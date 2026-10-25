import { useState, useEffect, useRef } from 'react';
import { studentAPI } from '../api/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HubtelPayment from '../components/HubtelPayment';
import PaystackPayment from '../components/PaystackPayment';
import { getCountry, formatMoney } from '../utils/countries';

function RequestPayment() {
  const [formData, setFormData] = useState({
    byuId: '',
    amount: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [requestToken, setRequestToken] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [country, setCountry] = useState(getCountry('GH'));
  const [exchangeRate, setExchangeRate] = useState(country.fallbackRate);
  const [rateLastUpdated, setRateLastUpdated] = useState(null);
  const [fetchingRate, setFetchingRate] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const CHARGE_FEE_PERCENT = 5; // 5% chargeback fee
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paymentVerifiedRef = useRef(false);

  useEffect(() => {
    // Pre-fill BYU ID if user has registered
    const savedByuId = localStorage.getItem('userByuId');
    if (savedByuId) {
      setFormData(prev => ({ ...prev, byuId: savedByuId }));
    }

    // The student's country decides the currency and how they pay
    let studentCountry = getCountry('GH');
    const loadCountry = savedByuId
      ? studentAPI.getDashboard(savedByuId)
        .then((res) => { studentCountry = getCountry(res.data?.student?.countryCode); })
        .catch(() => {})
      : Promise.resolve();
    loadCountry.then(() => {
      setCountry(studentCountry);
      setExchangeRate(studentCountry.fallbackRate);
      fetchExchangeRate(studentCountry.currency);
    });
  }, []);

  // Paystack sends the student back to /request?gateway=paystack&reference=...
  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (searchParams.get('gateway') !== 'paystack' || !reference) return;
    setSearchParams({}, { replace: true });

    setLoading(true);
    setMessage({ type: 'info', text: 'Confirming your payment with Paystack…' });
    studentAPI.verifyPaystack(reference)
      .then((res) => {
        setRequestToken(res.data?.requestToken || '');
        localStorage.setItem('hasRequestedCard', 'true');
        setMessage({
          type: 'success',
          text: `${res.message || 'Payment verified.'} You can follow your request on the dashboard.`
        });
      })
      .catch((error) => {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'We could not confirm your Paystack payment yet. If you paid, check your dashboard or contact support with your reference.'
        });
      })
      .finally(() => setLoading(false));
  }, [searchParams, setSearchParams]);

  const fetchExchangeRate = async (currency = country.currency) => {
    setFetchingRate(true);
    try {
      // Same rate source the server prices requests with
      const data = await studentAPI.getRates();
      if (data?.rates?.[currency]) {
        setExchangeRate(data.rates[currency]);
        setRateLastUpdated(new Date());
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

    try {
      const amount = parseFloat(formData.amount);

      // Create the card request; the server prices it in the student's currency
      const requestResponse = await studentAPI.requestCard({
        byuId: formData.byuId,
        amount,
        paymentMethod: 'pending' // Will be updated when payment method is selected
      });

      // Show the payment modal with the server-computed amounts (the server decides what is charged)
      const quote = requestResponse.data;
      setPaymentData({
        amount: quote.amount ?? amount,
        currency: quote.currency || 'GHS',
        subtotalLocal: quote.subtotalLocal ?? quote.amountInGHS,
        amountLocal: quote.amountLocal ?? quote.totalPaidGHS,
        amountInGHS: quote.amountInGHS,
        totalPaidGHS: quote.totalPaidGHS,
        exchangeRate: quote.exchangeRate,
        byuId: formData.byuId,
        paymentReference: requestResponse.data.paymentReference,
        requestToken: requestResponse.data.requestToken,
        studentName: localStorage.getItem('userName') || 'Student',
        studentEmail: localStorage.getItem('userEmail') || ''
      });
      setShowPayment(true);
      setLoading(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to create payment request'
      });
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentReference, paymentMethod) => {
    setShowPayment(false);
    setLoading(true);
    setMessage({ type: '', text: '' });
    paymentVerifiedRef.current = false;

    try {
      // For manual payments, skip automatic verification (admin will verify manually)
      if (paymentMethod === 'momo-manual') {
        setMessage({
          type: 'success',
          text: 'Payment confirmation received! Your request has been submitted. Admin will verify your payment and assign your card within 24 hours. Please check your dashboard for updates.'
        });
        setRequestToken(paymentData.requestToken);
        localStorage.setItem('hasRequestedCard', 'true');

        // Guide to next step
        setTimeout(() => {
          if (confirm('Request submitted successfully! Your payment will be verified manually. Would you like to check your dashboard?')) {
            navigate('/dashboard');
          }
        }, 3000);

        setFormData({ byuId: formData.byuId, amount: '' });
        setTermsAccepted(false);
      } else {
        // For Hubtel/automated payments, verify as before
        // Start polling for payment status
        setMessage({
          type: 'info',
          text: 'Payment initiated! Waiting for confirmation... Please check your phone to approve the transaction.'
        });

        // Poll every 5 seconds
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await studentAPI.checkPaymentStatus(paymentReference);

            if (statusResponse.success && statusResponse.status === 'paid') {
              clearInterval(pollInterval);
              paymentVerifiedRef.current = true;

              setMessage({ type: 'success', text: 'Payment verified successfully!' });
              setRequestToken(statusResponse.data.requestToken);
              localStorage.setItem('hasRequestedCard', 'true');

              // Guide to next step
              setTimeout(() => {
                if (confirm('Payment verified! Your card request has been submitted. Would you like to check your dashboard?')) {
                  navigate('/dashboard');
                }
              }, 1000);

              setFormData({ byuId: formData.byuId, amount: '' });
              setTermsAccepted(false);
            }
          } catch (error) {
            console.error('Polling error:', error);
          }
        }, 5000);

        // Stop polling after 2 minutes (120000 ms)
        setTimeout(() => {
          clearInterval(pollInterval);
          if (!paymentVerifiedRef.current) {
            setMessage({
              type: 'warning',
              text: 'Payment verification timed out. If you have paid, please contact support or check your dashboard later.'
            });
            setLoading(false);
          }
        }, 120000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Payment verification failed. Please contact admin with your payment reference.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setPaymentData(null);
  };

  const amountValue = parseFloat(formData.amount) || 0;
  const estimateLocal = amountValue * exchangeRate;
  const estimateFee = estimateLocal * (CHARGE_FEE_PERCENT / 100);
  const studentName = localStorage.getItem('userName') || '';

  return (
    <>
      <div className="cp-pagehead">
        <div className="cp-container" style={{ maxWidth: 760 }}>
          <span className="cp-eyebrow">New request</span>
          <h1 className="cp-h1">Request a card</h1>
          <p className="cp-lead">
            Enter the amount due on your BYU-Pathway payment page. You will see the total in {country.currencyName} before you pay.
          </p>
        </div>
      </div>

      <section style={{ paddingBottom: 80 }}>
        <div className="cp-container" style={{ maxWidth: 760 }}>
          {message.text && (
            <div
              className={`cp-alert cp-alert--${message.type === 'error' ? 'error' : message.type === 'success' ? 'success' : 'info'}`}
              style={{ marginBottom: 20 }}
              role="status"
            >
              {message.text}
              {requestToken && (
                <div style={{ marginTop: 8 }}>
                  Request reference: <span className="cp-num">{requestToken}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="cp-card">
            <div className="cp-card__body cp-form">
              {(studentName || formData.byuId) && (
                <p className="cp-small cp-muted">
                  Requesting as <strong style={{ color: 'var(--cp-ink)' }}>{studentName}</strong>
                  {formData.byuId && <> · BYU ID <span className="cp-num">{formData.byuId}</span></>}
                </p>
              )}

              <div className="cp-field">
                <label htmlFor="amount">Amount due (USD)</label>
                <div className="cp-money-input">
                  <span>USD</span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <small>Copy the exact amount from your BYU-Pathway payment page. The card is loaded with this amount.</small>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span className="cp-small cp-muted">
                    {rateLastUpdated ? 'Live rate' : 'Estimated rate'}: <span className="cp-num">1 USD = {exchangeRate.toFixed(2)} {country.currency}</span>
                  </span>
                  <button type="button" className="cp-btn cp-btn--ghost" onClick={() => fetchExchangeRate()} disabled={fetchingRate} style={{ minHeight: 32, padding: '0 10px', fontSize: 13 }}>
                    {fetchingRate ? 'Updating…' : 'Refresh rate'}
                  </button>
                </div>
                <dl className="cp-rows" style={{ marginTop: 8 }}>
                  <div>
                    <dt>Tuition in {country.currencyName}</dt>
                    <dd>{formatMoney(estimateLocal, country.currency)}</dd>
                  </div>
                  <div>
                    <dt>Service fee ({CHARGE_FEE_PERCENT}%)</dt>
                    <dd>{formatMoney(estimateFee, country.currency)}</dd>
                  </div>
                  <div className="cp-rows__total">
                    <dt>Estimated total</dt>
                    <dd>{formatMoney(estimateLocal + estimateFee, country.currency)}</dd>
                  </div>
                </dl>
                <p className="cp-small cp-muted" style={{ marginTop: 6 }}>
                  The final amount is calculated when you continue and shown on the payment screen.
                </p>
              </div>

              <div className="cp-note">
                Cards are valid for 4 to 6 hours after they are issued, and should only be used for BYU-Pathway fees.
                Have your payment page ready. You must confirm your Pathway email before requesting a card.
              </div>

              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, color: 'var(--cp-ink)' }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2 }}
                />
                <span>
                  I have read and accept the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    style={{ background: 'none', border: 0, padding: 0, color: 'var(--cp-brand)', textDecoration: 'underline', font: 'inherit', cursor: 'pointer' }}
                  >
                    terms of use
                  </button>
                </span>
              </label>
            </div>
            <div className="cp-card__foot">
              <button type="submit" className="cp-btn cp-btn--primary cp-btn--lg cp-btn--block" disabled={loading || !termsAccepted}>
                {loading ? <><span className="cp-spinner" /> Preparing payment…</> : 'Continue to payment'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Terms of use */}
      {showTerms && (
        <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="terms-title" onClick={() => setShowTerms(false)}>
          <div className="cp-modal__panel cp-card" onClick={(e) => e.stopPropagation()}>
            <div className="cp-card__body">
              <h2 id="terms-title" className="cp-h2">Terms of use</h2>
              <ol className="cp-terms">
                <li>
                  <h3 className="cp-h3">Payment purpose</h3>
                  <p>The card is only for payment on the BYU-Pathway payment page. It must not be used for anything else.</p>
                </li>
                <li>
                  <h3 className="cp-h3">Currency and exchange rate</h3>
                  <p>You enter the amount in US dollars. The amount you pay in {country.code === 'NG' ? 'Nigerian naira' : 'Ghana cedis'} is calculated from the live exchange rate when you submit your request, and that rate applies even if the market moves afterwards.</p>
                </li>
                <li>
                  <h3 className="cp-h3">Service fee</h3>
                  <p>A {CHARGE_FEE_PERCENT}% fee is added to cover transaction and processing costs. It is included in the total you pay.</p>
                </li>
                <li>
                  <h3 className="cp-h3">Remaining balances</h3>
                  <p>If any balance is left on the card after payment, raise a support request so it can be processed and returned to you.</p>
                </li>
                <li>
                  <h3 className="cp-h3">Proper use</h3>
                  <p>Abuse or fraudulent activity leads to immediate account suspension and may lead to legal action.</p>
                </li>
                <li>
                  <h3 className="cp-h3">Card expiry</h3>
                  <p>Cards expire 4 to 6 hours after they are issued. Complete your payment promptly.</p>
                </li>
              </ol>
            </div>
            <div className="cp-card__foot" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" className="cp-btn cp-btn--secondary" onClick={() => setShowTerms(false)}>Close</button>
              <button
                type="button"
                className="cp-btn cp-btn--primary"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTerms(false);
                }}
              >
                I accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal: Paystack for naira, Hubtel / manual Mobile Money for cedis */}
      {showPayment && paymentData && paymentData.currency === 'NGN' && (
        <PaystackPayment paymentData={paymentData} onCancel={handlePaymentCancel} />
      )}
      {showPayment && paymentData && paymentData.currency !== 'NGN' && (
        <HubtelPayment
          paymentData={paymentData}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </>
  );
}

export default RequestPayment;
