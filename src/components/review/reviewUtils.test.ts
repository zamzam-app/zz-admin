import { describe, expect, it } from 'vitest';
import { ComplaintStatus, type Review } from '../../lib/types/review';
import {
  average,
  buildOutletMetrics,
  clampScore,
  formatDateTime,
  getComplaintBorder,
  getReviewComment,
  isPendingComplaint,
  round,
} from './reviewUtils';

function createReview(overrides: Partial<Review> = {}): Review {
  return {
    _id: 'review-1',
    isActive: true,
    isDeleted: false,
    userId: { _id: 'user-1', name: 'Alice' },
    outletId: { _id: 'outlet-1', name: 'Downtown' },
    overallRating: 4.2,
    userResponses: [],
    ...overrides,
  };
}

describe('reviewUtils', () => {
  it('maps complaint status to the expected border color', () => {
    expect(
      getComplaintBorder(
        createReview({ isComplaint: true, complaintStatus: ComplaintStatus.RESOLVED }),
      ),
    ).toBe('green');
    expect(
      getComplaintBorder(
        createReview({ isComplaint: true, complaintStatus: ComplaintStatus.PENDING }),
      ),
    ).toBe('yellow');
    expect(
      getComplaintBorder(
        createReview({ isComplaint: true, complaintStatus: ComplaintStatus.DISMISSED }),
      ),
    ).toBe('red');
    expect(getComplaintBorder(createReview())).toBeUndefined();
  });

  it('returns text and array answers while falling back when no comment exists', () => {
    expect(
      getReviewComment(
        createReview({ userResponses: [{ questionId: 'comment', answer: 'Great service' }] }),
      ),
    ).toBe('Great service');
    expect(
      getReviewComment(
        createReview({ userResponses: [{ questionId: 'tags', answer: ['Fast', 'Friendly'] }] }),
      ),
    ).toBe('Fast, Friendly');
    expect(
      getReviewComment(createReview({ userResponses: [{ questionId: 'score', answer: 5 }] })),
    ).toBe('—');
  });

  it('calculates averages, rounds values, and clamps scores', () => {
    expect(average([3, 4, 5])).toBe(4);
    expect(average([])).toBe(0);
    expect(round(4.444, 1)).toBe(4.4);
    expect(clampScore(7)).toBe(5);
    expect(clampScore(0)).toBe(1);
  });

  it('formats valid datetimes and returns a placeholder for invalid values', () => {
    expect(formatDateTime('2026-03-23T10:15:00.000Z')).toMatch(/^2026-03-23 /);
    expect(formatDateTime('not-a-date')).toBe('—');
    expect(formatDateTime()).toBe('—');
  });

  it('builds outlet metrics from matching responses with fallback offsets', () => {
    const metrics = buildOutletMetrics(
      [
        createReview({
          userResponses: [
            { questionId: { _id: 'q1', title: 'Staff' }, answer: 4 },
            { questionId: { _id: 'q2', title: 'Speed of service' }, answer: '5 stars' },
          ],
        }),
      ],
      4,
    );

    expect(metrics.staff).toBe(4);
    expect(metrics.speed).toBe(5);
    expect(metrics.clean).toBeGreaterThan(0);
    expect(metrics.quality).toBeGreaterThan(0);
  });

  it('flags only pending complaints as action required', () => {
    expect(
      isPendingComplaint(
        createReview({ isComplaint: true, complaintStatus: ComplaintStatus.PENDING }),
      ),
    ).toBe(true);
    expect(
      isPendingComplaint(
        createReview({ isComplaint: true, complaintStatus: ComplaintStatus.RESOLVED }),
      ),
    ).toBe(false);
  });
});
