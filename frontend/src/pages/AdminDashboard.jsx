import { useState, useEffect } from 'react';
import { adminAPI } from '../api/api';
import AdminChat from '../components/AdminChat';

function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'chat'

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
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('requests')} 
              className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem' }}
            >
              📋 Card Requests
            </button>
            <button 
              onClick={() => setActiveTab('chat')} 
              className={`btn ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem' }}
            >
              💬 Live Chat
            </button>
          </div>
          <button onClick={() => setAuthenticated(false)} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {activeTab === 'chat' ? (
        <AdminChat adminKey={adminKey} />
      ) : (
        <>
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
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>Card Requests</h2>
        {requests.length === 0 ? (
          <div className="alert alert-info">No requests found.</div>
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
                  <div className="table-student-name">{request.student.name}</div>
                  <div className="table-student-id">{request.student.byuId} • {request.requestToken}</div>
                </td>
                <td>
                  <div style={{ fontWeight: '600', color: '#1f2937' }}>${request.amount}</div>
                  {request.amountInGHS && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      GHS {request.totalPaidGHS.toFixed(2)}
                    </div>
                  )}
                </td>
                <td>
                  {request.paymentMethod && (
                    <div>
                      <span style={{
                        fontSize: '0.813rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: request.paymentMethod === 'momo-manual' ? '#fef3e2' : '#ecfdf5',
                        color: request.paymentMethod === 'momo-manual' ? '#92400e' : '#065f46',
                        fontWeight: '500'
                      }}>
                        {request.paymentMethod === 'momo-manual' ? 'Manual' : 'Automated'}
                      </span>
                    </div>
                  )}
                  {request.paymentStatus && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      {request.paymentStatus}
                    </div>
                  )}
                </td>
                <td>
                  <span className={`badge ${getStatusBadge(request.status)}`}>
                    {request.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontSize: '0.813rem', color: '#6b7280' }}>
                  {new Date(request.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <div className="table-actions">
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
    </div>
  );
}

export default AdminDashboard;

