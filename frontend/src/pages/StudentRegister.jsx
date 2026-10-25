import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentAPI } from '../api/api';
import { useAuth } from '../utils/AuthContext';
import { COUNTRY_LIST, getCountry } from '../utils/countries';

const EMPTY_FORM = { name: '', countryCode: 'GH', byuId: '', email: '', phone: '', password: '', confirmPassword: '' };

function StudentRegister() {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const { login } = useAuth();
  const country = getCountry(formData.countryCode);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;
      const response = await studentAPI.register(payload);
      localStorage.setItem('hasRegistered', 'true');

      // Sign the student in straight away
      login({
        byuId: formData.byuId,
        name: formData.name,
        email: formData.email,
        token: response.token
      });

      setMessage({
        type: 'success',
        text: 'Account created. We sent a confirmation link to your Pathway email. Confirm it before requesting a card.'
      });
      setFormData(EMPTY_FORM);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'We could not create your account. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-auth">
      <div className="cp-auth__card cp-auth__card--wide cp-card">
        <div className="cp-card__body">
          <div className="cp-auth__head">
            <h1 className="cp-h2">Create your account</h1>
            <p>You need your BYU Student ID and your @byupathway.edu email.</p>
          </div>

          {message.text && (
            <div className={`cp-alert cp-alert--${message.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: 18 }} role="status">
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="cp-form">
            <div className="cp-field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" type="text" autoComplete="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="cp-field">
              <label htmlFor="countryCode">Country you pay from</label>
              <select id="countryCode" name="countryCode" value={formData.countryCode} onChange={handleChange} required>
                {COUNTRY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>
                ))}
              </select>
              <small>You pay in {country.currencyName} by {country.payWith}. More countries are coming.</small>
            </div>

            <div className="cp-form__grid">
              <div className="cp-field">
                <label htmlFor="byuId">BYU Student ID</label>
                <input
                  id="byuId"
                  name="byuId"
                  type="text"
                  inputMode="numeric"
                  value={formData.byuId}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{7,8}"
                  title="7 or 8 digits"
                  placeholder="7 or 8 digits"
                />
              </div>
              <div className="cp-field">
                <label htmlFor="phone">{country.phoneLabel}</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} required placeholder={country.phonePlaceholder} />
              </div>
            </div>

            <div className="cp-field">
              <label htmlFor="email">Pathway email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                required
                pattern="[a-zA-Z0-9._%+-]+@byupathway\.edu"
                title="Use your @byupathway.edu address"
                placeholder="name@byupathway.edu"
              />
              <small>Card details are sent here, so use the address you can open.</small>
            </div>

            <div className="cp-form__grid">
              <div className="cp-field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} value={formData.password} onChange={handleChange} required />
                <small>At least 8 characters.</small>
              </div>
              <div className="cp-field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} value={formData.confirmPassword} onChange={handleChange} required />
              </div>
            </div>

            <button type="submit" className="cp-btn cp-btn--primary cp-btn--lg cp-btn--block" disabled={loading}>
              {loading ? <><span className="cp-spinner" /> Creating account…</> : 'Create account'}
            </button>
          </form>
        </div>
        <div className="cp-card__foot cp-auth__switch" style={{ marginTop: 0 }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default StudentRegister;
