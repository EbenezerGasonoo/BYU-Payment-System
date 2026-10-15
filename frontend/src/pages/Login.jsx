import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { studentAPI } from '../api/api';

export default function Login() {
  const [byuId, setByuId] = useState('');
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Where to go after login (default → dashboard)
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!/^\d{7,8}$/.test(byuId.trim())) {
      setError('Please enter your valid 7–8 digit BYU Student ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    setError('');
    setNeedsPassword(false);
    try {
      const response = await studentAPI.login(byuId.trim(), password);
      const { student, token } = response;

      login({
        byuId: student.byuId,
        name: student.name,
        email: student.email,
        token
      });

      navigate(from, { replace: true });
    } catch (err) {
      setNeedsPassword(err.response?.data?.code === 'PASSWORD_NOT_SET');
      setError(
        err.response?.data?.message ||
        'Sign in failed. Please check your BYU ID and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Decorative Background */}
      <div className="login-bg-overlay"></div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">Sign in</h1>
          <p className="login-subtitle">Use your BYU Student ID and password.</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleLogin}>
          {error && (
            <div className="login-error">
              {error}
              {needsPassword && (
                <> <Link to="/forgot-password" style={{ fontWeight: 600 }}>Set your password</Link></>
              )}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="byuId" className="login-label">
              BYU Student ID
            </label>
            <input
              id="byuId"
              type="text"
              className="login-input"
              placeholder="e.g. 1234567 or 12345678"
              value={byuId}
              onChange={(e) => { setByuId(e.target.value); setError(''); }}
              pattern="[0-9]{7,8}"
              maxLength={8}
              required
              autoFocus
            />
            <small className="login-hint">Enter your 7–8 digit BYU Student ID number</small>
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder="Your password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password"
              required
            />
            <div style={{ textAlign: 'right', marginTop: '6px' }}>
              <Link to="/forgot-password" style={{ color: '#002E5D', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner"></span> Signing in…</>
            ) : (
              <>Sign in</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>New to ConnectPay?</p>
          <Link to="/register" className="login-register-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
