import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentAPI } from '../api/api';

export default function ForgotPassword() {
  const [emailOrByuId, setEmailOrByuId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);
  const [step, setStep] = useState(1); // 1 = Request, 2 = Verify Code
  const navigate = useNavigate();

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!emailOrByuId.trim()) {
      setError('Please enter your Pathway Email or BYU Student ID.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await studentAPI.forgotPassword(emailOrByuId.trim());
      setSuccessInfo(response);
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to process password reset. Please verify your details.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the valid 6-digit reset code sent to your email.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await studentAPI.verifyResetCode({
        emailOrByuId: emailOrByuId.trim(),
        resetCode: otpCode.trim()
      });
      
      // Navigate to reset-password page with token or code
      navigate(`/reset-password?code=${encodeURIComponent(otpCode.trim())}&email=${encodeURIComponent(emailOrByuId.trim())}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Invalid or expired 6-digit code. Please try again or request a new code.'
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
          <div className="login-logo">🔑</div>
          <h1 className="login-title">Forgot Password?</h1>
          <p className="login-subtitle">
            {step === 1
              ? 'Enter your BYU Student ID or Pathway email to receive a password reset link & OTP code.'
              : 'Check your email for the 6-digit verification code to reset your password.'}
          </p>
        </div>

        {error && (
          <div className="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {step === 1 ? (
          /* Step 1: Request Reset */
          <form className="login-form" onSubmit={handleRequestReset}>
            <div className="login-field">
              <label htmlFor="emailOrByuId" className="login-label">
                Pathway Email or BYU Student ID
              </label>
              <input
                id="emailOrByuId"
                type="text"
                className="login-input"
                placeholder="e.g. 1234567 or student@byupathway.edu"
                value={emailOrByuId}
                onChange={(e) => { setEmailOrByuId(e.target.value); setError(''); }}
                required
                autoFocus
              />
              <small className="login-hint">
                Enter your 7–8 digit BYU ID or your @byupathway.edu address
              </small>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner"></span> Sending Reset Code…</>
              ) : (
                <>Send Reset Link & OTP →</>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Verify OTP Code */
          <form className="login-form" onSubmit={handleVerifyOtp}>
            <div style={{
              backgroundColor: 'rgba(0, 46, 93, 0.05)',
              border: '1px solid rgba(0, 46, 93, 0.15)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#002e5d'
            }}>
              ✅ {successInfo?.message || 'Verification code sent to your registered email.'}
            </div>

            <div className="login-field">
              <label htmlFor="otpCode" className="login-label">
                Enter 6-Digit Reset Code (OTP)
              </label>
              <input
                id="otpCode"
                type="text"
                className="login-input"
                placeholder="e.g. 849201"
                value={otpCode}
                onChange={(e) => { setOtpCode(e.target.value); setError(''); }}
                maxLength={6}
                pattern="[0-9]{6}"
                style={{
                  fontSize: '22px',
                  letterSpacing: '6px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
                required
                autoFocus
              />
              <small className="login-hint">
                Check your email inbox (and spam folder) for the 6-digit code
              </small>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <><span className="btn-spinner"></span> Verifying Code…</>
              ) : (
                <>Verify Code & Continue →</>
              )}
            </button>

            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '13px',
                marginTop: '12px',
                textDecoration: 'underline'
              }}
              onClick={() => { setStep(1); setError(''); }}
            >
              ← Re-enter email or BYU Student ID
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="login-footer">
          <p>Remembered your credentials?</p>
          <Link to="/login" className="login-register-link">
            👈 Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
