export interface User {
  id?: string;          
  name: string;
  email: string;
  role: string;
  outletId?: string[];
  token?: string;      
}

/* Payloads */

export interface CreateUserPayload {
  name: string;
  email: string;
  role: string;
  outletId?: string[];
  password?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
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

