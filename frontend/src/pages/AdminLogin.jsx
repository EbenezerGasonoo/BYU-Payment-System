import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../utils/AdminAuthContext';
import './AdminLogin.css';

export default function AdminLogin() {
  const [key, setKey]         = useState('');
  const [show, setShow]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { adminLogin }        = useAdminAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim()) { setError('Please enter the admin key.'); return; }
    setLoading(true);
    setError('');
    const result = await adminLogin(key.trim());
    setLoading(false);
    if (result.success) {
      navigate('/admin', { replace: true });
    } else {
      setError(result.message || 'Invalid admin key. Please try again.');
    }
  };

  return (
    <div className="admin-login-wrapper">
      {/* Animated mesh background */}
      <div className="admin-login-bg" aria-hidden="true">
        <div className="al-bg-orb al-orb-1"></div>
        <div className="al-bg-orb al-orb-2"></div>
        <div className="al-bg-orb al-orb-3"></div>
      </div>

      <div className="admin-login-card">
        {/* Brand */}
        <div className="al-brand">
          <div className="al-logo">⚡</div>
          <h1 className="al-title">ConnectPay Admin</h1>
          <p className="al-subtitle">Secure administrator access portal</p>
        </div>

        {/* Shield Icon */}
        <div className="al-shield-badge">
          <span className="al-shield-icon">🛡️</span>
          <span className="al-shield-text">Restricted Access</span>
        </div>

        {/* Form */}
        <form className="al-form" onSubmit={handleSubmit}>
          {error && (
            <div className="al-error-msg" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="al-field">
            <label className="al-label" htmlFor="adminKey">
              Admin Key
            </label>
            <div className="al-input-wrapper">
              <span className="al-input-icon">🔑</span>
              <input
                id="adminKey"
                type={show ? 'text' : 'password'}
                className="al-input"
                placeholder="Enter your admin key…"
                value={key}
                onChange={(e) => { setKey(e.target.value); setError(''); }}
                autoComplete="current-password"
                autoFocus
              />
              <button
                type="button"
                className="al-toggle-show"
                onClick={() => setShow(s => !s)}
                aria-label={show ? 'Hide key' : 'Show key'}
              >
                {show ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            id="admin-login-submit"
            type="submit"
            className="al-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="al-spinner">⏳ Verifying…</span>
            ) : (
              <span>Access Admin Dashboard →</span>
            )}
          </button>
        </form>

        {/* Footer note */}
        <p className="al-footer-note">
          This portal is for authorised ConnectPay administrators only.
          All actions are logged.
        </p>
      </div>
    </div>
  );
}
