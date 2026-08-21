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
          <span className="live-dot"></span> LIVE BYU-PATHWAY TUITION FX:
        </div>
        <div className="ticker-track">
          <span className="ticker-item">🇬🇭 1 USD = <strong>{rates.GHS.toFixed(2)} GHS</strong></span>
          <span className="ticker-item">🇳🇬 1 USD = <strong>{rates.NGN.toFixed(2)} NGN</strong></span>
          <span className="ticker-item">🇨🇮 1 USD = <strong>{rates.XOF.toFixed(2)} XOF</strong></span>
          <span className="ticker-item">🇱🇷 1 USD = <strong>{rates.LRD.toFixed(2)} LRD</strong></span>
          <span className="ticker-item">🇸🇱 1 USD = <strong>{rates.SLE.toFixed(2)} SLE</strong></span>
        </div>
      </div>

      {/* HERO SECTION — HIGHER EDUCATION THAT FITS YOUR LIFE */}
      <section className="hero-modern-section">
        <div className="hero-mesh-overlay"></div>
        <div className="container hero-grid">
          
          {/* HERO LEFT COLUMN */}
          <div className="hero-text-content">
            <div className="hero-pill-badge">
              <span className="badge-icon">🎓</span> BYU-Pathway Worldwide • Ghana Student Payment Desk
            </div>
            
            <h1 className="hero-main-title">
              Higher Education That <span className="text-gradient">Fits Your Life</span> — Funded from Home
            </h1>
            
            <p className="hero-description">
              Earn spiritually-based, accredited online certificates and degrees from <strong>BYU-Idaho</strong> and <strong>Ensign College</strong> right from your home in Ghana. ConnectPay enables instant tuition fee payments directly using local Mobile Money (MTN MoMo, Telecel Cash, AT).
            </p>

            <div className="hero-cta-group">
              <Link to="/request" className="btn btn-hero-primary">
                💳 Request Virtual Card <span className="arrow-icon">→</span>
              </Link>
              <Link to="/register" className="btn btn-hero-secondary">
                👤 Student Register
              </Link>
            </div>

            {/* TRUST METRICS */}
            <div className="hero-trust-metrics">
              <div className="trust-item">
                <span className="trust-number">🏠 100% Online</span>
                <span className="trust-label">Study from Home</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <span className="trust-number">📜 BYU-Idaho</span>
                <span className="trust-label">&amp; Ensign Degrees</span>
              </div>
              <div className="trust-divider"></div>
              <div className="trust-item">
                <span className="trust-number">⚡ MTN MoMo</span>
                <span className="trust-label">Direct Ghana Payment</span>
              </div>
            </div>
          </div>

          {/* HERO RIGHT COLUMN - STUDY AT HOME VISUAL */}
          <div className="hero-card-preview">
            <div className="hero-visual-container">
              <img 
                src="/images/byu-study-home.jpg" 
                alt="Student studying BYU-Pathway online courses from home in Ghana" 
                className="hero-student-photo"
              />
              <div className="hero-floating-badge">
                <div className="hero-badge-left">
                  <div className="home-icon">🏠</div>
                  <div className="hero-badge-text">
                    <strong>Online Learning at Home</strong>
                    <span>Flexible coursework that fits work &amp; family</span>
                  </div>
                </div>
                <span className="hero-badge-pill">✓ Ghana Cohort</span>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <VirtualCardVisualizer
                cardNumber="4124559081239842"
                cardholderName="BYU-PATHWAY STUDENT"
                expiryDate="08/28"
                cvv="892"
                amountUsd={150.00}
                cardStatus="active"
              />
            </div>
          </div>

        </div>
      </section>

      {/* SUPPORTED LOCAL PAYMENT CHANNELS */}
      <section className="rails-banner-section">
        <div className="container">
          <p className="rails-title">SUPPORTED LOCAL MOBILE MONEY &amp; CARD SETTLEMENT CHANNELS</p>
          <div className="rails-grid">
            <div className="rail-badge">🇬🇭 MTN Mobile Money (MoMo)</div>
            <div className="rail-badge">🇬🇭 Telecel Cash (Vodafone)</div>
            <div className="rail-badge">🇬🇭 AT Money (AirtelTigo)</div>
            <div className="rail-badge">⚡ Hubtel Direct Debit Gateway</div>
            <div className="rail-badge">💳 Paystack Local Bank Cards</div>
          </div>
        </div>
      </section>

      {/* 3 PILLARS OF BYU-PATHWAY WORLDWIDE */}
      <section className="byu-pillars-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="hero-pill-badge" style={{ background: 'rgba(0, 46, 93, 0.08)', color: 'var(--cp-navy)', borderColor: 'rgba(0, 46, 93, 0.15)' }}>
              <span>🌟</span> The BYU-Pathway Model
            </div>
            <h2 className="section-title">An Education Built for <span className="text-gradient">Your Success &amp; Discipleship</span></h2>
            <p className="section-subtitle">
              BYU-Pathway Worldwide combines low-cost online learning with gospel-centered support to help students throughout Ghana build self-reliance and career skills.
            </p>
          </div>

          <div className="pillars-grid">
            
            {/* Pillar 1: Online Learning from Home */}
            <div className="pillar-card">
              <div className="pillar-icon-box blue-bg">💻</div>
              <h3>100% Online Degrees</h3>
              <p>
                Complete your courses anytime, anywhere in Ghana. Coursework is delivered entirely online in partnership with <strong>BYU-Idaho</strong> and <strong>Ensign College</strong>, designed to fit around your work and family commitments.
              </p>
              <span className="pillar-tag">✓ Certificate-First Curriculum</span>
            </div>

            {/* Pillar 2: Weekly Gatherings */}
            <div className="pillar-card gold">
              <div className="pillar-icon-box gold-bg">🤝</div>
              <h3>Weekly Gatherings</h3>
              <p>
                Connect weekly with fellow Ghanaian students at local Institute gathering centers (Accra, Kumasi, Cape Coast, Takoradi, Sunyani) or virtual cohorts for faith-filled collaboration, spiritual growth, and academic teamwork.
              </p>
              <span className="pillar-tag">✓ Local Fellowship &amp; Mentorship</span>
            </div>

            {/* Pillar 3: Accessible & Low-Cost Tuition */}
            <div className="pillar-card emerald">
              <div className="pillar-icon-box green-bg">💰</div>
              <h3>Affordable Tuition in MoMo</h3>
              <p>
                Tuition rates are significantly discounted for West Africa with Heber J. Grant scholarships. ConnectPay eliminates foreign card barriers by letting you pay semester tuition directly in Cedis via Mobile Money.
              </p>
              <span className="pillar-tag">✓ Instant USD Virtual Card</span>
            </div>

          </div>
        </div>
      </section>

      {/* GATHERING CENTER & COMMUNITY FEATURE */}
      <section className="gathering-section">
        <div className="container gathering-grid">
          
          <div className="gathering-img-box">
            <img 
              src="/images/byu-gathering.jpg" 
              alt="Weekly BYU-Pathway student gathering in Ghana institute" 
              className="gathering-img"
            />
            <div className="gathering-floating-tag">
              🇬🇭 Accra &amp; Kumasi Gathering Centers • Weekly Student Cohorts
            </div>
          </div>

          <div className="gathering-text">
            <div className="hero-pill-badge" style={{ background: 'rgba(0, 46, 93, 0.06)', color: 'var(--cp-navy)', borderColor: 'rgba(0, 46, 93, 0.12)', marginBottom: '1rem' }}>
              <span>🤝</span> Community &amp; Fellowship
            </div>
            <h2>More Than an Online Class — A Gathering of Disciples</h2>
            <p>
              In BYU-Pathway Worldwide, students in Ghana gather every week in local meetinghouses and online groups to discuss lessons, practice English and professional skills, and strengthen one another in the gospel of Jesus Christ.
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--cp-muted)' }}>
              ConnectPay ensures that financial and cross-border currency hurdles never stop you from attending gatherings and registering for your next semester block.
            </p>

            <div className="gathering-locations-list">
              <div className="gathering-location-badge">📍 Accra Gathering Center</div>
              <div className="gathering-location-badge">📍 Kumasi Gathering Hub</div>
              <div className="gathering-location-badge">📍 Takoradi Gathering Center</div>
              <div className="gathering-location-badge">📍 Cape Coast Center</div>
            </div>

            <Link to="/request" className="btn btn-hero-primary" style={{ display: 'inline-flex' }}>
              Fund Your Next Semester →
            </Link>
          </div>

        </div>
      </section>

      {/* CERTIFICATE-FIRST DEGREE PROGRAMS */}
      <section className="degrees-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="hero-pill-badge" style={{ background: 'rgba(0, 46, 93, 0.08)', color: 'var(--cp-navy)' }}>
              <span>📜</span> Certificate-First Career Pathways
            </div>
            <h2 className="section-title">Start with a Certificate, <span className="text-gradient">Finish with a Degree</span></h2>
            <p className="section-subtitle">
              Earn employable credentials in your very first year (5 courses) that stack into full Associate and Bachelor's degrees awarded by BYU-Idaho and Ensign College.
            </p>
          </div>

          <div className="degrees-grid">
            
            <div className="degree-card">
              <div className="degree-icon">💻</div>
              <h3>Applied Technology &amp; IT</h3>
              <p>Software development, web and computer programming, system administration, and technical support.</p>
              <div className="degree-partner">Awarded by BYU-Idaho</div>
            </div>

            <div className="degree-card">
              <div className="degree-icon">📊</div>
              <h3>Business &amp; Entrepreneurship</h3>
              <p>Business administration, accounting fundamentals, digital marketing, and project management.</p>
              <div className="degree-partner">Awarded by BYU-Idaho</div>
            </div>

            <div className="degree-card">
              <div className="degree-icon">🏥</div>
              <h3>Health &amp; Community Care</h3>
              <p>Community health administration, health data management, and public health coordination.</p>
              <div className="degree-partner">Awarded by BYU-Idaho</div>
            </div>

            <div className="degree-card">
              <div className="degree-icon">🛡️</div>
              <h3>Professional Communication</h3>
              <p>Workplace leadership, professional writing, organizational communication, and public speaking.</p>
              <div className="degree-partner">Awarded by Ensign College</div>
            </div>

          </div>
        </div>
      </section>

      {/* REAL STUDENT STORIES FROM GHANA GATHERING CENTERS */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header text-center">
            <div className="hero-pill-badge" style={{ marginBottom: '0.75rem', background: 'rgba(0, 46, 93, 0.06)', color: 'var(--cp-navy)' }}>
              <span>💬</span> Student Success Stories
            </div>
            <h2 className="section-title">Voices from <span className="text-gradient">Ghanaian Students</span></h2>
            <p className="section-subtitle">Hear how students in Accra, Kumasi, and Takoradi pay for their online degrees</p>
          </div>

          <div className="testimonials-grid">
            
            {/* Story 1 */}
            <div className="testimonial-card">
              <div className="quote-stars">★★★★★</div>
              <p className="testimonial-text">
                "Studying online from home while working in Accra was made possible through BYU-Pathway. But paying in USD was hard until ConnectPay. I used MTN MoMo, got my virtual card in 10 minutes, and registered on my.byupathway.edu immediately!"
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
                "The weekly gatherings in Kumasi gave me friends and spiritual strength. When tuition deadlines approached, ConnectPay made paying so easy without needing an international bank card. Abena on WhatsApp was so helpful!"
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
                "Hubtel Mobile Money direct debit was fast and simple. I approved the prompt on my phone in Takoradi, and the virtual card details arrived in my @byupathway.edu inbox within 5 minutes. Perfect platform for students."
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

      {/* 5-STEP SIMPLE PAYMENT TIMELINE */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-header text-center">
            <h2 className="section-title">How to Pay Your <span className="text-gradient">BYU-Pathway Tuition</span></h2>
            <p className="section-subtitle">5 simple steps from your Mobile Money wallet to your official university ledger</p>
          </div>

          <div className="timeline-grid">
            <div className="timeline-step">
              <div className="step-circle">1</div>
              <h4>Register Account</h4>
              <p>Sign up with your BYU Student ID and @byupathway.edu email.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">2</div>
              <h4>Request Virtual Card</h4>
              <p>Enter the exact USD tuition amount listed on your student portal.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">3</div>
              <h4>Pay in Ghana Cedis</h4>
              <p>Approve your local MoMo debit (MTN, Telecel, AT) via Hubtel.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">4</div>
              <h4>Receive USD Card</h4>
              <p>Instant virtual Visa card credentials delivered to your inbox.</p>
            </div>
            <div className="timeline-step">
              <div className="step-circle">5</div>
              <h4>Complete Enrollment</h4>
              <p>Enter the card on my.byupathway.edu to confirm your semester courses.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER DISCLAIMER */}
      <section className="container disclaimer-banner" style={{ paddingBottom: '3rem' }}>
        <div className="alert alert-info-modern">
          <span className="info-icon">ℹ️</span>
          <div>
            <strong>Student Community Payment Gateway:</strong> ConnectPay is designed to support BYU-Pathway Worldwide students across Ghana and West Africa in completing their course payments seamlessly. Degrees and certificates are awarded directly by BYU-Idaho and Ensign College.
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
