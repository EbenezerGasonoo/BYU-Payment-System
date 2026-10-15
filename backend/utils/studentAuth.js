const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Student } = require('../models');

// Session tokens are HMAC-signed `payload.signature` strings (JWT-like, no extra dependency).
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MIN_PASSWORD_LENGTH = 8;

let TOKEN_SECRET = process.env.STUDENT_TOKEN_SECRET;
if (!TOKEN_SECRET) {
  TOKEN_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️ STUDENT_TOKEN_SECRET is not set — using a random secret. Student sessions will reset on every restart.');
}

const base64url = (input) => Buffer.from(input).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');

// Ties a token to the current password hash, so resetting the password signs out old sessions
const passwordFingerprint = (passwordHash) => sign(`pw:${passwordHash || ''}`).slice(0, 16);

// ── Passwords ─────────────────────────────────────────────────────

const hashPassword = (password) => bcrypt.hash(password, 10);

// Legacy hashes were PBKDF2 with a fixed salt (from the old reset-password flow)
const legacyHash = (password) =>
  crypto.pbkdf2Sync(password, 'byu_connectpay_salt_2025', 10000, 64, 'sha512').toString('hex');

const verifyPassword = async (password, storedHash) => {
  if (!storedHash || !password) return { valid: false };
  if (storedHash.startsWith('$2')) {
    return { valid: await bcrypt.compare(password, storedHash) };
  }
  const candidate = Buffer.from(legacyHash(password));
  const stored = Buffer.from(storedHash);
  const valid = candidate.length === stored.length && crypto.timingSafeEqual(candidate, stored);
  return { valid, needsRehash: valid };
};

const validatePasswordStrength = (password) => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  }
  return null;
};

// ── Tokens ────────────────────────────────────────────────────────

const issueToken = (student) => {
  const payload = base64url(JSON.stringify({
    sub: String(student.id),
    byuId: student.byuId,
    pwv: passwordFingerprint(student.password),
    exp: Date.now() + TOKEN_TTL_MS
  }));
  return `${payload}.${sign(payload)}`;
};

const readToken = (token) => {
  const [payload, signature] = (token || '').split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!claims.exp || claims.exp < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
};

// ── Middleware ────────────────────────────────────────────────────

const isAdminRequest = (req) => {
  const adminKey = req.headers['x-admin-key'];
  return Boolean(adminKey && process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY);
};

/**
 * Requires a valid student session (Authorization: Bearer <token>).
 * Sets req.student. Admins (x-admin-key) pass through with req.isAdmin = true
 * so admin impersonation of the student portal keeps working.
 */
const requireStudent = async (req, res, next) => {
  try {
    if (isAdminRequest(req)) {
      req.isAdmin = true;
      return next();
    }

    const header = req.headers.authorization || '';
    const claims = readToken(header.startsWith('Bearer ') ? header.slice(7) : null);
    if (!claims) {
      return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    }

    const student = await Student.findOne({ where: { byuId: claims.byuId } });
    if (
      !student ||
      String(student.id) !== claims.sub ||
      student.status === 'deleted' ||
      passwordFingerprint(student.password) !== claims.pwv
    ) {
      return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
    }

    req.student = student;
    next();
  } catch (error) {
    console.error('Student auth error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// True when the signed-in student (or an admin) may access the given student's data
const canAccessStudent = (req, studentId) =>
  req.isAdmin || (req.student && String(req.student.id) === String(studentId));

// ── Login rate limiting (in-memory, per BYU ID) ──────────────────

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 10;
const loginAttempts = new Map();

const isLoginLocked = (key) => {
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < Date.now()) return false;
  return entry.count >= MAX_LOGIN_ATTEMPTS;
};

const recordFailedLogin = (key) => {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    entry.count += 1;
  }
};

const clearLoginAttempts = (key) => loginAttempts.delete(key);

module.exports = {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  issueToken,
  requireStudent,
  canAccessStudent,
  isLoginLocked,
  recordFailedLogin,
  clearLoginAttempts
};
