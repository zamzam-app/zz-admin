import apiClient from './axios';
import { Form } from '../../types/forms';

export const formsApi = {
  getForms: async (): Promise<Form[]> => {
    const { data } = await apiClient.get('/forms');
    return data?.data || data;
  },

  getForm: async (id: string): Promise<Form> => {
    const { data } = await apiClient.get(`/forms/${id}`);
    return data?.data || data;
  },

  createForm: async (): Promise<Form> => {
    const { data } = await apiClient.post('/forms', {
      title: 'Untitled Form',
      questions: [],
    });
    return data?.data || data;
  },

  updateForm: async (id: string, form: Partial<Form>): Promise<Form> => {
    const { data } = await apiClient.patch(`/forms/${id}`, form);
    return data?.data || data;
  },

  deleteForm: async (id: string) => {
    await apiClient.delete(`/forms/${id}`);
  },
};
