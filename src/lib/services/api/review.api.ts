import apiClient from './axios';
import type { Review, ReviewListResponse, ResolveComplaintDto } from '../../types/review';

export interface ReviewListParams {
  page?: number;
  limit?: number;
  outletId?: string;
  userId?: string;
}

export interface CreateReviewPayload {
  formId: string;
  outletId: string;
  response: Array<{ questionId: string; answer: string | string[] | number }>;
  userId?: string;
}

export interface UpdateReviewPayload {
  formId?: string;
  userId?: string;
  outletId?: string;
  response?: Array<{ questionId: string; answer: string | string[] | number }>;
}

export const reviewsApi = {
  getAll: async (params?: ReviewListParams): Promise<ReviewListResponse> => {
    const { data } = await apiClient.get<ReviewListResponse>('/review', { params });
    return data;
  },

  getOne: async (id: string): Promise<Review> => {
    const { data } = await apiClient.get<Review>(`/review/${id}`);
    return data;
  },

  create: async (payload: CreateReviewPayload): Promise<Review> => {
    const { data } = await apiClient.post<Review>('/review', payload);
    return data;
  },

  update: async (id: string, payload: UpdateReviewPayload): Promise<Review> => {
    const { data } = await apiClient.patch<Review>(`/review/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/review/${id}`);
  },

  resolveComplaint: async (reviewId: string, body: ResolveComplaintDto): Promise<Review> => {
    const { data } = await apiClient.post<Review>(`/review/resolve-complaint/${reviewId}`, body);
    return data;
  },
};
