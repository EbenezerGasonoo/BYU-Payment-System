import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function OnboardingTour() {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const tourSteps = [
    {
      title: '👋 Quick Tour',
      message: 'Let us show you how to get your virtual card!',
      target: null,
      action: null,
      position: 'center'
    },
    {
      title: '1️⃣ Register',
      message: 'Create your account with BYU ID',
      target: 'register-link',
      action: () => navigate('/register'),
      position: 'bottom',
      route: '/register'
    },
    {
      title: '2️⃣ Request Card',
      message: 'Submit a request with the amount you need',
      target: 'request-link',
      action: () => navigate('/request'),
      position: 'bottom',
      route: '/request'
    },
    {
      title: '3️⃣ Check Dashboard',
      message: 'Track your request and view card details',
      target: 'dashboard-link',
      action: () => navigate('/dashboard'),
      position: 'bottom',
      route: '/dashboard'
    },
    {
      title: '✅ Done!',
      message: 'You\'ll get an email when your card is ready (valid 4-6 hours).',
      target: null,
      action: () => navigate('/'),
      position: 'center'
    }
  ];

  // The tour only opens on request (WelcomeModal "take a quick tour" or the help button),
  // so first-time visitors don't get two popups stacked on top of each other.

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Navigate if there's an action
      if (tourSteps[nextStep].action) {
        tourSteps[nextStep].action();
      }
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      
      if (tourSteps[prevStep].action) {
        tourSteps[prevStep].action();
      }
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setShowTour(false);
    setCurrentStep(0);
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenTour', 'true');
    setShowTour(false);
    setCurrentStep(0);
    navigate('/');
  };

  const handleRestart = () => {
    localStorage.removeItem('hasSeenTour');
    setCurrentStep(0);
    setShowTour(true);
    navigate('/');
  };

  // Add restart button to window for easy access
  useEffect(() => {
    window.restartTour = handleRestart;
  }, []);

  if (!showTour) return null;

  const step = tourSteps[currentStep];
  const isCenter = step.position === 'center';

  return (
    <>
      {/* Overlay */}
      <div className="tour-overlay" onClick={handleSkip}></div>

      {/* Tour Card */}
      <div className={`tour-card ${isCenter ? 'tour-center' : 'tour-positioned'}`}>
        <div className="tour-header">
          <div className="tour-progress">
            <span className="tour-step-count">
              Step {currentStep + 1} of {tourSteps.length}
            </span>
            <div className="tour-progress-bar">
              <div 
                className="tour-progress-fill"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>
          <button className="tour-close" onClick={handleSkip} title="Skip tour">
            ✕
          </button>
        </div>

        <div className="tour-content">
          <h2 className="tour-title">{step.title}</h2>
          <p className="tour-message">{step.message}</p>
        </div>

        <div className="tour-footer">
          <button 
            className="tour-btn tour-btn-secondary" 
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            ← Previous
          </button>
          
          <div className="tour-dots">
            {tourSteps.map((_, index) => (
              <span 
                key={index}
                className={`tour-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>

          <button 
            className="tour-btn tour-btn-primary" 
            onClick={handleNext}
          >
            {currentStep === tourSteps.length - 1 ? 'Finish 🎉' : 'Next →'}
          </button>
        </div>
      </div>

      {/* Spotlight highlight for targeted elements */}
      {step.target && (
        <style dangerouslySetInnerHTML={{
          __html: `
            .${step.target} {
              position: relative;
              z-index: 10001 !important;
              animation: tourPulse 2s ease-in-out infinite;
            }
            @keyframes tourPulse {
              0%, 100% {
                box-shadow: 0 0 0 0 rgba(255, 184, 28, 0.7);
              }
              50% {
                box-shadow: 0 0 0 15px rgba(255, 184, 28, 0);
              }
            }
          `
        }} />
      )}
    </>
  );
}

export default OnboardingTour;

// Export restart function for use in other components
export function restartOnboarding() {
  if (window.restartTour) {
    window.restartTour();
  }
}

