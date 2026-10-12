// =============================================================================
// Centralized Axios Client
// =============================================================================
// All API calls go through this client. The base URL is read from the
// environment variable VITE_API_BASE_URL.
//
// Provisional API contracts (endpoint paths) are documented in each service
// file. The backend developer must confirm these paths before switching to
// API mode.
// =============================================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor (attach auth token when available) ──────────────────
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor (handle common errors) ─────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          sessionStorage.removeItem('auth_token');
          sessionStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden: insufficient permissions.');
          break;
        case 500:
          console.error('Server error — please try again later.');
          break;
        default:
          break;
      }
    }
    return Promise.reject(error);
  },
);

/**
 * Returns true when the frontend should use mock data instead of hitting
 * the real backend.
 */
export const useMockData = () =>
  import.meta.env.VITE_USE_MOCK_DATA === 'true';

export default api;
