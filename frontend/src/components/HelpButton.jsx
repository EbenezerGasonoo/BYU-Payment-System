import { useState } from 'react';
import { Link } from 'react-router-dom';
import { restartOnboarding } from './OnboardingTour';

function HelpButton() {
  const [showMenu, setShowMenu] = useState(false);

  const handleRestartTour = () => {
    console.log('Restart tour clicked');
    setShowMenu(false);
    restartOnboarding();
  };

  const handleResetVisit = () => {
    console.log('Reset visit clicked');
    localStorage.removeItem('hasVisited');
    localStorage.removeItem('hasSeenTour');
    window.location.reload();
  };

  return (
    <div className="help-button-container">
      <button 
        className="help-button"
        onClick={() => {
          console.log('Help button clicked, showMenu:', showMenu);
          setShowMenu(!showMenu);
        }}
        title="Need help?"
      >
        <span className="help-icon">?</span>
      </button>

      {showMenu && (
        <>
          <div className="help-backdrop" onClick={() => setShowMenu(false)}></div>
          <div className="help-menu">
            <button onClick={handleRestartTour} className="help-menu-item">
              🎯 Restart Tour
            </button>
            <button onClick={handleResetVisit} className="help-menu-item">
              🔄 Show Welcome Screen
            </button>
            <Link to="/faq" className="help-menu-item" onClick={() => {
              console.log('FAQ clicked');
              setShowMenu(false);
            }}>
              ❓ View FAQ
            </Link>
            <Link to="/contact" className="help-menu-item" onClick={() => {
              console.log('Contact clicked');
              setShowMenu(false);
            }}>
              💬 Contact Support
            </Link>
            <div className="help-menu-divider"></div>
            <div className="help-menu-info">
              <small>💡 We're here to help!</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default HelpButton;

