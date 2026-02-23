export const REVIEW_KEYS = ['reviews'];

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
  complaintStatus: 'pending' | 'resolved' | 'rejected';
  resolutionBy: string | null;
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
