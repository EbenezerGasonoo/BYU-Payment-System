import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Default to production Railway backend so Expo Go on real devices works seamlessly out of the box
export const API_BASE_URL = 'https://byupay.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('SecureStore error:', err);
  }
  return config;
});

export const studentAPI = {
  register: async (data) => {
    const res = await api.post('/student/register', data);
    return res.data;
  },

  login: async (byuId, password) => {
    const res = await api.post('/student/login', { byuId, password });
    return res.data;
  },

  requestCard: async (data) => {
    const res = await api.post('/student/request-card', data);
    return res.data;
  },

  getDashboard: async (byuId) => {
    const res = await api.get(`/student/dashboard/${byuId}`);
    return res.data;
  },

  getRequest: async (requestToken) => {
    const res = await api.get(`/student/request/${requestToken}`);
    return res.data;
  },

  forgotPassword: async (emailOrByuId) => {
    const res = await api.post('/student/forgot-password', { emailOrByuId });
    return res.data;
  },

  verifyResetCode: async (data) => {
    const res = await api.post('/student/verify-reset-code', data);
    return res.data;
  },

  resetPassword: async (data) => {
    const res = await api.post('/student/reset-password', data);
    return res.data;
  },

  initiateMtnPayment: async (data) => {
    const res = await api.post('/student/initiate-mtn-payment', data);
    return res.data;
  },

  checkMtnPayment: async (data) => {
    const res = await api.post('/student/check-mtn-payment', data);
    return res.data;
  }
};

export default api;
