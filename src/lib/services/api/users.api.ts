import api from './axios';
import { USERS } from './endpoints';
import {
  User,
  CreateUserPayload,
  UpdateUserPayload,
  ChangePasswordPayload,
} from '../../types/manager';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get<User[]>(USERS.BASE);
    return res.data;
  },

  getById: async (id: string): Promise<User> => {
    const res = await api.get<User>(USERS.BY_ID(id));
    return res.data;
  },

  create: async (data: CreateUserPayload): Promise<User> => {
    const res = await api.post<User>(USERS.BASE, data);
    return res.data;
  },

  update: async (id: string, data: UpdateUserPayload): Promise<User> => {
    const res = await api.patch<User>(USERS.BY_ID(id), data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(USERS.BY_ID(id));
  },

  changePassword: async (id: string, data: ChangePasswordPayload): Promise<void> => {
    await api.post(USERS.CHANGE_PASSWORD(id), data);
  },
};
