import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage on app load
    const byuId = localStorage.getItem('userByuId');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    if (byuId && name) {
      setUser({ byuId, name, email: email || '' });
    }
    setLoading(false);
  }, []);

  const login = ({ byuId, name, email = '' }) => {
    localStorage.setItem('userByuId', byuId);
    localStorage.setItem('userName', name);
    if (email) localStorage.setItem('userEmail', email);
    setUser({ byuId, name, email });
  };

  const logout = () => {
    localStorage.removeItem('userByuId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('hasRequestedCard');
    localStorage.removeItem('hasViewedDashboard');
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
