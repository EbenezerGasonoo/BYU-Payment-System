import { useState } from 'react';
import { studentAPI } from '../api/api';
import './HubtelPayment.css';

function HubtelPayment({ paymentData, onSuccess, onCancel }) {
  const [paymentMethod, setPaymentMethod] = useState('momo-hubtel');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showInstructions, setShowInstructions] = useState(false);

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
          // Show instructions - prompt sent to phone
          setShowInstructions(true);
          setMessage({
            type: 'success',
            text: `Payment prompt sent to ${phoneNumber}! Check your phone now.`
          });
          setProcessing(false);
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
    } else {
      // For momo-direct, show manual payment instructions
      setShowInstructions(true);
      setMessage({
        type: 'info',
        text: `Payment initiated! Reference: ${paymentReference}`
      });
    }
  };

  const confirmPayment = () => {
    if (confirm(`Have you completed the payment of GHS ${totalPaidGHS.toFixed(2)}?`)) {
      onSuccess(paymentReference, paymentMethod);
    }
  };

  const paymentMethods = [
    { id: 'momo-hubtel', name: 'Mobile Money (Hubtel)', icon: '📱', description: 'Automated via Hubtel - MTN, Vodafone, AirtelTigo' },
    { id: 'momo-direct', name: 'MTN Mobile Money Direct', icon: '💳', description: 'Direct transfer to our MTN MoMo number' }
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
                  className={`payment-method-card ${paymentMethod === method.id ? 'active' : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-info">
                    <h4>{method.name}</h4>
                    <p>{method.description}</p>
                  </div>
                  <div className="method-radio">
                    <input
                      type="radio"
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
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
                <h4>💳 MTN Mobile Money Direct Transfer</h4>
                <p style={{ marginBottom: '1rem', color: '#856404', fontWeight: '600' }}>
                  📲 Send money directly to our MTN Mobile Money account
                </p>
                <div className="office-info">
                  <p><strong>Network:</strong> MTN Mobile Money</p>
                  <p><strong>MTN MoMo Number:</strong> <span style={{fontSize: '1.2rem', color: '#002E5D', fontWeight: 'bold'}}>0241234567</span></p>
                  <p><strong>Account Name:</strong> BYU Pathway Ghana</p>
                  <p><strong>Amount to Send:</strong> <span style={{fontSize: '1.2rem', color: '#28a745', fontWeight: 'bold'}}>GHS {totalPaidGHS.toFixed(2)}</span></p>
                </div>
                
                <h4 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>How to Pay via MTN:</h4>
                <ol>
                  <li>Dial <strong>*170#</strong> on your MTN phone</li>
                  <li>Select <strong>Send Money</strong></li>
                  <li>Enter recipient number: <strong>0241234567</strong></li>
                  <li>Enter amount: <strong>GHS {totalPaidGHS.toFixed(2)}</strong></li>
                  <li>Add reference: <strong>{paymentReference}</strong></li>
                  <li>Enter your MTN MOMO PIN to confirm</li>
                  <li>Save the transaction confirmation SMS</li>
                </ol>

                <div className="payment-reference">
                  <strong>Payment Reference (IMPORTANT!):</strong>
                  <code>{paymentReference}</code>
                </div>
                
                <p className="warning" style={{ marginTop: '1rem' }}>
                  ⚠️ <strong>IMPORTANT:</strong> Make sure to include the payment reference in your transaction. Admin will verify using this reference.
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

