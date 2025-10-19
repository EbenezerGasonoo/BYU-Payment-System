import { useState } from 'react';
import { studentAPI } from '../api/api';
import './HubtelPayment.css';

function HubtelPayment({ paymentData, onSuccess, onCancel }) {
  const [paymentMethod, setPaymentMethod] = useState('momo-hubtel');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showInstructions, setShowInstructions] = useState(false);
  const [mtnReferenceId, setMtnReferenceId] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const { 
    amount, 
    amountInGHS, 
    totalPaidGHS, 
    paymentReference, 
    studentName, 
    studentEmail 
  } = paymentData;

  const initiatePayment = async () => {
    if (!phoneNumber) {
      setMessage({ type: 'error', text: 'Please enter your mobile money number' });
      return;
    }

    setProcessing(true);
    setMessage({ type: '', text: '' });

    if (paymentMethod === 'momo-hubtel') {
      try {
        setMessage({ type: 'info', text: 'Initiating payment with Hubtel...' });

        // Call backend to initiate Hubtel payment
        const response = await studentAPI.initiateHubtelPayment({
          phoneNumber,
          amount: totalPaidGHS,
          paymentReference,
          studentName: studentName || 'Student',
          studentEmail: studentEmail || ''
        });

        if (response.success) {
          setMessage({
            type: 'success',
            text: 'Redirecting to Hubtel payment page...'
          });

          // Redirect to Hubtel checkout URL
          setTimeout(() => {
            window.location.href = response.data.checkoutUrl;
          }, 1500);
        } else {
          setMessage({
            type: 'error',
            text: response.message || 'Failed to initiate payment'
          });
          setProcessing(false);
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to initiate Hubtel payment'
        });
        setProcessing(false);
      }
    } else if (paymentMethod === 'momo-direct') {
      // For MTN MoMo Direct (using MTN API)
      try {
        setMessage({ type: 'info', text: 'Sending payment prompt to your phone...' });

        // Call backend to initiate MTN MoMo Request to Pay
        const response = await studentAPI.initiateMtnPayment({
          phoneNumber,
          amount: totalPaidGHS,
          paymentReference,
          description: `BYU Virtual Card - ${studentName || 'Student'}`
        });

        if (response.success) {
          setMtnReferenceId(response.data.referenceId);
          setShowInstructions(true);
          setMessage({
            type: 'success',
            text: `Payment prompt sent to ${phoneNumber}! Check your phone.`
          });
          setProcessing(false);

          // Start polling for payment status
          startMtnStatusPolling(response.data.referenceId);
        } else {
          setMessage({
            type: 'error',
            text: response.message || 'Failed to send payment prompt'
          });
          setProcessing(false);
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to initiate MTN MoMo payment'
        });
        setProcessing(false);
      }
    }
  };

  const startMtnStatusPolling = (referenceId) => {
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes (5 second intervals)

    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        setCheckingStatus(true);
        const result = await studentAPI.checkMtnPayment({
          referenceId,
          paymentReference
        });

        if (result.success && result.data.status === 'SUCCESSFUL') {
          clearInterval(pollInterval);
          setMessage({
            type: 'success',
            text: 'Payment verified successfully!'
          });
          setTimeout(() => {
            onSuccess(paymentReference, paymentMethod);
          }, 1500);
        } else if (result.data.status === 'FAILED') {
          clearInterval(pollInterval);
          setMessage({
            type: 'error',
            text: 'Payment failed. Please try again.'
          });
          setCheckingStatus(false);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setCheckingStatus(false);
          setMessage({
            type: 'warning',
            text: 'Payment verification timeout. Click "I\'ve Completed Payment" if you approved it.'
          });
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000); // Check every 5 seconds
  };

  const confirmPayment = () => {
    if (confirm(`Have you completed the payment of GHS ${totalPaidGHS.toFixed(2)}?`)) {
      onSuccess(paymentReference, paymentMethod);
    }
  };

  const paymentMethods = [
    { id: 'momo-hubtel', name: 'Mobile Money (Hubtel)', icon: '📱', description: 'Secure payment - MTN, Vodafone, AirtelTigo', disabled: false },
    { id: 'momo-direct', name: 'MTN Mobile Money Direct', icon: '💳', description: 'Coming Soon - Under Development', disabled: true }
  ];

  return (
    <div className="payment-modal-overlay" onClick={onCancel}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-close" onClick={onCancel}>✕</button>

        <div className="payment-header">
          <div className="payment-icon">💳</div>
          <h2>Complete Payment</h2>
          <p>Secure payment via Hubtel</p>
        </div>

        <div className="payment-summary">
          <div className="summary-row">
            <span>Card Amount (USD):</span>
            <strong>${amount.toFixed(2)}</strong>
          </div>
          <div className="summary-row">
            <span>Amount in GHS:</span>
            <strong>GHS {amountInGHS.toFixed(2)}</strong>
          </div>
          <div className="summary-row" style={{ color: '#dc3545' }}>
            <span>Processing Fee (5%):</span>
            <strong>GHS {(totalPaidGHS - amountInGHS).toFixed(2)}</strong>
          </div>
          <div className="summary-row total">
            <span>Total to Pay:</span>
            <strong>GHS {totalPaidGHS.toFixed(2)}</strong>
          </div>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type}`} style={{ margin: '1rem 0' }}>
            {message.text}
          </div>
        )}

        {!showInstructions ? (
          <>
            <div className="payment-methods">
              <h3 style={{ marginBottom: '1rem', color: '#002E5D' }}>Select Payment Method</h3>
              {paymentMethods.map(method => (
                <div
                  key={method.id}
                  className={`payment-method-card ${paymentMethod === method.id ? 'active' : ''} ${method.disabled ? 'disabled' : ''}`}
                  onClick={() => !method.disabled && setPaymentMethod(method.id)}
                  style={{
                    opacity: method.disabled ? 0.5 : 1,
                    cursor: method.disabled ? 'not-allowed' : 'pointer',
                    position: 'relative'
                  }}
                >
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-info">
                    <h4>
                      {method.name}
                      {method.disabled && (
                        <span style={{
                          marginLeft: '0.5rem',
                          fontSize: '0.75rem',
                          background: 'rgba(108, 117, 125, 0.2)',
                          color: '#6c757d',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          COMING SOON
                        </span>
                      )}
                    </h4>
                    <p>{method.description}</p>
                  </div>
                  <div className="method-radio">
                    <input
                      type="radio"
                      checked={paymentMethod === method.id && !method.disabled}
                      onChange={() => !method.disabled && setPaymentMethod(method.id)}
                      disabled={method.disabled}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Mobile Money Number *</label>
              <input
                type="tel"
                placeholder="e.g., 0241234567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                pattern="[0-9]{10}"
                required
              />
              <small>Enter your 10-digit mobile money number</small>
            </div>

            <div className="payment-actions">
              <button
                className="btn btn-primary"
                onClick={initiatePayment}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Proceed to Pay'}
              </button>
              <button className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="payment-instructions">
            <h3 style={{ color: '#002E5D', marginBottom: '1rem' }}>Payment Instructions</h3>

            {paymentMethod === 'momo-hubtel' && (
              <div className="instruction-card">
                <h4>📱 Mobile Money Payment Prompt Sent!</h4>
                <div style={{ background: 'rgba(40, 167, 69, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <p style={{ marginBottom: '0.5rem', color: '#28a745', fontWeight: '700', fontSize: '1.2rem' }}>
                    ✅ Payment prompt sent to {phoneNumber}
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                    Check your phone NOW!
                  </p>
                </div>
                
                <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>What to do now:</h4>
                <ol>
                  <li><strong>Check your phone ({phoneNumber})</strong> for a payment notification</li>
                  <li>You should receive a <strong>MoMo prompt</strong> asking you to approve GHS {totalPaidGHS.toFixed(2)}</li>
                  <li><strong>Approve the payment</strong> by entering your MOMO PIN</li>
                  <li>You will receive an <strong>SMS confirmation</strong></li>
                  <li>Your card request will be <strong>automatically submitted to admin</strong></li>
                </ol>

                <div style={{ background: 'rgba(255, 184, 28, 0.1)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, color: '#856404', fontWeight: '600', fontSize: '0.95rem' }}>
                    💡 <strong>Didn't receive the prompt?</strong>
                  </p>
                  <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                    <li>Check if you have network signal</li>
                    <li>Make sure your phone number is correct: {phoneNumber}</li>
                    <li>Wait a few seconds and check again</li>
                    <li>The prompt should appear automatically</li>
                  </ul>
                </div>

                <div className="payment-reference">
                  <strong>Payment Reference:</strong>
                  <code>{paymentReference}</code>
                </div>
                
                <p className="warning" style={{ marginTop: '1rem' }}>
                  ⏰ <strong>Important:</strong> The payment prompt will expire in 2 minutes. Please approve promptly to avoid timeout.
                </p>
              </div>
            )}

            {paymentMethod === 'momo-direct' && (
              <div className="instruction-card">
                <h4>💳 MTN Mobile Money Payment Prompt Sent!</h4>
                <div style={{ background: 'rgba(40, 167, 69, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <p style={{ marginBottom: '0.5rem', color: '#28a745', fontWeight: '700', fontSize: '1.2rem' }}>
                    ✅ Payment prompt sent to {phoneNumber}
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                    {checkingStatus ? '🔄 Waiting for payment approval...' : 'Check your MTN phone NOW!'}
                  </p>
                </div>
                
                <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>What to do now:</h4>
                <ol>
                  <li><strong>Check your MTN phone ({phoneNumber})</strong> for a payment notification</li>
                  <li>You should receive a <strong>pop-up prompt</strong> asking you to approve GHS {totalPaidGHS.toFixed(2)}</li>
                  <li><strong>Approve the payment</strong> by entering your MTN MOMO PIN</li>
                  <li>You will receive an <strong>SMS confirmation</strong></li>
                  <li>Your card request will be <strong>automatically verified and submitted</strong></li>
                </ol>

                {checkingStatus && (
                  <div style={{ background: 'rgba(0, 123, 255, 0.1)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#007bff', fontWeight: '600' }}>
                      🔄 Checking payment status...
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                      Waiting for you to approve the payment on your phone
                    </p>
                  </div>
                )}

                <div style={{ background: 'rgba(255, 184, 28, 0.1)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, color: '#856404', fontWeight: '600', fontSize: '0.95rem' }}>
                    💡 <strong>Didn't receive the prompt?</strong>
                  </p>
                  <ul style={{ marginTop: '0.5rem', marginBottom: 0, paddingLeft: '1.5rem' }}>
                    <li>Check if you have network signal on your MTN line</li>
                    <li>Make sure your phone number is correct: {phoneNumber}</li>
                    <li>Wait a few seconds - the prompt should appear</li>
                    <li>Check if your MTN MoMo is active and has balance for fees</li>
                  </ul>
                </div>

                <div className="payment-reference">
                  <strong>Payment Reference:</strong>
                  <code>{paymentReference}</code>
                  {mtnReferenceId && (
                    <>
                      <br /><br />
                      <strong>MTN Transaction ID:</strong>
                      <code style={{fontSize: '0.85rem'}}>{mtnReferenceId}</code>
                    </>
                  )}
                </div>
                
                <p className="warning" style={{ marginTop: '1rem' }}>
                  ⏰ <strong>Important:</strong> The payment prompt will expire in 2 minutes. Please approve promptly.
                </p>
              </div>
            )}

            <div className="payment-actions" style={{ marginTop: '2rem' }}>
              <button className="btn btn-success" onClick={confirmPayment}>
                ✓ I've Completed Payment
              </button>
              <button className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HubtelPayment;

