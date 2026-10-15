import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contactAPI } from '../api/api';
import { SUPPORT, isSupportOpen } from '../utils/siteInfo';

// Keys must match the subject labels in backend/routes/contactRoutes.js
const TOPICS = [
  { key: 'card-request', label: 'My card or card request' },
  { key: 'payment', label: 'Mobile Money payment' },
  { key: 'registration', label: 'Account or registration' },
  { key: 'technical', label: 'Something is not working' },
  { key: 'general', label: 'General question' },
  { key: 'other', label: 'Other' }
];

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    byuId: '',
    subject: 'card-request',
    urgent: false,
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceId, setReferenceId] = useState(null);
  const [open, setOpen] = useState(isSupportOpen());

  // Pre-fill from the signed-in student, if any
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || localStorage.getItem('userName') || '',
      email: prev.email || localStorage.getItem('userEmail') || '',
      byuId: prev.byuId || localStorage.getItem('userByuId') || ''
    }));
    const timer = setInterval(() => setOpen(isSupportOpen()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.byuId && !/^\d{7,8}$/.test(formData.byuId.trim())) {
      setError('BYU Student ID should be 7 or 8 digits, or leave it empty.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await contactAPI.submitMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        byuId: formData.byuId.trim() || undefined,
        subject: formData.subject,
        message: formData.urgent ? `[URGENT: fee deadline within 24 hours]\n\n${formData.message}` : formData.message
      });
      setReferenceId(response.data?.referenceId || 'received');
      setFormData((prev) => ({ ...prev, message: '', urgent: false }));
    } catch (err) {
      setError(err.response?.data?.message || 'Your message could not be sent. Please try again or message us on WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="cp-pagehead">
        <div className="cp-container">
          <span className="cp-eyebrow">Support</span>
          <h1 className="cp-h1">Contact support</h1>
          <p className="cp-lead">
            WhatsApp is the fastest way to reach us. For anything else, send a message below and we reply by email.
          </p>
        </div>
      </div>

      <section style={{ paddingBottom: 80 }}>
        <div className="cp-container cp-contact">
          <div className="cp-card">
            <div className="cp-card__body">
              {referenceId ? (
                <div>
                  <h2 className="cp-h3">Message sent</h2>
                  <p style={{ marginTop: 8 }}>
                    We received your message and will reply to {formData.email || 'your email'}.
                    {referenceId !== 'received' && <> Your reference is <span className="cp-num">{referenceId}</span>.</>}
                  </p>
                  <button type="button" className="cp-btn cp-btn--secondary" style={{ marginTop: 20 }} onClick={() => setReferenceId(null)}>
                    Send another message
                  </button>
                </div>
              ) : (
                <form className="cp-form" onSubmit={handleSubmit}>
                  <h2 className="cp-h3">Send a message</h2>

                  {error && <div className="cp-alert cp-alert--error" role="alert">{error}</div>}

                  <div className="cp-form__grid">
                    <div className="cp-field">
                      <label htmlFor="c-name">Full name</label>
                      <input id="c-name" name="name" value={formData.name} onChange={handleChange} required autoComplete="name" />
                    </div>
                    <div className="cp-field">
                      <label htmlFor="c-byu">BYU Student ID <span className="cp-muted">(optional)</span></label>
                      <input id="c-byu" name="byuId" value={formData.byuId} onChange={handleChange} inputMode="numeric" />
                    </div>
                  </div>

                  <div className="cp-field">
                    <label htmlFor="c-email">Email</label>
                    <input id="c-email" name="email" type="email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                    <small>We reply to this address. Your Pathway email is best.</small>
                  </div>

                  <div className="cp-field">
                    <label htmlFor="c-topic">Topic</label>
                    <select id="c-topic" name="subject" value={formData.subject} onChange={handleChange}>
                      {TOPICS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>

                  <div className="cp-field">
                    <label htmlFor="c-message">Message</label>
                    <textarea
                      id="c-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      maxLength={1500}
                      placeholder="Include your request reference if you have one."
                    />
                    <small>{formData.message.length} / 1500</small>
                  </div>

                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--cp-ink-2)' }}>
                    <input type="checkbox" name="urgent" checked={formData.urgent} onChange={handleChange} style={{ marginTop: 3 }} />
                    My fee deadline is within 24 hours
                  </label>

                  <button type="submit" className="cp-btn cp-btn--primary cp-btn--lg" disabled={loading} style={{ justifySelf: 'start' }}>
                    {loading ? <><span className="cp-spinner" /> Sending…</> : 'Send message'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <aside className="cp-card">
            <div className="cp-channels">
              <div className="cp-channel">
                <span className={`cp-status ${open ? 'cp-status--open' : 'cp-status--closed'}`}>
                  {open ? 'Support is open now' : 'Support is closed now'}
                </span>
                <p>{SUPPORT.hours}</p>
              </div>
              <div className="cp-channel">
                <h3>WhatsApp</h3>
                <p>Fastest for card and payment questions, and anything urgent.</p>
                <a href={SUPPORT.whatsappUrl} target="_blank" rel="noopener noreferrer">{SUPPORT.whatsappDisplay}</a>
              </div>
              <div className="cp-channel">
                <h3>Phone</h3>
                <p>During support hours.</p>
                <a href={SUPPORT.phoneUrl}>{SUPPORT.whatsappDisplay}</a>
              </div>
              <div className="cp-channel">
                <h3>Email</h3>
                <p>For receipts or longer questions.</p>
                <a href={`mailto:${SUPPORT.email}`}>{SUPPORT.email}</a>
              </div>
              <div className="cp-channel">
                <p>Many questions are answered in the <Link to="/faq">FAQ</Link>.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

export default Contact;
