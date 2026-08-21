import { useNavigate } from 'react-router-dom';
import { useImpersonation } from '../utils/ImpersonationContext';
import { useAuth } from '../utils/AuthContext';

/**
 * Floating banner shown at the very top of the page when an admin
 * is impersonating a student for demo purposes.
 */
export default function ImpersonationBanner() {
  const { isImpersonating, impersonated, stopImpersonating } = useImpersonation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  const handleExit = () => {
    // Clear the injected student auth
    logout();
    stopImpersonating();
    navigate('/admin');
  };

  return (
    <div className="impersonation-banner" role="alert">
      <div className="imp-banner-inner">
        <div className="imp-banner-left">
          <span className="imp-icon" aria-hidden="true">🎭</span>
          <span className="imp-label">DEMO MODE</span>
          <span className="imp-divider">—</span>
          <span className="imp-name">
            Impersonating <strong>{impersonated.name}</strong>
          </span>
          <span className="imp-id-badge">BYU ID: {impersonated.byuId}</span>
        </div>
        <button
          className="imp-exit-btn"
          onClick={handleExit}
          id="exit-impersonation-btn"
        >
          ✕ Exit Impersonation
        </button>
      </div>
    </div>
  );
}
