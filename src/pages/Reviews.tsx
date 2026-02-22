import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { Star, AlertTriangle } from 'lucide-react';
import { reviewsApi } from '../lib/services/api/review.api';
import { useAuth } from '../lib/context/AuthContext';
import type { ApiReview, ComplaintReview, Review } from '../lib/types/review';
import { ComplaintStatus, REVIEW_KEYS } from '../lib/types/review';

/** Map API ratings to Review and ComplaintReview lists (pure, for useMemo). */
function mapRatingsToReviews(ratings: ApiReview[]): {
  allReviews: Review[];
  complaintReviews: ComplaintReview[];
} {
  const mapped: Review[] = [];
  const complaints: ComplaintReview[] = [];

  ratings.forEach((r) => {
    const formIdObj = typeof r.formId === 'object' && r.formId !== null ? r.formId : null;
    const questionMap = new Map(formIdObj?.questions?.map((q) => [q._id, q.type]) ?? []);

    let customerName = 'Anonymous';
    let commentText = '';

    for (const res of r.userResponses ?? []) {
      const questionType = questionMap.get(res.questionId);
      const answer = res.answer;

      if (questionType === 'short_answer') {
        customerName = Array.isArray(answer)
          ? (answer[0]?.toString() ?? 'Anonymous')
          : (answer?.toString() ?? 'Anonymous');
      }

      if (questionType === 'paragraph') {
        commentText = Array.isArray(answer)
          ? (answer[0]?.toString() ?? '')
          : (answer?.toString() ?? '');
      }
    }

    const outletIdObj = typeof r.outletId === 'object' && r.outletId !== null ? r.outletId : null;
    const baseReview: Review = {
      id: r._id,
      customer: customerName,
      outletId: outletIdObj?._id ?? (typeof r.outletId === 'string' ? r.outletId : ''),
      outletName: outletIdObj?.name ?? 'Outlet',
      rating: r.overallRating ?? 0,
      comment: commentText,
      date: new Date(r.createdAt).toLocaleDateString(),
    };

    mapped.push(baseReview);

    const pendingComplaintQuestions = (r.userResponses ?? []).filter(
      (res) => res.isComplaint === true && res.complaintStatus === ComplaintStatus.PENDING,
    );

    if (pendingComplaintQuestions.length > 0) {
      complaints.push({
        ...baseReview,
        complaintQuestions: pendingComplaintQuestions.map((q) => ({
          questionId: q.questionId,
          answer: q.answer,
          complaintStatus: q.complaintStatus,
        })),
      });
    }
  });

  return { allReviews: mapped, complaintReviews: complaints };
}
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import { ReviewPreviewModal } from '../components/resource/ReviewPreviewModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';
import { Button as CommonButton } from '../components/common/Button';

/* ─── scrollable container sx (hidden scrollbar) ─── */
const scrollableSx = {
  overflowY: 'auto',
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
} as const;

export default function ReviewsDemo() {
  const { user } = useAuth();
  const [selectedOutlet, setSelectedOutlet] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [previewReviewId, setPreviewReviewId] = useState<string | null>(null);

  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useApiQuery(REVIEW_KEYS, () => reviewsApi.getAll());

  const { allReviews, complaintReviews } = useMemo(() => {
    const ratings = data?.data ?? [];
    return mapRatingsToReviews(ratings);
  }, [data?.data]);

  const { data: previewReview = null, isLoading: previewLoading } = useApiQuery(
    [...REVIEW_KEYS, 'detail', previewReviewId ?? ''],
    () => reviewsApi.getOne(previewReviewId!),
    { enabled: !!previewReviewId },
  );

  const handleClosePreview = () => {
    setPreviewReviewId(null);
  };

  /* ================= FILTER LOGIC ================= */
  const filteredReviews = useMemo(() => {
    if (!user) return [];

    let reviews = allReviews;

    if (user.role !== 'admin' && Array.isArray(user.outletId) && user.outletId.length > 0) {
      reviews = reviews.filter((r) => user.outletId!.includes(r.outletId));
    }

    if (selectedOutlet !== 'all') {
      reviews = reviews.filter((r) => r.outletId === selectedOutlet);
    }

    return reviews;
  }, [selectedOutlet, user, allReviews]);

  /* ─── Complaint reviews filtered by role & outlet ─── */
  const filteredComplaints = useMemo(() => {
    if (!user) return [];

    let reviews = complaintReviews;

    // Manager: only their outlets
    if (user.role !== 'admin' && Array.isArray(user.outletId) && user.outletId.length > 0) {
      reviews = reviews.filter((r) => user.outletId!.includes(r.outletId));
    }

    // Apply outlet filter if selected
    if (selectedOutlet !== 'all') {
      reviews = reviews.filter((r) => r.outletId === selectedOutlet);
    }

    return reviews;
  }, [user, complaintReviews, selectedOutlet]);

  const hasComplaints = filteredComplaints.length > 0;

  /*  OUTLET LIST  */
  const outlets = useMemo(() => {
    let base = allReviews;

    if (user?.role !== 'admin' && Array.isArray(user?.outletId)) {
      base = base.filter((r) => user.outletId!.includes(r.outletId));
    }

    return Array.from(new Map(base.map((r) => [r.outletId, r.outletName])).entries());
  }, [user, allReviews]);

  /*  SORT + GROUP  */
  const groupedReviews = useMemo(() => {
    const sorted = [...filteredReviews].sort((a, b) =>
      sortOrder === 'asc' ? a.rating - b.rating : b.rating - a.rating,
    );

    const groups: Record<number, Review[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    sorted.forEach((review) => {
      if (groups[review.rating]) {
        groups[review.rating].push(review);
      }
    });

    return groups;
  }, [filteredReviews, sortOrder]);

  const ratingOrder = sortOrder === 'asc' ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1];

  /* ─── placeholder handlers ─── */
  const handleResolve = () => {
    // TODO: implement resolve API call
    console.log('resoluton logic not done!');
  };

  const handleReject = () => {
    // TODO: implement reject API call
    console.log('rejection logic not done!');
  };

  if (error) {
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
        <Box mb={2}>
          <Typography variant='h4' fontWeight={800}>
            Reviews
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Customer feedback grouped by rating
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <NoDataFallback
            title='Failed to load reviews'
            description={error.message}
            action={
              <CommonButton
                variant='admin-primary'
                onClick={() => refetch()}
                className='rounded-2xl'
              >
                Try again
              </CommonButton>
            }
          />
        </Box>
      </Box>
    );
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
      {/* ═══════ HEADER ═══════ */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        mb={2}
        flexShrink={0}
      >
        <Box>
          <Typography variant='h4' fontWeight={800}>
            Reviews
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Customer feedback grouped by rating
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          width={{ xs: '100%', sm: 'auto' }}
        >
          {/* Outlet Filter */}
          {(user?.role === 'admin' ||
            (Array.isArray(user?.outletId) && user.outletId.length > 1)) && (
            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Outlet</InputLabel>
              <Select
                value={selectedOutlet}
                label='Filter by Outlet'
                onChange={(e) => setSelectedOutlet(e.target.value)}
              >
                <MenuItem value='all'>All Outlets</MenuItem>
                {outlets.map(([id, name]) => (
                  <MenuItem key={id} value={id}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Sort Filter */}
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>Sort by Rating</InputLabel>
            <Select
              value={sortOrder}
              label='Sort by Rating'
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <MenuItem value='desc'>Highest to Lowest</MenuItem>
              <MenuItem value='asc'>Lowest to Highest</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* Loading */}
      {loading && (
        <Box flexShrink={0} mb={1}>
          <LoadingSpinner />
        </Box>
      )}

      {/* ═══════ SECTIONS CONTAINER ═══════ */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* ─── COMPLAINTS SECTION (conditional) ─── */}
        {hasComplaints && (
          <Box
            sx={{
              flex: '0 0 40%',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              mb: 2,
            }}
          >
            {/* Section header */}
            <Box display='flex' alignItems='center' gap={1} mb={1.5} flexShrink={0}>
              <AlertTriangle size={20} color='#dc2626' />
              <Typography variant='h6' fontWeight={700} color='#dc2626'>
                Pending Complaints
              </Typography>
              <Typography
                variant='body2'
                sx={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  px: 1.5,
                  py: 0.25,
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {filteredComplaints.length}
              </Typography>
            </Box>

            {/* Complaint cards – scrollable */}
            <Box
              sx={{
                ...scrollableSx,
                flex: 1,
                minHeight: 0,
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 2,
                alignContent: 'start',
                pr: 0.5,
              }}
            >
              {filteredComplaints.map((review) => (
                <Box
                  key={review.id}
                  onClick={() => setPreviewReviewId(review.id)}
                  sx={{
                    width: 280,
                    p: 2.5,
                    borderRadius: '16px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                    backgroundColor: '#fff',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' },
                  }}
                >
                  <Box display='flex' justifyContent='space-between'>
                    <Box display='flex' alignItems='center' gap={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>{review.customer.charAt(0)}</Avatar>
                      <Typography fontWeight={700} fontSize={14}>
                        {review.customer}
                      </Typography>
                    </Box>
                    <Typography variant='caption' color='text.secondary'>
                      {review.date}
                    </Typography>
                  </Box>

                  <Typography variant='caption' sx={{ fontWeight: 600, color: '#6B7280' }}>
                    {review.outletName}
                  </Typography>

                  <Box display='flex' gap={0.5}>
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={16} fill='#D4AF37' color='#D4AF37' />
                    ))}
                  </Box>

                  <Typography variant='body2' sx={{ fontSize: 14, color: '#374151' }}>
                    {review.comment}
                  </Typography>

                  {/* ── Action buttons ── */}
                  <Box display='flex' gap={1} mt='auto' onClick={(e) => e.stopPropagation()}>
                    <Button
                      size='small'
                      onClick={() => handleResolve()}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        '&:hover': { backgroundColor: '#bbf7d0' },
                      }}
                    >
                      Resolve
                    </Button>
                    <Button
                      size='small'
                      onClick={() => handleReject()}
                      sx={{
                        flex: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        '&:hover': { backgroundColor: '#fecaca' },
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ─── ALL REVIEWS SECTION ─── */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {/* Section header */}
          <Box display='flex' alignItems='center' gap={1} mb={1.5} flexShrink={0}>
            <Typography variant='h6' fontWeight={700}>
              All Reviews
            </Typography>
          </Box>

          {/* All reviews – scrollable */}
          <Box sx={{ ...scrollableSx, flex: 1, minHeight: 0, pr: 0.5 }}>
            {ratingOrder.map((rating) =>
              groupedReviews[rating].length > 0 ? (
                <Box key={rating} mb={4}>
                  {/* Rating Header */}
                  <Box display='flex' alignItems='center' gap={1} mb={2}>
                    {[...Array(rating)].map((_, i) => (
                      <Star key={i} size={18} fill='#D4AF37' color='#D4AF37' />
                    ))}
                    <Typography fontWeight={700}>({groupedReviews[rating].length})</Typography>
                  </Box>

                  {/* Cards Grid */}
                  <Box
                    display='grid'
                    gridTemplateColumns={{
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(3, 1fr)',
                      lg: 'repeat(4, 1fr)',
                    }}
                    gap={2}
                  >
                    {groupedReviews[rating].map((review) => (
                      <Box
                        key={review.id}
                        onClick={() => setPreviewReviewId(review.id)}
                        sx={{
                          width: 280,
                          p: 2.5,
                          borderRadius: '16px',
                          boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                          backgroundColor: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                          cursor: 'pointer',
                          '&:hover': { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' },
                        }}
                      >
                        <Box display='flex' justifyContent='space-between'>
                          <Box display='flex' alignItems='center' gap={1}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {review.customer.charAt(0)}
                            </Avatar>
                            <Typography fontWeight={700} fontSize={14}>
                              {review.customer}
                            </Typography>
                          </Box>
                          <Typography variant='caption' color='text.secondary'>
                            {review.date}
                          </Typography>
                        </Box>

                        <Typography variant='caption' sx={{ fontWeight: 600, color: '#6B7280' }}>
                          {review.outletName}
                        </Typography>

                        <Box display='flex' gap={0.5}>
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} size={16} fill='#D4AF37' color='#D4AF37' />
                          ))}
                        </Box>

                        <Typography variant='body2' sx={{ fontSize: 14, color: '#374151' }}>
                          {review.comment}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : null,
            )}

            {!loading && filteredReviews.length === 0 && (
              <Box py={10} textAlign='center'>
                <Typography color='text.secondary'>No reviews found for this selection.</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <ReviewPreviewModal
        open={!!previewReviewId}
        onClose={handleClosePreview}
        review={previewReviewId ? previewReview : null}
        loading={previewLoading}
      />
    </Box>
  );
}
