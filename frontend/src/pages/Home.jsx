import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VirtualCardVisualizer from '../components/VirtualCardVisualizer';

function Home() {
  const [rates, setRates] = useState({
    GHS: 15.50,
    NGN: 1520.00,
    XOF: 605.00,
    LRD: 195.00,
    SLE: 22.50
  });
  const [activeTab, setActiveTab] = useState('how-it-works');

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
              <span className="badge-icon">⚡</span> Built for Students across West Africa
            </div>
            
            <h1 className="hero-main-title">
              Instant USD <span className="text-gradient">Virtual Cards</span> for Tuition Payments
            </h1>
            
            <p className="hero-description">
              Pay your university tuition with local Mobile Money (MTN, Telecel, Orange, Wave) or Paystack. ConnectPay issues your USD Virtual Card automatically — in minutes.
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
                <span className="trust-label">Instant Card Issuance</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <span className="trust-number">🔒 256-Bit</span>
                <span className="trust-label">Encrypted Transactions</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <span className="trust-number">🌍 6 Countries</span>
                <span className="trust-label">West Africa Coverage</span>
              </div>
            </div>
          </div>

          {/* HERO RIGHT COLUMN - INTERACTIVE VIRTUAL CARD PREVIEW */}
          <div className="hero-card-preview">
            <div className="preview-card-glow"></div>
            <div className="card-floating-wrapper">
              <VirtualCardVisualizer
                cardNumber="4124559081239842"
                cardholderName="CONNECTPAY STUDENT"
                expiryDate="08/28"
                cvv="892"
                amountUsd={150.00}
                cardStatus="active"
              />
            </div>
            <p className="card-interact-hint">✨ Click card above to flip and explore ConnectPay security features</p>
          </div>

        </div>
      </section>

      {/* REGIONAL COVERAGE & PAYMENT RAILS SECTION */}
      <section className="rails-banner-section">
        <div className="container">
          <p className="rails-title">SUPPORTED PAYMENT RAILS ACROSS WEST AFRICA</p>
          <div className="rails-grid">
            <div className="rail-badge">🇬🇭 MTN Mobile Money</div>
            <div className="rail-badge">🇬🇭 Telecel Cash</div>
            <div className="rail-badge">🇳🇬 Bank Transfer & Cards</div>
            <div className="rail-badge">🇨🇮 🇸🇳 Orange & Wave Money</div>
            <div className="rail-badge">⚡ Paystack Direct Gateway</div>
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
            <h3>2. Request & Pay Local</h3>
            <p>Calculate live GHS, NGN, or XOF exchange rates with standard 5% fee protection. Pay via your favorite MoMo or card rail.</p>
            <Link to="/request" className="card-link">Request Card Now →</Link>
          </div>

          <div className="feature-card-modern">
            <div className="feature-icon-box green">📊</div>
            <h3>3. Real-Time Dashboard</h3>
            <p>Access active card numbers, CVV, expiry dates, transaction status, and instant card freeze/unfreeze controls anytime.</p>
            <Link to="/dashboard" className="card-link">View Dashboard →</Link>
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
              <p>Sign up with your student ID and contact details.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">2</div>
              <h4>Submit Request</h4>
              <p>Specify the required USD tuition fee amount.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">3</div>
              <h4>Pay in Local Currency</h4>
              <p>Pay via MTN MoMo, Telecel, Orange, or Paystack.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">4</div>
              <h4>Instant Card Issue</h4>
              <p>ConnectPay automatically issues USD Virtual Visa Cards for students across West Africa upon payment verification.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">5</div>
              <h4>Complete Payment</h4>
              <p>Enter card details on your university portal to complete tuition payment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER NOTICE */}
      <section className="container disclaimer-banner">
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
