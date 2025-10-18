import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <div className="hero">
        <h1>Welcome to BYU Pathway Ghanaian Students School Fees Virtual Card Payment System</h1>
        <p className="subtitle">
          A secure platform for Ghanaian students to access virtual payment cards for school fees
        </p>

        <div className="features">
          <div className="feature-card">
            <div className="feature-icon">👤</div>
            <h3>Register</h3>
            <p>Create your student account with BYU ID and contact details</p>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Request Card</h3>
            <p>Submit a request for a virtual card to pay your school fees</p>
            <Link to="/request" className="btn btn-primary">Request Now</Link>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Status</h3>
            <p>Monitor your card requests and view assigned card details</p>
            <Link to="/dashboard" className="btn btn-primary">View Dashboard</Link>
          </div>
        </div>

        <div className="info-section">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <span className="step-number">1</span>
              <h4>Register</h4>
              <p>Create your account with your BYU ID and contact information</p>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <h4>Request Virtual Card</h4>
              <p>Submit a request specifying the amount you need to pay</p>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <h4>Admin Approval</h4>
              <p>Admin receives notification and assigns a virtual card to your request</p>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <h4>Receive Card Details</h4>
              <p>Get card number, expiry, and CVV via email (valid for 12 hours)</p>
            </div>
            <div className="step">
              <span className="step-number">5</span>
              <h4>Make Payment</h4>
              <p>Use the virtual card to pay your school fees securely</p>
            </div>
          </div>
        </div>

        <div className="alert alert-info">
          <strong>Note:</strong> This platform is not officially affiliated with the school but a project created by a student to help make payment easier for fellow students. Virtual cards expire automatically after 4-6 hours.
        </div>
      </div>
    </div>
  );
}

export default Home;

