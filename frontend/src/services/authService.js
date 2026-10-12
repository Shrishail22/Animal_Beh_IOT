// =============================================================================
// Auth Service — Centralized authentication integration
// =============================================================================
// Provisional endpoints (confirm with backend developer):
//   POST /auth/login   — body: { username, password } -> { token, user: { id, username, name, email, role } }
//   POST /auth/logout  — invalidate current token
// =============================================================================

import api, { useMockData } from './api';
import { DEMO_CREDENTIALS, mockUser } from '../mock/mockData';

export const loginUser = async (credentials) => {
  if (useMockData()) {
    // In mock demo mode, check demo credentials
    if (
      credentials.username === DEMO_CREDENTIALS.username &&
      credentials.password === DEMO_CREDENTIALS.password
    ) {
      const mockToken = 'demo-jwt-token-' + Date.now();
      return {
        data: {
          token: mockToken,
          user: mockUser,
        },
      };
    }
    const err = new Error('Invalid demo credentials. Use admin / demo123');
    err.response = { status: 401, data: { detail: 'Invalid credentials' } };
    throw err;
  }

  // Real backend API call to FastAPI
  const response = await api.post('/auth/login', credentials);
  return response;
};

export const logoutUser = async () => {
  try {
    if (!useMockData()) {
      await api.post('/auth/logout');
    }
  } catch (err) {
    console.warn('Backend logout notification skipped/failed:', err.message);
  } finally {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
  }
};
