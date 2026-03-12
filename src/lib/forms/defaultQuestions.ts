import type { Question } from '../types/forms';

export const DEFAULT_FORM_QUESTION_TITLES = [
  'Overall Experience',
  'Staff',
  'Speed',
  'Cleanliness',
  'Quality',
] as const;

export const DEFAULT_FORM_QUESTIONS: Question[] = [
  {
    _id: 'default-overall-experience',
    type: 'rating',
    title: 'Overall Experience',
    hint: 'Please rate your overall experience',
    isRequired: true,
    maxRatings: 5,
    starStep: 1,
  },
  {
    _id: 'default-staff',
    type: 'rating',
    title: 'Staff',
    hint: 'Please rate our staff',
    isRequired: true,
    maxRatings: 5,
    starStep: 1,
  },
  {
    _id: 'default-speed',
    type: 'rating',
    title: 'Speed',
    hint: 'Please rate our speed of service',
    isRequired: true,
    maxRatings: 5,
    starStep: 1,
  },
  {
    _id: 'default-cleanliness',
    type: 'rating',
    title: 'Cleanliness',
    hint: 'Please rate our cleanliness',
    isRequired: true,
    maxRatings: 5,
    starStep: 1,
  },
  {
    _id: 'default-quality',
    type: 'rating',
    title: 'Quality',
    hint: 'Please rate our quality',
    isRequired: true,
    maxRatings: 5,
    starStep: 1,
  },
];

export function isDefaultQuestionTitle(title: string | undefined | null) {
  if (!title) return false;
  return DEFAULT_FORM_QUESTION_TITLES.includes(
    title as (typeof DEFAULT_FORM_QUESTION_TITLES)[number],
  );
}
