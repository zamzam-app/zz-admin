import axios from 'axios';

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
    const tokenString = localStorage.getItem('token');

    if (!tokenString || error?.status === 401 || error?.response?.status === 401) {
      console.log('token failed');
      localStorage.clear();
      window.location.href = '/login';
    }

    // return Promise.reject(error);
    console.log(error);
  },
);

export default api;
