import apiClient from './axios';
import type { UploadedCakesResponse } from '../../types/product';

export const uploadedCakesApi = {
  getUploadedCakes: async (
    page = 1,
    limit = 12,
    userId?: string,
  ): Promise<UploadedCakesResponse> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (userId) {
      params.set('userId', userId);
    }

    const { data } = await apiClient.get<UploadedCakesResponse>(
      `/uploaded-cakes?${params.toString()}`,
    );
    return data;
  },
};
