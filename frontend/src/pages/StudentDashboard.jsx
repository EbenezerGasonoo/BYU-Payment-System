import { useState, useEffect } from 'react';
import { studentAPI } from '../api/api';

function StudentDashboard() {
  const [byuId, setByuId] = useState('');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Auto-fill BYU ID if available
    const savedByuId = localStorage.getItem('userByuId');
    if (savedByuId) {
      setByuId(savedByuId);
      // Auto-load if user has ID
      setTimeout(() => {
        const hasViewedDashboard = localStorage.getItem('hasViewedDashboard');
        if (!hasViewedDashboard) {
          setShowHint(true);
        }
      }, 1000);
    } else {
      setTimeout(() => setShowHint(true), 1000);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDashboardData(null);
    setShowHint(false);

    try {
      const response = await studentAPI.getDashboard(byuId);
      setDashboardData(response.data);
      localStorage.setItem('hasViewedDashboard', 'true');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
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

  return (
    <div className="container">
      {showHint && (
        <div className="hint-banner hint-floating">
          <span className="hint-icon">🔍</span>
          <p>
            {byuId ? 
              'Click "Load Dashboard" to see your requests!' : 
              'Enter your BYU ID to view all your card requests and their status.'
            }
          </p>
          <button className="hint-close" onClick={() => setShowHint(false)}>✕</button>
        </div>
      )}

      <h1>Student Dashboard</h1>
      <p className="subtitle">View your card requests and status</p>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={byuId}
          onChange={(e) => setByuId(e.target.value)}
          placeholder="Enter your 9-digit BYU Student ID"
          pattern="[0-9]{9}"
          title="Please enter your 9-digit BYU Student ID"
          required
        />
        <small className="field-hint">Enter your 9-digit BYU Student ID number</small>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Loading...' : 'Load Dashboard'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {dashboardData && (
        <div className="dashboard">
          <div className="student-info-card">
            <h2>Student Information</h2>
            <div className="info-grid">
              <div><strong>Name:</strong> {dashboardData.student.name}</div>
              <div><strong>BYU ID:</strong> {dashboardData.student.byuId}</div>
              <div><strong>Email:</strong> {dashboardData.student.email}</div>
              <div><strong>Phone:</strong> {dashboardData.student.phone}</div>
            </div>
          </div>

          <h2>Card Requests History</h2>
          {dashboardData.cardRequests.length === 0 ? (
            <div className="alert alert-info">No card requests found.</div>
          ) : (
            <div className="requests-grid">
              {dashboardData.cardRequests.map((request) => (
                <div key={request._id} className="request-card">
                  <div className="request-header">
                    <span className={`badge ${getStatusBadge(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                    <span className="request-token">{request.requestToken}</span>
                  </div>

                  <div className="request-body">
                    <p><strong>Amount:</strong> GHS {request.amount}</p>
                    <p><strong>Requested:</strong> {formatDate(request.createdAt)}</p>

                    {request.status === 'assigned' && (
                      <div className="card-details">
                        <h4>Virtual Card Details</h4>
                        <div className="card-info">
                          <p><strong>Card Number:</strong> {request.virtualCardNumber}</p>
                          <p><strong>Expiry:</strong> {request.cardExpiryDate}</p>
                          <p><strong>CVV:</strong> {request.cardCVV}</p>
                          <p className="expiry-warning">
                            <strong>Expires At:</strong> {formatDate(request.expiresAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {request.status === 'paid' && (
                      <p className="success-text">✅ Payment completed on {formatDate(request.paidAt)}</p>
                    )}

                    {request.status === 'expired' && (
                      <p className="error-text">⏰ Card expired. Please submit a new request.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;

