import axios from 'axios';
import { getAccessToken, clearSession, hasSession } from '../../auth/auth-storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */
api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Only redirect if user was already logged in
    if (error?.response?.status === 401 && hasSession()) {
      clearSession();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

export default api;
