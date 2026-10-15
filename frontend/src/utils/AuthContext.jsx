import { createContext, useContext, useState, useEffect } from 'react';
import { STUDENT_TOKEN_KEY, SESSION_EXPIRED_EVENT } from '../api/api';

const AuthContext = createContext(null);

const clearStoredSession = () => {
  localStorage.removeItem(STUDENT_TOKEN_KEY);
  localStorage.removeItem('userByuId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('hasRequestedCard');
  localStorage.removeItem('hasViewedDashboard');
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on app load. A session needs a token
    // (or an admin key, for impersonation); old token-less sessions must sign in again.
    const byuId = localStorage.getItem('userByuId');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    const hasCredential = localStorage.getItem(STUDENT_TOKEN_KEY) || sessionStorage.getItem('adminKey');
    if (byuId && name && hasCredential) {
      setUser({ byuId, name, email: email || '' });
    } else if (byuId) {
      clearStoredSession();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      clearStoredSession();
      setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  // token is omitted when an admin impersonates a student (the admin key authorizes instead)
  const login = ({ byuId, name, email = '', token }) => {
    if (token) localStorage.setItem(STUDENT_TOKEN_KEY, token);
    localStorage.setItem('userByuId', byuId);
    localStorage.setItem('userName', name);
    if (email) localStorage.setItem('userEmail', email);
    setUser({ byuId, name, email });
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
