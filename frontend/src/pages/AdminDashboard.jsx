import { useState, useEffect } from 'react';
import { adminAPI } from '../api/api';
import AdminChat from '../components/AdminChat';
import './AdminDashboard.css';

function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('requests');
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('active'); // 'active' or 'deleted'

  // Manual card assignment state
  const [showCardForm, setShowCardForm] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });

  const handleAuth = async () => {
    if (!adminKey.trim()) {
      setError('Please enter an admin key');
      return;
    }

    setError('');
    setAuthenticated(true);
    // Load dashboard immediately with the admin key
    await loadDashboard();
  };

  const loadDashboard = async () => {
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
  };

  const loadUsers = async () => {
    const keyToUse = adminKey || '';
    if (!keyToUse) return;

    setLoading(true);
    try {
      const usersData = await adminAPI.getUsers(keyToUse, userFilter === 'deleted' ? 'deleted' : '');
      setUsers(usersData.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      // Don't show error to user to avoid disrupting other tabs, just log it
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated && adminKey) {
      if (activeTab === 'users') {
        loadUsers();
      } else {
        loadDashboard();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, authenticated, activeTab, userFilter]);

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

  const openCardForm = (requestId) => {
    setSelectedRequestId(requestId);
    setShowCardForm(true);
  };

  const closeCardForm = () => {
    setShowCardForm(false);
    setSelectedRequestId(null);
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
        requestId: selectedRequestId,
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
    if (!window.confirm('Are you sure you want to delete this user? They will be moved to the "Deleted Users" list.')) return;

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
    return new Date(date).toLocaleString();
  };

  // Authentication Screen
  if (!authenticated) {
    return (
      <div className="admin-auth-container">
        <div className="admin-auth-card">
          <div className="admin-auth-header">
            <h1>🔐 Admin Dashboard</h1>
            <p className="admin-auth-subtitle">Enter your admin key to access the dashboard</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form
            className="admin-auth-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleAuth();
            }}
          >
            <div className="form-group">
              <label htmlFor="adminKey">Admin Key</label>
              <input
                type="password"
                id="adminKey"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter your admin key"
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Manage card requests and student payments</p>
        </div>
        <div className="admin-header-actions">
          <div className="admin-tabs">
            <button
              onClick={() => setActiveTab('requests')}
              className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`}
            >
              📋 Card Requests
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`admin-tab ${activeTab === 'chat' ? 'active' : ''}`}
            >
              💬 Live Chat
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            >
              👥 Users
            </button>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Chat Tab */}
      {activeTab === 'chat' ? (
        <AdminChat adminKey={adminKey} />
      ) : activeTab === 'users' ? (
        <div className="users-section">
          <div className="filter-section">
            <div className="admin-tabs" style={{ marginBottom: 0 }}>
              <button
                onClick={() => setUserFilter('active')}
                className={`admin-tab ${userFilter === 'active' ? 'active' : ''}`}
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              >
                Active Users
              </button>
              <button
                onClick={() => setUserFilter('deleted')}
                className={`admin-tab ${userFilter === 'deleted' ? 'active' : ''}`}
                style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}
              >
                Deleted Users
              </button>
            </div>
            <button
              onClick={loadUsers}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>BYU ID</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      No {userFilter} users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.byuId}</td>
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
                            onClick={() => handleRestoreUser(user._id)}
                            className="btn btn-success btn-sm"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="btn btn-danger btn-sm"
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
        <>
          {/* Loading State */}
          {loading && !stats && (
            <div className="admin-loading">
              <div className="loading-spinner">⏳</div>
              <p>Loading dashboard...</p>
            </div>
          )}

          {/* Stats Section */}
          {stats && (
            <div className="admin-stats-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Requests</div>
                    <div className="stat-value">{stats.totalRequests || 0}</div>
                  </div>
                </div>
                <div className="stat-card stat-warning">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-content">
                    <div className="stat-label">Pending</div>
                    <div className="stat-value">{stats.pendingRequests || 0}</div>
                  </div>
                </div>
                <div className="stat-card stat-success">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-label">Assigned</div>
                    <div className="stat-value">{stats.assignedRequests || 0}</div>
                  </div>
                </div>
                <div className="stat-card stat-info">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-label">Paid</div>
                    <div className="stat-value">{stats.paidRequests || 0}</div>
                  </div>
                </div>
                <div className="stat-card stat-danger">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-content">
                    <div className="stat-label">Expired</div>
                    <div className="stat-value">{stats.expiredRequests || 0}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Students</div>
                    <div className="stat-value">{stats.totalStudents || 0}</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="performance-metrics">
                <div className="metric-card">
                  <h3>Success Rate</h3>
                  <div className="metric-value success">
                    {stats.totalRequests > 0
                      ? Math.round((stats.assignedRequests / stats.totalRequests) * 100)
                      : 0}%
                  </div>
                  <div className="metric-description">
                    Cards successfully assigned
                  </div>
                </div>
                <div className="metric-card">
                  <h3>Total Revenue</h3>
                  <div className="metric-value revenue">
                    ${(stats.totalRevenue || 0).toLocaleString()}
                  </div>
                  <div className="metric-description">
                    From completed payments
                  </div>
                </div>
                <div className="metric-card">
                  <h3>Completion Rate</h3>
                  <div className="metric-value info">
                    {stats.totalRequests > 0
                      ? Math.round((stats.paidRequests / stats.totalRequests) * 100)
                      : 0}%
                  </div>
                  <div className="metric-description">
                    Requests fully completed
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Section */}
          <div className="filter-section">
            <div className="filter-controls">
              <label htmlFor="statusFilter">Filter by Status:</label>
              <select
                id="statusFilter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Requests</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="paid">Paid</option>
                <option value="expired">Expired</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <button
              onClick={loadDashboard}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
          </div>

          {/* Requests Table */}
          <div className="requests-section">
            <h2>Card Requests</h2>

            {loading && requests.length === 0 ? (
              <div className="admin-loading">
                <div className="loading-spinner">⏳</div>
                <p>Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="alert alert-info">
                <p>No requests found.</p>
                {filter && (
                  <button
                    onClick={() => setFilter('')}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '1rem' }}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request._id}>
                        <td>
                          <div className="table-student-name">
                            {request.student?.name || 'Unknown'}
                          </div>
                          <div className="table-student-id">
                            {request.student?.byuId || 'N/A'} • {request.requestToken}
                          </div>
                        </td>
                        <td>
                          <div className="table-amount">
                            ${request.amount || 0}
                          </div>
                          {request.amountInGHS && (
                            <div className="table-amount-ghs">
                              GHS {request.totalPaidGHS?.toFixed(2) || '0.00'}
                            </div>
                          )}
                        </td>
                        <td>
                          {request.paymentMethod && (
                            <span className={`payment-badge ${request.paymentMethod === 'momo-manual' ? 'manual' : 'auto'}`}>
                              {request.paymentMethod === 'momo-manual' ? 'Manual' : 'Automated'}
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
                            {request.status?.toUpperCase() || 'UNKNOWN'}
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
                                  onClick={() => openCardForm(request._id)}
                                  className="btn btn-success btn-sm"
                                  title="Assign Card Manually"
                                >
                                  Assign Card
                                </button>
                                <button
                                  onClick={() => handleAssignMock(request._id)}
                                  className="btn btn-info btn-sm"
                                  title="Assign Mock Card"
                                >
                                  Mock Card
                                </button>
                                <button
                                  onClick={() => handleAction(request._id, 'declined')}
                                  className="btn btn-danger btn-sm"
                                  title="Decline Request"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {request.status === 'assigned' && (
                              <>
                                <button
                                  onClick={() => handleAction(request._id, 'paid')}
                                  className="btn btn-success btn-sm"
                                  title="Mark as Paid"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => handleAction(request._id, 'expired')}
                                  className="btn btn-warning btn-sm"
                                  title="Mark as Expired"
                                >
                                  Mark Expired
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
      {showCardForm && (
        <div className="modal-overlay" onClick={closeCardForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Card Details</h2>
              <button className="modal-close" onClick={closeCardForm}>&times;</button>
            </div>
            <form onSubmit={handleManualAssign} className="modal-body">
              <div className="form-group">
                <label htmlFor="cardNumber">Card Number *</label>
                <input
                  type="text"
                  id="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                    setCardDetails({ ...cardDetails, cardNumber: formatted });
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cardholderName">Cardholder Name *</label>
                <input
                  type="text"
                  id="cardholderName"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value.toUpperCase() })}
                  placeholder="JOHN DOE"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry Date *</label>
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
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="cvv">CVV *</label>
                  <input
                    type="text"
                    id="cvv"
                    value={cardDetails.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setCardDetails({ ...cardDetails, cvv: value });
                    }}
                    placeholder="123"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeCardForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Card
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
