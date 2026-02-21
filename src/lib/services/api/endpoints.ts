export const AUTH = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/me',
  REFRESH: '/auth/refresh',
};

export const USERS = {
  BASE: '/users',
  BY_ID: (id: string) => `/users/${id}`,
  CHANGE_PASSWORD: (id: string) => `/users/change-password/${id}`,
};

export const UPLOAD = {
  SIGNATURE: '/upload/signature',
};
