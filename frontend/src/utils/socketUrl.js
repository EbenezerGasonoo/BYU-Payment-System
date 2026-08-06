// Socket.io connects to the backend origin (not /api). Mirrors api.js production detection.
export function getSocketUrl() {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  const isProduction =
    typeof window !== 'undefined' &&
    (window.location.hostname.includes('vercel.app') ||
      import.meta.env.MODE === 'production');

  return isProduction
    ? 'https://byupay.up.railway.app'
    : 'http://localhost:3000';
}
