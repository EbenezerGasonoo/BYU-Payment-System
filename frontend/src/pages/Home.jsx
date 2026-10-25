import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { SERVICE, SUPPORT } from '../utils/siteInfo';
import { useCountUp, useReveal } from '../utils/motion';
import PhoneDemo from '../components/PhoneDemo';
import { formatMoney } from '../utils/countries';
import '../styles/home.css';

const QUICK_AMOUNTS = [50, 100, 150, 300];

const CALC_CURRENCIES = [
  { code: 'GHS', label: 'Ghana', name: 'cedis', fallback: SERVICE.fallbackGhsRate, payWith: 'Total by Mobile Money' },
  { code: 'NGN', label: 'Nigeria', name: 'naira', fallback: SERVICE.fallbackNgnRate, payWith: 'Total through Paystack' }
];

function Reveal({ as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Money({ value, currency }) {
  const animated = useCountUp(value);
  return <>{formatMoney(animated, currency)}</>;
}

function FeeCalculator() {
  const [usd, setUsd] = useState('150');
  const [currencyCode, setCurrencyCode] = useState('GHS');
  const [liveRates, setLiveRates] = useState(null);

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data?.rates) setLiveRates(data.rates);
      })
      .catch(() => {});
  }, []);

  const currency = CALC_CURRENCIES.find((c) => c.code === currencyCode);
  const isLive = Boolean(liveRates?.[currency.code]);
  const rate = isLive ? liveRates[currency.code] : currency.fallback;
  const amount = Math.max(0, parseFloat(usd) || 0);
  const tuitionLocal = amount * rate;
  const feeLocal = tuitionLocal * (SERVICE.feePercent / 100);
  const totalLocal = tuitionLocal + feeLocal;

  return (
    <div className="cp-card calc">
      <div className="cp-card__body">
        <div className="cp-calc__title">
          <h3 className="cp-h3">What you will pay</h3>
          <span className="cp-calc__rate">
            <span className={`live-dot ${isLive ? 'is-live' : ''}`} aria-hidden="true" />
            {isLive ? 'Live rate' : 'Estimated rate'} <span className="cp-num">1 USD = {rate.toFixed(2)} {currency.code}</span>
          </span>
        </div>

        <div className="calc__chips calc__chips--country" role="group" aria-label="Country you pay from">
          {CALC_CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`calc__chip ${currencyCode === c.code ? 'is-active' : ''}`}
              aria-pressed={currencyCode === c.code}
              onClick={() => setCurrencyCode(c.code)}
            >
              {c.label} · {c.code}
            </button>
          ))}
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
          <div className="calc__chips" role="group" aria-label="Quick amounts">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                className={`calc__chip ${Number(usd) === value ? 'is-active' : ''}`}
                onClick={() => setUsd(String(value))}
              >
                ${value}
              </button>
            ))}
          </div>
        </div>

        <dl className="cp-rows">
          <div>
            <dt>Tuition in {currency.name}</dt>
            <dd><Money value={tuitionLocal} currency={currency.code} /></dd>
          </div>
          <div>
            <dt>Service fee ({SERVICE.feePercent}%)</dt>
            <dd><Money value={feeLocal} currency={currency.code} /></dd>
          </div>
          <div className="cp-rows__total">
            <dt>{currency.payWith}</dt>
            <dd><Money value={totalLocal} currency={currency.code} /></dd>
          </div>
        </dl>
      </div>
      <div className="cp-card__foot">
        <p className="cp-small cp-muted">
          An estimate. The exact amount is fixed when you submit your request and is shown before you pay.
        </p>
        <Link to="/request" className="cp-btn cp-btn--primary cp-btn--block cp-btn--lg" style={{ marginTop: 14 }}>
          Request a card{amount > 0 ? ` for $${amount.toFixed(2)}` : ''}
        </Link>
      </div>
    </div>
  );
}

const QUICK_FAQ = [
  {
    q: 'Why do I need this instead of my bank card?',
    a: 'Many Ghanaian and Nigerian debit cards are declined on the BYU-Pathway payment portal because of foreign-currency limits. A ConnectPay card is a USD card, so it is charged in dollars like an international card.'
  },
  {
    q: 'How long until I get my card?',
    a: `Usually ${SERVICE.processingTime} after your payment is confirmed, during support hours (${SUPPORT.hours}).`
  },
  {
    q: 'What happens if my card expires before I use it?',
    a: `Cards are valid for ${SERVICE.cardValidity} after they are issued. If yours expires before you pay, contact support on WhatsApp straight away with your request reference.`
  },
  {
    q: 'Who can use ConnectPay?',
    a: 'Students in Ghana or Nigeria with a BYU Student ID and an active @byupathway.edu email address. In Ghana you pay by Mobile Money; in Nigeria you pay through Paystack.'
  }
];

const STEPS = [
  { title: 'Create your account', text: 'Sign up with your BYU Student ID and your @byupathway.edu email, then confirm the email we send you.' },
  { title: 'Request a card', text: 'Enter the exact USD amount from your BYU-Pathway payment page. You see the total in cedis or naira before paying.' },
  { title: 'Pay in your currency', text: `In Ghana, approve the Hubtel Mobile Money prompt (${SERVICE.networks.join(', ')}). In Nigeria, pay through Paystack by ${SERVICE.nigeriaMethods.join(', ')}.` },
  { title: 'Use your card', text: 'The card number, expiry and CVV appear in your dashboard and Pathway email. Use it on the payment portal right away.' }
];

const NETWORK_DOTS = { 'MTN MoMo': '#ffcb05', 'Telecel Cash': '#e30613', 'AT Money': '#1f5aa6', 'Paystack (Nigeria)': '#0ba4db' };
const HERO_NETWORKS = [...SERVICE.networks, 'Paystack (Nigeria)'];

function StickyCta({ user, heroRef }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const hero = heroRef.current;
      if (!hero) return;
      const pastHero = hero.getBoundingClientRect().bottom < 0;
      const nearEnd = window.innerHeight + window.scrollY > document.documentElement.scrollHeight - 420;
      setShow(pastHero && !nearEnd);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [heroRef]);

  return (
    <div className={`sticky-cta ${show ? 'is-shown' : ''}`} aria-hidden={!show}>
      {user ? (
        <Link to="/request" className="cp-btn cp-btn--primary cp-btn--block cp-btn--lg" tabIndex={show ? 0 : -1}>Request a card</Link>
      ) : (
        <>
          <Link to="/register" className="cp-btn cp-btn--primary cp-btn--lg" tabIndex={show ? 0 : -1}>Create account</Link>
          <Link to="/login" className="cp-btn cp-btn--secondary cp-btn--lg" tabIndex={show ? 0 : -1}>Sign in</Link>
        </>
      )}
    </div>
  );
}

function Home() {
  const { user } = useAuth();
  const heroRef = useRef(null);

  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero" ref={heroRef}>
        <div className="home-hero__grid-bg" aria-hidden="true" />
        <div className="cp-container home-hero__inner">
          <div className="home-hero__copy">
            <span className="cp-eyebrow home-hero__in" style={{ '--d': '0ms' }}>For BYU-Pathway students in Ghana and Nigeria</span>
            <h1 className="cp-h1 home-hero__title home-hero__in" style={{ '--d': '80ms' }}>
              Pay your BYU-Pathway fees in <span className="mark">cedis or naira.</span>
            </h1>
            <p className="cp-lead home-hero__in" style={{ '--d': '160ms' }}>
              Local bank cards are often declined on the BYU-Pathway payment portal. ConnectPay takes your payment by Mobile
              Money in Ghana or through Paystack in Nigeria, and gives you a single-use USD card for the exact amount you owe.
            </p>

            <div className="cp-hero__cta home-hero__in" style={{ '--d': '240ms' }}>
              {user ? (
                <>
                  <Link to="/request" className="cp-btn cp-btn--primary cp-btn--lg">Request a card</Link>
                  <Link to="/dashboard" className="cp-btn cp-btn--secondary cp-btn--lg">Go to dashboard</Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="cp-btn cp-btn--primary cp-btn--lg">Create an account</Link>
                  <a href="#calculator" className="cp-btn cp-btn--secondary cp-btn--lg">See what it costs</a>
                </>
              )}
            </div>

            <ul className="cp-hero__points home-hero__in" style={{ '--d': '320ms' }}>
              <li><CheckIcon /> {SERVICE.feePercent}% service fee, shown before you pay</li>
              <li><CheckIcon /> Card details in your dashboard and Pathway email</li>
            </ul>

            <div className="networks home-hero__in" style={{ '--d': '400ms' }}>
              <span className="networks__label">Pay from</span>
              {HERO_NETWORKS.map((name) => (
                <span key={name} className="networks__chip">
                  <span className="networks__dot" style={{ background: NETWORK_DOTS[name] }} />
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="home-hero__visual home-hero__in" style={{ '--d': '200ms' }}>
            <PhoneDemo />
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="cp-section calc-section">
        <div className="cp-container cp-split">
          <Reveal>
            <span className="cp-eyebrow">Fee calculator</span>
            <h2 className="cp-h2">Know the cost before you start</h2>
            <p className="cp-lead" style={{ marginTop: 12 }}>
              Enter the amount from your BYU-Pathway payment page. You pay that amount in cedis or naira at the live rate, plus a{' '}
              {SERVICE.feePercent}% service fee. Nothing else.
            </p>
          </Reveal>
          <Reveal style={{ '--d': '120ms' }}>
            <FeeCalculator />
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="cp-section cp-section--white">
        <div className="cp-container">
          <Reveal className="cp-section__head">
            <span className="cp-eyebrow">How it works</span>
            <h2 className="cp-h2">From local money to a paid tuition bill in four steps</h2>
          </Reveal>
          <Reveal as="ol" className="cp-steps steps-animated">
            {STEPS.map((step, i) => (
              <li key={step.title} style={{ '--d': `${i * 110}ms` }}>
                <h3 className="cp-h3">{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Fees and timing */}
      <section id="fees" className="cp-section">
        <div className="cp-container cp-split">
          <Reveal>
            <span className="cp-eyebrow">Fees and timing</span>
            <h2 className="cp-h2">One fee, shown up front</h2>
            <p className="cp-lead" style={{ marginTop: 12 }}>
              You pay the tuition amount plus a {SERVICE.feePercent}% service fee. No sign-up cost and no monthly charge.
            </p>
          </Reveal>
          <Reveal as="dl" className="cp-facts facts-animated">
            {[
              ['Service fee', `${SERVICE.feePercent}% of the card amount, added on top and shown before you pay.`],
              ['Exchange rate', 'The market USD to GHS or USD to NGN rate at the moment you submit your request.'],
              ['Processing time', `Usually ${SERVICE.processingTime} after your payment is confirmed (${SUPPORT.hours}).`],
              ['Card validity', `${SERVICE.cardValidity} from when the card is issued. Have your BYU-Pathway payment page ready.`],
              ['Requests', 'One open request at a time. When a card is used or expires, you can request another.'],
              ['Payment methods', `Ghana: ${SERVICE.networks.join(', ')}, through Hubtel. Nigeria: ${SERVICE.nigeriaMethods.join(', ')}, through Paystack.`]
            ].map(([term, desc], i) => (
              <div key={term} style={{ '--d': `${i * 60}ms` }}>
                <dt>{term}</dt>
                <dd>{desc}</dd>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Before you start */}
      <section className="cp-section cp-section--white">
        <div className="cp-container cp-split">
          <Reveal>
            <span className="cp-eyebrow">Before you start</span>
            <h2 className="cp-h2">Have these ready</h2>
          </Reveal>
          <Reveal>
            <ul className="cp-check check-animated">
              {[
                ['Your BYU Student ID', ', the 7 or 8 digit number on your student account.'],
                ['Access to your @byupathway.edu email.', ' Your account and card details are tied to it.'],
                ['The exact amount due in USD', ', copied from your BYU-Pathway payment page.'],
                ['Enough money to pay', ' the total in cedis or naira, including the fee.']
              ].map(([strong, rest], i) => (
                <li key={strong} style={{ '--d': `${i * 90}ms` }}>
                  <span className="cp-check__box"><CheckIcon /></span>
                  <span><strong>{strong}</strong>{rest}</span>
                </li>
              ))}
            </ul>
            <p className="cp-note" style={{ marginTop: 28 }}>
              Cards expire {SERVICE.cardValidity} after they are issued. Request your card when you are ready to pay, not days ahead.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Questions */}
      <section className="cp-section">
        <div className="cp-container cp-split">
          <Reveal>
            <span className="cp-eyebrow">Questions</span>
            <h2 className="cp-h2">Common questions</h2>
            <p className="cp-lead" style={{ marginTop: 12 }}>
              More answers on the <Link to="/faq">FAQ page</Link>, or message us on{' '}
              <a href={SUPPORT.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>.
            </p>
          </Reveal>
          <Reveal className="cp-faq">
            {QUICK_FAQ.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <div><p>{item.a}</p></div>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="closing">
        <Reveal className="cp-container closing__inner">
          <h2 className="cp-h2">Ready when your fees are due.</h2>
          <p>Create your account now, then request a card on the day you pay.</p>
          <div className="cp-hero__cta" style={{ justifyContent: 'center' }}>
            {user ? (
              <Link to="/request" className="cp-btn cp-btn--accent cp-btn--lg">Request a card</Link>
            ) : (
              <>
                <Link to="/register" className="cp-btn cp-btn--accent cp-btn--lg">Create an account</Link>
                <a href={SUPPORT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="cp-btn cp-btn--outline-light cp-btn--lg">
                  Ask on WhatsApp
                </a>
              </>
            )}
          </div>
        </Reveal>
      </section>

      <StickyCta user={user} heroRef={heroRef} />
    </div>
  );
}

export default Home;
