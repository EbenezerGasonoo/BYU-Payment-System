import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, useInView } from '../utils/motion';

// A looping, illustrative walk-through of the real flow. Figures are examples.
const SCREENS = [
  { key: 'approve', label: 'Approve on your phone', duration: 3600 },
  { key: 'received', label: 'Payment received', duration: 2800 },
  { key: 'card', label: 'Card ready to use', duration: 4200 }
];

function ApproveScreen() {
  return (
    <div className="pd-screen pd-approve">
      <div className="pd-topbar">
        <span>Hubtel Checkout</span>
        <span className="pd-lock" aria-hidden="true">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        </span>
      </div>
      <p className="pd-label">Pay ConnectPay</p>
      <p className="pd-amount">GHS 1,840.64</p>
      <p className="pd-sub">USD card · $150.00</p>
      <div className="pd-network">
        <span className="pd-network__dot" />
        MTN MoMo · 024 ••• 4567
      </div>
      <p className="pd-label" style={{ marginTop: 18 }}>Enter MoMo PIN</p>
      <div className="pd-pin" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      <div className="pd-approve-btn">Approve</div>
    </div>
  );
}

function ReceivedScreen() {
  return (
    <div className="pd-screen pd-received">
      <svg className="pd-check" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" />
        <path d="M20 33.5 28.5 42 45 24" />
      </svg>
      <p className="pd-title">Payment received</p>
      <p className="pd-sub">GHS 1,840.64 from MTN MoMo</p>
      <div className="pd-progress" aria-hidden="true"><span /></div>
      <p className="pd-sub">Preparing your USD card…</p>
    </div>
  );
}

function CardScreen() {
  return (
    <div className="pd-screen pd-cardscreen">
      <p className="pd-label">Your card</p>
      <div className="pd-card">
        <div className="pd-card__row">
          <span className="pd-card__chip" />
          <span className="pd-card__cur">USD</span>
        </div>
        <p className="pd-card__num">•••• •••• •••• 7390</p>
        <div className="pd-card__row pd-card__meta">
          <span>AMA MENSAH</span>
          <span>11/26</span>
        </div>
      </div>
      <div className="pd-cardinfo">
        <div>
          <p className="pd-label">Loaded</p>
          <p className="pd-value">$150.00</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="pd-label">Expires in</p>
          <p className="pd-value">4h 59m</p>
        </div>
      </div>
      <div className="pd-hint">
        <span className="pd-hint__icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3h7v7" /><path d="M10 14 21 3" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></svg>
        </span>
        Pay on my.byupathway.edu with these details
      </div>
      <div className="pd-actions">
        <span>Copy details</span>
        <span className="is-primary">Open portal</span>
      </div>
    </div>
  );
}

function PhoneDemo() {
  const reduced = prefersReducedMotion();
  const [index, setIndex] = useState(reduced ? 2 : 0);
  const [paused, setPaused] = useState(false);
  const wrapRef = useRef(null);
  const inView = useInView(wrapRef);

  useEffect(() => {
    if (reduced || paused || !inView) return undefined;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % SCREENS.length), SCREENS[index].duration);
    return () => clearTimeout(timer);
  }, [index, paused, inView, reduced]);

  const select = (i) => {
    setIndex(i);
    setPaused(true);
  };

  return (
    <div className="pd" ref={wrapRef}>
      <div className="pd-stage">
        <div className="pd-float pd-float--a" aria-hidden="true">
          <span className="pd-float__dot pd-float__dot--ok" /> Paid by Mobile Money
        </div>
        <div className="pd-float pd-float--b" aria-hidden="true">
          <span className="pd-float__dot" /> Card in your dashboard
        </div>

        <div className="pd-phone" role="img" aria-label="Example: approving a Mobile Money payment, then receiving a USD card">
          <div className="pd-notch" />
          <div className="pd-screens" data-screen={SCREENS[index].key}>
            <div className={`pd-slot ${index === 0 ? 'is-active' : ''}`}><ApproveScreen /></div>
            <div className={`pd-slot ${index === 1 ? 'is-active' : ''}`}><ReceivedScreen /></div>
            <div className={`pd-slot ${index === 2 ? 'is-active' : ''}`}><CardScreen /></div>
          </div>
        </div>
      </div>

      <ol className="pd-steps">
        {SCREENS.map((screen, i) => (
          <li key={screen.key}>
            <button
              type="button"
              className={i === index ? 'is-active' : ''}
              onClick={() => select(i)}
              aria-current={i === index ? 'step' : undefined}
            >
              <span className="pd-steps__bar"><span style={{ animationDuration: `${screen.duration}ms` }} /></span>
              {screen.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default PhoneDemo;
