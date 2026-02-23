export const MANAGER_KEYS = ['managers'];

export interface User {
  name: string;
  email: string;
  role: string;
  userName?: string;
  phoneNumber?: string;
  outletId?: string[];
  _id?: string;
  id?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersListMeta {
  total: number;
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  limit: number;
}

export interface UsersListResponse {
  data: User[];
  meta: UsersListMeta;
}

/* Payloads */
export interface CreateUserPayload {
  name: string;
  userName: string;
  email: string;
  role: string;
  phoneNumber: string;
  password?: string;
  outletId?: string[];
}

export interface UpdateUserPayload {
  name?: string;
  userName?: string;
  email?: string;
  role?: string;
  phoneNumber?: string;
  password?: string;
  outletId?: string[];
  isActive?: boolean;
  isBlocked?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}
export interface LoginResponse {
  access_token: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    outlets: string[];
    isActive: boolean;
    isDeleted: boolean;
    phoneNumber?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
