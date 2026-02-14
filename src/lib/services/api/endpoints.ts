export const AUTH = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/me',
  REFRESH: '/auth/refresh',
};

export const USERS = {
  BASE: '/users',
  BY_ID: (id: string) => `/users/${id}`,
};
