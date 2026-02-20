export type QuestionType = 'short_answer' | 'paragraph' | 'multiple_choice' | 'checkbox' | 'rating';

export interface Option {
  _id?: string;
  text: string;
  selected?: boolean;
  isOther?: boolean;
}

export interface Question {
  _id: string;
  type: QuestionType;
  title: string;
  isRequired: boolean;
  hint?: string;
  options?: Option[];
  maxRatings?: number;
}

export interface Form {
  _id: string;
  title: string;
  version?: number;
  questions: Question[];
}
