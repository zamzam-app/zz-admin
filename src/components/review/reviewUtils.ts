import type { Review } from '../../lib/types/review';
import { ComplaintStatus } from '../../lib/types/review';
import type { MetricKey } from './reviewConstants';
import { METRIC_ORDER, METRIC_MATCHERS, METRIC_OFFSETS } from './reviewConstants';

export type ComplaintBorder = 'green' | 'yellow' | 'red';

export function getComplaintBorder(review: Review): ComplaintBorder | undefined {
  if (review.isComplaint !== true || !review.complaintStatus) return undefined;
  switch (review.complaintStatus) {
    case ComplaintStatus.RESOLVED:
      return 'green';
    case ComplaintStatus.PENDING:
      return 'yellow';
    case ComplaintStatus.DISMISSED:
      return 'red';
    default:
      return undefined;
  }
}

export function getReviewComment(review: Review): string {
  const response = (review.userResponses ?? []).find((item) => typeof item.answer !== 'number');
  if (!response) return '—';
  if (Array.isArray(response.answer))
    return response.answer.length > 0 ? response.answer.join(', ') : '—';
  return String(response.answer ?? '—');
}

export function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

export function clampScore(value: number) {
  return Math.max(1, Math.min(5, value));
}

export function formatDateTime(source?: string) {
  if (!source) return '—';
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return '—';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function extractAnswerScores(answer: string | string[] | number | undefined) {
  if (answer == null) return [];
  const values = Array.isArray(answer) ? answer : [answer];
  return values
    .map((value) => Number.parseFloat(String(value).replace(/[^0-9.]/g, '')))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
}

export function isPendingComplaint(review: Review) {
  return review.isComplaint === true && review.complaintStatus === ComplaintStatus.PENDING;
}

export function buildOutletMetrics(
  reviews: Review[],
  baseScore: number,
): Record<MetricKey, number> {
  const buckets: Record<MetricKey, number[]> = {
    staff: [],
    speed: [],
    clean: [],
    quality: [],
  };

  reviews.forEach((review) => {
    (review.userResponses ?? []).forEach((response) => {
      const title =
        typeof response.questionId === 'string'
          ? response.questionId
          : ((response.questionId as { title?: string } | null)?.title ?? '');
      const scores = extractAnswerScores(response.answer ?? []);

      if (scores.length === 0) return;

      METRIC_ORDER.forEach((metric) => {
        if (METRIC_MATCHERS[metric].test(title)) {
          buckets[metric].push(...scores);
        }
      });
    });
  });

  const metrics = {} as Record<MetricKey, number>;

  METRIC_ORDER.forEach((metric) => {
    const fallback = clampScore(baseScore + METRIC_OFFSETS[metric]);
    const value = buckets[metric].length > 0 ? average(buckets[metric]) : fallback;
    metrics[metric] = round(value, 1);
  });

  return metrics;
}

export function getHeatCellStyle(score: number) {
  if (score >= 4.5) {
    return { backgroundColor: '#E8F7EF', borderColor: '#B7E4C7', color: '#0F9D58' };
  }
  if (score >= 4) {
    return { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', color: '#059669' };
  }
  if (score >= 3.5) {
    return { backgroundColor: '#FFF7E6', borderColor: '#FCD34D', color: '#B45309' };
  }
  if (score >= 3) {
    return { backgroundColor: '#FFF1EB', borderColor: '#FDBA74', color: '#C2410C' };
  }
  return { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', color: '#B91C1C' };
}

export function getRatingBadgeStyle(score: number) {
  if (score >= 4) return { backgroundColor: '#ECFDF5', color: '#047857' };
  if (score >= 3) return { backgroundColor: '#FFF7E6', color: '#B45309' };
  return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
}
