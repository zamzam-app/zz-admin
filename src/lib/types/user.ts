export interface User {
  id?: string;
  _id?: string;
  name: string;
  userName?: string;
  email: string;
  role: string;
  phoneNumber?: string;
  outletId?: string[];
  token?: string;
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
