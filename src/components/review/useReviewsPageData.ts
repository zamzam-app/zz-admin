import { useMemo } from 'react';
import type { Review } from '../../lib/types/review';
import { getOutletId, getOutletName } from '../../lib/types/review';
import { storesList } from '../../__mocks__/managers';
import type { OutletAggregate } from './reviewConstants';
import { buildOutletMetrics } from './reviewUtils';
import { average, round } from './reviewUtils';
import { isPendingComplaint } from './reviewUtils';
import type { CriticalFeedbackItem } from './CriticalFeedbackFeed';

type User = {
  role?: string;
  outletId?: string | string[];
} | null;

export function useReviewsPageData(
  user: User,
  allReviews: Review[],
  selectedOutlet: string,
) {
  const allowedOutletIds = useMemo(() => {
    if (!user) return new Set<string>();
    if (user.role === 'admin') return null;
    if (Array.isArray(user.outletId) && user.outletId.length > 0) return new Set(user.outletId);
    return new Set<string>();
  }, [user]);

  const accessibleStores = useMemo(() => {
    if (!user) return [];
    if (allowedOutletIds === null) return storesList;
    return storesList.filter((store) => allowedOutletIds.has(store.outletId));
  }, [allowedOutletIds, user]);

  const allowedReviews = useMemo(() => {
    if (!user) return [];
    if (allowedOutletIds === null) return allReviews;
    return allReviews.filter((review) => {
      const outletId = getOutletId(review);
      return outletId != null && allowedOutletIds.has(outletId);
    });
  }, [allReviews, allowedOutletIds, user]);

  const filteredReviews = useMemo(() => {
    if (selectedOutlet === 'all') return allowedReviews;
    return allowedReviews.filter((review) => getOutletId(review) === selectedOutlet);
  }, [allowedReviews, selectedOutlet]);

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

  const storeLookup = useMemo(() => {
    return new Map(storesList.map((store) => [store.outletId, store]));
  }, []);

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
      const managerName = store?.managerName ?? 'Manager not assigned';
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
        managerName,
        managerPhone,
        csat,
        metrics: buildOutletMetrics(reviews, csat || 3.5),
      });
    });

    return rows.sort((first, second) => second.csat - first.csat);
  }, [accessibleStores, filteredReviews, selectedOutlet, storeLookup]);

  const criticalFeed = useMemo((): CriticalFeedbackItem[] => {
    if (filteredReviews.length === 0) return [];

    const targetCount = Math.min(
      filteredReviews.length,
      Math.max(3, Math.ceil(filteredReviews.length * 0.1)),
    );
    const sorted = [...filteredReviews].sort((first, second) => {
      const firstPending = isPendingComplaint(first) ? 1 : 0;
      const secondPending = isPendingComplaint(second) ? 1 : 0;

      if (secondPending !== firstPending) return secondPending - firstPending;
      if (first.overallRating !== second.overallRating)
        return first.overallRating - second.overallRating;

      const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      return secondTime - firstTime;
    });

    return sorted.slice(0, targetCount).map((review) => {
      const store = storeLookup.get(getOutletId(review) ?? '');
      return {
        review,
        outletName: getOutletName(review) ?? store?.name ?? 'Outlet',
        managerPhone: store?.managerPhone,
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
