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
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'requests', 'users', 'chat', 'analytics'
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('active');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Manual card assignment modal
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
      const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
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
      setError('Please enter your admin access key');
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

  // Auto-refresh interval (30s)
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
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `card_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `students_${userFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAssignMock = async (requestId) => {
    if (!window.confirm('Assign a mock card to this request?')) return;
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
    setCardDetails({ cardNumber: '', cardholderName: '', expiryDate: '', cvv: '' });
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
    if (!window.confirm('Delete this user? They will be moved to Deleted Users.')) return;
    try {
      await adminAPI.deleteUser(adminKey, userId);
      alert('User deleted');
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRestoreUser = async (userId) => {
    if (!window.confirm('Restore this user account?')) return;
    try {
      await adminAPI.restoreUser(adminKey, userId);
      alert('User restored');
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
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bento-badge-amber',
      assigned: 'bento-badge-emerald',
      paid: 'bento-badge-indigo',
      expired: 'bento-badge-rose',
      declined: 'bento-badge-rose'
    };
    return badges[status] || 'bento-badge-gray';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ── Authentication Screen ──
  if (!authenticated) {
    return (
      <div className="bento-auth-wrapper">
        <div className="bento-auth-card">
          <div className="bento-auth-brand">
            <div className="brand-logo-pill">⚡</div>
            <h2>ConnectPay Studio</h2>
            <p>Admin Operations & Oversight Console</p>
          </div>

          {error && <div className="bento-auth-alert">⚠️ {error}</div>}

          <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }}>
            <div className="bento-input-group">
              <label>Admin Security Key</label>
              <div className="bento-input-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminKey}
                  onChange={(e) => { setAdminKey(e.target.value); setError(''); }}
                  placeholder="Enter secret key..."
                  autoFocus
                  required
                />
                <button
                  type="button"
                  className="bento-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <button type="submit" className="bento-btn-primary">
              Enter Workspace →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate metrics for Bento Grid
  const totalVolume = stats?.totalRevenue || 857850;
  const totalExpenses = (stats?.paidRequests || 0) * 45 || 198110;
  const issuanceRate = stats?.totalRequests > 0 ? Math.round((stats.assignedRequests / stats.totalRequests) * 100) : 76;
  const settlementRate = stats?.totalRequests > 0 ? Math.round((stats.paidRequests / stats.totalRequests) * 100) : 84;

  return (
    <div className="bento-app-container">
      {/* ── Left Sidebar Navigation ── */}
      <aside className="bento-sidebar">
        <div className="bento-sidebar-brand">
          <div className="brand-icon">⚡</div>
          <span className="brand-title">ConnectPay</span>
          <span className="brand-sub">Admin</span>
        </div>

        <nav className="bento-sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-text">Requests</span>
            {requests.length > 0 && <span className="nav-pill">{requests.length}</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Students</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-text">Live Chat</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Analytics</span>
          </button>
        </nav>

        <div className="bento-sidebar-footer">
          <div className="auto-sync-box" onClick={() => setAutoRefresh(!autoRefresh)}>
            <span className={`sync-dot ${autoRefresh ? 'on' : ''}`}></span>
            <span>{autoRefresh ? 'Auto-Sync ON' : 'Auto-Sync OFF'}</span>
          </div>

          <button className="nav-item nav-signout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="bento-main">
        {/* Top Header */}
        <header className="bento-header">
          <div className="bento-header-greeting">
            <h1>Hello, Admin welcome back</h1>
            <p>Real-time Virtual Card Operations & Payment Monitoring</p>
          </div>

          <div className="bento-header-right">
            <div className="bento-search-pill">
              <span className="search-icon-sm">🔍</span>
              <input
                type="text"
                placeholder="Search students, cards, IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-sm" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            <div className="bento-profile-pill">
              <div className="profile-avatar">🛡️</div>
              <div className="profile-info">
                <span className="profile-name">System Administrator</span>
                <span className="profile-role">Super Admin</span>
              </div>
              <span className="profile-status-dot"></span>
            </div>
          </div>
        </header>

        {error && <div className="bento-banner-error">⚠️ {error}</div>}

        {/* Dynamic Tab Switcher Content */}
        {activeTab === 'chat' ? (
          <div className="bento-card-full">
            <AdminChat adminKey={adminKey} />
          </div>
        ) : activeTab === 'users' ? (
          /* ── Students Tab ── */
          <div className="bento-card-full">
            <div className="bento-card-header">
              <h2>Student Roster & Verification</h2>
              <div className="bento-actions-group">
                <button
                  className={`bento-subtab ${userFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setUserFilter('active')}
                >
                  Active Users
                </button>
                <button
                  className={`bento-subtab ${userFilter === 'deleted' ? 'active' : ''}`}
                  onClick={() => setUserFilter('deleted')}
                >
                  Deleted Users
                </button>
                <button onClick={exportUsersToCSV} className="bento-btn-sm btn-ghost">
                  📥 Export CSV
                </button>
                <button onClick={loadUsers} className="bento-btn-sm btn-indigo" disabled={loading}>
                  {loading ? '...' : '🔄 Refresh'}
                </button>
              </div>
            </div>

            <div className="bento-table-wrapper">
              <table className="bento-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>BYU ID</th>
                    <th>Pathway Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Joined Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="bento-table-empty">
                        No student accounts found {searchQuery ? `matching "${searchQuery}"` : ''}.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id || u.id}>
                        <td className="font-semibold text-white">{u.name}</td>
                        <td>
                          <code
                            className="bento-code-badge"
                            onClick={() => copyToClipboard(u.byuId, u._id || u.id)}
                          >
                            {u.byuId} {copiedId === (u._id || u.id) ? '✓' : '📋'}
                          </code>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td>
                          <span className={`bento-badge ${u.status === 'deleted' ? 'bento-badge-rose' : 'bento-badge-emerald'}`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>
                          {u.status === 'deleted' ? (
                            <button onClick={() => handleRestoreUser(u._id || u.id)} className="bento-action-btn green">Restore</button>
                          ) : (
                            <button onClick={() => handleDeleteUser(u._id || u.id)} className="bento-action-btn red">Delete</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'requests' ? (
          /* ── Requests Detailed Tab ── */
          <div className="bento-card-full">
            <div className="bento-card-header">
              <h2>Virtual Card Applications ({filteredRequests.length})</h2>
              <div className="bento-actions-group">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bento-select"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="paid">Paid</option>
                  <option value="expired">Expired</option>
                </select>
                <button onClick={exportRequestsToCSV} className="bento-btn-sm btn-ghost">
                  📥 Export CSV
                </button>
                <button onClick={loadDashboard} className="bento-btn-sm btn-indigo" disabled={loading}>
                  {loading ? '...' : '🔄 Refresh Data'}
                </button>
              </div>
            </div>

            <div className="bento-table-wrapper">
              <table className="bento-table">
                <thead>
                  <tr>
                    <th>Student & Token</th>
                    <th>Requested USD</th>
                    <th>Total Paid (GHS)</th>
                    <th>Payment Method</th>
                    <th>Card Status</th>
                    <th>Submission Date</th>
                    <th>Action Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="bento-table-empty">
                        No requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((r) => (
                      <tr key={r._id || r.id}>
                        <td>
                          <div className="table-name-bold">{r.student?.name || 'Unknown Student'}</div>
                          <div className="table-sub-info">
                            ID: <code>{r.student?.byuId || 'N/A'}</code>
                            <span className="sub-divider">•</span>
                            <span
                              className="token-click"
                              onClick={() => copyToClipboard(r.requestToken, r._id || r.id)}
                            >
                              {r.requestToken?.slice(0, 10)}... {copiedId === (r._id || r.id) ? '✓' : '📋'}
                            </span>
                          </div>
                        </td>
                        <td className="amount-highlight">${r.amount || 0} USD</td>
                        <td className="text-emerald">GHS {Number(r.totalPaidGHS || 0).toFixed(2)}</td>
                        <td>
                          <span className="bento-tag-purple">{(r.paymentMethod || 'momo-hubtel').toUpperCase()}</span>
                        </td>
                        <td>
                          <span className={`bento-badge ${getStatusBadge(r.status)}`}>
                            {(r.status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td className="text-muted">{formatDate(r.createdAt)}</td>
                        <td>
                          <div className="bento-flex-actions">
                            {r.status === 'pending' && (
                              <>
                                <button onClick={() => openCardForm(r)} className="bento-action-btn indigo">Card</button>
                                <button onClick={() => handleAssignMock(r._id || r.id)} className="bento-action-btn cyan">Mock</button>
                                <button onClick={() => handleAction(r._id || r.id, 'declined')} className="bento-action-btn red">Decline</button>
                              </>
                            )}

                            {r.status === 'assigned' && (
                              <>
                                <button onClick={() => handleAction(r._id || r.id, 'paid')} className="bento-action-btn green">Paid</button>
                                <button onClick={() => handleAction(r._id || r.id, 'expired')} className="bento-action-btn amber">Expire</button>
                              </>
                            )}

                            {r.status === 'paid' && <span className="text-emerald font-semibold">✓ Completed</span>}
                            {r.status === 'expired' && <span className="text-rose font-semibold">⏰ Expired</span>}
                            {r.status === 'declined' && <span className="text-muted font-semibold">✗ Declined</span>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Default Dashboard View (INSPIRED BENTO GRID) ── */
          <div className="bento-grid">

            {/* Bento Row 1: KPI Cards */}
            {/* KPI 1: Total Balance / Volume */}
            <div className="bento-card kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Total Volume Processed</span>
                <div className="bento-dropdown-pill">last month ▾</div>
              </div>
              <div className="kpi-value">${totalVolume.toLocaleString()}</div>
              <div className="kpi-footer">
                <span className="kpi-trend green">↑ 20.3% last month</span>
                {/* SVG Sparkline 1 */}
                <svg className="sparkline-svg" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradViolet" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path d="M0,25 Q15,5 30,20 T60,10 T90,18 T120,5" fill="none" stroke="url(#gradViolet)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* KPI 2: Total Expenses */}
            <div className="bento-card kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Total Expenses & Fees</span>
                <div className="bento-dropdown-pill">last month ▾</div>
              </div>
              <div className="kpi-value">${totalExpenses.toLocaleString()}</div>
              <div className="kpi-footer">
                <span className="kpi-trend red">↓ 3.12% last month</span>
                {/* SVG Sparkline 2 */}
                <svg className="sparkline-svg" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradPink" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path d="M0,10 Q20,25 40,15 T80,22 T120,8" fill="none" stroke="url(#gradPink)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* KPI 3: Active Virtual Card Widget */}
            <div className="bento-card card-widget-card">
              <div className="card-widget-top">
                <span className="kpi-label">Active Virtual Cards</span>
                <span className="view-all-link" onClick={() => setActiveTab('requests')}>view all</span>
              </div>
              <div className="mini-virtual-card">
                <div className="mini-card-top">
                  <span className="mini-card-bank">ConnectPay</span>
                  <span className="mini-card-logo">VISA</span>
                </div>
                <div className="mini-card-balance">${(stats?.assignedRequests ? stats.assignedRequests * 250 : 1452.23).toLocaleString()}</div>
                <div className="mini-card-footer">
                  <span className="mini-card-num">•••• 4578</span>
                  <span className="mini-card-exp">12/28</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Request Status Categories Doughnut Chart */}
            <div className="bento-card doughnut-card">
              <div className="kpi-top">
                <span className="kpi-label">Request Breakdown</span>
                <div className="bento-dropdown-pill">last month ▾</div>
              </div>
              <div className="doughnut-content">
                <div className="svg-donut-wrapper">
                  <svg viewBox="0 0 100 100" className="donut-svg">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#23253b" strokeWidth="12" />
                    {/* Paid Segment (Blue) */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="95 144" strokeDashoffset="0" />
                    {/* Assigned Segment (Purple) */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#8b5cf6" strokeWidth="12" strokeDasharray="70 169" strokeDashoffset="-95" />
                    {/* Pending Segment (Green) */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="45 194" strokeDashoffset="-165" />
                    {/* Expired Segment (Orange) */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="28 211" strokeDashoffset="-210" />
                  </svg>
                  <div className="donut-center-text">
                    <span className="donut-num">100%</span>
                    <span className="donut-sub">processed</span>
                  </div>
                </div>
                <div className="donut-legend">
                  <div className="legend-item"><span className="dot blue"></span> Paid {stats?.totalRequests ? Math.round(((stats.paidRequests||0)/stats.totalRequests)*100) : 34}%</div>
                  <div className="legend-item"><span className="dot purple"></span> Assigned {stats?.totalRequests ? Math.round(((stats.assignedRequests||0)/stats.totalRequests)*100) : 25}%</div>
                  <div className="legend-item"><span className="dot green"></span> Pending {stats?.totalRequests ? Math.round(((stats.pendingRequests||0)/stats.totalRequests)*100) : 22}%</div>
                  <div className="legend-item"><span className="dot orange"></span> Expired {stats?.totalRequests ? Math.round(((stats.expiredRequests||0)/stats.totalRequests)*100) : 19}%</div>
                </div>
              </div>
            </div>

            {/* Bento Row 2: Dissection Bar Chart & Spending Gauges */}
            {/* Chart 1: Dissection Monthly Bar Chart */}
            <div className="bento-card bar-chart-card">
              <div className="kpi-top">
                <div className="bar-header-left">
                  <h3>Dissection & Trends</h3>
                  <div className="bar-legend-pills">
                    <span className="bar-pill purple"><span className="pill-dot"></span> Volume</span>
                    <span className="bar-pill blue"><span className="pill-dot"></span> Cards</span>
                  </div>
                </div>
                <div className="bento-dropdown-pill">last week ▾</div>
              </div>

              {/* Bar Chart Visual */}
              <div className="bar-chart-bars">
                {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m, idx) => {
                  const h1 = [45, 65, 80, 50, 90, 75, 60, 85, 95, 70, 85, 60][idx];
                  const h2 = [30, 50, 60, 35, 70, 55, 45, 65, 75, 50, 65, 40][idx];
                  return (
                    <div key={m} className="bar-group">
                      <div className="bars-pair">
                        <div className="bar bar-purple" style={{ height: `${h1}%` }}></div>
                        <div className="bar bar-blue" style={{ height: `${h2}%` }}></div>
                      </div>
                      <span className="bar-month">{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Operational Parameters Radial Gauges */}
            <div className="bento-card gauges-card">
              <div className="kpi-top">
                <h3>Operational Parameters</h3>
                <div className="bento-dropdown-pill">last month ▾</div>
              </div>
              <div className="gauges-grid">
                {/* Gauge 1 */}
                <div className="gauge-item">
                  <div className="gauge-ring-wrapper">
                    <svg viewBox="0 0 36 36" className="gauge-svg">
                      <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#23253b" strokeWidth="3" />
                      <path className="gauge-fill green" strokeDasharray="57, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3.5" />
                    </svg>
                    <span className="gauge-percent">57%</span>
                  </div>
                  <span className="gauge-label">Issuance</span>
                </div>

                {/* Gauge 2 */}
                <div className="gauge-item">
                  <div className="gauge-ring-wrapper">
                    <svg viewBox="0 0 36 36" className="gauge-svg">
                      <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#23253b" strokeWidth="3" />
                      <path className="gauge-fill yellow" strokeDasharray={`${issuanceRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="3.5" />
                    </svg>
                    <span className="gauge-percent">{issuanceRate}%</span>
                  </div>
                  <span className="gauge-label">Assigned</span>
                </div>

                {/* Gauge 3 */}
                <div className="gauge-item">
                  <div className="gauge-ring-wrapper">
                    <svg viewBox="0 0 36 36" className="gauge-svg">
                      <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#23253b" strokeWidth="3" />
                      <path className="gauge-fill pink" strokeDasharray={`${settlementRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ec4899" strokeWidth="3.5" />
                    </svg>
                    <span className="gauge-percent">{settlementRate}%</span>
                  </div>
                  <span className="gauge-label">Settlement</span>
                </div>

                {/* Gauge 4 */}
                <div className="gauge-item">
                  <div className="gauge-ring-wrapper">
                    <svg viewBox="0 0 36 36" className="gauge-svg">
                      <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#23253b" strokeWidth="3" />
                      <path className="gauge-fill cyan" strokeDasharray="99, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#06b6d4" strokeWidth="3.5" />
                    </svg>
                    <span className="gauge-percent">99%</span>
                  </div>
                  <span className="gauge-label">Uptime</span>
                </div>
              </div>
            </div>

            {/* Bento Row 3: Recent Activity List & Income/Expenses Waves Chart */}
            {/* Activity List: Recent Card Requests */}
            <div className="bento-card activity-card">
              <div className="kpi-top">
                <h3>Recent Card Activity</h3>
                <div className="bento-dropdown-pill">last day ▾</div>
              </div>
              <div className="activity-list">
                {requests.slice(0, 4).map((r) => (
                  <div key={r._id || r.id} className="activity-item">
                    <div className="activity-icon-badge font-bold">
                      💳
                    </div>
                    <div className="activity-details">
                      <span className="activity-title">{r.student?.name || 'Student Request'}</span>
                      <span className="activity-sub">BYU ID: {r.student?.byuId || 'N/A'} • {formatDate(r.createdAt)}</span>
                    </div>
                    <div className="activity-right">
                      <span className="activity-amount">${r.amount || 0}</span>
                      <span className={`bento-badge ${getStatusBadge(r.status)}`}>{(r.status || 'pending').toUpperCase()}</span>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && (
                  <div className="bento-table-empty" style={{ padding: '2rem' }}>No recent activity to display.</div>
                )}
              </div>
            </div>

            {/* Income & Expenses Dual Bezier Waves Chart */}
            <div className="bento-card waves-card">
              <div className="kpi-top">
                <div className="waves-header-left">
                  <h3>Income and Expenses</h3>
                  <div className="bar-legend-pills">
                    <span className="bar-pill purple"><span className="pill-dot"></span> Income</span>
                    <span className="bar-pill pink"><span className="pill-dot"></span> Expenses</span>
                  </div>
                </div>
                <div className="bento-dropdown-pill">last week ▾</div>
              </div>

              <div className="waves-svg-container">
                <svg className="waves-svg" viewBox="0 0 500 140" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveBlueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="wavePinkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#1c1e33" strokeDasharray="4 4" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#1c1e33" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#1c1e33" strokeDasharray="4 4" />

                  {/* Curve 1: Blue/Purple */}
                  <path d="M0,90 C80,30 150,110 230,40 C310,-10 380,100 500,30 L500,140 L0,140 Z" fill="url(#waveBlueGrad)" />
                  <path d="M0,90 C80,30 150,110 230,40 C310,-10 380,100 500,30" fill="none" stroke="#8b5cf6" strokeWidth="3" />

                  {/* Curve 2: Pink */}
                  <path d="M0,110 C90,60 170,120 250,70 C330,20 410,90 500,50 L500,140 L0,140 Z" fill="url(#wavePinkGrad)" />
                  <path d="M0,110 C90,60 170,120 250,70 C330,20 410,90 500,50" fill="none" stroke="#ec4899" strokeWidth="3" />

                  {/* Interactive Dot Tooltip */}
                  <circle cx="390" cy="42" r="6" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2.5" />
                  <rect x="365" y="10" width="50" height="22" rx="11" fill="#6366f1" />
                  <text x="390" y="25" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">$85,732</text>
                </svg>

                <div className="waves-days">
                  <span>Monday</span>
                  <span>Tuesday</span>
                  <span>Wednesday</span>
                  <span>Thursday</span>
                  <span>Friday</span>
                  <span>Saturday</span>
                  <span>Sunday</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Manual Card Assignment Modal */}
      {showCardForm && selectedRequest && (
        <div className="modal-overlay" onClick={closeCardForm}>
          <div className="bento-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Issue Virtual Card</h2>
              <button className="modal-close" onClick={closeCardForm}>&times;</button>
            </div>

            {/* Virtual Card Preview */}
            <div className="card-preview-wrapper">
              <div className="bento-virtual-card">
                <div className="card-preview-top">
                  <span className="card-chip"></span>
                  <span className="card-logo">VISA</span>
                </div>
                <div className="card-preview-num">
                  {cardDetails.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="card-preview-bot">
                  <div>
                    <span className="lbl">CARDHOLDER</span>
                    <span className="val">{cardDetails.cardholderName || 'STUDENT NAME'}</span>
                  </div>
                  <div>
                    <span className="lbl">EXPIRES</span>
                    <span className="val">{cardDetails.expiryDate || 'MM/YY'}</span>
                  </div>
                  <div>
                    <span className="lbl">CVV</span>
                    <span className="val">{cardDetails.cvv || '•••'}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleManualAssign} className="modal-form">
              <div className="bento-input-group">
                <label>16-Digit Card Number *</label>
                <input
                  type="text"
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

              <div className="bento-input-group">
                <label>Cardholder Name *</label>
                <input
                  type="text"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value.toUpperCase() })}
                  placeholder="JOHN DOE"
                  required
                />
              </div>

              <div className="bento-form-row">
                <div className="bento-input-group">
                  <label>Expiry (MM/YY) *</label>
                  <input
                    type="text"
                    value={cardDetails.expiryDate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      let formatted = value;
                      if (value.length >= 2) formatted = value.slice(0, 2) + '/' + value.slice(2, 4);
                      setCardDetails({ ...cardDetails, expiryDate: formatted });
                    }}
                    placeholder="12/28"
                    maxLength="5"
                    required
                  />
                </div>

                <div className="bento-input-group">
                  <label>CVV *</label>
                  <input
                    type="text"
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

              <div className="modal-actions">
                <button type="button" onClick={closeCardForm} className="bento-btn-sm btn-ghost">Cancel</button>
                <button type="submit" className="bento-btn-primary">Confirm & Issue Card →</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
