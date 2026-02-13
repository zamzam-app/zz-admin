import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API ERROR:', err.response || err);
    return Promise.reject(err);
  },
);

export default api;
