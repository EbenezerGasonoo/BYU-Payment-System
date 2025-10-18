import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StudentRegister from './pages/StudentRegister';
import RequestPayment from './pages/RequestPayment';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import InstallButton from './components/InstallButton';
import OnboardingTour from './components/OnboardingTour';
import WelcomeModal from './components/WelcomeModal';
import HelpButton from './components/HelpButton';
import ProgressTracker from './components/ProgressTracker';
import LiveChat from './components/LiveChat';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <OnboardingTour />
        <WelcomeModal />
        <HelpButton />
        <ProgressTracker />
        <LiveChat />
        
        <nav className="navbar">
          <div className="container">
            <div className="nav-brand">
              <h2>🎓 BYU Pathway Ghana</h2>
              <p>Virtual Card Payment System</p>
            </div>
            <ul className="nav-links">
              <li><Link to="/" className="home-link">Home</Link></li>
              <li><Link to="/register" className="register-link">Register</Link></li>
              <li><Link to="/request" className="request-link">Request Card</Link></li>
              <li><Link to="/dashboard" className="dashboard-link">Dashboard</Link></li>
              <li><Link to="/faq" className="faq-link">FAQ</Link></li>
              <li><Link to="/contact" className="contact-link">Contact</Link></li>
              <li><Link to="/admin" className="admin-link">Admin</Link></li>
              <li><InstallButton /></li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<StudentRegister />} />
            <Route path="/request" element={<RequestPayment />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-links">
                <Link to="/faq">FAQ</Link>
                <span className="footer-divider">•</span>
                <Link to="/contact">Contact</Link>
                <span className="footer-divider">•</span>
                <Link to="/admin">Admin</Link>
              </div>
              <p>&copy; 2025 BYU Pathway Ghana. Payment Platform.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

