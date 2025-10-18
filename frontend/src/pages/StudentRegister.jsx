import { useState, useEffect } from 'react';
import { studentAPI } from '../api/api';
import { useNavigate } from 'react-router-dom';

function StudentRegister() {
  const [formData, setFormData] = useState({
    name: '',
    byuId: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showHint, setShowHint] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show hint for first-time visitors
    const hasRegistered = localStorage.getItem('hasRegistered');
    if (!hasRegistered) {
      setTimeout(() => setShowHint(true), 1000);
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setShowHint(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await studentAPI.register(formData);
      setMessage({ type: 'success', text: response.message });
      localStorage.setItem('hasRegistered', 'true');
      localStorage.setItem('userByuId', formData.byuId);
      
      // Show success and guide to next step
      setTimeout(() => {
        if (confirm('Registration successful! Would you like to request a virtual card now?')) {
          navigate('/request');
        }
      }, 2000);
      
      setFormData({ name: '', byuId: '', email: '', phone: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Registration failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        {showHint && (
          <div className="hint-banner">
            <span className="hint-icon">💡</span>
            <p>Start here! Fill in your details to create your student account.</p>
            <button className="hint-close" onClick={() => setShowHint(false)}>✕</button>
          </div>
        )}

        <h1>Student Registration</h1>
        <p className="subtitle">Register to access the virtual card payment system</p>

        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="byuId">BYU Student ID *</label>
            <input
              type="text"
              id="byuId"
              name="byuId"
              value={formData.byuId}
              onChange={handleChange}
              required
              placeholder="e.g., 123456789"
              pattern="[0-9]{9}"
              title="Please enter your 9-digit BYU Student ID"
            />
            <small className="field-hint">Enter your 9-digit BYU Student ID number</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">BYU Pathway Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.name@byupathway.edu"
              pattern="[a-zA-Z0-9._%+-]+@byupathway\.edu"
              title="Please use your BYU Pathway email (@byupathway.edu)"
            />
            <small className="field-hint">Must be your @byupathway.edu email address</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+233 XX XXX XXXX"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StudentRegister;

