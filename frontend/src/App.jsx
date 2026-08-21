import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import StudentRegister from './pages/StudentRegister';
import RequestPayment from './pages/RequestPayment';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import VerifyEmail from './pages/VerifyEmail';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import InstallButton from './components/InstallButton';
import OnboardingTour from './components/OnboardingTour';
import WelcomeModal from './components/WelcomeModal';
import HelpButton from './components/HelpButton';
import ProgressTracker from './components/ProgressTracker';
import LiveChat from './components/LiveChat';
import LanguageToggle from './components/LanguageToggle';
import ProtectedRoute from './components/ProtectedRoute';
import ImpersonationBanner from './components/ImpersonationBanner';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { AdminAuthProvider } from './utils/AdminAuthContext';
import { ImpersonationProvider } from './utils/ImpersonationContext';
import './App.css';

function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdminPage = location.pathname.startsWith('/admin');

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/login');
  };

  return (
    <div className="app">
      {/* Impersonation banner — always on top when active */}
      <ImpersonationBanner />

      {!isAdminPage && (
        <>
          <OnboardingTour />
          <WelcomeModal />
          <HelpButton />
          <ProgressTracker />
          <LiveChat />
        </>
      )}

      {!isAdminPage && (
        <nav className="navbar">
          <div className="container">
            <div className="nav-brand">
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2>⚡ ConnectPay</h2>
                <p>West Africa Virtual Card Platform</p>
              </Link>
            </div>

            {/* Hamburger Menu Button */}
            <button
              className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>

            {/* Navigation Links */}
            <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <li><Link to="/" className="home-link" onClick={closeMobileMenu}>Home</Link></li>
              <li><Link to="/faq" className="faq-link" onClick={closeMobileMenu}>FAQ</Link></li>
              <li><Link to="/contact" className="contact-link" onClick={closeMobileMenu}>Contact</Link></li>

              {user ? (
                /* ── LOGGED IN ── */
                <>
                  <li><Link to="/request" className="request-link" onClick={closeMobileMenu}>💳 Request Card</Link></li>
                  <li><Link to="/dashboard" className="dashboard-link" onClick={closeMobileMenu}>📊 Dashboard</Link></li>
                  <li>
                    <div className="nav-user-pill">
                      <span className="nav-user-name">👤 {user.name.split(' ')[0]}</span>
                      <button className="nav-logout-btn" onClick={handleLogout}>Sign Out</button>
                    </div>
                  </li>
                </>
              ) : (
                /* ── LOGGED OUT ── */
                <>
                  <li><Link to="/register" className="register-link" onClick={closeMobileMenu}>Register</Link></li>
                  <li>
                    <Link to="/login" className="nav-login-btn" onClick={closeMobileMenu}>
                      Sign In →
                    </Link>
                  </li>
                </>
              )}

              <li><LanguageToggle currentLang={currentLang} onToggle={setCurrentLang} /></li>
              <li><InstallButton /></li>
            </ul>
          </div>
        </nav>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<StudentRegister />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* ── ADMIN ROUTES ── */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* ── PROTECTED STUDENT ROUTES ── */}
          <Route
            path="/request"
            element={
              <ProtectedRoute>
                <RequestPayment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {!isAdminPage && (
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-links">
                <Link to="/faq">FAQ</Link>
                <span className="footer-divider">•</span>
                <Link to="/contact">Contact</Link>
              </div>
              <p>&copy; 2025 ConnectPay. West Africa Virtual Card Platform.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AdminAuthProvider>
        <ImpersonationProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ImpersonationProvider>
      </AdminAuthProvider>
    </Router>
  );
}

export default App;

