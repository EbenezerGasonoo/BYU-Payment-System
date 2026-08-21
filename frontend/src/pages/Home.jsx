import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VirtualCardVisualizer from '../components/VirtualCardVisualizer';
import './Home.css';

function Home() {
  const [rates, setRates] = useState({
    GHS: 15.50,
    NGN: 1520.00,
    XOF: 605.00,
    LRD: 195.00,
    SLE: 22.50
  });

  useEffect(() => {
    // Fetch live rates for ticker
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setRates(prev => ({
            GHS: data.rates.GHS || prev.GHS,
            NGN: data.rates.NGN || prev.NGN,
            XOF: data.rates.XOF || prev.XOF,
            LRD: data.rates.LRD || prev.LRD,
            SLE: data.rates.SLE || prev.SLE
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="home-page-wrapper">
      {/* WEST AFRICA FX LIVE TICKER BAR */}
      <div className="fx-ticker-bar">
        <div className="ticker-label">
          <span className="live-dot"></span> LIVE WEST AFRICA FX:
        </div>
        <div className="ticker-track">
          <span className="ticker-item">🇬🇭 1 USD = <strong>{rates.GHS.toFixed(2)} GHS</strong></span>
          <span className="ticker-item">🇳🇬 1 USD = <strong>{rates.NGN.toFixed(2)} NGN</strong></span>
          <span className="ticker-item">🇨🇮 1 USD = <strong>{rates.XOF.toFixed(2)} XOF</strong></span>
          <span className="ticker-item">🇱🇷 1 USD = <strong>{rates.LRD.toFixed(2)} LRD</strong></span>
          <span className="ticker-item">🇸🇱 1 USD = <strong>{rates.SLE.toFixed(2)} SLE</strong></span>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="hero-modern-section">
        <div className="hero-mesh-overlay"></div>
        <div className="container hero-grid">
          
          {/* HERO LEFT COLUMN */}
          <div className="hero-text-content">
            <div className="hero-pill-badge">
              <span className="badge-icon">⚡</span> Built for BYU Pathway Students across Ghana &amp; West Africa
            </div>
            
            <h1 className="hero-main-title">
              Empowering Your Future with <span className="text-gradient">Instant Virtual Cards</span>
            </h1>
            
            <p className="hero-description">
              Pay your BYU Pathway university tuition effortlessly with MTN MoMo, Telecel Cash, or Paystack. ConnectPay delivers your secure USD Virtual Card automatically in minutes.
            </p>

            <div className="hero-cta-group">
              <Link to="/request" className="btn btn-hero-primary">
                💳 Request Virtual Card <span className="arrow-icon">→</span>
              </Link>
              <Link to="/register" className="btn btn-hero-secondary">
                👤 Student Register
              </Link>
            </div>

            {/* TRUST METRICS BADGES */}
            <div className="hero-trust-metrics">
              <div className="trust-item">
                <span className="trust-number">⚡ &lt; 5 Mins</span>
                <span className="trust-label">Fast Card Issuance</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <span className="trust-number">🔒 256-Bit</span>
                <span className="trust-label">Encrypted Gateway</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <span className="trust-number">🎓 1,200+</span>
                <span className="trust-label">Students Supported</span>
              </div>
            </div>
          </div>

          {/* HERO RIGHT COLUMN - HUMAN PHOTO & VIRTUAL CARD PREVIEW */}
          <div className="hero-card-preview">
            <div className="hero-visual-container">
              <img 
                src="/images/students-hero.jpg" 
                alt="BYU Pathway Students in Ghana" 
                className="hero-student-photo"
              />
              <div className="hero-floating-badge">
                <div className="hero-badge-left">
                  <div className="hero-avatar-stack">
                    <img src="/images/avatar-kwame.jpg" alt="Student Kwame" className="hero-mini-avatar" />
                    <img src="/images/avatar-ama.jpg" alt="Student Ama" className="hero-mini-avatar" />
                    <img src="/images/support-specialist.jpg" alt="Support Specialist" className="hero-mini-avatar" />
                  </div>
                  <div className="hero-badge-text">
                    <strong>1,200+ Ghanaian Students</strong>
                    <span>Tuition Paid on Time</span>
                  </div>
                </div>
                <span className="hero-badge-pill">✓ Verified</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <VirtualCardVisualizer
                cardNumber="4124559081239842"
                cardholderName="CONNECTPAY STUDENT"
                expiryDate="08/28"
                cvv="892"
                amountUsd={150.00}
                cardStatus="active"
              />
              <p className="card-interact-hint" style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                ✨ Click card above to flip and preview card credentials
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* REGIONAL COVERAGE & PAYMENT RAILS SECTION */}
      <section className="rails-banner-section">
        <div className="container">
          <p className="rails-title">SUPPORTED GHANA &amp; WEST AFRICA PAYMENT NETWORKS</p>
          <div className="rails-grid">
            <div className="rail-badge">🇬🇭 MTN Mobile Money</div>
            <div className="rail-badge">🇬🇭 Telecel Cash (Vodafone)</div>
            <div className="rail-badge">🇬🇭 AT Money (AirtelTigo)</div>
            <div className="rail-badge">⚡ Hubtel Direct Debit</div>
            <div className="rail-badge">💳 Paystack Visa &amp; Mastercard</div>
          </div>
        </div>
      </section>

      {/* HUMAN FEATURE SPOTLIGHT: HOW MOBILE MONEY POWERS TUITION */}
      <section className="container">
        <div className="human-feature-row">
          <div className="human-feature-img-box">
            <img 
              src="/images/student-mobile-pay.jpg" 
              alt="Student Paying BYU Pathway Tuition with Mobile Money" 
              className="human-feature-img"
            />
            <div className="img-floating-stat">
              <span className="stat-emoji">📱</span>
              <div className="stat-content">
                <strong>Instant MoMo Debit</strong>
                <span>Direct Hubtel Gateway</span>
              </div>
            </div>
          </div>

          <div className="human-feature-text">
            <div className="hero-pill-badge" style={{ marginBottom: '1rem' }}>
              <span>🇬🇭</span> Dedicated Ghana Student Desk
            </div>
            <h2>Pay Tuition with Mobile Money Without Leaving Campus</h2>
            <p>
              No need to queue at commercial banks or struggle with dollar exchange limits. ConnectPay connects your local MoMo wallet directly to university tuition settlement rails.
            </p>
            
            <div className="feature-check-list">
              <div className="check-item">
                <span className="check-icon">✓</span>
                <span>Direct debit on MTN MoMo, Telecel Cash, and AT Money</span>
              </div>
              <div className="check-item">
                <span className="check-icon">✓</span>
                <span>Virtual Card issued to your official @byupathway.edu email</span>
              </div>
              <div className="check-item">
                <span className="check-icon">✓</span>
                <span>Live Accra support team ready to assist via WhatsApp &amp; Phone</span>
              </div>
            </div>

            <Link to="/request" className="btn btn-hero-primary" style={{ display: 'inline-flex' }}>
              Start Card Request →
            </Link>
          </div>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section className="features-section container">
        <div className="section-header text-center">
          <h2 className="section-title">Designed for <span className="text-gradient">Seamless Student Payments</span></h2>
          <p className="section-subtitle">Everything you need to receive and manage your virtual school fee card</p>
        </div>

        <div className="features-grid-3">
          <div className="feature-card-modern">
            <div className="feature-icon-box yellow">👤</div>
            <h3>1. Student Registration</h3>
            <p>Register securely using your university student ID and email. One account unlocks instant virtual card requests.</p>
            <Link to="/register" className="card-link">Register Account →</Link>
          </div>

          <div className="feature-card-modern highlight">
            <div className="feature-icon-box blue">💳</div>
            <h3>2. Request &amp; Pay Local</h3>
            <p>Calculate live GHS, NGN, or XOF exchange rates with standard fee protection. Pay via your favorite MoMo or card rail.</p>
            <Link to="/request" className="card-link">Request Card Now →</Link>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-box green">📊</div>
            <h3>3. Real-Time Dashboard</h3>
            <p>Access active card numbers, CVV, expiry dates, transaction status, and instant card status controls anytime.</p>
            <Link to="/dashboard" className="card-link">View Dashboard →</Link>
          </div>
        </div>
      </section>

      {/* REAL STUDENT STORIES / TESTIMONIALS SECTION */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="hero-pill-badge" style={{ marginBottom: '0.75rem' }}>
              <span>💬</span> Student Community Voices
            </div>
            <h2 className="section-title">Loved by <span className="text-gradient">BYU Pathway Students</span></h2>
            <p className="section-subtitle">Read how students across Ghana fund their education smoothly with ConnectPay</p>
          </div>

          <div className="testimonials-grid">
            
            {/* Story 1 */}
            <div className="testimonial-card">
              <div className="quote-stars">★★★★★</div>
              <p className="testimonial-text">
                "Paying my tuition used to take days of trying different bank cards that often failed. With ConnectPay and MTN MoMo, my virtual card was generated in under 15 minutes and my semester fees were confirmed immediately!"
              </p>
              <div className="testimonial-author">
                <img src="/images/avatar-kwame.jpg" alt="Kwame Mensah" className="author-avatar" />
                <div className="author-info">
                  <h4>Kwame Mensah</h4>
                  <p>Applied Technology • Accra Gathering</p>
                  <span className="verified-tag">✓ Verified Student</span>
                </div>
              </div>
            </div>

            {/* Story 2 */}
            <div className="testimonial-card">
              <div className="quote-stars">★★★★★</div>
              <p className="testimonial-text">
                "The WhatsApp support desk is amazing. Abena answered my questions right away, and I got my receipt and card details directly in my student email. It makes studying with BYU Pathway so much easier."
              </p>
              <div className="testimonial-author">
                <img src="/images/avatar-ama.jpg" alt="Ama Serwaa" className="author-avatar" />
                <div className="author-info">
                  <h4>Ama Serwaa</h4>
                  <p>Business Management • Kumasi Center</p>
                  <span className="verified-tag">✓ Verified Student</span>
                </div>
              </div>
            </div>

            {/* Story 3 */}
            <div className="testimonial-card">
              <div className="quote-stars">★★★★★</div>
              <p className="testimonial-text">
                "Hubtel Mobile Money debit makes everything seamless. I entered my Ghana phone number, approved the prompt on my phone, and my virtual card was active on my dashboard right away. Super reliable!"
              </p>
              <div className="testimonial-author">
                <img src="/images/student-mobile-pay.jpg" alt="Kofi Boateng" className="author-avatar" />
                <div className="author-info">
                  <h4>Kofi Boateng</h4>
                  <p>Software Development • Takoradi Hub</p>
                  <span className="verified-tag">✓ Verified Student</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS TIMELINE SECTION */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">How It <span className="text-gradient">Works</span></h2>
            <p className="section-subtitle">5 simple steps to pay your tuition</p>
          </div>

          <div className="timeline-grid">
            <div className="timeline-step">
              <div className="step-circle">1</div>
              <h4>Register</h4>
              <p>Sign up with your BYU student ID and @byupathway.edu email.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">2</div>
              <h4>Submit Request</h4>
              <p>Specify your required tuition fee amount in USD.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">3</div>
              <h4>Pay via MoMo</h4>
              <p>Pay in GHS via MTN MoMo, Telecel Cash, AT, or Hubtel.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">4</div>
              <h4>Instant Card Issue</h4>
              <p>ConnectPay generates and delivers your USD Virtual Visa Card details.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">5</div>
              <h4>Complete Payment</h4>
              <p>Enter card credentials into your university student portal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER NOTICE */}
      <section className="container disclaimer-banner" style={{ paddingBottom: '3rem' }}>
        <div className="alert alert-info-modern">
          <span className="info-icon">ℹ️</span>
          <div>
            <strong>Student Community Initiative:</strong> This platform is designed specifically for BYU Pathway students across West Africa to simplify fee payments. Virtual USD cards are active upon assignment and can be managed directly on your dashboard.
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
