import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VerifyEmail.css';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email address...');
    const navigate = useNavigate();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/student/verify-email/${token}`);

                if (response.data.success) {
                    setStatus('success');
                    setMessage('Email verified successfully!');
                    // Redirect to dashboard after 3 seconds
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(response.data.message || 'Verification failed.');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'An error occurred during verification.');
            }
        };

        verifyEmail();
    }, [token, navigate]);

    return (
        <div className="verify-email-container">
            <div className="verify-card">
                <div className={`status-icon ${status}`}>
                    {status === 'verifying' && <span className="loader">⏳</span>}
                    {status === 'success' && <span>✅</span>}
                    {status === 'error' && <span>❌</span>}
                </div>

                <h2>
                    {status === 'verifying' && 'Verifying Email'}
                    {status === 'success' && 'Verification Successful'}
                    {status === 'error' && 'Verification Failed'}
                </h2>

                <p className="message">{message}</p>

                {status === 'success' && (
                    <p className="redirect-text">Redirecting to dashboard...</p>
                )}

                <div className="actions">
                    <Link to="/" className="btn-secondary">Go Home</Link>
                    {status === 'success' && (
                        <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;
