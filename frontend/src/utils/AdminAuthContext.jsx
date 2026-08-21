import { createContext, useContext, useState, useEffect } from 'react';
import { adminAPI } from '../api/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin]   = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    // Restore admin session from sessionStorage (clears on tab close)
    const storedKey = sessionStorage.getItem('adminKey');
    if (storedKey) {
      setAdminKey(storedKey);
      setIsAdmin(true);
    }
    setAdminLoading(false);
  }, []);

  /**
   * Attempt login with the provided key.
   * Returns { success, message }.
   */
  const adminLogin = async (key) => {
    try {
      await adminAPI.verifyKey(key);
      sessionStorage.setItem('adminKey', key);
      setAdminKey(key);
      setIsAdmin(true);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid admin key';
      return { success: false, message };
    }
  };

  const adminLogout = () => {
    sessionStorage.removeItem('adminKey');
    setAdminKey('');
    setIsAdmin(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, adminKey, adminLogin, adminLogout, adminLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
