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
