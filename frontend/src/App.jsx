import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
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
import LiveChat from './components/LiveChat';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';
import ImpersonationBanner from './components/ImpersonationBanner';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { AuthProvider } from './utils/AuthContext';
import { AdminAuthProvider } from './utils/AdminAuthContext';
import { ImpersonationProvider } from './utils/ImpersonationContext';
import './App.css';
import './styles/site.css';

// Scroll to #section links (e.g. /#fees), otherwise to the top on page change
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className={`app ${isAdminPage ? '' : 'cp-site'}`}>
      <ScrollManager />
      {/* Impersonation banner — always on top when active */}
      <ImpersonationBanner />

      {!isAdminPage && <LiveChat />}
      {!isAdminPage && <SiteHeader />}

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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminPage && <SiteFooter />}
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

