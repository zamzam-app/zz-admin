import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ComplaintStatus, type Review } from '../../lib/types/review';
import { useReviewsPageData } from './useReviewsPageData';

function createReview(overrides: Partial<Review> = {}): Review {
  return {
    _id: 'review-1',
    isActive: true,
    isDeleted: false,
    userId: { _id: 'user-1', name: 'Alice' },
    outletId: { _id: 'outlet-1', name: 'Downtown' },
    overallRating: 4.5,
    userResponses: [],
    createdAt: '2026-03-23T10:00:00.000Z',
    ...overrides,
  };
}

describe('useReviewsPageData', () => {
  const reviews = [
    createReview({
      _id: 'review-1',
      outletId: { _id: 'outlet-1', name: 'Downtown' },
      overallRating: 4.8,
      userResponses: [{ questionId: { _id: 'q1', title: 'Staff' }, answer: 5 }],
    }),
    createReview({
      _id: 'review-2',
      outletId: { _id: 'outlet-2', name: 'Airport' },
      userId: { _id: 'user-2', name: 'Bob' },
      overallRating: 1.8,
      isComplaint: true,
      complaintStatus: ComplaintStatus.PENDING,
      createdAt: '2026-03-23T12:00:00.000Z',
    }),
    createReview({
      _id: 'review-3',
      outletId: { _id: 'outlet-2', name: 'Airport' },
      userId: { _id: 'user-3', name: 'Cara' },
      overallRating: 2.2,
      isComplaint: true,
      complaintStatus: ComplaintStatus.RESOLVED,
    }),
  ];

  it('returns all stores and sorts outlet aggregates for admins', () => {
    const { result } = renderHook(() =>
      useReviewsPageData({ role: 'admin', outletId: [] }, reviews, 'all', null),
    );

    expect(result.current.outletOptions).toEqual([
      ['outlet-1', 'Downtown'],
      ['outlet-2', 'Airport'],
    ]);
    expect(result.current.outletAggregates[0].outletName).toBe('Downtown');
    expect(result.current.groupedReviews[5]).toHaveLength(1);
  });

  it('filters reviews and outlets for non-admin users', () => {
    const { result } = renderHook(() =>
      useReviewsPageData({ role: 'cafe', outletId: ['outlet-2'] }, reviews, 'all', null),
    );

    expect(result.current.filteredReviews).toHaveLength(2);
    expect(result.current.outletOptions).toEqual([['outlet-2', 'Airport']]);
  });

  it('builds the critical feed and action required count from pending complaints', () => {
    const { result } = renderHook(() =>
      useReviewsPageData({ role: 'admin', outletId: [] }, reviews, 'all', ComplaintStatus.PENDING),
    );

    expect(result.current.criticalFeed).toHaveLength(1);
    expect(result.current.criticalFeed[0].displayLabel).toContain('Bob');
    expect(result.current.actionRequiredCount).toBe(1);
  });
});
