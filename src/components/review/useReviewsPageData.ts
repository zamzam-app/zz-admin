import { useMemo } from 'react';
import type { ComplaintStatusValue, Review } from '../../lib/types/review';
import { getOutletId, getOutletName, getUserName } from '../../lib/types/review';
import type { OutletAggregate } from './reviewConstants';
import { buildOutletMetrics } from './reviewUtils';
import { average, round } from './reviewUtils';
import { isPendingComplaint } from './reviewUtils';
import type { CriticalFeedbackItem } from './CriticalFeedbackFeed';

type User = {
  role?: string;
  outletId?: string | string[];
} | null;

/** Minimal store info derived from review data (no mock). */
type StoreInfo = {
  outletId: string;
  name: string;
  managerNames?: string[];
  managerPhone?: string;
  rating?: number;
};

export function useReviewsPageData(
  user: User,
  allReviews: Review[],
  selectedOutlet: string,
  statusFilter: ComplaintStatusValue | null,
  assignedOutletIds?: string[] | null,
) {
  const allowedOutletIds = useMemo(() => {
    if (!user) return new Set<string>();
    if (user.role === 'admin') return null;
    if (assignedOutletIds && assignedOutletIds.length > 0) return new Set(assignedOutletIds);
    if (Array.isArray(user.outletId) && user.outletId.length > 0) return new Set(user.outletId);
    return new Set<string>();
  }, [assignedOutletIds, user]);

  const allowedReviews = useMemo(() => {
    if (!user) return [];
    if (allowedOutletIds === null) return allReviews;
    return allReviews.filter((review) => {
      const outletId = getOutletId(review);
      return outletId != null && allowedOutletIds.has(outletId);
    });
  }, [allReviews, allowedOutletIds, user]);

  const { storeLookup, accessibleStores } = useMemo(() => {
    const grouped = new Map<string, Review[]>();
    allowedReviews.forEach((review) => {
      const outletId = getOutletId(review);
      if (outletId) {
        const existing = grouped.get(outletId) ?? [];
        existing.push(review);
        grouped.set(outletId, existing);
      }
    });
    const lookup = new Map<string, StoreInfo>();
    grouped.forEach((reviews, outletId) => {
      const name = getOutletName(reviews[0]);
      const rating = average(reviews.map((r) => r.overallRating));
      lookup.set(outletId, {
        outletId,
        name,
        managerNames: [],
        managerPhone: undefined,
        rating: round(rating, 1),
      });
    });
    return {
      storeLookup: lookup,
      accessibleStores: Array.from(lookup.values()),
    };
  }, [allowedReviews]);

  const filteredReviews = useMemo(() => {
    const byOutlet =
      selectedOutlet === 'all'
        ? allowedReviews
        : allowedReviews.filter((review) => getOutletId(review) === selectedOutlet);

    if (!statusFilter) return byOutlet;
    return byOutlet.filter(
      (review) => review.isComplaint === true && review.complaintStatus === statusFilter,
    );
  }, [allowedReviews, selectedOutlet, statusFilter]);

  const outletOptions = useMemo((): [string, string][] => {
    const options = new Map<string, string>();

    accessibleStores.forEach((store) => {
      options.set(store.outletId, store.name);
    });

    allowedReviews.forEach((review) => {
      const outletId = getOutletId(review);
      if (outletId) {
        options.set(outletId, getOutletName(review));
      }
    });

    return Array.from(options.entries());
  }, [accessibleStores, allowedReviews]);

  const outletAggregates = useMemo((): OutletAggregate[] => {
    const grouped = new Map<string, Review[]>();

    filteredReviews.forEach((review) => {
      const outletId = getOutletId(review) ?? 'unknown-outlet';
      const existing = grouped.get(outletId) ?? [];
      existing.push(review);
      grouped.set(outletId, existing);
    });

    const outletIds = new Set<string>();
    grouped.forEach((_, outletId) => outletIds.add(outletId));

    accessibleStores.forEach((store) => {
      if (selectedOutlet === 'all' || selectedOutlet === store.outletId) {
        outletIds.add(store.outletId);
      }
    });

    const rows: OutletAggregate[] = [];

    outletIds.forEach((outletId) => {
      const reviews = grouped.get(outletId) ?? [];
      const store = storeLookup.get(outletId);
      const outletName = reviews[0] ? getOutletName(reviews[0]) : (store?.name ?? 'Unknown Outlet');
      const managerNames =
        store?.managerNames && store.managerNames.length > 0 ? store.managerNames : [];
      const managerPhone = store?.managerPhone;
      const csat = round(
        reviews.length > 0
          ? average(reviews.map((review) => review.overallRating))
          : (store?.rating ?? 0),
        1,
      );

      rows.push({
        outletId,
        outletName,
        managerNames,
        managerPhone,
        csat,
        metrics: buildOutletMetrics(reviews, csat || 3.5),
      });
    });

    return rows.sort((first, second) => second.csat - first.csat);
  }, [accessibleStores, filteredReviews, selectedOutlet, storeLookup]);

  const criticalFeed = useMemo((): CriticalFeedbackItem[] => {
    const isCritical = (review: Review) =>
      review.complaintStatus === 'pending' &&
      (review.isComplaint === true || (review.overallRating ?? 0) < 2.5);

    const criticalReviews = filteredReviews.filter(isCritical);
    if (criticalReviews.length === 0) return [];

    const sorted = [...criticalReviews].sort((first, second) => {
      const firstPending = isPendingComplaint(first) ? 1 : 0;
      const secondPending = isPendingComplaint(second) ? 1 : 0;

      if (secondPending !== firstPending) return secondPending - firstPending;
      if (first.overallRating !== second.overallRating)
        return first.overallRating - second.overallRating;

      const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      return secondTime - firstTime;
    });

    return sorted.map((review) => {
      const store = storeLookup.get(getOutletId(review) ?? '');
      const outletName = getOutletName(review) ?? store?.name ?? 'Outlet';
      const userName = getUserName(review);
      return {
        review,
        outletName,
        displayLabel: `${userName} - ${outletName}`,
        actionRequired: isPendingComplaint(review),
      };
    });
  }, [filteredReviews, storeLookup]);

  const actionRequiredCount = useMemo(
    () => criticalFeed.filter((item) => item.actionRequired).length,
    [criticalFeed],
  );

  const groupedReviews = useMemo(() => {
    const sorted = [...filteredReviews].sort(
      (first, second) => second.overallRating - first.overallRating,
    );

    const groups: Record<number, Review[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    sorted.forEach((review) => {
      const rating = Math.round(review.overallRating);
      if (rating >= 1 && rating <= 5 && groups[rating]) {
        groups[rating].push(review);
      }
    });

    return groups;
  }, [filteredReviews]);

  const ratingOrder = [5, 4, 3, 2, 1];

  return {
    filteredReviews,
    outletOptions,
    outletAggregates,
    criticalFeed,
    actionRequiredCount,
    groupedReviews,
    ratingOrder,
  };
}
