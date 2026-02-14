import axios from 'axios';
import { AUTH } from './endpoints';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */
api.interceptors.request.use((config) => {
  const sessionString = localStorage.getItem('token');

  if (sessionString) {
    const sessionData = JSON.parse(sessionString);
    const token = sessionData?.token;

    if (token) {
      // Axios v1+ safe way
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return config;
});

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    const tokenString = localStorage.getItem('token');

    if (!tokenString || error?.status === 401 || error?.response?.status === 401) {
      originalRequest._retry = true;
      try {
        const response = await api.post(AUTH.REFRESH);
        const newToken = response.data?.access_token;
        if (newToken) {
          // Update localStorage
          localStorage.setItem('token', JSON.stringify({ token: newToken }));

          // Update retry request header
          originalRequest.headers.set('Authorization', `Bearer ${newToken}`);

          return api(originalRequest);
        }
      } catch {
        console.log('refresh token failed');
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    // return Promise.reject(error);
    console.log(error);
  },
);

export default api;
