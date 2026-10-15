import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

export function BrandMark({ size = 28 }) {
  return (
    <span className="cp-brand__mark" style={{ width: size, height: size }} aria-hidden="true">
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6.2L13.5 2Z" fill="#E8A317" />
      </svg>
    </span>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Close the mobile menu whenever the route changes
  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const links = user
    ? [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/request', label: 'Request a card' },
        { to: '/faq', label: 'FAQ' },
        { to: '/contact', label: 'Help' }
      ]
    : [
        { to: '/#how-it-works', label: 'How it works' },
        { to: '/#fees', label: 'Fees' },
        { to: '/faq', label: 'FAQ' },
        { to: '/contact', label: 'Contact' }
      ];

  return (
    <header className={`cp-header ${open ? 'is-open' : ''}`}>
      <div className="cp-container cp-header__inner">
        <Link to="/" className="cp-brand">
          <BrandMark />
          ConnectPay
        </Link>

        <nav className="cp-nav" aria-label="Main">
          {links.map((link) =>
            link.to.includes('#') ? (
              <Link key={link.to} to={link.to}>{link.label}</Link>
            ) : (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {link.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="cp-header__actions">
          {user ? (
            <>
              <span className="cp-header__user">{user.name.split(' ')[0]}</span>
              <button type="button" className="cp-btn cp-btn--secondary" onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="cp-btn cp-btn--ghost">Sign in</Link>
              <Link to="/register" className="cp-btn cp-btn--primary">Create account</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="cp-menu-btn"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      <div className="cp-mobile">
        <div className="cp-container">
          {links.map((link) => <Link key={link.to} to={link.to}>{link.label}</Link>)}
          <div className="cp-mobile__actions">
            {user ? (
              <button type="button" className="cp-btn cp-btn--secondary cp-btn--block" onClick={handleSignOut}>
                Sign out ({user.name.split(' ')[0]})
              </button>
            ) : (
              <>
                <Link to="/register" className="cp-btn cp-btn--primary cp-btn--block">Create account</Link>
                <Link to="/login" className="cp-btn cp-btn--secondary cp-btn--block">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
