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

/** Single user response (answer to a question); may be a complaint. */
export interface UserResponse {
  questionId: string;
  answer: string | string[] | number;
  isComplaint?: boolean;
  complaintStatus?: ComplaintStatus;
  resolvedAt?: string;
  resolutionNotes?: string;
  resolutionBy?: string;
}

export interface ApiReview {
  _id: string;
  createdAt: string;
  overallRating: number;
  userId: string;
  type?: RatingType;

  outletId?:
    | string
    | {
        _id: string;
        name: string;
      };

  /** Form ref (id) or populated form with questions. */
  formId?:
    | string
    | {
        questions: {
          _id: string;
          type: string;
          title?: string;
        }[];
      };

  userResponses: UserResponse[];
}

/** Mapped review for the Reviews page (derived from ApiReview). */
export interface Review {
  id: string;
  customer: string;
  outletId: string;
  outletName: string;
  rating: number;
  comment: string;
  date: string;
}

/** Mapped complaint review (extends Review with complaint info). */
export interface ComplaintReview extends Review {
  complaintQuestions: {
    questionId: string;
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

/** Paginated response for ratings get-all API. */
export interface RatingsListResponse {
  data: ApiReview[];
  meta: RatingsListMeta;
}
