import { useState, useEffect } from 'react';
import { adminAPI } from '../api/api';

function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const handleAuth = () => {
    if (adminKey.trim()) {
      setAuthenticated(true);
      loadDashboard();
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [requestsData, statsData] = await Promise.all([
        adminAPI.getRequests(adminKey, filter),
        adminAPI.getStats(adminKey)
      ]);

      setRequests(requestsData.data);
      setStats(statsData.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin dashboard');
      if (err.response?.status === 403) {
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadDashboard();
    }
  }, [filter, authenticated]);

  const handleAssignMock = async (requestId) => {
    try {
      await adminAPI.assignMockCard(adminKey, requestId);
      alert('Mock card assigned successfully!');
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign card');
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      await adminAPI.updateAction(adminKey, { requestId, action });
      alert(`Request marked as ${action}!`);
      loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
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

  if (!authenticated) {
    return (
      <div className="container">
        <div className="form-container">
          <h1>Admin Dashboard</h1>
          <p className="subtitle">Enter admin key to access</p>

          <div className="form">
            <div className="form-group">
              <label htmlFor="adminKey">Admin Key</label>
              <input
                type="password"
                id="adminKey"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter your admin key"
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              />
            </div>
            <button onClick={handleAuth} className="btn btn-primary">
              Access Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={() => setAuthenticated(false)} className="btn btn-secondary">
          Logout
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalRequests}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-value">{stats.pendingRequests}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-value">{stats.assignedRequests}</div>
            <div className="stat-label">Assigned</div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-value">{stats.paidRequests}</div>
            <div className="stat-label">Paid</div>
          </div>
          <div className="stat-card stat-danger">
            <div className="stat-value">{stats.expiredRequests}</div>
            <div className="stat-label">Expired</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>
      )}

      <div className="filter-section">
        <label>Filter by Status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
          <option value="">All Requests</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="paid">Paid</option>
          <option value="expired">Expired</option>
          <option value="declined">Declined</option>
        </select>
        <button onClick={loadDashboard} className="btn btn-primary" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="requests-section">
        <h2>Card Requests</h2>
        {requests.length === 0 ? (
          <div className="alert alert-info">No requests found.</div>
        ) : (
          <div className="admin-requests-grid">
            {requests.map((request) => (
              <div key={request._id} className="admin-request-card">
                <div className="request-header">
                  <span className={`badge ${getStatusBadge(request.status)}`}>
                    {request.status.toUpperCase()}
                  </span>
                  <span className="request-token">{request.requestToken}</span>
                </div>

                <div className="request-body">
                  <h3>{request.student.name}</h3>
                  <p><strong>BYU ID:</strong> {request.student.byuId}</p>
                  <p><strong>Email:</strong> {request.student.email}</p>
                  <p><strong>Phone:</strong> {request.student.phone}</p>
                  <p><strong>Amount (USD):</strong> ${request.amount}</p>
                  {request.amountInGHS && (
                    <>
                      <p><strong>Amount (GHS):</strong> GHS {request.amountInGHS.toFixed(2)}</p>
                      <p><strong>Total Paid:</strong> GHS {request.totalPaidGHS.toFixed(2)} <small>(incl. {request.chargebackFee}% fee)</small></p>
                      <p><strong>Exchange Rate:</strong> 1 USD = {request.exchangeRate.toFixed(2)} GHS</p>
                    </>
                  )}
                  {request.paymentStatus && (
                    <p>
                      <strong>Payment:</strong>{' '}
                      <span className={`badge ${
                        request.paymentStatus === 'paid' ? 'badge-success' :
                        request.paymentStatus === 'pending' ? 'badge-warning' :
                        request.paymentStatus === 'failed' ? 'badge-danger' :
                        'badge-secondary'
                      }`}>
                        {request.paymentStatus.toUpperCase()}
                      </span>
                      {request.paymentMethod && ` via ${request.paymentMethod.toUpperCase()}`}
                    </p>
                  )}
                  {request.paymentReference && (
                    <p><strong>Payment Ref:</strong> <code style={{fontSize: '0.85rem', background: 'rgba(255,184,28,0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px'}}>{request.paymentReference}</code></p>
                  )}
                  <p><strong>Requested:</strong> {formatDate(request.createdAt)}</p>

                  {request.status === 'assigned' && (
                    <div className="card-details">
                      <h4>Assigned Card</h4>
                      <p><strong>Card:</strong> {request.virtualCardNumber}</p>
                      <p><strong>Expiry:</strong> {request.cardExpiryDate}</p>
                      <p><strong>CVV:</strong> {request.cardCVV}</p>
                      <p><strong>Expires:</strong> {formatDate(request.expiresAt)}</p>
                    </div>
                  )}

                  <div className="action-buttons">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAssignMock(request._id)}
                          className="btn btn-success btn-sm"
                        >
                          Assign Mock Card
                        </button>
                        <button
                          onClick={() => handleAction(request._id, 'declined')}
                          className="btn btn-danger btn-sm"
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
                        >
                          Mark as Paid
                        </button>
                        <button
                          onClick={() => handleAction(request._id, 'expired')}
                          className="btn btn-warning btn-sm"
                        >
                          Mark as Expired
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;

