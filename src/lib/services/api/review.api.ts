import apiClient from './axios';
import type { Review, RatingsListResponse, ResolveComplaintDto } from '../../types/review';

export const reviewsApi = {
  getAll: async (): Promise<RatingsListResponse> => {
    const { data } = await apiClient.get<RatingsListResponse>('/rating');
    return data;
  },

  getOne: async (id: string): Promise<Review> => {
    const { data } = await apiClient.get<Review>(`/rating/${id}`);
    return data;
  },

  create: async (review: {
    comment: string;
    stars: number;
    productId?: string;
  }): Promise<Review> => {
    const { data } = await apiClient.post<Review>('/rating', {
      comment: review.comment,
      value: review.stars,
      product: review.productId,
    });
    return data;
  },

  update: async (id: string, review: { comment?: string; stars?: number }): Promise<Review> => {
    const payload: Partial<{ comment: string; value: number }> = {};

    if (review.comment !== undefined) payload.comment = review.comment;
    if (review.stars !== undefined) payload.value = review.stars;

    const { data } = await apiClient.patch<Review>(`/rating/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/rating/${id}`);
  },

  resolveComplaint: async (ratingId: string, body: ResolveComplaintDto): Promise<Review> => {
    const { data } = await apiClient.post<Review>(`/rating/resolve-complaint/${ratingId}`, body);
    return data;
  },
};
