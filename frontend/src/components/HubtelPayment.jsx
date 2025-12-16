import { useState } from 'react';
import { studentAPI } from '../api/api';
import './HubtelPayment.css';

function HubtelPayment({ paymentData, onSuccess, onCancel }) {
  const [paymentMethod, setPaymentMethod] = useState('momo-hubtel'); // Default to Hubtel
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
        setMessage({ type: 'info', text: 'Creating Hubtel checkout...' });

        // Call backend to initiate Hubtel Online Checkout
        const response = await studentAPI.initiateHubtelPayment({
          phoneNumber: phoneNumber || '',
          amount: totalPaidGHS,
          paymentReference,
          studentName: studentName || 'Student',
          studentEmail: studentEmail || ''
        });

        if (response.success && response.data.checkoutUrl) {
          // Redirect to Hubtel checkout page
          setMessage({
            type: 'success',
            text: 'Redirecting to Hubtel checkout...'
          });
          
          // Redirect to Hubtel checkout
          window.location.href = response.data.checkoutUrl;
        } else {
          setMessage({
            type: 'error',
            text: response.message || response.error || 'Failed to create checkout'
          });
          setProcessing(false);
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || error.response?.data?.error || 'Failed to initiate Hubtel payment'
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
    { id: 'momo-hubtel', name: 'Mobile Money (Hubtel)', icon: '📱', description: 'Secure payment - MTN, Vodafone, AirtelTigo', disabled: false, comingSoon: false },
    { id: 'momo-manual', name: 'Manual Mobile Money', icon: '💰', description: 'Pay directly to our account', disabled: false, comingSoon: false }
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
            {paymentMethods.length > 1 && (
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
                      {method.comingSoon && (
                        <span style={{
                          marginLeft: '0.75rem',
                          fontSize: '0.7rem',
                          background: 'linear-gradient(135deg, #FFB81C 0%, #FFC844 100%)',
                          color: '#002E5D',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '12px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          boxShadow: '0 2px 8px rgba(255, 184, 28, 0.3)',
                          border: '1px solid rgba(0, 46, 93, 0.2)'
                        }}>
                          🚀 Coming Soon
                        </span>
                      )}
                      {method.disabled && !method.comingSoon && (
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
            )}

            {paymentMethod === 'momo-hubtel' ? (
              <>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Mobile Money Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g., 0241234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    pattern="[0-9]{10}"
                  />
                  <small>Optional: Enter your number for faster checkout</small>
                </div>

                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(0, 46, 93, 0.05), rgba(0, 61, 130, 0.05))', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  marginTop: '1rem',
                  border: '1px solid rgba(0, 46, 93, 0.1)'
                }}>
                  <h4 style={{ color: '#002E5D', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>
                    📱 How Hubtel Payment Works:
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8', color: '#666', fontSize: '0.9rem' }}>
                    <li>Click "Proceed to Pay" to open Hubtel checkout</li>
                    <li>Select your mobile money network (MTN, Vodafone, or AirtelTigo)</li>
                    <li>Enter your mobile money number and approve payment</li>
                    <li>You'll be redirected back automatically after payment</li>
                  </ol>
                </div>

                <div className="payment-actions" style={{ marginTop: '1.5rem' }}>
                  <button
                    className="btn btn-primary"
                    onClick={initiatePayment}
                    disabled={processing}
                  >
                    {processing ? 'Creating Checkout...' : 'Proceed to Hubtel Checkout'}
                  </button>
                  <button className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                  </button>
                </div>
              </>
            ) : paymentMethod === 'momo-manual' ? (
              <div className="payment-instructions" style={{ marginTop: '1.5rem' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(255, 184, 28, 0.1), rgba(255, 200, 68, 0.1))', 
                  padding: '1.5rem', 
                  borderRadius: '12px', 
                  border: '2px solid rgba(255, 184, 28, 0.3)',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ color: '#002E5D', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>💰</span>
                    Manual Payment Instructions
                  </h3>
                  
                  <div style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 1rem 0', color: '#666', fontSize: '0.95rem' }}>
                      Send <strong style={{ color: '#002E5D', fontSize: '1.1rem' }}>GHS {totalPaidGHS.toFixed(2)}</strong> via Mobile Money to:
                    </p>
                    
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(0, 46, 93, 0.05)', borderRadius: '6px' }}>
                        <span style={{ color: '#666', fontWeight: '500' }}>Mobile Number:</span>
                        <strong style={{ color: '#002E5D', fontSize: '1.1rem', fontFamily: 'monospace' }}>0594767131</strong>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(0, 46, 93, 0.05)', borderRadius: '6px' }}>
                        <span style={{ color: '#666', fontWeight: '500' }}>Account Name:</span>
                        <strong style={{ color: '#002E5D', fontSize: '0.95rem' }}>ENCRYPTION NONCE TECHNOLOGY</strong>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255, 184, 28, 0.15)', borderRadius: '6px', border: '2px solid rgba(255, 184, 28, 0.3)' }}>
                        <span style={{ color: '#856404', fontWeight: '600' }}>Reference/Description:</span>
                        <strong style={{ color: '#856404', fontSize: '1.05rem', fontFamily: 'monospace' }}>{paymentData.byuId}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0, 123, 255, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <p style={{ margin: '0 0 0.75rem 0', color: '#007bff', fontWeight: '600' }}>
                      📝 Important Steps:
                    </p>
                    <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8', color: '#333' }}>
                      <li>Open your Mobile Money app or dial your network's MoMo code</li>
                      <li>Select "Send Money" or "Transfer"</li>
                      <li>Enter the number: <strong>0594767131</strong></li>
                      <li>Enter the amount: <strong>GHS {totalPaidGHS.toFixed(2)}</strong></li>
                      <li>In the reference/description field, enter your Student ID: <strong>{paymentData.byuId}</strong></li>
                      <li>Verify the recipient name shows: <strong>ENCRYPTION NONCE TECHNOLOGY</strong></li>
                      <li>Complete the transaction</li>
                      <li>Click the button below after payment</li>
                    </ol>
                  </div>

                  <div style={{ background: 'rgba(220, 53, 69, 0.1)', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: '#dc3545', fontWeight: '600', fontSize: '0.9rem' }}>
                      ⚠️ <strong>IMPORTANT:</strong> You MUST include your Student ID ({paymentData.byuId}) in the reference field for us to verify your payment!
                    </p>
                  </div>
                </div>

                <div className="payment-actions">
                  <button 
                    className="btn btn-success" 
                    onClick={confirmPayment}
                  >
                    ✓ I've Completed the Payment
                  </button>
                  <button className="btn btn-secondary" onClick={onCancel}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
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
            )}
          </>
        ) : (
          <div className="payment-instructions">
            <h3 style={{ color: '#002E5D', marginBottom: '1rem' }}>Payment Instructions</h3>

            {paymentMethod === 'momo-hubtel' && (
              <div className="instruction-card">
                <h4>📱 Payment Request Sent!</h4>
                <div style={{ background: 'rgba(40, 167, 69, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
                  <p style={{ marginBottom: '0.5rem', color: '#28a745', fontWeight: '700', fontSize: '1.2rem' }}>
                    ✅ Payment initiated for {phoneNumber}
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                    Payment processing...
                  </p>
                </div>
                
                <div style={{ background: 'rgba(0, 123, 255, 0.1)', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#007bff' }}>⏳ What happens next:</h4>
                  <ol style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    <li>Hubtel is processing your payment request</li>
                    <li>You may receive an SMS notification</li>
                    <li>The payment will be automatically verified</li>
                    <li>You'll be notified when complete</li>
                  </ol>
                </div>

                <div style={{ background: 'rgba(255, 184, 28, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, color: '#856404', fontWeight: '600', fontSize: '0.95rem' }}>
                    💡 <strong>Payment Status:</strong>
                  </p>
                  <p style={{ marginTop: '0.5rem', marginBottom: 0, color: '#666' }}>
                    Hubtel will send a callback when the payment is complete. If you've completed the payment, click the button below to verify.
                  </p>
                </div>

                <div className="payment-reference">
                  <strong>Payment Reference:</strong>
                  <code>{paymentReference}</code>
                </div>
                
                <p className="warning" style={{ marginTop: '1rem' }}>
                  ⏰ <strong>Note:</strong> Payment processing typically takes less than 30 seconds. You'll receive confirmation automatically.
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

