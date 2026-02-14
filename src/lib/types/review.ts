export interface ApiReview {
  _id: string;
  createdAt: string;
  totalRatings: number;

  outletId?: {
    _id: string;
    name: string;
  };

  formId: {
    questions: {
      _id: string;
      type: string;
    }[];
  };

  response: {
    questionId: string;
    answer: string[];
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
