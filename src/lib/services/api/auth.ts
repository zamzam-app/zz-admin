import api from './axios';
import { AUTH } from './endpoints';
import { User, LoginPayload } from '../../types/user';

export const authApi = {
  login: async (data: LoginPayload): Promise<User> => {
    const response = await api.post<User>(AUTH.LOGIN, data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post(AUTH.LOGOUT);
  },

  profile: async (): Promise<User> => {
    const response = await api.get<User>(AUTH.PROFILE);
    return response.data;
  },
};
