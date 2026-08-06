import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { studentAPI } from '../api/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync('user_data');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Failed to restore auth state', e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (byuId, password) => {
    const response = await studentAPI.login(byuId, password);
    if (response.success && response.student) {
      const userData = response.student;
      setUser(userData);
      await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
      if (response.token) {
        await SecureStore.setItemAsync('user_token', response.token);
      }
      return response;
    }
    throw new Error(response.message || 'Login failed');
  };

  const setDirectUser = async (userData) => {
    setUser(userData);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    try {
      await SecureStore.deleteItemAsync('user_data');
      await SecureStore.deleteItemAsync('user_token');
    } catch (e) {
      console.warn('Failed to clear secure storage', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        setDirectUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
