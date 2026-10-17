import axios from 'axios';

// Base Axios instance preconfigured for T-Kart REST API
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to automatically attach JWT token from localStorage if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tkart_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const endpoint = error.config?.url || '';
      const isCredentialRequest = /\/auth\/(login|register)\/?$/.test(endpoint);
      if (!isCredentialRequest) {
        const authorization = error.config?.headers?.Authorization || error.config?.headers?.authorization || '';
        window.dispatchEvent(new CustomEvent('tkart:session-expired', { detail: { authorization } }));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
