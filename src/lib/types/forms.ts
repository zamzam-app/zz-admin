export type QuestionType = 'short_answer' | 'paragraph' | 'multiple_choice' | 'checkbox' | 'rating';

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  hint?: string;
  options?: Option[];
  required: boolean;
  maxRating?: number;
}

export interface Form {
  id: string;
  title: string;
  questions: Question[];
}
