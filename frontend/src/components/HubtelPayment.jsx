import { useState } from 'react';
import './HubtelPayment.css';

function HubtelPayment({ paymentData, onSuccess, onCancel }) {
  const [paymentMethod, setPaymentMethod] = useState('momo');
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
    if (paymentMethod === 'momo' && !phoneNumber) {
      setMessage({ type: 'error', text: 'Please enter your mobile money number' });
      return;
    }

    setProcessing(true);
    setMessage({ type: '', text: '' });

    // Show payment instructions
    setShowInstructions(true);
    setMessage({
      type: 'info',
      text: `Payment initiated! Reference: ${paymentReference}`
    });
  };

  const confirmPayment = () => {
    if (confirm(`Have you completed the payment of GHS ${totalPaidGHS.toFixed(2)}?`)) {
      onSuccess(paymentReference, paymentMethod);
    }
  };

  const paymentMethods = [
    { id: 'momo', name: 'Mobile Money', icon: '📱', description: 'MTN, Vodafone, AirtelTigo' },
    { id: 'cash', name: 'Cash Payment', icon: '💵', description: 'Pay at office' },
    { id: 'bank', name: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer' }
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

            {paymentMethod === 'momo' && (
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
            )}

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

            {paymentMethod === 'momo' && (
              <div className="instruction-card">
                <h4>📱 Mobile Money Payment</h4>
                <ol>
                  <li>Dial <strong>*170#</strong> on your mobile phone ({phoneNumber})</li>
                  <li>Select <strong>Option 6</strong> (My Wallet)</li>
                  <li>Select <strong>Option 3</strong> (My Approvals)</li>
                  <li>You will see a pending payment of <strong>GHS {totalPaidGHS.toFixed(2)}</strong></li>
                  <li>Enter your MOMO PIN to approve the payment</li>
                  <li>You will receive a confirmation SMS</li>
                </ol>
                <div className="payment-reference">
                  <strong>Payment Reference:</strong>
                  <code>{paymentReference}</code>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="instruction-card">
                <h4>💵 Cash Payment</h4>
                <p>Please visit our office to complete your payment:</p>
                <div className="office-info">
                  <p><strong>Location:</strong> BYU Pathway Office, Accra</p>
                  <p><strong>Amount:</strong> GHS {totalPaidGHS.toFixed(2)}</p>
                  <p><strong>Reference:</strong> {paymentReference}</p>
                </div>
                <p className="warning">⚠️ Please bring your BYU Student ID and mention this reference number</p>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="instruction-card">
                <h4>🏦 Bank Transfer</h4>
                <div className="bank-details">
                  <p><strong>Bank Name:</strong> [Your Bank Name]</p>
                  <p><strong>Account Name:</strong> BYU Pathway Ghana</p>
                  <p><strong>Account Number:</strong> [Account Number]</p>
                  <p><strong>Amount:</strong> GHS {totalPaidGHS.toFixed(2)}</p>
                  <p><strong>Reference:</strong> {paymentReference}</p>
                </div>
                <p className="warning">⚠️ Please use the payment reference as your transfer description</p>
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

