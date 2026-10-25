import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../api/api';
import { useAuth } from '../utils/AuthContext';
import { SERVICE, SUPPORT } from '../utils/siteInfo';
import { formatRequestPaid, requestCurrency } from '../utils/countries';

const BYU_PAYMENT_URL = 'https://my.byupathway.edu';

// ── Status helpers ──────────────────────────────────────────────

// Turns the backend's status + paymentStatus pair into what the student needs to know
function describeRequest(req) {
  if (req.status === 'assigned') return { key: 'ready', label: 'Card ready', tone: 'ok' };
  if (req.status === 'paid') return { key: 'done', label: 'Completed', tone: 'neutral' };
  if (req.status === 'expired') return { key: 'expired', label: 'Expired', tone: 'neutral' };
  if (req.status === 'declined' || req.paymentStatus === 'failed') return { key: 'declined', label: 'Cancelled', tone: 'err' };
  if (req.paymentStatus === 'paid') return { key: 'preparing', label: 'Preparing card', tone: 'info' };
  return { key: 'awaiting', label: 'Awaiting payment', tone: 'warn' };
}

const isOpen = (req) => ['awaiting', 'preparing', 'ready'].includes(describeRequest(req).key);

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

const formatUsd = (value) => `$${(Number(value) || 0).toFixed(2)}`;

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function timeLeft(expiresAt, now) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

// ── Pieces ──────────────────────────────────────────────────────

function StatusBadge({ req }) {
  const { label, tone } = describeRequest(req);
  return <span className={`cp-badge cp-badge--${tone}`}>{label}</span>;
}

const STEPS = [
  { key: 'awaiting', label: 'Pay' },
  { key: 'preparing', label: 'Card prepared' },
  { key: 'ready', label: 'Card ready' }
];

function Progress({ current }) {
  const index = STEPS.findIndex((s) => s.key === current);
  return (
    <ol className="cp-progress" aria-label="Request progress">
      {STEPS.map((step, i) => (
        <li key={step.key} className={i < index ? 'is-done' : i === index ? 'is-current' : ''}>
          <span className="cp-progress__dot" aria-hidden="true" />
          {step.label}
        </li>
      ))}
    </ol>
  );
}

function CopyRow({ label, value, display, secret, onCopy }) {
  const [shown, setShown] = useState(!secret);
  return (
    <div className="cp-detail">
      <dt>{label}</dt>
      <dd>
        <span className="cp-num cp-detail__value">{shown ? (display || value) : '•••'}</span>
        <span className="cp-detail__actions">
          {secret && (
            <button type="button" className="cp-linkbtn" onClick={() => setShown(!shown)}>
              {shown ? 'Hide' : 'Show'}
            </button>
          )}
          <button type="button" className="cp-linkbtn" onClick={() => onCopy(value, label)}>Copy</button>
        </span>
      </dd>
    </div>
  );
}

function CardDetails({ req, studentName, now, onCopy, onFreeze, freezing }) {
  const remaining = timeLeft(req.expiresAt, now);
  const frozen = req.cardStatus === 'frozen';
  const number = req.virtualCardNumber || '';
  const grouped = number.replace(/(.{4})/g, '$1 ').trim();

  return (
    <>
      <div className="cp-card-ready__top">
        <div>
          <p className="cp-small cp-muted">USD card for</p>
          <p className="cp-card-ready__amount cp-num">{formatUsd(req.amount)}</p>
        </div>
        {remaining && (
          <div className={`cp-countdown ${remaining === 'expired' ? 'is-expired' : ''}`}>
            {remaining === 'expired' ? 'Expired' : <>Expires in <strong className="cp-num">{remaining}</strong></>}
            <span className="cp-small cp-muted">{formatDate(req.expiresAt)}</span>
          </div>
        )}
      </div>

      {frozen && (
        <div className="cp-alert cp-alert--info" style={{ marginTop: 16 }}>
          This card is frozen. Unfreeze it before you pay.
        </div>
      )}

      <dl className="cp-details">
        <CopyRow label="Card number" value={number} display={grouped} onCopy={onCopy} />
        <CopyRow label="Name on card" value={req.cardholderName || studentName} onCopy={onCopy} />
        <CopyRow label="Expiry" value={req.cardExpiryDate} onCopy={onCopy} />
        <CopyRow label="CVV" value={req.cardCVV} secret onCopy={onCopy} />
      </dl>
      <p className="cp-small cp-muted" style={{ marginTop: 10 }}>
        Do not share these details with anyone.
      </p>

      <div className="cp-actions-row">
        <a href={BYU_PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="cp-btn cp-btn--primary">
          Open BYU-Pathway portal
        </a>
        <button type="button" className="cp-btn cp-btn--secondary" onClick={onFreeze} disabled={freezing}>
          {freezing ? 'Updating…' : frozen ? 'Unfreeze card' : 'Freeze card'}
        </button>
      </div>
    </>
  );
}

function CurrentRequest({ req, studentName, now, onCopy, onFreeze, freezing, onCancel, cancelling, onRefresh, refreshing }) {
  const state = describeRequest(req).key;
  const paysWithPaystack = requestCurrency(req) === 'NGN';
  const [payError, setPayError] = useState('');
  const [openingCheckout, setOpeningCheckout] = useState(false);

  // Reopen Paystack for a naira request the student left before paying
  const payWithPaystack = async () => {
    setPayError('');
    setOpeningCheckout(true);
    try {
      const res = await studentAPI.initializePaystack(req.requestToken);
      if (res.success && res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
        return;
      }
      setPayError(res.message || 'Could not open the Paystack checkout.');
    } catch (err) {
      setPayError(err.response?.data?.message || 'Could not open the Paystack checkout.');
    }
    setOpeningCheckout(false);
  };

  return (
    <section className="cp-card cp-dash__current">
      <div className="cp-card__body">
        <div className="cp-dash__current-head">
          <div>
            <h2 className="cp-h3">Current request</h2>
            <p className="cp-small cp-muted">
              Reference <span className="cp-num">{req.requestToken}</span> · {formatDate(req.createdAt)}
            </p>
          </div>
          <StatusBadge req={req} />
        </div>

        <Progress current={state} />

        {state === 'awaiting' && (
          <div className="cp-dash__state">
            <p>
              We have not received your {paysWithPaystack ? 'Paystack' : 'Mobile Money'} payment of{' '}
              <strong className="cp-num">{formatRequestPaid(req)}</strong> for a{' '}
              <strong className="cp-num">{formatUsd(req.amount)}</strong> card yet.
            </p>
            {paysWithPaystack ? (
              <p className="cp-small cp-muted">
                If you closed the Paystack page before paying, continue to Paystack to finish. If you were charged but this
                still shows as unpaid, do not pay again: contact support with your reference.
              </p>
            ) : (
              <p className="cp-small cp-muted">
                If you approved the Hubtel prompt, it can take a few minutes to confirm. If you sent Mobile Money manually, our
                team confirms it by hand during support hours, so do not cancel. If you did not pay at all, cancel this
                request and start a new one.
              </p>
            )}
            {payError && <div className="cp-alert cp-alert--error" role="status">{payError}</div>}
            <div className="cp-actions-row">
              {paysWithPaystack && (
                <button type="button" className="cp-btn cp-btn--primary" onClick={payWithPaystack} disabled={openingCheckout}>
                  {openingCheckout ? 'Opening checkout…' : 'Continue to Paystack'}
                </button>
              )}
              <button type="button" className="cp-btn cp-btn--secondary" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? 'Checking…' : 'Check again'}
              </button>
              <button type="button" className="cp-btn cp-btn--ghost cp-btn--danger" onClick={onCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling…' : 'Cancel request'}
              </button>
            </div>
          </div>
        )}

        {state === 'preparing' && (
          <div className="cp-dash__state">
            <p>
              Payment received. Your <strong className="cp-num">{formatUsd(req.amount)}</strong> card is being prepared.
            </p>
            <p className="cp-small cp-muted">
              This usually takes {SERVICE.processingTime} ({SUPPORT.hours}). We email your Pathway address when it is ready,
              and the details appear here.
            </p>
            <div className="cp-actions-row">
              <button type="button" className="cp-btn cp-btn--secondary" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? 'Checking…' : 'Check again'}
              </button>
            </div>
          </div>
        )}

        {state === 'ready' && (
          <CardDetails req={req} studentName={studentName} now={now} onCopy={onCopy} onFreeze={onFreeze} freezing={freezing} />
        )}
      </div>
    </section>
  );
}

function HowToPay() {
  return (
    <section className="cp-card">
      <div className="cp-card__body">
        <h2 className="cp-h3">Paying with your card</h2>
        <ol className="cp-howto">
          <li>Sign in at <strong>my.byupathway.edu</strong> and go to the payment page.</li>
          <li>Choose to pay by card.</li>
          <li>Copy the card number, name, expiry and CVV from this page.</li>
          <li>Pay the exact amount the card was issued for.</li>
        </ol>
        <p className="cp-small cp-muted" style={{ marginTop: 14 }}>
          Problem paying? Message us on{' '}
          <a href={SUPPORT.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a> with your request reference.
        </p>
      </div>
    </section>
  );
}

function History({ requests }) {
  if (requests.length === 0) return null;
  return (
    <section className="cp-card">
      <div className="cp-card__body" style={{ paddingBottom: 8 }}>
        <h2 className="cp-h3">History</h2>
      </div>
      <div className="cp-table-wrap">
        <table className="cp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th className="is-num">Card</th>
              <th className="is-num">Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req._id || req.id}>
                <td data-label="Date">{formatDate(req.createdAt)}</td>
                <td data-label="Reference"><span className="cp-num">{req.requestToken || '—'}</span></td>
                <td data-label="Card" className="is-num cp-num">{formatUsd(req.amount)}</td>
                <td data-label="Paid" className="is-num cp-num">{formatRequestPaid(req)}</td>
                <td data-label="Status"><StatusBadge req={req} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Page ────────────────────────────────────────────────────────

function StudentDashboard() {
  const { user } = useAuth();
  const byuId = user?.byuId || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [freezing, setFreezing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const now = useNow();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!byuId) return;
    quiet ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const response = await studentAPI.getDashboard(byuId);
      setData(response.data);
      localStorage.setItem('hasViewedDashboard', 'true');
    } catch (err) {
      setError(err.response?.data?.message || 'We could not load your account. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [byuId]);

  useEffect(() => { load(); }, [load]);

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text || '');
      showToast(`${label} copied`);
    } catch {
      showToast('Could not copy. Select the text instead.');
    }
  };

  const requests = data?.cardRequests || [];
  const current = requests.find(isOpen) || null;
  const past = requests.filter((r) => r !== current);
  const student = data?.student;
  const firstName = (student?.name || user?.name || '').split(' ')[0];
  const totalCompletedUsd = requests
    .filter((r) => ['done', 'ready'].includes(describeRequest(r).key))
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const handleFreeze = async () => {
    if (!current) return;
    setFreezing(true);
    try {
      const result = await studentAPI.freezeCard(current.id || current._id);
      if (result?.success) {
        setData((prev) => ({
          ...prev,
          cardRequests: prev.cardRequests.map((r) => (r === current ? { ...r, cardStatus: result.cardStatus } : r))
        }));
        showToast(result.cardStatus === 'frozen' ? 'Card frozen' : 'Card unfrozen');
      }
    } catch {
      showToast('Could not update the card. Try again.');
    } finally {
      setFreezing(false);
    }
  };

  const handleCancel = async () => {
    if (!current || !window.confirm('Cancel this request? Only do this if you did not pay anything for it.')) return;
    setCancelling(true);
    try {
      await studentAPI.paymentFailed({ paymentReference: current.paymentReference, reason: 'Cancelled by student' });
      showToast('Request cancelled');
      await load({ quiet: true });
    } catch {
      showToast('Could not cancel. Contact support.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="cp-dash">
      <div className="cp-container">
        <header className="cp-dash__head">
          <div>
            <h1 className="cp-h2">{firstName ? `Hello, ${firstName}` : 'Your account'}</h1>
            <p className="cp-small cp-muted">
              BYU ID <span className="cp-num">{byuId}</span>
              {student?.email && <> · {student.email}</>}
            </p>
          </div>
          <div className="cp-actions-row" style={{ marginTop: 0 }}>
            <button type="button" className="cp-btn cp-btn--secondary" onClick={() => load({ quiet: true })} disabled={refreshing || loading}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            {!current && <Link to="/request" className="cp-btn cp-btn--primary">Request a card</Link>}
          </div>
        </header>

        {error && <div className="cp-alert cp-alert--error" role="alert" style={{ marginBottom: 20 }}>{error}</div>}

        {student && student.isVerified === false && (
          <div className="cp-note" style={{ marginBottom: 20 }}>
            <strong>Confirm your email to request a card.</strong> Open the link we sent to {student.email}. Check spam if
            you cannot find it, or <Link to="/contact">contact support</Link>.
          </div>
        )}

        {loading ? (
          <div className="cp-card"><div className="cp-card__body cp-muted">Loading your account…</div></div>
        ) : (
          <div className="cp-dash__grid">
            <div className="cp-dash__main">
              {current ? (
                <CurrentRequest
                  req={current}
                  studentName={student?.name || user?.name}
                  now={now}
                  onCopy={copy}
                  onFreeze={handleFreeze}
                  freezing={freezing}
                  onCancel={handleCancel}
                  cancelling={cancelling}
                  onRefresh={() => load({ quiet: true })}
                  refreshing={refreshing}
                />
              ) : (
                <section className="cp-card">
                  <div className="cp-card__body">
                    <h2 className="cp-h3">No open request</h2>
                    <p style={{ marginTop: 8 }}>
                      When your BYU-Pathway payment is due, request a card for the exact amount. Cards are valid for{' '}
                      {SERVICE.cardValidity} after they are issued, so request one when you are ready to pay.
                    </p>
                    <div className="cp-actions-row">
                      <Link to="/request" className="cp-btn cp-btn--primary">Request a card</Link>
                    </div>
                  </div>
                </section>
              )}

              <History requests={past} />
            </div>

            <aside className="cp-dash__side">
              <HowToPay />
              {totalCompletedUsd > 0 && (
                <section className="cp-card">
                  <div className="cp-card__body">
                    <p className="cp-small cp-muted">Paid through ConnectPay</p>
                    <p className="cp-card-ready__amount cp-num">{formatUsd(totalCompletedUsd)}</p>
                  </div>
                </section>
              )}
            </aside>
          </div>
        )}
      </div>

      {toast && <div className="cp-toast" role="status">{toast}</div>}
    </div>
  );
}

export default StudentDashboard;
