import { useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  ButtonBase,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { AlertTriangle, Phone, Star } from 'lucide-react';
import { reviewsApi } from '../lib/services/api/review.api';
import { useAuth } from '../lib/context/AuthContext';
import type { Review } from '../lib/types/review';
import {
  ComplaintStatus,
  REVIEW_KEYS,
  getOutletId,
  getOutletName,
  getUserName,
} from '../lib/types/review';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import { ReviewPreviewModal } from '../components/ratings/ReviewPreviewModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';
import { Button as CommonButton } from '../components/common/Button';
import { storesList } from '../__mocks__/managers';

type MetricKey = 'staff' | 'speed' | 'clean' | 'quality';

type OutletAggregate = {
  outletId: string;
  outletName: string;
  managerName: string;
  managerPhone?: string;
  csat: number;
  metrics: Record<MetricKey, number>;
};

const METRIC_ORDER: MetricKey[] = ['staff', 'speed', 'clean', 'quality'];

const METRIC_LABEL: Record<MetricKey, string> = {
  staff: 'Staff',
  speed: 'Speed',
  clean: 'Clean',
  quality: 'Quality',
};

const METRIC_MATCHERS: Record<MetricKey, RegExp> = {
  staff: /(staff|service|team|friendly|attitude)/i,
  speed: /(speed|wait|time|quick|fast)/i,
  clean: /(clean|hygiene|sanitize|sanitation|tidy)/i,
  quality: /(quality|taste|food|fresh|product)/i,
};

const METRIC_OFFSETS: Record<MetricKey, number> = {
  staff: 0.1,
  speed: -0.15,
  clean: 0.05,
  quality: 0.15,
};

function getReviewComment(review: Review): string {
  const response = (review.userResponses ?? []).find((item) => typeof item.answer !== 'number');
  if (!response) return '—';
  if (Array.isArray(response.answer))
    return response.answer.length > 0 ? response.answer.join(', ') : '—';
  return String(response.answer ?? '—');
}

const scrollableSx = {
  overflowY: 'auto',
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
} as const;

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function clampScore(value: number) {
  return Math.max(1, Math.min(5, value));
}

function formatDateTime(source?: string) {
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

function isPendingComplaint(review: Review) {
  return review.isComplaint === true && review.complaintStatus === ComplaintStatus.PENDING;
}

function buildOutletMetrics(reviews: Review[], baseScore: number): Record<MetricKey, number> {
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

function getHeatCellStyle(score: number) {
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

function getRatingBadgeStyle(score: number) {
  if (score >= 4) return { backgroundColor: '#ECFDF5', color: '#047857' };
  if (score >= 3) return { backgroundColor: '#FFF7E6', color: '#B45309' };
  return { backgroundColor: '#FEE2E2', color: '#B91C1C' };
}

export default function Reviews() {
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

  const allReviews = useMemo(() => data?.data ?? [], [data?.data]);

  const { data: previewReview = null, isLoading: previewLoading } = useApiQuery(
    [...REVIEW_KEYS, 'detail', previewReviewId ?? ''],
    () => reviewsApi.getOne(previewReviewId!),
    { enabled: !!previewReviewId },
  );

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

  const outletAggregates = useMemo(() => {
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

  const criticalFeed = useMemo(() => {
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
    const sorted = [...filteredReviews].sort((first, second) =>
      sortOrder === 'asc'
        ? first.overallRating - second.overallRating
        : second.overallRating - first.overallRating,
    );

    const groups: Record<number, Review[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    sorted.forEach((review) => {
      const rating = Math.round(review.overallRating);
      if (rating >= 1 && rating <= 5 && groups[rating]) {
        groups[rating].push(review);
      }
    });

    return groups;
  }, [filteredReviews, sortOrder]);

  const ratingOrder = sortOrder === 'asc' ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1];

  const handleClosePreview = () => {
    setPreviewReviewId(null);
  };

  const handleCallManager = (phone?: string) => {
    if (phone) {
      window.open(`tel:${phone}`);
    }
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
            Outlet ranking, service metrics and critical feedback feed
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
            Franchise Ranking, Universal Metrics Heatmap and critical feedback intelligence.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {(user?.role === 'admin' || outletOptions.length > 1) && (
            <FormControl size='small' sx={{ minWidth: 220 }}>
              <InputLabel>Filter by Outlet</InputLabel>
              <Select
                value={selectedOutlet}
                label='Filter by Outlet'
                onChange={(event) => setSelectedOutlet(event.target.value)}
              >
                <MenuItem value='all'>All Outlets</MenuItem>
                {outletOptions.map(([id, name]) => (
                  <MenuItem key={id} value={id}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>All Reviews Order</InputLabel>
            <Select
              value={sortOrder}
              label='All Reviews Order'
              onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}
            >
              <MenuItem value='desc'>Highest to Lowest</MenuItem>
              <MenuItem value='asc'>Lowest to Highest</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {loading && (
        <Box flexShrink={0} mb={1}>
          <LoadingSpinner />
        </Box>
      )}

      <Box sx={{ ...scrollableSx, flex: 1, minHeight: 0, pr: 0.5, pb: 1 }}>
        <Stack spacing={3}>
          {/* 1) Franchise Ranking + 2) Universal Metrics Heatmap */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Box
                sx={{
                  borderRadius: '22px',
                  border: '1px solid #E5E7EB',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  overflow: 'hidden',
                }}
              >
                <Stack
                  direction='column'
                  justifyContent='space-between'
                  alignItems='left'
                  px={3}
                  py={2.5}
                  borderBottom='1px solid #F3F4F6'
                >
                  <Typography
                    fontSize={20}
                    fontWeight={900}
                    color='#111827'
                    letterSpacing='-0.04em'
                  >
                    Franchise Ranking
                  </Typography>
                  <Typography
                    fontSize={10}
                    fontWeight={700}
                    color='#9CA3AF'
                    textTransform='uppercase'
                  >
                    Sorted by CSAT
                  </Typography>
                </Stack>

                {outletAggregates.length === 0 ? (
                  <Box px={3} py={5}>
                    <Typography color='text.secondary'>No outlet data for this filter.</Typography>
                  </Box>
                ) : (
                  outletAggregates.map((row, index) => (
                    <Stack
                      key={row.outletId}
                      direction='row'
                      justifyContent='space-between'
                      alignItems='center'
                      px={3}
                      py={2.5}
                      borderTop={index === 0 ? undefined : '1px solid #F3F4F6'}
                    >
                      <Stack direction='row' spacing={1.5} alignItems='flex-start'>
                        <Typography
                          fontSize={15}
                          lineHeight={2}
                          fontWeight={900}
                          color='#9CA3AF'
                          letterSpacing='-0.03em'
                        >
                          #{index + 1}
                        </Typography>
                        <Box>
                          <Typography fontSize={15} fontWeight={800} color='#111827'>
                            {row.outletName}
                          </Typography>
                          <Typography fontSize={12} color='#6B7280'>
                            Manager: {row.managerName}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack direction='row' spacing={0.6} alignItems='center'>
                        <Star size={10} fill='#D4AF37' color='#D4AF37' />
                        <Typography
                          fontSize={20}
                          fontWeight={900}
                          color='#111827'
                          letterSpacing='-0.03em'
                        >
                          {row.csat.toFixed(1)}
                        </Typography>
                      </Stack>
                    </Stack>
                  ))
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <Box
                sx={{
                  borderRadius: '22px',
                  border: '1px solid #E5E7EB',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  overflow: 'hidden',
                }}
              >
                <Box px={3} py={2.5} borderBottom='1px solid #F3F4F6'>
                  <Typography
                    fontSize={30}
                    fontWeight={900}
                    color='#111827'
                    letterSpacing='-0.04em'
                  >
                    Universal Metrics Heatmap
                  </Typography>
                </Box>

                <Box px={2.5} py={2.5} sx={{ overflowX: 'auto' }}>
                  <Box sx={{ minWidth: 780 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '2fr repeat(5, minmax(90px, 1fr))',
                        gap: 1.2,
                        alignItems: 'center',
                        pb: 1.25,
                      }}
                    >
                      <Typography
                        fontSize={13}
                        fontWeight={800}
                        color='#9CA3AF'
                        textTransform='uppercase'
                      >
                        Outlet
                      </Typography>
                      {METRIC_ORDER.map((metric) => (
                        <Typography
                          key={metric}
                          textAlign='center'
                          fontSize={13}
                          fontWeight={800}
                          color='#9CA3AF'
                          textTransform='uppercase'
                        >
                          {METRIC_LABEL[metric]}
                        </Typography>
                      ))}
                      <Typography
                        textAlign='center'
                        fontSize={13}
                        fontWeight={800}
                        color='#9CA3AF'
                        textTransform='uppercase'
                      >
                        Overall
                      </Typography>
                    </Box>

                    <Stack spacing={1.1}>
                      {outletAggregates.length === 0 && (
                        <Typography px={1} py={2} color='text.secondary'>
                          No heatmap data available.
                        </Typography>
                      )}

                      {outletAggregates.map((row) => (
                        <Box
                          key={row.outletId}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '2fr repeat(5, minmax(90px, 1fr))',
                            gap: 1.2,
                            alignItems: 'center',
                          }}
                        >
                          <Typography fontSize={16} fontWeight={700} color='#111827' px={0.5}>
                            {row.outletName}
                          </Typography>

                          {METRIC_ORDER.map((metric) => {
                            const value = row.metrics[metric];
                            const heatStyle = getHeatCellStyle(value);

                            return (
                              <Box
                                key={metric}
                                sx={{
                                  height: 38,
                                  borderRadius: '10px',
                                  border: `1px solid ${heatStyle.borderColor}`,
                                  bgcolor: heatStyle.backgroundColor,
                                  color: heatStyle.color,
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: 16,
                                  fontWeight: 900,
                                }}
                              >
                                {value.toFixed(1)}
                              </Box>
                            );
                          })}

                          {(() => {
                            const overallStyle = getHeatCellStyle(row.csat);

                            return (
                              <Box
                                sx={{
                                  height: 38,
                                  borderRadius: '10px',
                                  border: `1px solid ${overallStyle.borderColor}`,
                                  bgcolor: overallStyle.backgroundColor,
                                  color: overallStyle.color,
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: 16,
                                  fontWeight: 900,
                                }}
                              >
                                {row.csat.toFixed(1)}
                              </Box>
                            );
                          })()}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* 3) Critical Feedback Feed */}
          <Box
            sx={{
              borderRadius: '22px',
              border: '1px solid #E5E7EB',
              bgcolor: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              overflow: 'hidden',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1.5}
              px={3}
              py={2.5}
              borderBottom='1px solid #F3F4F6'
            >
              <Stack direction='row' spacing={1.2} alignItems='center'>
                <AlertTriangle size={20} color='#DC2626' />
                <Typography fontSize={30} fontWeight={900} color='#111827' letterSpacing='-0.04em'>
                  Critical Feedback Feed (Bottom 10%)
                </Typography>
              </Stack>

              {actionRequiredCount > 0 && (
                <Box
                  sx={{
                    px: 1.6,
                    py: 0.55,
                    borderRadius: '999px',
                    border: '1px solid #FCA5A5',
                    bgcolor: '#FEF2F2',
                    color: '#B91C1C',
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {actionRequiredCount} Action Required
                </Box>
              )}
            </Stack>

            <Stack spacing={0}>
              {criticalFeed.length === 0 && (
                <Box px={3} py={5}>
                  <Typography color='text.secondary'>
                    No critical feedback for this filter.
                  </Typography>
                </Box>
              )}

              {criticalFeed.map((item, index) => {
                const badgeStyle = getRatingBadgeStyle(item.review.overallRating);

                return (
                  <Box
                    key={item.review._id}
                    px={3}
                    py={2.75}
                    borderTop={index === 0 ? undefined : '1px solid #F3F4F6'}
                  >
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent='space-between'
                      alignItems={{ xs: 'flex-start', md: 'flex-start' }}
                      spacing={2}
                    >
                      <Stack direction='row' spacing={1.5} alignItems='flex-start' flex={1}>
                        <Box
                          sx={{
                            minWidth: 42,
                            height: 42,
                            borderRadius: '12px',
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: badgeStyle.backgroundColor,
                            color: badgeStyle.color,
                            fontSize: 18,
                            fontWeight: 900,
                          }}
                        >
                          {item.review.overallRating}★
                        </Box>

                        <Box>
                          <Typography fontSize={21} fontWeight={800} color='#111827'>
                            {item.outletName}
                          </Typography>
                          <Typography mt={0.5} fontSize={19} color='#4B5563' fontStyle='italic'>
                            "{getReviewComment(item.review)}"
                          </Typography>

                          <Stack direction='row' spacing={1.2} mt={1.5} flexWrap='wrap'>
                            <ButtonBase
                              onClick={() => setPreviewReviewId(item.review._id)}
                              sx={{
                                height: 34,
                                px: 1.8,
                                borderRadius: '999px',
                                border: '1px solid #CBD5E1',
                                bgcolor: '#FFFFFF',
                                color: '#334155',
                                fontSize: 12,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              View Ticket
                            </ButtonBase>

                            <ButtonBase
                              onClick={() => handleCallManager(item.managerPhone)}
                              disabled={!item.managerPhone}
                              sx={{
                                height: 34,
                                px: 1.8,
                                borderRadius: '999px',
                                border: '1px solid #A7F3D0',
                                bgcolor: '#ECFDF5',
                                color: '#047857',
                                fontSize: 12,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.7,
                                '&:disabled': {
                                  borderColor: '#E5E7EB',
                                  bgcolor: '#F9FAFB',
                                  color: '#9CA3AF',
                                },
                              }}
                            >
                              <Phone size={13} />
                              Call Manager
                            </ButtonBase>
                          </Stack>
                        </Box>
                      </Stack>

                      <Typography fontSize={14} color='#9CA3AF' fontWeight={600}>
                        {formatDateTime(item.review.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* 4) All Reviews */}
          <Box
            sx={{
              borderRadius: '22px',
              border: '1px solid #E5E7EB',
              bgcolor: '#FFFFFF',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              p: 3,
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
              mb={2}
            >
              <Typography fontSize={30} fontWeight={900} color='#111827' letterSpacing='-0.04em'>
                All Reviews
              </Typography>
              <Typography fontSize={14} color='#6B7280' fontWeight={600}>
                {filteredReviews.length} review{filteredReviews.length === 1 ? '' : 's'}
              </Typography>
            </Stack>

            {filteredReviews.length === 0 ? (
              <Box py={4}>
                <Typography color='text.secondary'>No reviews found for this selection.</Typography>
              </Box>
            ) : (
              <Stack spacing={3}>
                {ratingOrder.map((rating) =>
                  groupedReviews[rating].length > 0 ? (
                    <Box key={rating}>
                      <Stack direction='row' alignItems='center' spacing={1} mb={1.5}>
                        <Stack direction='row' spacing={0.3}>
                          {[...Array(rating)].map((_, index) => (
                            <Star key={index} size={16} fill='#D4AF37' color='#D4AF37' />
                          ))}
                        </Stack>
                        <Typography fontSize={14} fontWeight={700} color='#6B7280'>
                          ({groupedReviews[rating].length})
                        </Typography>
                      </Stack>

                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: 'repeat(2, minmax(0, 1fr))',
                            xl: 'repeat(3, minmax(0, 1fr))',
                          },
                          gap: 2,
                        }}
                      >
                        {groupedReviews[rating].map((review) => (
                          <Box
                            key={review._id}
                            onClick={() => setPreviewReviewId(review._id)}
                            sx={{
                              p: 2.25,
                              borderRadius: '14px',
                              border: '1px solid #E5E7EB',
                              bgcolor: '#FFFFFF',
                              boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.10)',
                                borderColor: '#D1D5DB',
                              },
                            }}
                          >
                            <Stack
                              direction='row'
                              justifyContent='space-between'
                              alignItems='flex-start'
                              mb={1}
                            >
                              <Stack direction='row' spacing={1} alignItems='center'>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {getUserName(review).charAt(0)}
                                </Avatar>
                                <Typography fontSize={14} fontWeight={700} color='#111827'>
                                  {getUserName(review)}
                                </Typography>
                              </Stack>
                              <Typography fontSize={12} color='#9CA3AF'>
                                {review.createdAt
                                  ? new Date(review.createdAt).toLocaleDateString()
                                  : '—'}
                              </Typography>
                            </Stack>

                            <Typography
                              fontSize={12}
                              fontWeight={700}
                              color='#6B7280'
                              textTransform='uppercase'
                            >
                              {getOutletName(review)}
                            </Typography>

                            <Stack direction='row' spacing={0.3} mt={1}>
                              {[...Array(Math.round(review.overallRating))].map((_, index) => (
                                <Star key={index} size={14} fill='#D4AF37' color='#D4AF37' />
                              ))}
                            </Stack>

                            <Typography mt={1.2} fontSize={14} color='#374151'>
                              {getReviewComment(review)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ) : null,
                )}
              </Stack>
            )}
          </Box>
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
