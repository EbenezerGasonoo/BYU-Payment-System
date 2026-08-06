import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminAPI } from '../api/api';
import AdminChat from '../components/AdminChat';
import './AdminDashboard.css';

function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('active'); // 'active' or 'deleted'
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Manual card assignment state
  const [showCardForm, setShowCardForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });

  const loadDashboard = useCallback(async () => {
    const keyToUse = adminKey || '';
    if (!keyToUse) return;

    setLoading(true);
    setError('');

    try {
      const [requestsData, statsData] = await Promise.all([
        adminAPI.getRequests(keyToUse, filter),
        adminAPI.getStats(keyToUse)
      ]);

      setRequests(requestsData.data || []);
      setStats(statsData.data || null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load admin dashboard';
      setError(errorMessage);

      if (err.response?.status === 403) {
        setAuthenticated(false);
        setAdminKey('');
      }
    } finally {
      setLoading(false);
    }
  }, [adminKey, filter]);

  const loadUsers = useCallback(async () => {
    const keyToUse = adminKey || '';
    if (!keyToUse) return;

    setLoading(true);
    try {
      const usersData = await adminAPI.getUsers(keyToUse, userFilter === 'deleted' ? 'deleted' : '');
      setUsers(usersData.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [adminKey, userFilter]);

  const handleAuth = async () => {
    if (!adminKey.trim()) {
      setError('Please enter an admin key');
      return;
    }

    setError('');
    setAuthenticated(true);
    await loadDashboard();
  };

  useEffect(() => {
    if (authenticated && adminKey) {
      if (activeTab === 'users') {
        loadUsers();
      } else {
        loadDashboard();
      }
    }
  }, [filter, authenticated, activeTab, userFilter, loadDashboard, loadUsers]);

  // Auto-refresh interval (30 seconds)
  useEffect(() => {
    if (!autoRefresh || !authenticated) return;
    const interval = setInterval(() => {
      if (activeTab === 'users') {
        loadUsers();
      } else {
        loadDashboard();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, authenticated, activeTab, loadDashboard, loadUsers]);

  // Filter requests by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((r) => {
      const name = r.student?.name?.toLowerCase() || '';
      const byuId = r.student?.byuId?.toLowerCase() || '';
      const email = r.student?.email?.toLowerCase() || '';
      const token = r.requestToken?.toLowerCase() || '';
      return name.includes(q) || byuId.includes(q) || email.includes(q) || token.includes(q);
    });
  }, [requests, searchQuery]);

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const name = u.name?.toLowerCase() || '';
      const byuId = u.byuId?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      const phone = u.phone?.toLowerCase() || '';
      return name.includes(q) || byuId.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [users, searchQuery]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // CSV Export for Requests
  const exportRequestsToCSV = () => {
    if (!filteredRequests.length) return;
    const headers = ['Student Name', 'BYU ID', 'Email', 'Amount USD', 'Total Paid GHS', 'Payment Method', 'Payment Status', 'Card Status', 'Request Token', 'Date'];
    const rows = filteredRequests.map(r => [
      `"${r.student?.name || ''}"`,
      `"${r.student?.byuId || ''}"`,
      `"${r.student?.email || ''}"`,
      r.amount || 0,
      r.totalPaidGHS || 0,
      `"${r.paymentMethod || ''}"`,
      `"${r.paymentStatus || ''}"`,
      `"${r.status || ''}"`,
      `"${r.requestToken || ''}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `card_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Users
  const exportUsersToCSV = () => {
    if (!filteredUsers.length) return;
    const headers = ['Full Name', 'BYU ID', 'Email', 'Phone', 'Status', 'Registration Date'];
    const rows = filteredUsers.map(u => [
      `"${u.name || ''}"`,
      `"${u.byuId || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.status || 'active'}"`,
      `"${new Date(u.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_${userFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAssignMock = async (requestId) => {
    if (!window.confirm('Assign a mock virtual card to this request?')) return;

    try {
      await adminAPI.assignMockCard(adminKey, requestId);
      alert('Mock card assigned successfully!');
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign card');
    }
  };

  const openCardForm = (request) => {
    setSelectedRequest(request);
    setCardDetails({
      cardNumber: '',
      cardholderName: request.student?.name?.toUpperCase() || 'STUDENT NAME',
      expiryDate: '',
      cvv: ''
    });
    setShowCardForm(true);
  };

  const closeCardForm = () => {
    setShowCardForm(false);
    setSelectedRequest(null);
    setCardDetails({
      cardNumber: '',
      cardholderName: '',
      expiryDate: '',
      cvv: ''
    });
  };

  const handleManualAssign = async (e) => {
    e.preventDefault();

    if (!cardDetails.cardNumber || !cardDetails.cardholderName || !cardDetails.expiryDate || !cardDetails.cvv) {
      alert('All card details are required');
      return;
    }

    try {
      await adminAPI.assignCard(adminKey, {
        requestId: selectedRequest._id || selectedRequest.id,
        ...cardDetails
      });
      alert('Card assigned successfully!');
      closeCardForm();
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign card');
    }
  };

  const handleAction = async (requestId, action) => {
    if (!window.confirm(`Mark this request as ${action}?`)) return;

    try {
      await adminAPI.updateAction(adminKey, { requestId, action });
      alert(`Request marked as ${action}!`);
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? They will be moved to "Deleted Users".')) return;

    try {
      await adminAPI.deleteUser(adminKey, userId);
      alert('User deleted successfully');
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRestoreUser = async (userId) => {
    if (!window.confirm('Restore this user account?')) return;

    try {
      await adminAPI.restoreUser(adminKey, userId);
      alert('User restored successfully');
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore user');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setAdminKey('');
    setRequests([]);
    setStats(null);
    setError('');
    setFilter('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      assigned: 'badge-success',
      paid: 'badge-info',
      expired: 'badge-danger',
      declined: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ── Authentication Screen ──
  if (!authenticated) {
    return (
      <div className="admin-auth-container">
        <div className="admin-auth-card">
          <div className="admin-auth-header">
            <div className="admin-auth-icon">🛡️</div>
            <h1>Admin Dashboard</h1>
            <p className="admin-auth-subtitle">BYU Pathway Ghana Virtual Card Platform</p>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form
            className="admin-auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth();
            }}
          >
            <div className="form-group">
              <label htmlFor="adminKey">Admin Access Key</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="adminKey"
                  value={adminKey}
                  onChange={(e) => { setAdminKey(e.target.value); setError(''); }}
                  placeholder="Enter admin security key"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg">
              Unlock Dashboard →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main Dashboard ──
  return (
    <div className="admin-dashboard-container">
      {/* Top Navbar Header */}
      <div className="admin-header">
        <div className="admin-header-title">
          <span className="admin-badge-live">LIVE ADMIN</span>
          <h1>Admin Control Center</h1>
          <p className="admin-subtitle">West Africa Virtual Card Platform & Payment Oversight</p>
        </div>

        <div className="admin-header-actions">
          <div className="admin-tabs">
            <button
              onClick={() => setActiveTab('requests')}
              className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`}
            >
              📋 Card Requests ({requests.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`admin-tab ${activeTab === 'chat' ? 'active' : ''}`}
            >
              💬 Live Support Chat
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            >
              👥 Students Roster
            </button>
          </div>

          <div className="admin-controls-right">
            <label className="auto-refresh-toggle" title="Toggle automatic data refresh every 30s">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">
                {autoRefresh ? <span className="pulse-indicator">● Auto-Sync ON</span> : 'Auto-Sync'}
              </span>
            </label>

            <button onClick={handleLogout} className="btn btn-logout">
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Chat Tab */}
      {activeTab === 'chat' ? (
        <AdminChat adminKey={adminKey} />
      ) : activeTab === 'users' ? (
        /* ── Users Tab ── */
        <div className="users-section">
          <div className="filter-section">
            <div className="filter-controls">
              <div className="admin-tabs" style={{ marginBottom: 0 }}>
                <button
                  onClick={() => setUserFilter('active')}
                  className={`admin-tab ${userFilter === 'active' ? 'active' : ''}`}
                >
                  Active Accounts
                </button>
                <button
                  onClick={() => setUserFilter('deleted')}
                  className={`admin-tab ${userFilter === 'deleted' ? 'active' : ''}`}
                >
                  Deleted Accounts
                </button>
              </div>

              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search students by Name, BYU ID, Email, Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
            </div>

            <div className="filter-actions-right">
              <button onClick={exportUsersToCSV} className="btn btn-secondary btn-sm" disabled={!filteredUsers.length}>
                📥 Export CSV
              </button>
              <button onClick={loadUsers} className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>BYU ID</th>
                  <th>Pathway Email</th>
                  <th>Phone Number</th>
                  <th>Status</th>
                  <th>Registration Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty">
                      No {userFilter} students found {searchQuery ? `matching "${searchQuery}"` : ''}.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id || user.id}>
                      <td className="font-semibold">{user.name}</td>
                      <td>
                        <span className="copyable-text" onClick={() => copyToClipboard(user.byuId, user._id || user.id)}>
                          <code>{user.byuId}</code> {copiedId === (user._id || user.id) ? '✓' : '📋'}
                        </span>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.phone}</td>
                      <td>
                        <span className={`badge ${user.status === 'deleted' ? 'badge-danger' : 'badge-success'}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        {user.status === 'deleted' ? (
                          <button
                            onClick={() => handleRestoreUser(user._id || user.id)}
                            className="btn btn-success btn-xs"
                          >
                            Restore Account
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(user._id || user.id)}
                            className="btn btn-danger btn-xs"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Requests Tab ── */
        <>
          {/* Loading State */}
          {loading && !stats && (
            <div className="admin-loading">
              <div className="loading-spinner">⏳</div>
              <p>Fetching real-time analytics & card requests...</p>
            </div>
          )}

          {/* Key Analytics Stats */}
          {stats && (
            <div className="admin-stats-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper blue">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Requests</div>
                    <div className="stat-value">{stats.totalRequests || 0}</div>
                    <div className="stat-hint">Lifetime card applications</div>
                  </div>
                </div>

                <div className="stat-card stat-warning">
                  <div className="stat-icon-wrapper orange">⏳</div>
                  <div className="stat-content">
                    <div className="stat-label">Pending Review</div>
                    <div className="stat-value">{stats.pendingRequests || 0}</div>
                    <div className="stat-hint">Awaiting card issuance</div>
                  </div>
                </div>

                <div className="stat-card stat-success">
                  <div className="stat-icon-wrapper green">✅</div>
                  <div className="stat-content">
                    <div className="stat-label">Cards Assigned</div>
                    <div className="stat-value">{stats.assignedRequests || 0}</div>
                    <div className="stat-hint">Issued to students</div>
                  </div>
                </div>

                <div className="stat-card stat-info">
                  <div className="stat-icon-wrapper purple">💰</div>
                  <div className="stat-content">
                    <div className="stat-label">Payments Completed</div>
                    <div className="stat-value">{stats.paidRequests || 0}</div>
                    <div className="stat-hint">Full settlement verified</div>
                  </div>
                </div>

                <div className="stat-card stat-danger">
                  <div className="stat-icon-wrapper red">⏰</div>
                  <div className="stat-content">
                    <div className="stat-label">Expired / Declined</div>
                    <div className="stat-value">{(stats.expiredRequests || 0) + (stats.declinedRequests || 0)}</div>
                    <div className="stat-hint">Unsuccessful or expired</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper teal">👥</div>
                  <div className="stat-content">
                    <div className="stat-label">Registered Students</div>
                    <div className="stat-value">{stats.totalStudents || 0}</div>
                    <div className="stat-hint">Active Pathway accounts</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="performance-metrics">
                <div className="metric-card">
                  <div className="metric-header">
                    <h3>Issuance Success</h3>
                    <span className="metric-badge green">Card Assignment</span>
                  </div>
                  <div className="metric-value success">
                    {stats.totalRequests > 0
                      ? Math.round((stats.assignedRequests / stats.totalRequests) * 100)
                      : 0}%
                  </div>
                  <div className="metric-description">
                    Percentage of card applications successfully fulfilled
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <h3>Total Processed Revenue</h3>
                    <span className="metric-badge gold">USD Volume</span>
                  </div>
                  <div className="metric-value revenue">
                    ${(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="metric-description">
                    Accumulated volume of completed payments
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <h3>Payment Settlement Rate</h3>
                    <span className="metric-badge blue">Settlement</span>
                  </div>
                  <div className="metric-value info">
                    {stats.totalRequests > 0
                      ? Math.round((stats.paidRequests / stats.totalRequests) * 100)
                      : 0}%
                  </div>
                  <div className="metric-description">
                    Percentage of payment requests fully completed
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="filter-section">
            <div className="filter-controls">
              <div className="status-filter-pills">
                <button
                  className={`status-pill ${filter === '' ? 'active' : ''}`}
                  onClick={() => setFilter('')}
                >
                  All ({requests.length})
                </button>
                <button
                  className={`status-pill yellow ${filter === 'pending' ? 'active' : ''}`}
                  onClick={() => setFilter('pending')}
                >
                  Pending
                </button>
                <button
                  className={`status-pill green ${filter === 'assigned' ? 'active' : ''}`}
                  onClick={() => setFilter('assigned')}
                >
                  Assigned
                </button>
                <button
                  className={`status-pill blue ${filter === 'paid' ? 'active' : ''}`}
                  onClick={() => setFilter('paid')}
                >
                  Paid
                </button>
                <button
                  className={`status-pill red ${filter === 'expired' ? 'active' : ''}`}
                  onClick={() => setFilter('expired')}
                >
                  Expired
                </button>
              </div>

              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by Student Name, BYU ID, Email, Token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
                )}
              </div>
            </div>

            <div className="filter-actions-right">
              <button
                onClick={exportRequestsToCSV}
                className="btn btn-secondary btn-sm"
                disabled={!filteredRequests.length}
                title="Download filtered records as CSV"
              >
                📥 Export CSV
              </button>
              <button
                onClick={loadDashboard}
                className="btn btn-primary btn-sm"
                disabled={loading}
              >
                {loading ? 'Refreshing...' : '🔄 Refresh Data'}
              </button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="requests-section">
            <div className="section-title-bar">
              <h2>Card Request Management ({filteredRequests.length})</h2>
              {searchQuery && (
                <span className="search-results-tag">
                  Showing results for "{searchQuery}"
                </span>
              )}
            </div>

            {loading && requests.length === 0 ? (
              <div className="admin-loading">
                <div className="loading-spinner">⏳</div>
                <p>Loading request table...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="alert alert-info">
                <p>No card requests found {searchQuery ? `matching "${searchQuery}"` : ''}.</p>
                {(filter || searchQuery) && (
                  <button
                    onClick={() => { setFilter(''); setSearchQuery(''); }}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '0.75rem' }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student & Request Token</th>
                      <th>Requested Amount</th>
                      <th>Payment Gateway</th>
                      <th>Card Status</th>
                      <th>Submission Date</th>
                      <th>Action Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request._id || request.id}>
                        <td>
                          <div className="table-student-name">
                            {request.student?.name || 'Unknown Student'}
                          </div>
                          <div className="table-student-id">
                            ID: <code className="code-badge">{request.student?.byuId || 'N/A'}</code>
                            <span className="divider">•</span>
                            <span
                              className="token-badge"
                              onClick={() => copyToClipboard(request.requestToken, request._id || request.id)}
                              title="Click to copy token"
                            >
                              {request.requestToken?.substring(0, 14)}... {copiedId === (request._id || request.id) ? '✓ Copied' : '📋'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="table-amount">
                            ${request.amount || 0} USD
                          </div>
                          {request.totalPaidGHS ? (
                            <div className="table-amount-ghs">
                              GHS {Number(request.totalPaidGHS).toFixed(2)}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          {request.paymentMethod && (
                            <span className={`payment-badge ${request.paymentMethod.includes('manual') ? 'manual' : 'auto'}`}>
                              {request.paymentMethod.toUpperCase()}
                            </span>
                          )}
                          {request.paymentStatus && (
                            <div className={`payment-status ${request.paymentStatus}`}>
                              {request.paymentStatus === 'paid' ? '✓ Paid' : request.paymentStatus}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(request.status)}`}>
                            {request.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </td>
                        <td className="table-date">
                          {request.createdAt ? formatDate(request.createdAt) : 'N/A'}
                        </td>
                        <td>
                          <div className="table-actions">
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => openCardForm(request)}
                                  className="btn btn-success btn-xs"
                                  title="Assign real virtual card details"
                                >
                                  💳 Assign Card
                                </button>
                                <button
                                  onClick={() => handleAssignMock(request._id || request.id)}
                                  className="btn btn-info btn-xs"
                                  title="Generate mock card for testing"
                                >
                                  ⚡ Mock Card
                                </button>
                                <button
                                  onClick={() => handleAction(request._id || request.id, 'declined')}
                                  className="btn btn-danger btn-xs"
                                  title="Decline Request"
                                >
                                  ✕ Decline
                                </button>
                              </>
                            )}

                            {request.status === 'assigned' && (
                              <>
                                <button
                                  onClick={() => handleAction(request._id || request.id, 'paid')}
                                  className="btn btn-success btn-xs"
                                  title="Mark Payment as Paid"
                                >
                                  ✓ Mark Paid
                                </button>
                                <button
                                  onClick={() => handleAction(request._id || request.id, 'expired')}
                                  className="btn btn-warning btn-xs"
                                  title="Mark Card as Expired"
                                >
                                  ⏰ Expire
                                </button>
                              </>
                            )}

                            {request.status === 'paid' && (
                              <span className="status-complete">✓ Completed</span>
                            )}

                            {request.status === 'expired' && (
                              <span className="status-expired">⏰ Expired</span>
                            )}

                            {request.status === 'declined' && (
                              <span className="status-declined">✗ Declined</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Manual Card Assignment Modal */}
      {showCardForm && selectedRequest && (
        <div className="modal-overlay" onClick={closeCardForm}>
          <div className="modal-content glass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Virtual Card Assignment</h2>
              <button className="modal-close" onClick={closeCardForm}>&times;</button>
            </div>

            {/* Virtual Card Preview */}
            <div className="card-preview-container">
              <div className="virtual-card-preview">
                <div className="card-preview-top">
                  <span className="card-preview-chip"></span>
                  <span className="card-preview-logo">VISA</span>
                </div>
                <div className="card-preview-number">
                  {cardDetails.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="card-preview-bottom">
                  <div>
                    <div className="card-preview-label">CARDHOLDER</div>
                    <div className="card-preview-val">{cardDetails.cardholderName || 'STUDENT NAME'}</div>
                  </div>
                  <div>
                    <div className="card-preview-label">EXPIRES</div>
                    <div className="card-preview-val">{cardDetails.expiryDate || 'MM/YY'}</div>
                  </div>
                  <div>
                    <div className="card-preview-label">CVV</div>
                    <div className="card-preview-val">{cardDetails.cvv || '•••'}</div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleManualAssign} className="modal-body">
              <div className="form-group">
                <label htmlFor="cardNumber">16-Digit Card Number *</label>
                <input
                  type="text"
                  id="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                    setCardDetails({ ...cardDetails, cardNumber: formatted });
                  }}
                  placeholder="4111 2222 3333 4444"
                  maxLength="19"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cardholderName">Cardholder Full Name *</label>
                <input
                  type="text"
                  id="cardholderName"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value.toUpperCase() })}
                  placeholder="STUDENT NAME"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry Date (MM/YY) *</label>
                  <input
                    type="text"
                    id="expiryDate"
                    value={cardDetails.expiryDate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      let formatted = value;
                      if (value.length >= 2) {
                        formatted = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      setCardDetails({ ...cardDetails, expiryDate: formatted });
                    }}
                    placeholder="12/28"
                    maxLength="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cvv">Security Code (CVV) *</label>
                  <input
                    type="text"
                    id="cvv"
                    value={cardDetails.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setCardDetails({ ...cardDetails, cvv: value });
                    }}
                    placeholder="789"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeCardForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-lg">
                  Confirm & Issue Card →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
