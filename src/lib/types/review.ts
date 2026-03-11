export const REVIEW_KEYS = ['reviews'];
export const GLOBAL_CSAT_KEYS = ['global-csat'];
export const CSAT_TRENDLINE_KEYS = ['csat-trendline'];
export const INCIDENTS_OVERVIEW_KEYS = ['incidents-overview'];

export enum RatingType {
  COMPLAINT = 'complaint',
  REVIEW = 'review',
}

export enum ComplaintStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

interface UserRef {
  _id: string;
  name: string;
}

interface OutletRef {
  _id: string;
  name: string;
}

interface QuestionRef {
  _id: string;
  title: string;
}

interface UserResponse {
  _id: string;
  questionId: QuestionRef;
  answer: string[];
  isComplaint: boolean;
  complaintStatus?: 'pending' | 'resolved' | 'dismissed';
  resolutionBy?: string | null;
  resolutionNotes?: string;
  resolvedAt?: string;
}

export interface Review {
  _id: string;
  isActive: boolean;
  isDeleted: boolean;
  userId: UserRef;
  outletId: OutletRef;
  userResponses: UserResponse[];
  overallRating: number;
  type: 'review' | 'complaint';
  formId: string;
  createdAt: string;
  updatedAt: string;
}

/** Mapped complaint review (extends Review with complaint info). */
export interface ComplaintReview extends Review {
  complaintQuestions: {
    questionId: string | { _id: string; title?: string };
    answer: string | string[] | number;
    complaintStatus?: ComplaintStatus;
  }[];
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

/** Pagination meta for ratings list API. */
export interface RatingsListMeta {
  total: number;
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  limit: number;
}

/** Request body for resolving a complaint (single question in a rating). */
export interface ResolveComplaintDto {
  questionId: string;
  complaintStatus: ComplaintStatus;
  answer?: string;
  resolutionNotes?: string;
  resolvedBy: string;
}

/** Paginated response for ratings get-all API. */
export interface RatingsListResponse {
  data: Review[];
  meta: RatingsListMeta;
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
