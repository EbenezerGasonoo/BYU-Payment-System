import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🧭</div>
      <h1 style={{ marginBottom: '0.75rem' }}>Page not found</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>
        The page you were looking for doesn't exist or has moved.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary">Go to Home</Link>
        <Link to="/contact" className="btn btn-secondary">Contact Support</Link>
      </div>
    </div>
  );
}

export default NotFound;
