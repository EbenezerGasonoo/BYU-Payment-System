import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WelcomeModal() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisited');
    
    if (!hasVisited) {
      setTimeout(() => setShow(true), 500);
    }
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem('hasVisited', 'true');
    setShow(false);
    navigate('/register');
  };

  const handleTakeTour = () => {
    localStorage.setItem('hasVisited', 'true');
    setShow(false);
    if (window.restartTour) {
      window.restartTour();
    }
  };

  const handleClose = () => {
    localStorage.setItem('hasVisited', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <button className="welcome-close" onClick={handleClose} title="Close">✕</button>
        
        <div className="welcome-header">
          <div className="welcome-icon">🎓</div>
          <h1>Welcome!</h1>
          <p className="welcome-subtitle">Get your virtual card in 3 easy steps</p>
        </div>

        <div className="welcome-body">
          <div className="welcome-step">
            <span className="welcome-step-number">1</span>
            <span className="welcome-step-text">Register with your BYU ID</span>
          </div>

          <div className="welcome-step">
            <span className="welcome-step-number">2</span>
            <span className="welcome-step-text">Request a virtual card</span>
          </div>

          <div className="welcome-step">
            <span className="welcome-step-number">3</span>
            <span className="welcome-step-text">Get card details via email</span>
          </div>
        </div>

        <div className="welcome-footer">
          <button className="welcome-btn welcome-btn-primary" onClick={handleGetStarted}>
            Get Started →
          </button>
          <button className="welcome-btn welcome-btn-text" onClick={handleTakeTour}>
            or take a quick tour
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeModal;

