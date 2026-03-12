export const REVIEW_KEYS = ['reviews'];
export const GLOBAL_CSAT_KEYS = ['global-csat'];
export const CSAT_TRENDLINE_KEYS = ['csat-trendline'];
export const INCIDENTS_OVERVIEW_KEYS = ['incidents-overview'];
export const OUTLET_FEEDBACK_SUMMARY_KEYS = ['outlet-feedback-summary'];
export const FRANCHISE_ANALYTICS_KEYS = ['franchise-analytics'];

export enum RatingType {
  COMPLAINT = 'complaint',
  REVIEW = 'review',
}

export enum ComplaintStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export type ComplaintStatusValue = 'pending' | 'resolved' | 'dismissed';

/** One answered question (no per-response complaint fields). */
export interface UserResponse {
  questionId: string;
  answer: string | string[] | number;
}

/** Populated user reference (list/detail). */
export interface UserRef {
  _id: string;
  name?: string;
}

/** Populated outlet reference (list/detail). */
export interface OutletRef {
  _id: string;
  name?: string;
  address?: string;
  outletType?: unknown;
}

export interface Review {
  _id: string;
  isActive: boolean;
  isDeleted: boolean;
  userId: string | UserRef;
  outletId: string | OutletRef;
  userResponses: UserResponse[];
  overallRating: number;
  formId?: string;
  isComplaint?: boolean;
  complaintStatus?: ComplaintStatusValue;
  complaintReason?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewUI {
  id: string;
  customer: string;
  customerImage?: string;
  outletId: string;
  outletName: string;
  date: string;
  rating: number;
  comment: string;
}

/** Pagination meta for review list API. */
export interface ReviewListMeta {
  total: number;
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  limit: number;
}

/** Request body for resolving a complaint (review-level only). */
export interface ResolveComplaintDto {
  complaintStatus: ComplaintStatus;
  resolvedBy: string;
  resolutionNotes?: string;
}

/** Paginated response for review list API. */
export interface ReviewListResponse {
  data: Review[];
  meta: ReviewListMeta;
}

/** Get outlet ID from review (string or populated object). */
export function getOutletId(review: { outletId?: string | OutletRef }): string | undefined {
  if (review.outletId == null) return undefined;
  return typeof review.outletId === 'string' ? review.outletId : review.outletId._id;
}

/** Get outlet name from review (string or populated object). */
export function getOutletName(review: { outletId?: string | OutletRef }): string {
  if (review.outletId == null) return 'Outlet';
  if (typeof review.outletId === 'string') return 'Outlet';
  return review.outletId.name ?? 'Outlet';
}

/** Get user ID from review (string or populated object). */
export function getUserId(review: { userId?: string | UserRef }): string | undefined {
  if (review.userId == null) return undefined;
  return typeof review.userId === 'string' ? review.userId : review.userId._id;
}

/** Get user display name from review (string or populated object). */
export function getUserName(review: { userId?: string | UserRef }): string {
  if (review.userId == null) return 'Anonymous';
  if (typeof review.userId === 'string') return 'Anonymous';
  return review.userId.name ?? 'Anonymous';
}

export type GlobalCsatPeriod = 'daily' | 'weekly' | 'monthly';

export interface QueryGlobalCsatParams {
  period?: GlobalCsatPeriod;
  startDate?: string;
  endDate?: string;
}

export interface GlobalCsatResponse {
  globalCsatScore: number;
  averageOverallRating: number;
  totalRatings: number;
  totalScore: number;
  period?: GlobalCsatPeriod;
  startDate?: string;
  endDate?: string;
}

export interface CsatTrendlinePeriodData {
  startDate: string;
  endDate: string;
  labels: string[];
  values: number[];
  totalRatings: number;
}

export interface CsatTrendlineResponse {
  period: GlobalCsatPeriod;
  currentPeriod: CsatTrendlinePeriodData;
  previousPeriod: CsatTrendlinePeriodData;
}

export interface QueryIncidentsOverviewParams {
  period?: GlobalCsatPeriod;
  startDate?: string;
  endDate?: string;
}

export interface IncidentsOverviewResponse {
  totalOpenIncidents: number;
  criticalIssues: number;
  incidentsResolvedToday: number;
  resolvedTodayDate: string;
  period?: GlobalCsatPeriod;
  startDate?: string;
  endDate?: string;
}

export interface OutletFeedbackSummaryItem {
  outletId: string;
  outletName: string;
  negativeFeedbacks: number;
  totalFeedbacks: number;
  resolvedFeedbacks: number;
}

export interface OutletFeedbackSummaryResponse {
  items: OutletFeedbackSummaryItem[];
  period: GlobalCsatPeriod;
  startDate: string;
  endDate: string;
}

export interface FranchiseRankingItemDto {
  rank: number;
  outletId: string;
  outletName: string;
  managerName: string | null;
  csatScore: number;
}

export interface MetricsHeatmapItemDto {
  outletId: string;
  outletName: string;
  metrics: {
    staff: number;
    speed: number;
    clean: number;
    quality: number;
    overall: number;
  };
}

export interface FranchiseAnalyticsResponseDto {
  franchiseRanking: FranchiseRankingItemDto[];
  metricsHeatmap: MetricsHeatmapItemDto[];
}
