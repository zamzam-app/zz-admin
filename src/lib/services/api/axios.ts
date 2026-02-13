// import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
//   withCredentials: true,
// });

// api.interceptors.response.use(
//   (res) => res,
//   (err) => {
//     console.error('API ERROR:', err.response || err);
//     return Promise.reject(err);
//   }
// );

// export default api;

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const sessionString = localStorage.getItem('user_session');

  if (sessionString) {
    const sessionData = JSON.parse(sessionString);
    const token = sessionData.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await api.post('/auth/refresh');

        const newToken = localStorage.getItem('accessToken');
        if (newToken) {
          originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
        }

        return api(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
