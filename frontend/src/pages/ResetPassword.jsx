import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { studentAPI } from '../api/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';
  const codeParam = searchParams.get('code') || '';
  const emailParam = searchParams.get('email') || '';

  const [token, setToken] = useState(tokenParam);
  const [resetCode, setResetCode] = useState(codeParam);
  const [emailOrByuId, setEmailOrByuId] = useState(emailParam);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Compute password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#cbd5e0' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 20, label: 'Weak', color: '#e53e3e' };
    if (score <= 3) return { score: 60, label: 'Medium', color: '#dd6b20' };
    return { score: 100, label: 'Strong 🔒', color: '#38a169' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (!token && !resetCode) {
      setError('Missing reset authorization. Please provide a valid token or 6-digit OTP code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await studentAPI.resetPassword({
        token: token || undefined,
        resetCode: resetCode || undefined,
        emailOrByuId: emailOrByuId || undefined,
        newPassword
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to reset password. The link or code may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-bg-overlay"></div>

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">🔐</div>
          <h1 className="login-title">Reset Your Password</h1>
          <p className="login-subtitle">
            Create a strong, new password for your ConnectPay account.
          </p>
        </div>

        {success ? (
          <div style={{ textAlignment: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: '#002E5D', marginBottom: '12px', fontSize: '20px' }}>
              Password Reset Complete!
            </h2>
            <p style={{ color: '#4a5568', marginBottom: '24px', fontSize: '14px' }}>
              Your password has been successfully updated. You can now log in using your new credentials.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="login-btn"
              style={{ width: '100%' }}
            >
              Sign In to Your Account →
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error">
                <span>⚠️</span> {error}
              </div>
            )}

            {!token && (
              <div className="login-field">
                <label htmlFor="resetCode" className="login-label">
                  6-Digit OTP Reset Code
                </label>
                <input
                  id="resetCode"
                  type="text"
                  className="login-input"
                  placeholder="e.g. 123456"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
            )}

            <div className="login-field">
              <label htmlFor="newPassword" className="login-label">
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  required
                  autoFocus
                  style={{ paddingRight: '45px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>

              {/* Password strength meter */}
              {newPassword && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#718096'
                  }}>
                    <span>Password Strength:</span>
                    <span style={{ fontWeight: 'bold', color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{
                    height: '6px',
                    width: '100%',
                    backgroundColor: '#edf2f7',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${strength.score}%`,
                      backgroundColor: strength.color,
                      transition: 'all 0.3s ease'
                    }} />
                  </div>
                </div>
              )}
            </div>

            <div className="login-field">
              <label htmlFor="confirmPassword" className="login-label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <small style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  ❌ Passwords do not match
                </small>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <small style={{ color: '#38a169', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  ✓ Passwords match
                </small>
              )}
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading || (confirmPassword && newPassword !== confirmPassword)}
            >
              {loading ? (
                <><span className="btn-spinner"></span> Resetting Password…</>
              ) : (
                <>Save New Password →</>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="login-footer">
          <Link to="/forgot-password" className="login-register-link">
            Need a new reset link/OTP code?
          </Link>
        </div>
      </div>
    </div>
  );
}
