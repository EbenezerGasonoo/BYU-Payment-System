import { useState } from 'react';
import { studentAPI } from '../api/api';

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
    // Hubtel checkout collects the number itself; only the direct MTN prompt needs it here
    if (paymentMethod === 'momo-direct' && !phoneNumber) {
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
    { id: 'momo-hubtel', name: 'Mobile Money through Hubtel', description: 'MTN MoMo, Telecel Cash or AT Money. Confirmed automatically.' },
    { id: 'momo-manual', name: 'Send Mobile Money manually', description: 'Transfer to our MoMo number. Confirmed by our team.' }
  ];

  const MANUAL_NUMBER = '0594767131';
  const MANUAL_NAME = 'ENCRYPTION NONCE TECHNOLOGY';

  return (
    <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="pay-title" onClick={onCancel}>
      <div className="cp-modal__panel cp-card" onClick={(e) => e.stopPropagation()}>
        <div className="cp-card__body">
          <div className="cp-pay__head">
            <h2 id="pay-title" className="cp-h2">Pay for your card</h2>
            <button type="button" className="cp-iconbtn" onClick={onCancel} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>

          <dl className="cp-rows" style={{ marginTop: 12 }}>
            <div>
              <dt>Card amount</dt>
              <dd>${amount.toFixed(2)}</dd>
            </div>
            <div>
              <dt>In cedis</dt>
              <dd>GHS {amountInGHS.toFixed(2)}</dd>
            </div>
            <div>
              <dt>Service fee (5%)</dt>
              <dd>GHS {(totalPaidGHS - amountInGHS).toFixed(2)}</dd>
            </div>
            <div className="cp-rows__total">
              <dt>Total to pay</dt>
              <dd>GHS {totalPaidGHS.toFixed(2)}</dd>
            </div>
          </dl>

          {message.text && (
            <div
              className={`cp-alert cp-alert--${message.type === 'error' ? 'error' : message.type === 'success' ? 'success' : 'info'}`}
              style={{ marginTop: 16 }}
              role="status"
            >
              {message.text}
            </div>
          )}

          {!showInstructions ? (
            <>
              <fieldset className="cp-methods">
                <legend className="cp-h3">How do you want to pay?</legend>
                {paymentMethods.map((method) => (
                  <label key={method.id} className={`cp-method ${paymentMethod === method.id ? 'is-active' : ''}`}>
                    <input
                      type="radio"
                      name="payment-method"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                    />
                    <span>
                      <strong>{method.name}</strong>
                      <span className="cp-small cp-muted">{method.description}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              {paymentMethod === 'momo-hubtel' && (
                <div className="cp-form" style={{ marginTop: 20 }}>
                  <div className="cp-field">
                    <label htmlFor="pay-phone">Mobile Money number <span className="cp-muted">(optional)</span></label>
                    <input
                      id="pay-phone"
                      type="tel"
                      inputMode="tel"
                      placeholder="024 123 4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <small>Pre-fills the Hubtel checkout.</small>
                  </div>
                  <ol className="cp-howto" style={{ marginTop: 0 }}>
                    <li>Continue to the Hubtel checkout page.</li>
                    <li>Choose your network and enter your number.</li>
                    <li>Approve the prompt on your phone with your PIN.</li>
                    <li>You are brought back here once it is done.</li>
                  </ol>
                </div>
              )}

              {paymentMethod === 'momo-manual' && (
                <div style={{ marginTop: 20 }}>
                  <p>Send exactly <strong className="cp-num">GHS {totalPaidGHS.toFixed(2)}</strong> by Mobile Money to:</p>
                  <dl className="cp-details">
                    <div className="cp-detail">
                      <dt>Number</dt>
                      <dd><span className="cp-num cp-detail__value">{MANUAL_NUMBER}</span></dd>
                    </div>
                    <div className="cp-detail">
                      <dt>Account name</dt>
                      <dd><span className="cp-detail__value">{MANUAL_NAME}</span></dd>
                    </div>
                    <div className="cp-detail">
                      <dt>Reference</dt>
                      <dd><span className="cp-num cp-detail__value">{paymentData.byuId}</span></dd>
                    </div>
                  </dl>
                  <div className="cp-note" style={{ marginTop: 16 }}>
                    Put your BYU Student ID (<span className="cp-num">{paymentData.byuId}</span>) in the reference field and check that
                    the recipient name shows {MANUAL_NAME}. Without the reference we cannot match your payment.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ marginTop: 20 }}>
              <h3 className="cp-h3">Approve the prompt on your phone</h3>
              <p style={{ marginTop: 8 }}>
                A payment request for <strong className="cp-num">GHS {totalPaidGHS.toFixed(2)}</strong> was sent to {phoneNumber}.
                {checkingStatus ? ' Waiting for your approval…' : ''}
              </p>
              <p className="cp-small cp-muted" style={{ marginTop: 8 }}>
                Reference <span className="cp-num">{paymentReference}</span>. The prompt expires after about 2 minutes.
              </p>
            </div>
          )}
        </div>

        <div className="cp-card__foot cp-pay__foot">
          <button type="button" className="cp-btn cp-btn--secondary" onClick={onCancel}>Cancel</button>
          {showInstructions || paymentMethod === 'momo-manual' ? (
            <button type="button" className="cp-btn cp-btn--primary" onClick={confirmPayment}>I have paid</button>
          ) : (
            <button type="button" className="cp-btn cp-btn--primary" onClick={initiatePayment} disabled={processing}>
              {processing ? <><span className="cp-spinner" /> Opening checkout…</> : 'Continue to Hubtel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default HubtelPayment;
