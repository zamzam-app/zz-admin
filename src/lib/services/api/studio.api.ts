import apiClient from './axios';
import type { CustomCakesResponse } from '../../types/product';

export const studioApi = {
  getCreations: async (page = 1, limit = 12): Promise<CustomCakesResponse> => {
    const { data } = await apiClient.get<CustomCakesResponse>(
      `/custom-cakes?page=${page}&limit=${limit}`,
    );
    return data;
  },

  deleteCreation: async (id: string): Promise<void> => {
    await apiClient.delete(`/custom-cakes/${id}`);
  },
};
