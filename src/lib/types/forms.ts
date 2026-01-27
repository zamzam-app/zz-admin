export type QuestionType = 'short_answer' | 'paragraph' | 'multiple_choice' | 'checkbox' | 'rating' | 'linear_scale';

export interface Option {
  id: string;
  text: string;
  isOther?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  hint?: string;
  options?: Option[];
  required: boolean;
  maxRating?: number;


  scale?: {
    min: number;      // e.g. 1
    max: number;      // e.g. 5
    minLabel?: string;
    maxLabel?: string;
  };
}

export interface Form {
  id: string;
  title: string;
  questions: Question[];
}
