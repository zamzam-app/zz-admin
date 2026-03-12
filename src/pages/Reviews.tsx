import { useState } from 'react';
import { Box, Grid, Stack } from '@mui/material';
import { reviewsApi } from '../lib/services/api/review.api';
import { useAuth } from '../lib/context/AuthContext';
import { REVIEW_KEYS } from '../lib/types/review';
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
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Reviews() {
  const { user } = useAuth();
  const [selectedOutlet, setSelectedOutlet] = useState('all');
  const [previewReviewId, setPreviewReviewId] = useState<string | null>(null);

  const {
    data,
    isLoading: reviewsLoading,
    error,
    refetch,
  } = useApiQuery(REVIEW_KEYS, () => reviewsApi.getAll());

  const allReviews = data?.data ?? [];

  const { data: previewReview = null, isLoading: previewLoading } = useApiQuery(
    [...REVIEW_KEYS, 'detail', previewReviewId ?? ''],
    () => reviewsApi.getOne(previewReviewId!),
    { enabled: !!previewReviewId },
  );

  const {
    filteredReviews,
    outletOptions,
    outletAggregates,
    criticalFeed,
    actionRequiredCount,
    groupedReviews,
    ratingOrder,
  } = useReviewsPageData(user, allReviews, selectedOutlet, sortOrder);

  const handleClosePreview = () => {
    setPreviewReviewId(null);
  };

  const handleCallManager = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`);
    }
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
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        outletOptions={outletOptions}
        showOutletFilter={user?.role === 'admin' || outletOptions.length > 1}
      />

      {loading && (
        <Box flexShrink={0} mb={1}>
          <LoadingSpinner />
        </Box>
      )}

      <Box sx={{ ...scrollableSx, flex: 1, minHeight: 0, pr: 0.5, pb: 1 }}>
        <Stack spacing={3}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <FranchiseRankingCard outletAggregates={outletAggregates} />
            </Grid>
            <Grid size={{ xs: 12, lg: 8 }}>
              <UniversalMetricsHeatmap outletAggregates={outletAggregates} />
            </Grid>
          </Grid>

          <CriticalFeedbackFeed
            items={criticalFeed}
            actionRequiredCount={actionRequiredCount}
            onViewTicket={setPreviewReviewId}
            onCallManager={handleCallManager}
          />

          <AllReviewsSection
            groupedReviews={groupedReviews}
            ratingOrder={ratingOrder}
            totalCount={filteredReviews.length}
            onReviewClick={setPreviewReviewId}
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
