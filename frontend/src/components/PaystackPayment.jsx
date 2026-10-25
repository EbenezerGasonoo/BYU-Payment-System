import { useState } from 'react';
import { studentAPI } from '../api/api';
import { formatMoney } from '../utils/countries';

// Sends the student to Paystack's hosted checkout. Paystack redirects back to
// /request?gateway=paystack&reference=..., where RequestPayment verifies the payment.
function PaystackPayment({ paymentData, onCancel }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const { amount, currency, subtotalLocal, amountLocal, exchangeRate, requestToken } = paymentData;

  const startCheckout = async () => {
    setProcessing(true);
    setError('');
    try {
      const response = await studentAPI.initializePaystack(requestToken);
      if (response.success && response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
        return;
      }
      setError(response.message || 'Could not open the Paystack checkout.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open the Paystack checkout. Please try again.');
    }
    setProcessing(false);
  };

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
              <dt>In naira</dt>
              <dd>{formatMoney(subtotalLocal, currency)}</dd>
            </div>
            <div>
              <dt>Service fee (5%)</dt>
              <dd>{formatMoney(amountLocal - subtotalLocal, currency)}</dd>
            </div>
            <div className="cp-rows__total">
              <dt>Total to pay</dt>
              <dd>{formatMoney(amountLocal, currency)}</dd>
            </div>
          </dl>
          <p className="cp-small cp-muted" style={{ marginTop: 6 }}>
            Rate fixed for this request: <span className="cp-num">1 USD = {Number(exchangeRate).toFixed(2)} {currency}</span>
          </p>

          {error && (
            <div className="cp-alert cp-alert--error" style={{ marginTop: 16 }} role="status">{error}</div>
          )}

          <ol className="cp-howto" style={{ marginTop: 20 }}>
            <li>Continue to the secure Paystack checkout.</li>
            <li>Pay with your Nigerian debit card, bank transfer or USSD.</li>
            <li>You are brought back here and we confirm the payment with Paystack.</li>
            <li>Your USD card is assigned once the payment is confirmed.</li>
          </ol>
        </div>

        <div className="cp-card__foot cp-pay__foot">
          <button type="button" className="cp-btn cp-btn--secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="cp-btn cp-btn--primary" onClick={startCheckout} disabled={processing}>
            {processing ? <><span className="cp-spinner" /> Opening checkout…</> : 'Continue to Paystack'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaystackPayment;
