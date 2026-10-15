import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="cp-auth">
      <div className="cp-auth__card">
        <span className="cp-eyebrow">404</span>
        <h1 className="cp-h2">Page not found</h1>
        <p style={{ marginTop: 12 }}>The page you were looking for does not exist or has moved.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <Link to="/" className="cp-btn cp-btn--primary">Go to home</Link>
          <Link to="/contact" className="cp-btn cp-btn--secondary">Contact support</Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
