import { useState, useEffect } from 'react';
import { studentAPI } from '../api/api';
import VirtualCardVisualizer from '../components/VirtualCardVisualizer';
import axios from 'axios';

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

  const handleFreezeToggle = async (requestId) => {
    try {
      const response = await axios.post(`/api/students/cards/${requestId}/freeze`);
      if (response.data && response.data.success) {
        setDashboardData(prev => {
          if (!prev) return prev;
          const updatedRequests = prev.cardRequests.map(req => {
            if (req.id === requestId || req._id === String(requestId)) {
              return { ...req, cardStatus: response.data.cardStatus };
            }
            return req;
          });
          return { ...prev, cardRequests: updatedRequests };
        });
      }
    } catch (err) {
      alert('Failed to toggle card status');
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

      <div className="white-glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#002E5D', marginBottom: '0.5rem', fontSize: '2rem', fontWeight: '700' }}>
          Student Dashboard
        </h1>
        <p style={{ color: '#666', fontSize: '1rem', margin: '0 0 1.5rem 0' }}>
          View your card requests, virtual card details, and status
        </p>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={byuId}
            onChange={(e) => setByuId(e.target.value)}
            placeholder="Enter your 7-8 digit BYU Student ID"
            pattern="[0-9]{7,8}"
            title="Please enter your 7-8 digit BYU Student ID"
            required
          />
          <small className="field-hint">Enter your 7-8 digit BYU Student ID number</small>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Load Dashboard'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {dashboardData && (
        <div className="dashboard">
          <div className="white-glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h2 style={{ color: '#002E5D', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
              Student Information
            </h2>
            <div className="info-grid">
              <div><strong>Name:</strong> {dashboardData.student.name}</div>
              <div><strong>BYU ID:</strong> {dashboardData.student.byuId}</div>
              <div><strong>Email:</strong> {dashboardData.student.email}</div>
              <div><strong>Phone:</strong> {dashboardData.student.phone}</div>
            </div>
          </div>

          <h2 style={{ color: '#002E5D', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600' }}>
            Card Requests History
          </h2>
          {dashboardData.cardRequests.length === 0 ? (
            <div className="white-glass-card" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
              No card requests found.
            </div>
          ) : (
            <div className="requests-grid">
              {dashboardData.cardRequests.map((request) => (
                <div key={request._id || request.id} className="white-glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                  <div className="request-header">
                    <span className={`badge ${getStatusBadge(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                    <span className="request-token">{request.requestToken}</span>
                  </div>

                  <div className="request-body">
                    <p><strong>Amount:</strong> ${request.amount} USD ({request.currency || 'GHS'} {request.amountLocal || request.amountInGHS || request.amount})</p>
                    <p><strong>Requested:</strong> {formatDate(request.createdAt)}</p>

                    {request.status === 'assigned' && request.virtualCardNumber && (
                      <div className="card-details-wrapper" style={{ marginTop: '1.5rem' }}>
                        <VirtualCardVisualizer
                          cardNumber={request.virtualCardNumber}
                          cardholderName={request.cardholderName || dashboardData.student.name}
                          expiryDate={request.cardExpiryDate}
                          cvv={request.cardCVV}
                          amountUsd={request.amount}
                          cardStatus={request.cardStatus || 'active'}
                          onFreezeToggle={() => handleFreezeToggle(request.id || request._id)}
                        />
                        <p className="expiry-warning" style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3e2', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid #f59e0b' }}>
                          <strong>⏰ Card Expires:</strong> {formatDate(request.expiresAt)}
                        </p>
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

