import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ProgressTracker() {
  const [progress, setProgress] = useState({
    registered: false,
    requested: false,
    viewed: false
  });
  const [show, setShow] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check progress
    const registered = localStorage.getItem('hasRegistered') === 'true';
    const requested = localStorage.getItem('hasRequestedCard') === 'true';
    const viewed = localStorage.getItem('hasViewedDashboard') === 'true';

    setProgress({ registered, requested, viewed });

    // Only show if user has started but not completed all steps
    if ((registered || requested) && !viewed) {
      setShow(true);
    }

    // Hide on certain routes
    if (location.pathname === '/admin' || location.pathname === '/') {
      setShow(false);
    }
  }, [location]);

  if (!show) return null;

  const completedSteps = Object.values(progress).filter(Boolean).length;
  const totalSteps = 3;
  const percentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="progress-indicator">
      <button 
        className="progress-close"
        onClick={() => setShow(false)}
        title="Hide progress"
      >
        ✕
      </button>
      
      <h4>🎯 Your Progress</h4>
      
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${percentage}%` }}>
          <span className="progress-percentage">{Math.round(percentage)}%</span>
        </div>
      </div>

      <div className="progress-steps">
        <div className={`progress-step ${progress.registered ? 'completed' : ''}`}>
          <span className="progress-step-icon">
            {progress.registered ? '✅' : '○'}
          </span>
          <span>Register Account</span>
        </div>

        <div className={`progress-step ${progress.requested ? 'completed' : progress.registered ? 'active' : ''}`}>
          <span className="progress-step-icon">
            {progress.requested ? '✅' : progress.registered ? '👉' : '○'}
          </span>
          <span>Request Card</span>
        </div>

        <div className={`progress-step ${progress.viewed ? 'completed' : progress.requested ? 'active' : ''}`}>
          <span className="progress-step-icon">
            {progress.viewed ? '✅' : progress.requested ? '👉' : '○'}
          </span>
          <span>Check Dashboard</span>
        </div>
      </div>

      {completedSteps === totalSteps && (
        <div className="progress-complete">
          🎉 All steps completed!
        </div>
      )}
    </div>
  );
}

export default ProgressTracker;


