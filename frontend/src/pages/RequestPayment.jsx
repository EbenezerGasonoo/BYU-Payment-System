import { useState, useEffect } from 'react';
import { studentAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

function RequestPayment() {
  const [formData, setFormData] = useState({
    byuId: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [requestToken, setRequestToken] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(15.50); // Default GHS to USD rate
  const [rateLastUpdated, setRateLastUpdated] = useState(null);
  const [fetchingRate, setFetchingRate] = useState(false);
  const CHARGE_FEE_PERCENT = 5; // 5% chargeback fee
  const navigate = useNavigate();

  useEffect(() => {
    // Pre-fill BYU ID if user has registered
    const savedByuId = localStorage.getItem('userByuId');
    if (savedByuId) {
      setFormData(prev => ({ ...prev, byuId: savedByuId }));
    }

    // Show hint
    const hasRequested = localStorage.getItem('hasRequestedCard');
    if (!hasRequested) {
      setTimeout(() => setShowHint(true), 800);
    }

    // Fetch live exchange rate
    fetchExchangeRate();
  }, []);

  const fetchExchangeRate = async () => {
    setFetchingRate(true);
    try {
      // Using Open Exchange Rate API (free, no API key required)
      const response = await fetch('https://open.exchangerate-api.com/v6/latest/USD');
      const data = await response.json();
      
      if (data && data.rates && data.rates.GHS) {
        setExchangeRate(data.rates.GHS);
        setRateLastUpdated(new Date());
        console.log('✅ Live exchange rate fetched: 1 USD =', data.rates.GHS, 'GHS');
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate, using default:', error);
      setMessage({ type: 'error', text: 'Could not fetch live exchange rate. Using fallback rate.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setFetchingRate(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setShowHint(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if terms are accepted
    if (!termsAccepted) {
      setMessage({ type: 'error', text: 'Please read and accept the Terms and Agreement before submitting.' });
      setShowTerms(true);
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setRequestToken('');

    try {
      const response = await studentAPI.requestCard({
        byuId: formData.byuId,
        amount: parseFloat(formData.amount)
      });

      setMessage({ type: 'success', text: response.message });
      setRequestToken(response.data.requestToken);
      localStorage.setItem('hasRequestedCard', 'true');
      
      // Guide to next step
      setTimeout(() => {
        if (confirm('Request submitted! Admin will be notified. Would you like to check your dashboard?')) {
          navigate('/dashboard');
        }
      }, 3000);
      
      setFormData({ byuId: formData.byuId, amount: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Request failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        {showHint && (
          <div className="hint-banner hint-animated">
            <span className="hint-icon">👉</span>
            <p>Enter your BYU ID and the amount you need for school fees!</p>
            <button className="hint-close" onClick={() => setShowHint(false)}>✕</button>
          </div>
        )}

        <h1>Request Virtual Card</h1>
        <p className="subtitle">Submit a request to receive a virtual card for payment</p>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
            {requestToken && (
              <div className="token-box">
                <strong>Your Request Token:</strong>
                <code>{requestToken}</code>
                <p className="small-text">💾 Save this token to track your request</p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="byuId">BYU Student ID *</label>
            <input
              type="text"
              id="byuId"
              name="byuId"
              value={formData.byuId}
              onChange={handleChange}
              required
              placeholder="e.g., 123456789"
              pattern="[0-9]{9}"
              title="Please enter your 9-digit BYU Student ID"
            />
            <small className="field-hint">Enter your 9-digit BYU Student ID number</small>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount to Pay (USD) *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="1"
              step="0.01"
              placeholder="Enter amount in US Dollars"
            />
            <small className="field-hint">Enter the amount you need to pay in US Dollars (USD)</small>
          </div>

          {/* Exchange Rate Calculator */}
          {formData.amount && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 184, 28, 0.1), rgba(255, 200, 68, 0.1))',
              padding: '1.5rem',
              borderRadius: '16px',
              border: '2px solid rgba(255, 184, 28, 0.3)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💱</span>
                <h3 style={{ margin: 0, color: '#002E5D', fontSize: '1.1rem' }}>Exchange Rate Calculator</h3>
              </div>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#666', fontWeight: '500' }}>Amount in USD:</span>
                  <span style={{ color: '#002E5D', fontWeight: '700', fontSize: '1.1rem' }}>
                    ${parseFloat(formData.amount).toFixed(2)} USD
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: '#666', fontWeight: '500' }}>Exchange Rate:</span>
                    {rateLastUpdated && (
                      <span style={{ fontSize: '0.75rem', color: '#28a745', fontWeight: '500' }}>
                        🟢 Live • Updated {rateLastUpdated.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#FFB81C', fontWeight: '700', fontSize: '1.1rem' }}>
                      1 USD = {exchangeRate.toFixed(2)} GHS
                    </span>
                    <button
                      type="button"
                      onClick={fetchExchangeRate}
                      disabled={fetchingRate}
                      style={{
                        background: 'rgba(255, 184, 28, 0.2)',
                        border: '1px solid rgba(255, 184, 28, 0.4)',
                        borderRadius: '8px',
                        padding: '0.4rem 0.6rem',
                        cursor: fetchingRate ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.3s ease',
                        fontWeight: '600',
                        color: '#002E5D'
                      }}
                      title="Refresh exchange rate"
                    >
                      {fetchingRate ? '⏳' : '🔄'}
                    </button>
                  </div>
                </div>
                
                <div style={{
                  borderTop: '2px dashed rgba(255, 184, 28, 0.3)',
                  paddingTop: '0.75rem',
                  marginTop: '0.5rem',
                  display: 'grid',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontWeight: '500' }}>Base Amount (GHS):</span>
                    <span style={{ color: '#002E5D', fontWeight: '700', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                      GHS {(parseFloat(formData.amount) * exchangeRate).toFixed(2)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontWeight: '500' }}>Chargeback Fee ({CHARGE_FEE_PERCENT}%):</span>
                    <span style={{ color: '#dc3545', fontWeight: '700', fontSize: '1.05rem', fontFamily: 'monospace' }}>
                      GHS {(parseFloat(formData.amount) * exchangeRate * (CHARGE_FEE_PERCENT / 100)).toFixed(2)}
                    </span>
                  </div>

                  <div style={{
                    borderTop: '2px solid rgba(255, 184, 28, 0.4)',
                    paddingTop: '0.75rem',
                    marginTop: '0.25rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#002E5D', fontWeight: '700', fontSize: '1.15rem' }}>Total to Pay (GHS):</span>
                      <span style={{
                        color: '#28a745',
                        fontWeight: '800',
                        fontSize: '1.5rem',
                        fontFamily: 'monospace'
                      }}>
                        GHS {(parseFloat(formData.amount) * exchangeRate * (1 + CHARGE_FEE_PERCENT / 100)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p style={{
                margin: '1rem 0 0 0',
                fontSize: '0.85rem',
                color: '#856404',
                fontStyle: 'italic'
              }}>
                💡 Total includes a {CHARGE_FEE_PERCENT}% chargeback fee. You will receive a ${parseFloat(formData.amount).toFixed(2)} USD virtual card.
              </p>
            </div>
          )}

          <div className="alert alert-info">
            <strong>Important:</strong>
            <ul>
              <li>Make sure you're registered before requesting a card</li>
              <li>Enter the amount in USD - calculator shows the GHS equivalent you'll pay</li>
              <li>A {CHARGE_FEE_PERCENT}% chargeback fee is applied to cover processing costs</li>
              <li>The admin will be notified of your request</li>
              <li>You'll receive an email once your card is assigned</li>
              <li>Cards are valid for 4-6 hours after assignment</li>
              <li>Use the card only for BYU school fees payment</li>
            </ul>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ color: '#002E5D', fontWeight: '500' }}>
                I have read and accept the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  style={{
                    color: '#FFB81C',
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '700',
                    padding: '0'
                  }}
                >
                  Terms and Agreement
                </button>
              </span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !termsAccepted}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Terms and Agreement Modal */}
      {showTerms && (
        <div className="welcome-overlay" onClick={() => setShowTerms(false)}>
          <div className="welcome-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <button className="welcome-close" onClick={() => setShowTerms(false)}>✕</button>
            
            <div className="welcome-header">
              <div className="welcome-icon">📋</div>
              <h1>Terms and Agreement</h1>
              <p className="welcome-subtitle">Please read carefully before requesting a virtual card</p>
            </div>

            <div className="welcome-body" style={{ padding: '2rem', maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h3 style={{ color: '#002E5D', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>1️⃣</span> Payment Purpose
                  </h3>
                  <p style={{ color: '#555', lineHeight: '1.6', marginLeft: '2rem' }}>
                    The payment is solely for payment on the BYU school page. Virtual cards must not be used for any other purpose.
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#002E5D', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>2️⃣</span> Currency & Exchange Rate
                  </h3>
                  <p style={{ color: '#555', lineHeight: '1.6', marginLeft: '2rem' }}>
                    You enter the amount in US Dollars (USD) needed for your school fees. The system will calculate and show you the Ghana Cedis (GHS) equivalent you need to pay based on the current live exchange rate.
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#002E5D', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>3️⃣</span> Chargeback Fee
                  </h3>
                  <p style={{ color: '#555', lineHeight: '1.6', marginLeft: '2rem' }}>
                    A {CHARGE_FEE_PERCENT}% chargeback fee is applied to cover transaction and processing costs. This fee is included in the total GHS amount you pay.
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#002E5D', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>4️⃣</span> Remaining Balances
                  </h3>
                  <p style={{ color: '#555', lineHeight: '1.6', marginLeft: '2rem' }}>
                    Any remaining balances after payment should be raised in a support ticket for the admin to process and send back to the student.
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#002E5D', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>5️⃣</span> Proper Use
                  </h3>
                  <p style={{ color: '#555', lineHeight: '1.6', marginLeft: '2rem' }}>
                    I will not use this platform for malicious purposes. Any abuse or fraudulent activity will result in immediate account suspension and possible legal action.
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#002E5D', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>6️⃣</span> Exchange Rate Acceptance
                  </h3>
                  <p style={{ color: '#555', lineHeight: '1.6', marginLeft: '2rem' }}>
                    I accept that the current exchange rate displayed will be used to calculate the GHS amount I need to pay. I understand that exchange rates may fluctuate and the rate shown at the time of request will be applied.
                  </p>
                </div>

                <div style={{ 
                  background: 'rgba(255, 184, 28, 0.1)', 
                  padding: '1rem', 
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 184, 28, 0.3)',
                  marginTop: '1rem'
                }}>
                  <p style={{ color: '#856404', fontWeight: '600', margin: 0, lineHeight: '1.6' }}>
                    ⚠️ <strong>Important:</strong> Virtual cards expire 4-6 hours after assignment. Please complete your payment promptly.
                  </p>
                </div>
              </div>
            </div>

            <div className="welcome-footer">
              <button 
                className="welcome-btn-primary" 
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTerms(false);
                }}
              >
                I Accept the Terms
              </button>
              <button 
                className="welcome-btn-text" 
                onClick={() => setShowTerms(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestPayment;

