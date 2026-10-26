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

export const STUDENT_TOKEN_KEY = 'studentToken';
export const SESSION_EXPIRED_EVENT = 'student-session-expired';

const isStudentApiUrl = (url = '') => url.startsWith(`${API_BASE_URL}/student/`);

// Attach the student session token (and the admin key while impersonating) to student API calls
axios.interceptors.request.use((config) => {
  if (isStudentApiUrl(config.url)) {
    const token = localStorage.getItem(STUDENT_TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    const adminKey = sessionStorage.getItem('adminKey');
    if (adminKey) config.headers['x-admin-key'] = adminKey;
  }
  return config;
});

// A 401 from a student endpoint means the session is missing or expired
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && isStudentApiUrl(error.config?.url)) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

// Student API calls
export const studentAPI = {
  register: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/register`, data);
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await axios.get(`${API_BASE_URL}/student/verify-email/${encodeURIComponent(token)}`);
    return response.data;
  },

  login: async (byuId, password) => {
    const response = await axios.post(`${API_BASE_URL}/student/login`, { byuId, password });
    return response.data;
  },

  freezeCard: async (requestId) => {
    const response = await axios.post(`${API_BASE_URL}/student/cards/${requestId}/freeze`);
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

  initiateMtnPayment: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/initiate-mtn-payment`, data);
    return response.data;
  },

  checkMtnPayment: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/check-mtn-payment`, data);
    return response.data;
  },

  verifyPayment: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/verify-payment`, data);
    return response.data;
  },

  checkPaymentStatus: async (paymentReference) => {
    const response = await axios.get(`${API_BASE_URL}/student/check-payment-status/${paymentReference}`);
    return response.data;
  },

  paymentFailed: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/payment-failed`, data);
    return response.data;
  },

  updateCountry: async (countryCode, byuId) => {
    const response = await axios.patch(`${API_BASE_URL}/student/me/country`, { countryCode, byuId });
    return response.data;
  },

  getRates: async () => {
    const response = await axios.get(`${API_BASE_URL}/student/rates`);
    return response.data;
  },

  initializePaystack: async (requestToken) => {
    const response = await axios.post(`${API_BASE_URL}/student/paystack/initialize`, { requestToken });
    return response.data;
  },

  verifyPaystack: async (reference) => {
    const response = await axios.get(`${API_BASE_URL}/student/paystack/verify/${encodeURIComponent(reference)}`);
    return response.data;
  },

  getDashboard: async (byuId) => {
    const response = await axios.get(`${API_BASE_URL}/student/dashboard/${byuId}`);
    return response.data;
  },

  getRequest: async (requestToken) => {
    const response = await axios.get(`${API_BASE_URL}/student/request/${requestToken}`);
    return response.data;
  },

  forgotPassword: async (emailOrByuId) => {
    const response = await axios.post(`${API_BASE_URL}/student/forgot-password`, { emailOrByuId });
    return response.data;
  },

  verifyResetCode: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/verify-reset-code`, data);
    return response.data;
  },

  resetPassword: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/student/reset-password`, data);
    return response.data;
  }
};

// Admin API calls
export const adminAPI = {
  // country: 'GH' | 'NG' narrows the list to one country; '' means all
  getRequests: async (adminKey, status = '', country = '') => {
    const response = await axios.get(`${API_BASE_URL}/admin/requests`, {
      params: { ...(status && { status }), ...(country && { country }) },
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

  getStats: async (adminKey, country = '') => {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
      params: country ? { country } : {},
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  // USD card float per country (balance, low-balance warning, recent entries)
  getFloat: async (adminKey) => {
    const response = await axios.get(`${API_BASE_URL}/admin/float`, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  topUpFloat: async (adminKey, data) => {
    const response = await axios.post(`${API_BASE_URL}/admin/float/topup`, data, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  // Record that a manual Mobile Money payment was received, so a card can be assigned
  confirmPayment: async (adminKey, requestId, data) => {
    const response = await axios.post(`${API_BASE_URL}/admin/requests/${requestId}/confirm-payment`, data, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  // Record that an expired card from a manual issuer was closed by hand
  markCardClosed: async (adminKey, requestId) => {
    const response = await axios.post(`${API_BASE_URL}/admin/requests/${requestId}/manual-close`, {}, {
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
  },

  getUsers: async (adminKey, status = '') => {
    const url = status ? `${API_BASE_URL}/admin/users?status=${status}` : `${API_BASE_URL}/admin/users`;
    const response = await axios.get(url, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  deleteUser: async (adminKey, studentId) => {
    const response = await axios.delete(`${API_BASE_URL}/admin/users/${studentId}`, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  restoreUser: async (adminKey, studentId) => {
    const response = await axios.patch(`${API_BASE_URL}/admin/users/${studentId}/restore`, {}, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  getCountryStats: async (adminKey) => {
    const response = await axios.get(`${API_BASE_URL}/admin/country-requests`, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  createStudent: async (adminKey, data) => {
    const response = await axios.post(`${API_BASE_URL}/admin/create-student`, data, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  // Verify that an admin key is valid (used by AdminLogin page)
  verifyKey: async (adminKey) => {
    const response = await axios.get(`${API_BASE_URL}/admin/verify`, {
      headers: { 'x-admin-key': adminKey }
    });
    return response.data;
  },

  // Fetch a single student by BYU ID for impersonation
  getStudentByByuId: async (adminKey, byuId) => {
    const response = await axios.get(`${API_BASE_URL}/admin/users/by-byu/${byuId}`, {
      headers: { 'x-admin-key': adminKey }
    });
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

