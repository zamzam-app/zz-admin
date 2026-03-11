import apiClient from './axios';
import type {
  CsatTrendlineResponse,
  GlobalCsatResponse,
  GlobalCsatPeriod,
  IncidentsOverviewResponse,
  QueryIncidentsOverviewParams,
  QueryGlobalCsatParams,
  RatingsListResponse,
  ResolveComplaintDto,
  Review,
} from '../../types/review';

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

  getGlobalCsat: async (params: QueryGlobalCsatParams = {}): Promise<GlobalCsatResponse> => {
    const searchParams = new URLSearchParams();

    if (params.period) searchParams.set('period', params.period);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);

    const query = searchParams.toString();
    const { data } = await apiClient.get<GlobalCsatResponse>(
      query ? `/review/analytics/global-csat?${query}` : '/review/analytics/global-csat',
    );
    return data;
  },

  getCsatTrendline: async (period: GlobalCsatPeriod): Promise<CsatTrendlineResponse> => {
    const { data } = await apiClient.get<CsatTrendlineResponse>(
      `/review/analytics/csat-trendline?period=${period}`,
    );
    return data;
  },

  getIncidentsOverview: async (
    params: QueryIncidentsOverviewParams = {},
  ): Promise<IncidentsOverviewResponse> => {
    const searchParams = new URLSearchParams();

    if (params.period) searchParams.set('period', params.period);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);

    const query = searchParams.toString();
    const { data } = await apiClient.get<IncidentsOverviewResponse>(
      query
        ? `/review/analytics/incidents-overview?${query}`
        : '/review/analytics/incidents-overview',
    );
    return data;
  },
};
