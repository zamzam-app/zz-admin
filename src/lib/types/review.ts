export enum RatingType {
  COMPLAINT = 'complaint',
  REVIEW = 'review',
}

export enum ComplaintStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export interface ApiReview {
  _id: string;
  createdAt: string;
  totalRatings: number;
  userId: string;
  type?: RatingType;

  outletId?: {
    _id: string;
    name: string;
  };

  formId: {
    questions: {
      _id: string;
      type: string;
      title?: string;
    }[];
  };

  response: {
    questionId: string;
    answer: string | string[] | number;
    isComplaint?: boolean;
    complaintStatus?: ComplaintStatus;
    complaintResolvedAt?: Date | string;
    complaintManagerNotes?: string;
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
