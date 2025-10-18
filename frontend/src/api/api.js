import axios from 'axios';

// Use Railway backend in production, proxy in development
// Detect production by checking if we're on vercel.app domain
const isProduction = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   import.meta.env.MODE === 'production');

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isProduction
    ? 'https://byupay.up.railway.app/api' 
    : '/api');

// Debug log (remove after confirming it works)
console.log('🔧 API Configuration:', {
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  mode: import.meta.env.MODE,
  apiUrl: API_BASE_URL,
  isProduction
});

// Student API calls
export const studentAPI = {
  register: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/register`, data);
    return response.data;
  },

  requestCard: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/request-card`, data);
    return response.data;
  },

  initiateHubtelPayment: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/initiate-hubtel-payment`, data);
    return response.data;
  },

  verifyPayment: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/verify-payment`, data);
    return response.data;
  },

  paymentFailed: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/payment-failed`, data);
    return response.data;
  },

  getDashboard: async (byuId) => {
    const response = await axios.get(`${API_BASE_URL}/student/dashboard/${byuId}`);
    return response.data;
  },

  getRequest: async (requestToken) => {
    const response = await axios.get(`${API_BASE_URL}/student/request/${requestToken}`);
    return response.data;
  }
};

// Admin API calls
export const adminAPI = {
  getRequests: async (adminKey, status = '') => {
    const url = status ? `${API_BASE_URL}/admin/requests?status=${status}` : `${API_BASE_URL}/admin/requests`;
    const response = await axios.get(url, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  assignCard: async (adminKey, data) => {
    const response = await axios.post(`${API_BASE_URL}/admin/assign`, data, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  assignMockCard: async (adminKey, requestId) => {
    const response = await axios.post(`${API_BASE_URL}/admin/assign/mock`, { requestId }, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  updateAction: async (adminKey, data) => {
    const response = await axios.post(`${API_BASE_URL}/admin/action`, data, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  getStats: async (adminKey) => {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  getMessages: async (adminKey, status = '') => {
    const url = status ? `${API_BASE_URL}/contact/messages?status=${status}` : `${API_BASE_URL}/contact/messages`;
    const response = await axios.get(url, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  updateMessageStatus: async (adminKey, messageId, status) => {
    const response = await axios.patch(`${API_BASE_URL}/contact/messages/${messageId}`, 
      { status }, 
      { headers: { 'x-admin-key': adminKey } }
    );
    return response.data;
  }
};

// Contact API calls
export const contactAPI = {
  submitMessage: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/contact/submit`, data);
    return response.data;
  }
};

