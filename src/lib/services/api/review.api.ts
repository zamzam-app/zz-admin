import apiClient from './axios';
import type { ApiReview } from '../../types/review';

export const reviewsApi = {
  getAll: async (): Promise<ApiReview[]> => {
    const { data } = await apiClient.get<ApiReview[]>('/rating');
    return data;
  },

  getOne: async (id: string): Promise<ApiReview> => {
    const { data } = await apiClient.get<ApiReview>(`/rating/${id}`);
    return data;
  },

  create: async (review: {
    comment: string;
    stars: number;
    productId?: string;
  }): Promise<ApiReview> => {
    const { data } = await apiClient.post<ApiReview>('/rating', {
      comment: review.comment,
      value: review.stars,
      product: review.productId,
    });
    return data;
  },

  update: async (
    id: string,
    review: { comment?: string; stars?: number }
  ): Promise<ApiReview> => {
    const payload: Partial<{ comment: string; value: number }> = {};

    if (review.comment !== undefined) payload.comment = review.comment;
    if (review.stars !== undefined) payload.value = review.stars;

    const { data } = await apiClient.patch<ApiReview>(
      `/rating/${id}`,
      payload
    );
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/rating/${id}`);
  },
};
