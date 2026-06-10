/**
 * axiosInstance.js — Centralized Axios client with Clerk token interceptor.
 *
 * Every outgoing request automatically attaches the Bearer token
 * from the active Clerk session, so service files don't need to
 * worry about auth headers.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

/**
 * Attach the Clerk session token to every request.
 * Call setTokenGetter(getToken) from App.jsx after Clerk initializes.
 */
let _getToken = null;

export function setTokenGetter(fn) {
  _getToken = fn;
}

api.interceptors.request.use(async (config) => {
  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Clerk not ready — send without token
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — redirect to sign-in
      window.location.href = '/sign-in';
    }
    return Promise.reject(error);
  },
);

export default api;
