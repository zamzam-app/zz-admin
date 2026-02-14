import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */
api.interceptors.request.use((config) => {
  const sessionString = localStorage.getItem("user_session");

  if (sessionString) {
    const sessionData = JSON.parse(sessionString);
    const token = sessionData?.token;

    if (token) {
      // Axios v1+ safe way
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return config;
});

/* ---------------- RESPONSE INTERCEPTOR ---------------- */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await api.post("/auth/refresh");

        const newToken = res.data?.token;
        if (newToken) {
          // Update localStorage
          const sessionString = localStorage.getItem("user_session");
          const sessionData = sessionString ? JSON.parse(sessionString) : {};
          sessionData.token = newToken;
          localStorage.setItem("user_session", JSON.stringify(sessionData));

          // Update retry request header
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);

          return api(originalRequest);
        }
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
