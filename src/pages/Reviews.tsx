import { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Stack } from '@mui/material';
import { reviewsApi } from '../lib/services/api/review.api';
import { useAuth } from '../lib/context/AuthContext';
import {
  REVIEW_KEYS,
  FRANCHISE_ANALYTICS_KEYS,
  type ComplaintStatusValue,
} from '../lib/types/review';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import { ReviewPreviewModal } from '../components/review/ReviewPreviewModal';
import { ReviewsPageHeader } from '../components/review/ReviewsPageHeader';
import { ReviewsErrorState } from '../components/review/ReviewsErrorState';
import { FranchiseRankingCard } from '../components/review/FranchiseRankingCard';
import { UniversalMetricsHeatmap } from '../components/review/UniversalMetricsHeatmap';
import { CriticalFeedbackFeed } from '../components/review/CriticalFeedbackFeed';
import { AllReviewsSection } from '../components/review/AllReviewsSection';
import { useReviewsPageData } from '../components/review/useReviewsPageData';
import { scrollableSx } from '../components/review/reviewConstants';
import type { OutletAggregate } from '../components/review/reviewConstants';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Reviews() {
  const { user } = useAuth();
  const [selectedOutlet, setSelectedOutlet] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatusValue | null>(null);
  const [previewReviewId, setPreviewReviewId] = useState<string | null>(null);

  const {
    data,
    isLoading: reviewsLoading,
    error,
    refetch,
  } = useApiQuery(REVIEW_KEYS, () => reviewsApi.getAll());

  const { data: franchiseData, isLoading: franchiseLoading } = useApiQuery(
    FRANCHISE_ANALYTICS_KEYS,
    () => reviewsApi.getFranchiseAnalytics(),
  );

  const loading = reviewsLoading || franchiseLoading;

  const allReviews = data?.data ?? [];

  const { data: previewReview = null, isLoading: previewLoading } = useApiQuery(
    [...REVIEW_KEYS, 'detail', previewReviewId ?? ''],
    () => reviewsApi.getOne(previewReviewId!),
    { enabled: !!previewReviewId },
  );

  const { filteredReviews, criticalFeed, actionRequiredCount, groupedReviews, ratingOrder } =
    useReviewsPageData(user, allReviews, selectedOutlet, statusFilter);

  const finalOutletOptions = useMemo((): [string, string][] => {
    if (!franchiseData?.franchiseRanking) return [];
    return franchiseData.franchiseRanking.map((r) => [r.outletId, r.outletName]);
  }, [franchiseData]);

  useEffect(() => {
    if (selectedOutlet !== 'all') {
      const exists = finalOutletOptions.some(([id]) => id === selectedOutlet);
      if (!exists) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedOutlet('all');
      }
    }
  }, [finalOutletOptions, selectedOutlet]);

  const outletAggregates = useMemo(() => {
    if (!franchiseData) return [];
    const { franchiseRanking, metricsHeatmap } = franchiseData;

    const rows: OutletAggregate[] = franchiseRanking.map((ranking, index) => {
      const heatmap = metricsHeatmap[index];
      return {
        outletId: ranking.outletId,
        outletName: ranking.outletName,
        managerName: ranking.managerName ?? 'Manager not assigned',
        csat: heatmap?.metrics.overall ?? ranking.csatScore,
        metrics: {
          staff: heatmap?.metrics.staff ?? 0,
          speed: heatmap?.metrics.speed ?? 0,
          clean: heatmap?.metrics.clean ?? 0,
          quality: heatmap?.metrics.quality ?? 0,
        },
      };
    });

    if (selectedOutlet === 'all') return rows;
    return rows.filter((row) => row.outletId === selectedOutlet);
  }, [franchiseData, selectedOutlet]);

  const handleClosePreview = () => {
    setPreviewReviewId(null);
  };

  if (error) {
    return <ReviewsErrorState error={error} onRetry={() => refetch()} />;
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 3,
        boxSizing: 'border-box',
      }}
    >
      <ReviewsPageHeader
        selectedOutlet={selectedOutlet}
        onOutletChange={setSelectedOutlet}
        outletOptions={finalOutletOptions}
        showOutletFilter={user?.role === 'admin' || finalOutletOptions.length > 1}
      />

      {loading && (
        <Box flexShrink={0} mb={1}>
          <LoadingSpinner />
        </Box>
      )}

      <Box sx={{ ...scrollableSx, flex: 1, minHeight: 0, pr: 0.5, pb: 1 }}>
        <Stack spacing={3}>
          <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
            <Grid size={{ xs: 12, lg: 4 }} sx={{ minHeight: 320 }}>
              <Box sx={{ height: '100%' }}>
                <FranchiseRankingCard outletAggregates={outletAggregates} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, lg: 8 }} sx={{ minHeight: 320 }}>
              <Box sx={{ height: '100%' }}>
                <UniversalMetricsHeatmap outletAggregates={outletAggregates} />
              </Box>
            </Grid>
          </Grid>

          <CriticalFeedbackFeed
            items={criticalFeed}
            actionRequiredCount={actionRequiredCount}
            onViewTicket={setPreviewReviewId}
          />

          <AllReviewsSection
            groupedReviews={groupedReviews}
            ratingOrder={ratingOrder}
            totalCount={filteredReviews.length}
            onReviewClick={setPreviewReviewId}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </Stack>
      </Box>

      <ReviewPreviewModal
        open={!!previewReviewId}
        onClose={handleClosePreview}
        review={
          previewReviewId
            ? (allReviews.find((review) => review._id === previewReviewId) ?? previewReview)
            : null
        }
        loading={previewLoading}
      />
    </Box>
  );
}
