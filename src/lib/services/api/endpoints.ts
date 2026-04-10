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

export const OUTLET = {
  BASE: '/outlet',
  BY_ID: (id: string) => `/outlet/${id}`,
};

export const OUTLET_TYPE = {
  BASE: '/outlet-type',
  BY_ID: (id: string) => `/outlet-type/${id}`,
};

export const OUTLET_TABLE = {
  BASE: '/outlet-table',
  BY_ID: (id: string) => `/outlet-table/${id}`,
};

export const CATEGORY = {
  BASE: '/category',
  BY_ID: (id: string) => `/category/${id}`,
};

export const TASKS = {
  BASE: '/tasks',
  BY_ID: (id: string) => `/tasks/${id}`,
  STATUS: (id: string) => `/tasks/${id}/status`,
};

export const TASK_CATEGORY = {
  BASE: '/task-category',
  BY_ID: (id: string) => `/task-category/${id}`,
};
