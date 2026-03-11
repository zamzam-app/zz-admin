import apiClient from './axios';
import type {
  CsatTrendlineResponse,
  GlobalCsatResponse,
  GlobalCsatPeriod,
  IncidentsOverviewResponse,
  OutletFeedbackSummaryResponse,
  QuickInsightsResponse,
  QueryIncidentsOverviewParams,
  QueryGlobalCsatParams,
  Review,
  ReviewListResponse,
  ResolveComplaintDto,
} from '../../types/review';

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

  getOutletFeedbackSummary: async (
    period: GlobalCsatPeriod,
  ): Promise<OutletFeedbackSummaryResponse> => {
    const { data } = await apiClient.get<OutletFeedbackSummaryResponse>(
      `/review/analytics/outlet-feedback-summary?period=${period}`,
    );
    return data;
  },

  getQuickInsights: async (period: GlobalCsatPeriod): Promise<QuickInsightsResponse> => {
    const { data } = await apiClient.get<QuickInsightsResponse>(
      `/review/analytics/quick-insights?period=${period}`,
    );
    return data;
  },
};
