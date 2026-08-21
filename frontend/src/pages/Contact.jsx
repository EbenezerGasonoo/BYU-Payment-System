import { useState, useEffect } from 'react';
import { contactAPI } from '../api/api';
import './Contact.css';

function Contact() {
  const [showAdminNotice, setShowAdminNotice] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    byuId: '',
    subject: 'card-request',
    urgency: 'normal',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Live Accra GMT Time & Office Status
  const [officeStatus, setOfficeStatus] = useState({ isOpen: false, gmtTime: '' });

  // Pre-fill user data from auth/localStorage if present
  useEffect(() => {
    const savedName = localStorage.getItem('userName') || '';
    const savedEmail = localStorage.getItem('userEmail') || '';
    const savedByuId = localStorage.getItem('userByuId') || '';

    setFormData(prev => ({
      ...prev,
      name: prev.name || savedName,
      email: prev.email || savedEmail,
      byuId: prev.byuId || savedByuId
    }));

    // Admin detection
    const adminKey = sessionStorage.getItem('adminKey');
    if (adminKey === 'byu-admin-2025-secret-key') {
      setShowAdminNotice(true);
    }

    // Check office status (GMT Time)
    const updateOfficeStatus = () => {
      const now = new Date();
      // Ghana is UTC / GMT+0
      const utcHours = now.getUTCHours();
      const utcDay = now.getUTCDay(); // 0 = Sun, 6 = Sat
      const isWeekday = utcDay >= 1 && utcDay <= 5;
      const isOpen = isWeekday && utcHours >= 9 && utcHours < 17;

      const timeString = now.toLocaleTimeString('en-GB', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      setOfficeStatus({
        isOpen,
        gmtTime: `${timeString} GMT`
      });
    };

    updateOfficeStatus();
    const timer = setInterval(updateOfficeStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleCategorySelect = (categoryKey) => {
    setFormData(prev => ({
      ...prev,
      subject: categoryKey
    }));
  };

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenLiveChat = () => {
    const chatBtn = document.querySelector('.chat-button');
    if (chatBtn) {
      chatBtn.click();
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side quick check
    if (!formData.email.toLowerCase().endsWith('@byupathway.edu')) {
      setError('Please use your official BYU Pathway email address (@byupathway.edu).');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        byuId: formData.byuId.trim() || undefined,
        subject: formData.subject,
        message: formData.urgency === 'urgent' 
          ? `[URGENT / DEADLINE ISSUE]\n\n${formData.message}` 
          : formData.message
      };

      const response = await contactAPI.submitMessage(payload);
      
      setSubmitted(true);
      setReferenceId(response.data?.data?.referenceId || response.data?.referenceId || `BYU-TKT-${Date.now().toString().slice(-6)}`);
      
      // Clear form
      setFormData(prev => ({
        ...prev,
        message: ''
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit support ticket. Please try again or reach us on WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  // Category definitions
  const categories = [
    { key: 'card-request', name: 'Virtual Card', icon: '💳', tip: 'Virtual cards are normally generated within 2-4 business hours after registration verification.' },
    { key: 'payment', name: 'Payment / Hubtel', icon: '💰', tip: 'Mobile money debits via Hubtel usually settle within 1-3 minutes. Keep your transaction reference handy.' },
    { key: 'registration', name: 'Registration & ID', icon: '📝', tip: 'Make sure your name exactly matches your BYU Pathway portal records and your email ends with @byupathway.edu.' },
    { key: 'technical', name: 'Technical / Bug', icon: '⚙️', tip: 'Include browser details and any specific error messages to help our engineers investigate swiftly.' },
    { key: 'urgent', name: 'Urgent Deadline', icon: '🚨', tip: 'If your fee deadline is within 24 hours, also message our WhatsApp desk for instant escalation.' },
    { key: 'general', name: 'General Inquiry', icon: '❓', tip: 'Our support team responds to all general inquiries within 24 business hours.' }
  ];

  const currentCategory = categories.find(c => c.key === formData.subject) || categories[0];

  const miniFaqs = [
    {
      q: 'How fast will my virtual card request be processed?',
      a: 'Card requests are reviewed and assigned within 2-4 hours during business hours (Monday - Friday, 9:00 AM - 5:00 PM GMT).'
    },
    {
      q: 'How do I pay with Mobile Money (MTN / Telecel / AT)?',
      a: 'Select Hubtel Direct Debit on the Payment page, enter your MoMo number, and approve the prompt that appears on your phone.'
    },
    {
      q: 'Why does my email need to be @byupathway.edu?',
      a: 'We authenticate BYU students exclusively through their official university pathway credentials to protect student financial accounts.'
    },
    {
      q: 'Can I track an existing ticket or request?',
      a: 'Yes! Check your Student Dashboard using your BYU ID to view real-time card request status and payment updates.'
    }
  ];

  const isEmailValid = formData.email.toLowerCase().endsWith('@byupathway.edu');
  const isByuIdValid = !formData.byuId || /^\d{7,8}$/.test(formData.byuId);

  return (
    <div className="contact-page">
      <div className="container">
        
        {/* Hero Section */}
        <div className="contact-hero">
          <div className="contact-badge">
            <span className="pulse-dot"></span>
            CONNECTPAY SUPPORT DESK • GHANA
          </div>
          <h1>
            We're Here to Support Your <span className="highlight-text">BYU Journey</span>
          </h1>
          <p className="contact-subtitle">
            Need help with your virtual card, tuition payment, or student verification? Connect with our dedicated West Africa student support team.
          </p>

          {/* Trust Stats Bar */}
          <div className="trust-stats-bar">
            <div className="trust-stat-item">
              <div className="trust-stat-icon">⚡</div>
              <div className="trust-stat-text">
                <strong>&lt; 2 Hours</strong>
                <span>Avg Response Time</span>
              </div>
            </div>
            <div className="trust-stat-item">
              <div className="trust-stat-icon">🇬🇭</div>
              <div className="trust-stat-text">
                <strong>Local Ghana Desk</strong>
                <span>Accra &amp; Regional Support</span>
              </div>
            </div>
            <div className="trust-stat-item">
              <div className="trust-stat-icon">💬</div>
              <div className="trust-stat-text">
                <strong>Live Assistance</strong>
                <span>WhatsApp &amp; Portal Chat</span>
              </div>
            </div>
            <div className="trust-stat-item">
              <div className="trust-stat-icon">🔒</div>
              <div className="trust-stat-text">
                <strong>100% Encrypted</strong>
                <span>Secure Ticket Routing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Instant Channels */}
        <div className="quick-channels-grid">
          {/* WhatsApp */}
          <div className="channel-card whatsapp">
            <div className="channel-header">
              <div className="channel-icon-box whatsapp-bg">💬</div>
              <div className="channel-title">
                <h3>WhatsApp Instant Desk</h3>
                <span className="channel-badge fast">Fastest Support</span>
              </div>
            </div>
            <p className="channel-desc">
              Chat directly with our student support representative for urgent assistance and live status verification.
            </p>
            <div className="channel-value">
              <span>+233 54 369 2272</span>
            </div>
            <div className="channel-actions">
              <a 
                href="https://wa.me/233543692272?text=Hello%20ConnectPay%20Support%2C%20I%20need%20assistance%20with%20my%20BYU%20Pathway%20Virtual%20Card%20system." 
                target="_blank" 
                rel="noopener noreferrer" 
                className="channel-btn-primary whatsapp-action"
              >
                <span>Chat on WhatsApp →</span>
              </a>
              <button 
                className="channel-btn-copy" 
                onClick={() => handleCopy('+233543692272', 'wa')}
                title="Copy phone number"
              >
                {copiedKey === 'wa' ? '✓' : '📋'}
              </button>
            </div>
          </div>

          {/* Telephone Support */}
          <div className="channel-card phone">
            <div className="channel-header">
              <div className="channel-icon-box phone-bg">📞</div>
              <div className="channel-title">
                <h3>Telephone Line</h3>
                <span className="channel-badge direct">Direct Call</span>
              </div>
            </div>
            <p className="channel-desc">
              Speak directly with an advisor during official Ghana operating hours (Mon-Fri, 9:00 AM – 5:00 PM GMT).
            </p>
            <div className="channel-value">
              <span>+233 54 369 2272</span>
            </div>
            <div className="channel-actions">
              <a href="tel:+233543692272" className="channel-btn-primary phone-action">
                <span>Call Support →</span>
              </a>
              <button 
                className="channel-btn-copy" 
                onClick={() => handleCopy('+233543692272', 'tel')}
                title="Copy phone number"
              >
                {copiedKey === 'tel' ? '✓' : '📋'}
              </button>
            </div>
          </div>

          {/* Official Email */}
          <div className="channel-card email">
            <div className="channel-header">
              <div className="channel-icon-box email-bg">📧</div>
              <div className="channel-title">
                <h3>Official Email Desk</h3>
                <span className="channel-badge sla">24h Response</span>
              </div>
            </div>
            <p className="channel-desc">
              Submit detailed requests, payment receipts, or escalated student account inquiries.
            </p>
            <div className="channel-value">
              <span>iamknightrae@gmail.com</span>
            </div>
            <div className="channel-actions">
              <a href="mailto:iamknightrae@gmail.com?subject=BYU%20Pathway%20Support%20Inquiry" className="channel-btn-primary email-action">
                <span>Send Email →</span>
              </a>
              <button 
                className="channel-btn-copy" 
                onClick={() => handleCopy('iamknightrae@gmail.com', 'email')}
                title="Copy email address"
              >
                {copiedKey === 'email' ? '✓' : '📋'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Form + Information Sidebar */}
        <div className="contact-main-grid">
          
          {/* Form Card */}
          <div className="contact-form-card">
            
            {submitted ? (
              <div className="contact-success-panel">
                <div className="success-icon-badge">✓</div>
                <h3>Ticket Created Successfully!</h3>
                <p>
                  Thank you for reaching out. We have logged your request and sent a confirmation email to <strong>{formData.email || 'your email'}</strong>.
                </p>

                {referenceId && (
                  <div className="reference-card">
                    <div className="ref-info">
                      <small>Support Reference ID</small>
                      <code>#{referenceId}</code>
                    </div>
                    <button 
                      className="ref-copy-btn"
                      onClick={() => handleCopy(referenceId, 'ref')}
                    >
                      {copiedKey === 'ref' ? 'Copied!' : 'Copy ID'}
                    </button>
                  </div>
                )}

                <div className="success-actions">
                  <a 
                    href={`https://wa.me/233543692272?text=Hello%20Support%2C%20I%20just%20submitted%20ticket%20%23${referenceId}.%20Can%20you%20please%20help%20check%20it%3F`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="channel-btn-primary whatsapp-action"
                  >
                    💬 Follow up on WhatsApp
                  </a>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="form-header-bar">
                  <h2>Submit a Support Request</h2>
                  <p>Fill out the form below and our Ghana support team will assist you shortly.</p>
                </div>

                {/* Auto-fill notice if user is logged in */}
                {formData.name && (
                  <div className="user-autofill-banner">
                    <div className="user-autofill-info">
                      <span>👤 Logged in as <strong>{formData.name}</strong></span>
                      {formData.byuId && <span>• ID: <code>{formData.byuId}</code></span>}
                    </div>
                    <span className="user-autofill-tag">Auto-Filled</span>
                  </div>
                )}

                {error && (
                  <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  
                  {/* Category Selector Tiles */}
                  <div className="category-tiles-label">
                    <span>Select Inquiry Topic *</span>
                    <small style={{ color: 'var(--cp-muted)', fontWeight: 'normal' }}>Choose best fit</small>
                  </div>
                  <div className="category-tiles-grid">
                    {categories.map(cat => (
                      <button
                        type="button"
                        key={cat.key}
                        className={`category-tile-btn ${formData.subject === cat.key ? 'active' : ''}`}
                        onClick={() => handleCategorySelect(cat.key)}
                      >
                        <span className="tile-icon">{cat.icon}</span>
                        <span className="tile-name">{cat.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Smart dynamic tip for the selected category */}
                  <div className="smart-hint-box">
                    <span>💡</span>
                    <div>
                      <strong>Helpful Tip:</strong> {currentCategory.tip}
                    </div>
                  </div>

                  {/* Name & BYU ID Row */}
                  <div className="form-row">
                    <div className="form-group-custom">
                      <label htmlFor="name">Full Name *</label>
                      <div className="form-input-wrapper">
                        <span className="input-icon-prefix">👤</span>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="e.g. Ebenezer Gasonoo"
                          className="form-input-custom"
                        />
                      </div>
                    </div>

                    <div className="form-group-custom">
                      <label htmlFor="byuId">
                        <span>BYU Student ID</span>
                        {formData.byuId && (
                          <span className={`field-status-badge ${isByuIdValid ? 'valid' : 'invalid'}`}>
                            {isByuIdValid ? '✓ Valid Format' : '⚠️ 7-8 digits'}
                          </span>
                        )}
                      </label>
                      <div className="form-input-wrapper">
                        <span className="input-icon-prefix">🎓</span>
                        <input
                          type="text"
                          id="byuId"
                          name="byuId"
                          value={formData.byuId}
                          onChange={handleChange}
                          placeholder="e.g. 12345678"
                          maxLength={8}
                          className={`form-input-custom ${formData.byuId && isByuIdValid ? 'is-valid' : ''}`}
                        />
                      </div>
                      <span className="form-helper-text">7 to 8 digit number (Optional, but speeds up review)</span>
                    </div>
                  </div>

                  {/* BYU Pathway Email */}
                  <div className="form-group-custom">
                    <label htmlFor="email">
                      <span>BYU Pathway Email *</span>
                      {formData.email && (
                        <span className={`field-status-badge ${isEmailValid ? 'valid' : 'invalid'}`}>
                          {isEmailValid ? '✓ Valid @byupathway.edu' : '⚠️ Must end with @byupathway.edu'}
                        </span>
                      )}
                    </label>
                    <div className="form-input-wrapper">
                      <span className="input-icon-prefix">✉️</span>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="yourname@byupathway.edu"
                        className={`form-input-custom ${formData.email && isEmailValid ? 'is-valid' : ''}`}
                      />
                    </div>
                    <span className="form-helper-text">Official school address where card credentials will be sent</span>
                  </div>

                  {/* Priority Toggle */}
                  <div className="form-group-custom">
                    <label>Priority Level</label>
                    <div className="priority-toggle-row">
                      <div 
                        className={`priority-option ${formData.urgency === 'normal' ? 'selected' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, urgency: 'normal' }))}
                      >
                        <span>🟢</span>
                        <span>Standard (Within 24 hrs)</span>
                      </div>
                      <div 
                        className={`priority-option urgent ${formData.urgency === 'urgent' ? 'selected' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, urgency: 'urgent' }))}
                      >
                        <span>🚨</span>
                        <span>High / Fee Deadline &lt; 24h</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="form-group-custom">
                    <label htmlFor="message">Detailed Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      maxLength={1500}
                      placeholder="Please describe your issue, transaction details, or question with as much detail as possible..."
                      className="form-textarea-custom"
                    ></textarea>
                    <div className="char-counter">
                      {formData.message.length} / 1500 characters
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    className="submit-btn-custom" 
                    disabled={loading || (formData.email.length > 0 && !isEmailValid)}
                  >
                    {loading ? (
                      <>
                        <span className="btn-spinner"></span>
                        <span>Routing to Support Desk...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Support Ticket</span>
                        <span>→</span>
                      </>
                    )}
                  </button>

                </form>
              </>
            )}

          </div>

          {/* Sidebar */}
          <div className="contact-sidebar">
            
            {/* Dedicated Support Lead Specialist */}
            <div className="advisor-card-widget">
              <img 
                src="/images/support-specialist.jpg" 
                alt="Abena Osei - Lead Student Support Advisor" 
                className="advisor-avatar-img" 
              />
              <div className="advisor-details">
                <h4>Abena Osei</h4>
                <p>Senior Student Support Advisor • Accra Desk</p>
                <span className="advisor-live-badge">🟢 Online &amp; Assisting Students</span>
              </div>
            </div>

            {/* Live Operating Status Card */}
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <span className="sidebar-icon">⏰</span>
                <h3>Support Desk Hours</h3>
              </div>
              
              <div className={`hours-status-banner ${officeStatus.isOpen ? 'open' : 'closed'}`}>
                <span>{officeStatus.isOpen ? '🟢 Desk is Currently OPEN' : '🌙 Desk is Currently OFFLINE'}</span>
                <span>{officeStatus.gmtTime}</span>
              </div>

              <div className="hours-list">
                <div className="hours-row">
                  <span>Monday – Friday</span>
                  <span>9:00 AM – 5:00 PM GMT</span>
                </div>
                <div className="hours-row">
                  <span>Saturday – Sunday</span>
                  <span>Automated / Emergency Desk</span>
                </div>
                <div className="hours-row">
                  <span>Public Holidays</span>
                  <span>Limited Availability</span>
                </div>
              </div>
            </div>

            {/* Quick Live Chat Trigger */}
            <div className="sidebar-card" style={{ background: 'linear-gradient(135deg, rgba(0, 46, 93, 0.03) 0%, rgba(255, 184, 28, 0.08) 100%)', borderColor: 'rgba(255, 184, 28, 0.3)' }}>
              <div className="sidebar-card-header">
                <span className="sidebar-icon">💬</span>
                <h3>Real-Time Live Chat</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--cp-muted)', lineHeight: '1.5', marginBottom: '1rem' }}>
                Need immediate answers? Start an interactive live chat session with our system agent right inside this portal.
              </p>
              <button 
                type="button" 
                className="channel-btn-primary phone-action"
                style={{ width: '100%' }}
                onClick={handleOpenLiveChat}
              >
                <span>Open Live Chat Widget</span>
                <span>💬</span>
              </button>
            </div>

            {/* Location Card */}
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <span className="sidebar-icon">📍</span>
                <h3>Ghana Hub &amp; Location</h3>
              </div>
              <div className="location-content">
                <p>Accra BYU Pathway Gathering Center</p>
                <small>Greater Accra Region, Ghana • West Africa Coordinating Office</small>
                <a 
                  href="https://maps.google.com/?q=Accra,Ghana" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="location-link"
                >
                  <span>View on Google Maps</span>
                  <span>↗</span>
                </a>
              </div>
            </div>

            {/* Mini FAQ Quick Accordion */}
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                <span className="sidebar-icon">❓</span>
                <h3>Quick Answers (FAQ)</h3>
              </div>
              
              <div className="mini-faq-list">
                {miniFaqs.map((faq, idx) => {
                  const isExpanded = expandedFaq === idx;
                  return (
                    <div key={idx} className={`mini-faq-item ${isExpanded ? 'expanded' : ''}`}>
                      <button 
                        type="button"
                        className="mini-faq-question"
                        onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                      >
                        <span>{faq.q}</span>
                        <span>{isExpanded ? '−' : '+'}</span>
                      </button>
                      {isExpanded && (
                        <div className="mini-faq-answer">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <a href="/faq" className="view-all-faqs-btn">
                Browse Full Knowledge Base →
              </a>
            </div>

          </div>

        </div>

        {/* Admin Secret Notice */}
        {showAdminNotice && (
          <div className="admin-badge-notice">
            <div>
              <strong>👨‍💼 Administrator Live Mode Active:</strong> Incoming support tickets and user inquiries will appear directly on your administrative console and live chat queue.
            </div>
            <a href="/admin" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              Open Admin Console
            </a>
          </div>
        )}

      </div>
    </div>
  );
}

export default Contact;
