import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { studentAPI } from '../api/api';

const TITLES = {
  verifying: 'Confirming your email…',
  success: 'Email confirmed',
  error: 'We could not confirm your email'
};

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This confirmation link is incomplete. Open the link from your email again.');
      return;
    }

    studentAPI.verifyEmail(token)
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage('You can now request a card. Taking you to your dashboard…');
          setTimeout(() => navigate('/dashboard'), 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'The link may have expired or already been used.');
        }
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'The link may have expired or already been used.');
      });
  }, [token, navigate]);

  return (
    <div className="cp-auth">
      <div className="cp-auth__card cp-card">
        <div className="cp-card__body">
          <h1 className="cp-h2">{TITLES[status]}</h1>
          {message && (
            <p className={status === 'error' ? 'cp-alert cp-alert--error' : ''} style={{ marginTop: 16 }} role="status">
              {message}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            {status === 'success' && <Link to="/dashboard" className="cp-btn cp-btn--primary">Go to dashboard</Link>}
            {status === 'error' && <Link to="/contact" className="cp-btn cp-btn--primary">Contact support</Link>}
            <Link to="/" className="cp-btn cp-btn--secondary">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
