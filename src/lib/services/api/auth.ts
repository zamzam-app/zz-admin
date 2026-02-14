import api from './axios';
import { AUTH } from './endpoints';
import { User, LoginPayload,LoginResponse } from '../../types/user';

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
  const res = await api.post('/auth/login', payload);
  return res.data;
},

  logout: async (): Promise<void> => {
    await api.post(AUTH.LOGOUT);
  },

  profile: async (): Promise<User> => {
    const response = await api.get<User>(AUTH.PROFILE);
    return response.data;
  },
};
