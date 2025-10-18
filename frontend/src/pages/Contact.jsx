import { useState, useEffect } from 'react';
import { contactAPI } from '../api/api';

function Contact() {
  const [showAdminChat, setShowAdminChat] = useState(false);

  // Check if admin key is in sessionStorage
  useEffect(() => {
    const adminKey = sessionStorage.getItem('adminKey');
    if (adminKey === 'byu-admin-2025-secret-key') {
      setShowAdminChat(true);
    }
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    byuId: '',
    subject: 'general',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await contactAPI.submitMessage(formData);
      
      setSubmitted(true);
      setReferenceId(response.data.referenceId);
      setFormData({
        name: '',
        email: '',
        byuId: '',
        subject: 'general',
        message: ''
      });

      // Reset after 10 seconds
      setTimeout(() => {
        setSubmitted(false);
        setReferenceId('');
      }, 10000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="contact-container">
        <div className="contact-header">
          <h1>Contact Support</h1>
          <p className="subtitle">We're here to help! Send us a message and we'll get back to you soon.</p>
        </div>

        <div className="contact-grid">
          {/* Contact Form */}
          <div className="contact-form-section">
            {submitted ? (
              <div className="contact-success">
                <div className="success-icon">✅</div>
                <h3>Message Sent!</h3>
                <p>Thank you for contacting us. We'll respond to your email within 24 hours.</p>
                {referenceId && (
                  <div className="reference-box">
                    <small>Reference ID:</small>
                    <code>{referenceId}</code>
                  </div>
                )}
                <button 
                  className="btn btn-primary"
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="alert alert-error">
                    {error}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                  />
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
                  <label htmlFor="byuId">BYU Student ID (Optional)</label>
                  <input
                    type="text"
                    id="byuId"
                    name="byuId"
                    value={formData.byuId}
                    onChange={handleChange}
                    placeholder="e.g. 123456789"
                    pattern="[0-9]{9}"
                    title="Please enter your 9-digit BYU Student ID"
                  />
                  <small className="field-hint">9-digit Student ID (helps us assist you faster)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="general">General Inquiry</option>
                    <option value="card-request">Card Request Issue</option>
                    <option value="registration">Registration Problem</option>
                    <option value="payment">Payment Question</option>
                    <option value="technical">Technical Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="6"
                    placeholder="Describe your issue or question in detail..."
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
              </>
            )}
          </div>

          {/* Contact Info */}
          <div className="contact-info-section">
            <div className="contact-info-card">
              <div className="contact-info-icon">📧</div>
              <h3>Email Support</h3>
              <p>iamknightrae@gmail.com</p>
              <small>We typically respond within 24 hours</small>
            </div>

            <div className="contact-info-card">
              <div className="contact-info-icon">📱</div>
              <h3>Phone Support</h3>
              <p>+233 543692272</p>
              <small>Monday - Friday, 9 AM - 5 PM GMT</small>
            </div>

            <div className="contact-info-card">
              <div className="contact-info-icon">💬</div>
              <h3>WhatsApp</h3>
              <p>+233 543692272</p>
              <small>Quick responses during business hours</small>
            </div>

            <div className="contact-info-card">
              <div className="contact-info-icon">📍</div>
              <h3>Office Location</h3>
              <p>Accra, Ghana</p>
              <small>Visit by appointment only</small>
            </div>

            <div className="contact-info-card highlight">
              <div className="contact-info-icon">⏰</div>
              <h3>Office Hours</h3>
              <div className="office-hours">
                <p><strong>Monday - Friday</strong></p>
                <p>9:00 AM - 5:00 PM GMT</p>
                <p><strong>Weekends:</strong> Closed</p>
              </div>
            </div>

            <div className="contact-info-card highlight">
              <div className="contact-info-icon">❓</div>
              <h3>Quick Help</h3>
              <p>Check our <a href="/faq">FAQ page</a> for instant answers to common questions.</p>
            </div>
          </div>
        </div>

        {showAdminChat && (
          <div className="admin-chat-notice">
            <div className="info-box">
              <strong>👨‍💼 Admin:</strong> Users can now chat with you in real-time using the live chat button (💬) at the bottom left of any page. When users send messages, you'll see them in real-time!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Contact;

