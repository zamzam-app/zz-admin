const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
export const userBaseUrl = import.meta.env.VITE_USER_BASE_URL ?? baseUrl;
