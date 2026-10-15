const axios = require('axios');
const nodemailer = require('nodemailer');

// One mail sender for the whole backend.
// - BREVO_API_KEY set → send over Brevo's HTTPS API (works on Railway plans that block SMTP)
// - otherwise        → SMTP via nodemailer (EMAIL_HOST/EMAIL_PORT, or EMAIL_SERVICE such as "gmail")

const BREVO_API_URL = 'https://api.brevo.com/v3';
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Sender address must be a verified sender in Brevo
const SENDER_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER;
const SENDER_NAME = process.env.EMAIL_FROM_NAME || 'ConnectPay';

const provider = BREVO_API_KEY
  ? 'brevo'
  : (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD ? 'smtp' : null);

const isEmailConfigured = () => Boolean(provider && SENDER_EMAIL);

// Parses `"Name" <a@b.com>` or `a@b.com`
const parseAddress = (value) => {
  const match = /^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/.exec(value || '');
  return match ? { name: match[1].trim() || undefined, email: match[2].trim() } : { email: String(value).trim() };
};

const parseRecipients = (value) =>
  (Array.isArray(value) ? value : String(value || '').split(','))
    .map((entry) => entry.trim ? entry.trim() : entry)
    .filter(Boolean)
    .map(parseAddress);

// ── Brevo ─────────────────────────────────────────────────────────

const brevoHeaders = () => ({
  'api-key': BREVO_API_KEY,
  'content-type': 'application/json',
  accept: 'application/json'
});

const sendViaBrevo = async ({ from, to, subject, html, text, replyTo }) => {
  const payload = {
    // Always send from the verified sender; keep a display name from `from` when given
    sender: { email: SENDER_EMAIL, name: (from && parseAddress(from).name) || SENDER_NAME },
    to: parseRecipients(to),
    subject,
    htmlContent: html,
    ...(text ? { textContent: text } : {}),
    ...(replyTo ? { replyTo: parseAddress(replyTo) } : {})
  };

  try {
    const response = await axios.post(`${BREVO_API_URL}/smtp/email`, payload, {
      headers: brevoHeaders(),
      timeout: 15000
    });
    return { messageId: response.data?.messageId };
  } catch (error) {
    const detail = error.response?.data?.message || error.message;
    throw new Error(`Brevo send failed (${error.response?.status || 'network'}): ${detail}`);
  }
};

// ── SMTP ──────────────────────────────────────────────────────────

let smtpTransport = null;
if (provider === 'smtp') {
  const auth = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD };
  smtpTransport = process.env.EMAIL_HOST || !process.env.EMAIL_SERVICE
    ? nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'mail.entechnologygh.com',
        port: parseInt(process.env.EMAIL_PORT || '465', 10),
        secure: (process.env.EMAIL_PORT || '465') === '465',
        auth,
        tls: { rejectUnauthorized: false }
      })
    : nodemailer.createTransport({ service: process.env.EMAIL_SERVICE, auth });
}

// ── Public API ────────────────────────────────────────────────────

/** Sends one email. Accepts nodemailer-style options; resolves to { messageId }. */
const sendMail = async (options) => {
  if (!isEmailConfigured()) {
    throw new Error('Email is not configured');
  }
  if (provider === 'brevo') {
    return sendViaBrevo(options);
  }
  return smtpTransport.sendMail({ from: SENDER_EMAIL, ...options });
};

/** Logs whether the configured provider is reachable (called once at startup). */
const verifyMailer = async () => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not configured: set BREVO_API_KEY + EMAIL_FROM, or EMAIL_USER + EMAIL_PASSWORD. Emails will not be sent.');
    return false;
  }
  try {
    if (provider === 'brevo') {
      await axios.get(`${BREVO_API_URL}/account`, { headers: brevoHeaders(), timeout: 10000 });
    } else {
      await smtpTransport.verify();
    }
    console.log(`✅ Email ready (${provider})`);
    return true;
  } catch (error) {
    const detail = error.response?.data?.message || error.message;
    console.error(`❌ Email provider check failed (${provider}):`, detail);
    return false;
  }
};

module.exports = { sendMail, isEmailConfigured, verifyMailer, emailProvider: provider };
