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

  // Interactive Live Tuition FX Calculator State
  const [calcUsd, setCalcUsd] = useState(150);

  useEffect(() => {
    // Fetch live exchange rates
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

  const ghsBaseAmount = (calcUsd * rates.GHS);
  const ghsFeeAmount = ghsBaseAmount * 0.05; // Standard 5% processing buffer
  const ghsTotalAmount = ghsBaseAmount + ghsFeeAmount;

  return (
    <div className="home-page-wrapper">
      
      {/* WEST AFRICA FX LIVE TICKER BAR */}
      <div className="fx-ticker-bar">
        <div className="ticker-label">
          <span className="live-dot"></span> CONNECTPAY LIVE TUITION FX:
        </div>
        <div className="ticker-track">
          <span className="ticker-item">🇬🇭 1 USD = <strong>{rates.GHS.toFixed(2)} GHS</strong></span>
          <span className="ticker-item">🇳🇬 1 USD = <strong>{rates.NGN.toFixed(2)} NGN</strong></span>
          <span className="ticker-item">🇨🇮 1 USD = <strong>{rates.XOF.toFixed(2)} XOF</strong></span>
          <span className="ticker-item">🇱🇷 1 USD = <strong>{rates.LRD.toFixed(2)} LRD</strong></span>
          <span className="ticker-item">🇸🇱 1 USD = <strong>{rates.SLE.toFixed(2)} SLE</strong></span>
        </div>
      </div>

      {/* HERO SECTION — CONNECTPAY VALUE PROPOSITION */}
      <section className="hero-modern-section">
        <div className="hero-mesh-overlay"></div>
        <div className="container hero-grid">
          
          {/* HERO LEFT COLUMN */}
          <div className="hero-text-content">
            <div className="hero-pill-badge">
              <span className="badge-icon">⚡</span> ConnectPay • Ghana &amp; West Africa Student Payment Engine
            </div>
            
            <h1 className="hero-main-title">
              Instant USD <span className="text-gradient">Virtual Cards</span> for Your BYU-Pathway Tuition
            </h1>
            
            <p className="hero-description">
              ConnectPay converts your local <strong>MTN MoMo</strong>, <strong>Telecel Cash</strong>, or <strong>AT Money</strong> directly into an active USD Virtual Visa Card in minutes. Settle your BYU-Pathway, BYU-Idaho, or Ensign College course fees without foreign bank limits or dollar exchange delays.
            </p>

            <div className="hero-cta-group">
              <Link to="/request" className="btn btn-hero-primary">
                💳 Request Virtual Card <span className="arrow-icon">→</span>
              </Link>
              <Link to="/dashboard" className="btn btn-hero-secondary">
                📊 Check Dashboard
              </Link>
            </div>

            {/* TRUST METRICS */}
            <div className="hero-trust-metrics">
              <div className="trust-item">
                <span className="trust-number">⚡ &lt; 5 Mins</span>
                <span className="trust-label">Instant Card Issuance</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <span className="trust-number">📱 100% MoMo</span>
                <span className="trust-label">MTN • Telecel • AT</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <span className="trust-number">🔒 256-Bit</span>
                <span className="trust-label">Encrypted Gateway</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <span className="trust-number">📈 Growing Fast</span>
                <span className="trust-label">Join Early Adopters</span>
              </div>
            </div>
          </div>

          {/* HERO RIGHT COLUMN - STUDY AT HOME VISUAL + CARD PREVIEW */}
          <div className="hero-card-preview">
            <div className="hero-visual-container">
              <img 
                src="/images/byu-study-home.jpg" 
                alt="Student studying BYU-Pathway online courses from home with ConnectPay" 
                className="hero-student-photo"
              />
              <div className="hero-floating-badge">
                <div className="hero-badge-left">
                  <div className="home-icon">💳</div>
                  <div className="hero-badge-text">
                    <strong>ConnectPay Virtual Visa Engine</strong>
                    <span>Delivered straight to your @byupathway.edu email</span>
                  </div>
                </div>
                <span className="hero-badge-pill">✓ Instant</span>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <VirtualCardVisualizer
                cardNumber="4124559081239842"
                cardholderName="CONNECTPAY STUDENT"
                expiryDate="08/28"
                cvv="892"
                amountUsd={Number(calcUsd) || 150}
                cardStatus="active"
              />
            </div>
          </div>

        </div>
      </section>

      {/* SUPPORTED LOCAL PAYMENT CHANNELS */}
      <section className="rails-banner-section">
        <div className="container">
          <p className="rails-title">SUPPORTED LOCAL MOBILE MONEY &amp; DIRECT DEBIT CHANNELS</p>
          <div className="rails-grid">
            <div className="rail-badge">🇬🇭 MTN Mobile Money (MoMo)</div>
            <div className="rail-badge">🇬🇭 Telecel Cash (Vodafone)</div>
            <div className="rail-badge">🇬🇭 AT Money (AirtelTigo)</div>
            <div className="rail-badge">⚡ Hubtel Direct Debit Rail</div>
            <div className="rail-badge">💳 Paystack Local Bank Cards</div>
          </div>
        </div>
      </section>

      {/* WHAT CONNECTPAY DOES — 4 CORE ENGINE FEATURES */}
      <section className="connectpay-features-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="hero-pill-badge" style={{ background: 'rgba(0, 46, 93, 0.08)', color: 'var(--cp-navy)', borderColor: 'rgba(0, 46, 93, 0.15)' }}>
              <span>🚀</span> What ConnectPay Does
            </div>
            <h2 className="section-title">The Complete <span className="text-gradient">Student Payment Solution</span></h2>
            <p className="section-subtitle">
              ConnectPay takes the friction out of cross-border university tuition payments by turning local currency deposits into globally accepted USD virtual cards.
            </p>
          </div>

          <div className="features-grid-4">
            
            {/* Feature 1: Mobile Money Integration */}
            <div className="cp-feature-card">
              <div className="cp-feature-icon blue-bg">📱</div>
              <h3>1. Pay with Local MoMo</h3>
              <p>
                No dollar account or foreign bank needed. Enter your Ghana Mobile Money number and approve the prompt on your phone via Hubtel.
              </p>
              <span className="cp-feature-tag">✓ MTN • Telecel • AT</span>
            </div>

            {/* Feature 2: Instant Virtual Card Issuing */}
            <div className="cp-feature-card gold">
              <div className="cp-feature-icon gold-bg">💳</div>
              <h3>2. Instant Virtual USD Card</h3>
              <p>
                ConnectPay generates an authentic 16-digit Visa card with CVV and expiry loaded with your exact tuition amount in USD.
              </p>
              <span className="cp-feature-tag">✓ Automated in &lt; 5 Mins</span>
            </div>

            {/* Feature 3: Automated Secure Delivery */}
            <div className="cp-feature-card green">
              <div className="cp-feature-icon green-bg">📧</div>
              <h3>3. Delivered to Your Email</h3>
              <p>
                Your card credentials land directly in your authenticated <code>@byupathway.edu</code> inbox and your personal student dashboard.
              </p>
              <span className="cp-feature-tag">✓ Encrypted Dispatch</span>
            </div>

            {/* Feature 4: Fraud & Expiry Protection */}
            <div className="cp-feature-card blue">
              <div className="cp-feature-icon cyan-bg">🛡️</div>
              <h3>4. Expiry &amp; Fund Shield</h3>
              <p>
                Each card features a temporary 4–6 hour lifecycle so your balance is shielded from unauthorized charges and unexpected recurring debits.
              </p>
              <span className="cp-feature-tag">✓ Fraud-Proof Lifecycle</span>
            </div>

          </div>
        </div>
      </section>

      {/* LIVE TUITION FX CALCULATOR & INTERACTIVE CARD SPOTLIGHT */}
      <section className="calculator-showcase-section">
        <div className="container calculator-grid">
          
          {/* Calculator Box */}
          <div className="calculator-card-box">
            <div className="calc-title-row">
              <h3>Live Tuition Calculator</h3>
              <span className="calc-rate-badge">1 USD = {rates.GHS.toFixed(2)} GHS</span>
            </div>

            <div className="calc-input-group">
              <label>Tuition Fee (USD):</label>
              <div className="calc-input-wrapper">
                <span>$</span>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={calcUsd}
                  onChange={(e) => setCalcUsd(Math.max(1, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className="calc-breakdown">
              <div className="breakdown-row">
                <span>Tuition Cost in Cedis:</span>
                <span>GHS {ghsBaseAmount.toFixed(2)}</span>
              </div>
              <div className="breakdown-row">
                <span>Payment Processing Buffer (5%):</span>
                <span>GHS {ghsFeeAmount.toFixed(2)}</span>
              </div>
              <div className="breakdown-row total">
                <span>Total Mobile Money Debit:</span>
                <strong>GHS {ghsTotalAmount.toFixed(2)}</strong>
              </div>
            </div>

            <Link 
              to="/request" 
              className="btn btn-hero-primary" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Get Virtual Card for ${calcUsd} USD →
            </Link>
          </div>

          {/* Visual Showcase Box */}
          <div className="calc-right-text">
            <div className="hero-pill-badge" style={{ background: 'rgba(0, 46, 93, 0.06)', color: 'var(--cp-navy)', borderColor: 'rgba(0, 46, 93, 0.12)', marginBottom: '1rem' }}>
              <span>🇬🇭</span> Built for BYU-Pathway Worldwide Ghana Students
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cp-navy)', lineHeight: 1.2, marginBottom: '1.25rem' }}>Say Goodbye to Bank Queues &amp; Foreign Card Declines</h2>
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.65, marginBottom: '1rem' }}>
              Traditional Ghanaian debit and savings cards frequently decline on the BYU-Pathway portal due to bank foreign exchange restrictions.
            </p>
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              <strong style={{ color: 'var(--cp-navy)' }}>ConnectPay is your direct gateway:</strong> Dedicated, single-use USD Virtual Visa cards that are accepted on BYU-Pathway Worldwide's official payment system — funded entirely from your Ghana Mobile Money wallet.
            </p>
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '0.85rem 1.15rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.88rem', color: '#065f46', fontWeight: 700 }}>📈 Adoption is growing — be part of the early cohort making tuition payment seamless for Ghana BYU-Pathway students.</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-hero-secondary" style={{ background: 'var(--cp-navy)', color: '#ffffff', border: 'none' }}>
                Create Student Account
              </Link>
              <Link to="/faq" className="btn btn-hero-secondary" style={{ background: 'transparent', color: 'var(--cp-navy)', borderColor: 'var(--cp-border)' }}>
                Read Payment FAQs
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* WHY CHOOSE CONNECTPAY VS TRADITIONAL BANKS */}
      <section className="comparison-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="hero-pill-badge" style={{ background: 'rgba(0, 46, 93, 0.08)', color: 'var(--cp-navy)' }}>
              <span>⚖️</span> Why ConnectPay?
            </div>
            <h2 className="section-title">ConnectPay vs <span className="text-gradient">Traditional Banking</span></h2>
            <p className="section-subtitle">
              See why over 1,200 Ghanaian students choose ConnectPay over traditional bank foreign exchange options.
            </p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="col-connectpay">ConnectPay Platform</th>
                  <th className="col-banks">Traditional Bank Cards</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Payment Source</td>
                  <td className="col-connectpay">✅ 100% Mobile Money (MTN, Telecel, AT)</td>
                  <td className="col-banks">❌ Requires Foreign Currency / Domiciliary Account</td>
                </tr>
                <tr>
                  <td>Speed of Card Delivery</td>
                  <td className="col-connectpay">✅ Instant (2 to 5 minutes)</td>
                  <td className="col-banks">❌ 3 to 7 business days</td>
                </tr>
                <tr>
                  <td>BYU Portal Acceptance</td>
                  <td className="col-connectpay">✅ 100% Accepted on my.byupathway.edu</td>
                  <td className="col-banks">⚠️ High failure &amp; decline rate</td>
                </tr>
                <tr>
                  <td>Local Student Support</td>
                  <td className="col-connectpay">✅ Dedicated Ghana WhatsApp &amp; Live Chat</td>
                  <td className="col-banks">❌ Long queues &amp; generic branch desk</td>
                </tr>
                <tr>
                  <td>Account Maintenance Fees</td>
                  <td className="col-connectpay">✅ Zero Monthly Maintenance Fees</td>
                  <td className="col-banks">❌ Monthly dollar card maintenance charges</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5-STEP SIMPLE PAYMENT TIMELINE */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="hero-pill-badge" style={{ background: 'rgba(0, 46, 93, 0.08)', color: 'var(--cp-navy)' }}>
              <span>⚙️</span> How It Works
            </div>
            <h2 className="section-title">Pay Your Tuition in <span className="text-gradient">5 Simple Steps</span></h2>
            <p className="section-subtitle">From your local Mobile Money wallet to your official university enrollment</p>
          </div>

          <div className="timeline-grid">
            <div className="timeline-step">
              <div className="step-circle">1</div>
              <h4>Register</h4>
              <p>Sign up with your BYU Student ID and @byupathway.edu email.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">2</div>
              <h4>Request Card</h4>
              <p>Enter the exact USD fee amount listed on your student portal.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">3</div>
              <h4>Pay with MoMo</h4>
              <p>Approve your local Cedis debit (MTN, Telecel, AT) via Hubtel.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">4</div>
              <h4>Receive Card</h4>
              <p>ConnectPay generates and delivers your USD Virtual Visa details.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">5</div>
              <h4>Confirm Fees</h4>
              <p>Enter the card on my.byupathway.edu to finalize enrollment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* REAL STUDENT TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="hero-pill-badge" style={{ marginBottom: '0.75rem', background: 'rgba(0, 46, 93, 0.06)', color: 'var(--cp-navy)' }}>
              <span>💬</span> Early Student Experiences
            </div>
            <h2 className="section-title">Real Feedback from <span className="text-gradient">BYU-Pathway Students</span></h2>
            <p className="section-subtitle">Hear directly from students who used ConnectPay to pay their BYU-Pathway tuition fees</p>
          </div>

          <div className="testimonials-grid">
            
            {/* Story 1 */}
            <div className="testimonial-card">
              <div className="quote-stars">★★★★★</div>
              <p className="testimonial-text">
                "My local bank debit card kept getting declined on the BYU portal. With ConnectPay, I used my MTN MoMo wallet, received a USD Virtual Card in 5 minutes, and paid my semester fees with zero stress!"
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
                "ConnectPay is a lifesaver for students in Kumasi. The WhatsApp support desk answered my question within 2 minutes, and the card credentials were emailed straight to my @byupathway.edu inbox."
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
                "The live calculator shows the exact Cedis amount and fees upfront before you pay. The Hubtel prompt appeared on my phone immediately, and my virtual card was ready on my dashboard instantly."
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

      {/* FOOTER DISCLAIMER */}
      <section style={{ paddingBottom: '3rem', paddingTop: '1rem' }}>
        <div className="container">
          <div className="alert alert-info-modern">
            <span className="info-icon">ℹ️</span>
            <div>
              <strong>Student Community Payment Gateway:</strong> ConnectPay is an independent platform making it easy for BYU-Pathway Worldwide students in Ghana to pay tuition online. Adoption is actively growing — join the community simplifying online education payments.
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
