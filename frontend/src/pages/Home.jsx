import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { SERVICE, SUPPORT } from '../utils/siteInfo';

const formatGhs = (value) =>
  value.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function FeeCalculator() {
  const [usd, setUsd] = useState('150');
  const [rate, setRate] = useState(SERVICE.fallbackGhsRate);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data?.rates?.GHS) {
          setRate(data.rates.GHS);
          setIsLive(true);
        }
      })
      .catch(() => {});
  }, []);

  const amount = Math.max(0, parseFloat(usd) || 0);
  const tuitionGhs = amount * rate;
  const feeGhs = tuitionGhs * (SERVICE.feePercent / 100);
  const totalGhs = tuitionGhs + feeGhs;

  return (
    <div className="cp-card">
      <div className="cp-card__body">
        <div className="cp-calc__title">
          <h2 className="cp-h3">What you will pay</h2>
          <span className="cp-calc__rate">
            {isLive ? 'Live rate' : 'Estimated rate'}: <span className="cp-num">1 USD = {rate.toFixed(2)} GHS</span>
          </span>
        </div>

        <div className="cp-calc__field">
          <label htmlFor="calc-usd">Amount due on your BYU-Pathway payment page</label>
          <div className="cp-money-input">
            <span>USD</span>
            <input
              id="calc-usd"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={usd}
              onChange={(e) => setUsd(e.target.value)}
            />
          </div>
        </div>

        <dl className="cp-rows">
          <div>
            <dt>Tuition in cedis</dt>
            <dd>GHS {formatGhs(tuitionGhs)}</dd>
          </div>
          <div>
            <dt>Service fee ({SERVICE.feePercent}%)</dt>
            <dd>GHS {formatGhs(feeGhs)}</dd>
          </div>
          <div className="cp-rows__total">
            <dt>Total by Mobile Money</dt>
            <dd>GHS {formatGhs(totalGhs)}</dd>
          </div>
        </dl>
      </div>
      <div className="cp-card__foot">
        <p className="cp-small cp-muted">
          This is an estimate. The exact amount is fixed when you submit your request and is shown before you pay.
        </p>
        <Link to="/request" className="cp-btn cp-btn--primary cp-btn--block" style={{ marginTop: 14 }}>
          Request a card{amount > 0 ? ` for $${amount.toFixed(2)}` : ''}
        </Link>
      </div>
    </div>
  );
}

const QUICK_FAQ = [
  {
    q: 'Why do I need this instead of my bank card?',
    a: 'Many Ghanaian debit cards are declined on the BYU-Pathway payment portal because of foreign-currency limits. A ConnectPay card is a USD card, so it is charged in dollars like an international card.'
  },
  {
    q: 'How long until I get my card?',
    a: `Usually ${SERVICE.processingTime} after your Mobile Money payment is confirmed, during support hours (${SUPPORT.hours}).`
  },
  {
    q: 'What happens if my card expires before I use it?',
    a: `Cards are valid for ${SERVICE.cardValidity} after they are issued. If yours expires before you pay, contact support on WhatsApp straight away with your request reference.`
  },
  {
    q: 'Who can use ConnectPay?',
    a: 'Students with a BYU Student ID and an active @byupathway.edu email address. Payment is by Mobile Money in Ghana.'
  }
];

function Home() {
  const { user } = useAuth();

  return (
    <>
      {/* Hero */}
      <section className="cp-hero">
        <div className="cp-container cp-hero__grid">
          <div>
            <span className="cp-eyebrow">For BYU-Pathway students in Ghana</span>
            <h1 className="cp-h1">Pay your BYU-Pathway fees with Mobile Money.</h1>
            <p className="cp-lead">
              Ghanaian bank cards are often declined on the BYU-Pathway payment portal. ConnectPay takes your
              payment in cedis by Mobile Money and gives you a single-use USD card for the exact amount you owe.
            </p>

            <div className="cp-hero__cta">
              {user ? (
                <>
                  <Link to="/request" className="cp-btn cp-btn--primary cp-btn--lg">Request a card</Link>
                  <Link to="/dashboard" className="cp-btn cp-btn--secondary cp-btn--lg">Go to dashboard</Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="cp-btn cp-btn--primary cp-btn--lg">Create an account</Link>
                  <Link to="/login" className="cp-btn cp-btn--secondary cp-btn--lg">Sign in</Link>
                </>
              )}
            </div>

            <ul className="cp-hero__points">
              <li><CheckIcon /> Pay from {SERVICE.networks.join(', ')}</li>
              <li><CheckIcon /> {SERVICE.feePercent}% service fee, shown before you pay</li>
              <li><CheckIcon /> Card details sent to your Pathway email and your dashboard</li>
            </ul>
          </div>

          <FeeCalculator />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="cp-section cp-section--white">
        <div className="cp-container">
          <div className="cp-section__head">
            <span className="cp-eyebrow">How it works</span>
            <h2 className="cp-h2">From Mobile Money to a paid tuition bill in four steps</h2>
          </div>
          <ol className="cp-steps">
            <li>
              <h3 className="cp-h3">Create your account</h3>
              <p>Sign up with your BYU Student ID and your @byupathway.edu email, then confirm the email we send you.</p>
            </li>
            <li>
              <h3 className="cp-h3">Request a card</h3>
              <p>Enter the exact USD amount shown on your BYU-Pathway payment page. You see the total in cedis before paying.</p>
            </li>
            <li>
              <h3 className="cp-h3">Pay with Mobile Money</h3>
              <p>Approve the Hubtel payment prompt on your phone from {SERVICE.networks.join(', ')}.</p>
            </li>
            <li>
              <h3 className="cp-h3">Use your card</h3>
              <p>Once payment is confirmed, the card number, expiry and CVV appear in your dashboard and Pathway email. Use it on the payment portal right away.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* Fees and timing */}
      <section id="fees" className="cp-section">
        <div className="cp-container cp-split">
          <div>
            <span className="cp-eyebrow">Fees and timing</span>
            <h2 className="cp-h2">One fee, shown up front</h2>
            <p className="cp-lead" style={{ marginTop: 12 }}>
              You pay the tuition amount plus a {SERVICE.feePercent}% service fee. There is no sign-up cost and no monthly charge.
            </p>
          </div>
          <dl className="cp-facts">
            <div>
              <dt>Service fee</dt>
              <dd>{SERVICE.feePercent}% of the card amount, added on top and shown before you pay.</dd>
            </div>
            <div>
              <dt>Exchange rate</dt>
              <dd>The market USD to GHS rate at the moment you submit your request.</dd>
            </div>
            <div>
              <dt>Processing time</dt>
              <dd>Usually {SERVICE.processingTime} after your payment is confirmed ({SUPPORT.hours}).</dd>
            </div>
            <div>
              <dt>Card validity</dt>
              <dd>{SERVICE.cardValidity} from when the card is issued. Have your BYU-Pathway payment page ready.</dd>
            </div>
            <div>
              <dt>Requests</dt>
              <dd>One open request at a time. When a card is used or expires, you can request another.</dd>
            </div>
            <div>
              <dt>Payment methods</dt>
              <dd>{SERVICE.networks.join(', ')}, through Hubtel.</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Before you start */}
      <section className="cp-section cp-section--white">
        <div className="cp-container cp-split">
          <div>
            <span className="cp-eyebrow">Before you start</span>
            <h2 className="cp-h2">Have these ready</h2>
          </div>
          <div>
            <ul className="cp-check">
              <li><span className="cp-check__box" /><span><strong>Your BYU Student ID</strong>, the 7 or 8 digit number on your student account.</span></li>
              <li><span className="cp-check__box" /><span><strong>Access to your @byupathway.edu email.</strong> Your account and card details are tied to it.</span></li>
              <li><span className="cp-check__box" /><span><strong>The exact amount due in USD</strong>, copied from your BYU-Pathway payment page.</span></li>
              <li><span className="cp-check__box" /><span><strong>Enough Mobile Money balance</strong> for the total in cedis, including the fee.</span></li>
            </ul>
            <p className="cp-note" style={{ marginTop: 28 }}>
              Cards expire {SERVICE.cardValidity} after they are issued. Request your card when you are ready to pay, not days ahead.
            </p>
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="cp-section">
        <div className="cp-container cp-split">
          <div>
            <span className="cp-eyebrow">Questions</span>
            <h2 className="cp-h2">Common questions</h2>
            <p className="cp-lead" style={{ marginTop: 12 }}>
              More answers on the <Link to="/faq">FAQ page</Link>, or message us on{' '}
              <a href={SUPPORT.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>.
            </p>
          </div>
          <div className="cp-faq">
            {QUICK_FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <div><p>{item.a}</p></div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
