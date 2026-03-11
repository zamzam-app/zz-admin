import { type ReactNode, useMemo, useState } from 'react';
import { Box, ButtonBase, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../lib/context/AuthContext';
import { reviewsApi } from '../lib/services/api/review.api';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import {
  CSAT_TRENDLINE_KEYS,
  GLOBAL_CSAT_KEYS,
  OUTLET_FEEDBACK_SUMMARY_KEYS,
  QUICK_INSIGHTS_KEYS,
  type GlobalCsatPeriod,
  type OutletFeedbackSummaryItem,
  type QuickInsightsResponse,
} from '../lib/types/review';

type Period = GlobalCsatPeriod;
type OutletCount = {
  outletId: string;
  outletName: string;
  count: number;
};

type TrendPoint = {
  label: string;
  current: number | null;
  previous: number | null;
};

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const PERIOD_META: Record<
  Period,
  {
    title: string;
    compareLabel: string;
    offsets: number[];
    bucketLength: number;
    previousOffset: number;
    rangeInDays: number;
  }
> = {
  daily: {
    title: 'CSAT Trendline (7 Days)',
    compareLabel: 'vs previous 7 days',
    offsets: [-6, -5, -4, -3, -2, -1, 0],
    bucketLength: 1,
    previousOffset: 7,
    rangeInDays: 7,
  },
  weekly: {
    title: 'CSAT Trendline (7 Days)',
    compareLabel: 'vs previous 7 days',
    offsets: [-6, -5, -4, -3, -2, -1, 0],
    bucketLength: 1,
    previousOffset: 7,
    rangeInDays: 7,
  },
  monthly: {
    title: 'CSAT Trendline (30 Days)',
    compareLabel: 'vs previous 30 days',
    offsets: [-25, -20, -15, -10, -5, 0],
    bucketLength: 5,
    previousOffset: 30,
    rangeInDays: 30,
  },
};

const IST_TIMEZONE = 'Asia/Kolkata';

function formatHourLabel(hour: number) {
  const display = hour % 12 || 12;
  const period = hour < 12 ? 'AM' : 'PM';
  return `${display} ${period}`;
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: '2-digit',
    timeZone: IST_TIMEZONE,
  }).format(date);
}

function formatTrendLabel(value: string, period: Period) {
  if (period === 'daily') return value;
  return formatDateLabel(value);
}

function getIstHourIndex(value: string): number | null {
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    const hour = Number(
      new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        hour12: false,
        timeZone: IST_TIMEZONE,
      }).format(date),
    );
    return Number.isFinite(hour) ? hour : null;
  }

  const match = value.trim().match(/^(\d{1,2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  if (!Number.isFinite(hour)) return null;
  const ampm = match[2]?.toUpperCase();
  if (ampm) {
    if (hour === 12) hour = 0;
    if (ampm === 'PM') hour += 12;
  }
  if (hour < 0 || hour > 23) return null;
  return hour;
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction='row' spacing={1} alignItems='center'>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: color,
        }}
      />
      <Typography fontSize={13} fontWeight={600} color='#6B7280'>
        {label}
      </Typography>
    </Stack>
  );
}

function IncidentSummaryCard({
  icon,
  title,
  description,
  items,
  loading,
  errorMessage,
  background,
  borderColor,
  accentColor,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  items: OutletCount[];
  loading: boolean;
  errorMessage?: string | null;
  background: string;
  borderColor: string;
  accentColor: string;
}) {
  return (
    <Box
      sx={{
        p: 3,
        minHeight: 260,
        borderRadius: '20px',
        border: `1px solid ${borderColor}`,
        background,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction='row' alignItems='center' spacing={1.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            border: `1px solid ${borderColor}`,
            color: accentColor,
            bgcolor: '#ffffff',
          }}
        >
          {icon}
        </Box>
        <Typography fontSize={18} fontWeight={800} color='#111827'>
          {title}
        </Typography>
      </Stack>

      <Typography mt={1.5} fontSize={13} color='#6B7280'>
        {description}
      </Typography>

      {errorMessage && (
        <Typography mt={1} fontSize={12} color='#B91C1C' fontWeight={600}>
          {errorMessage}
        </Typography>
      )}

      <Box
        sx={{
          mt: 2,
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          bgcolor: '#ffffff',
          px: 1.5,
          py: 1,
          maxHeight: 180,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {loading ? (
          <Stack spacing={1} py={0.5}>
            {Array.from({ length: 3 }, (_, index) => (
              <Stack
                key={index}
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                py={0.5}
              >
                <Skeleton variant='text' width='65%' height={18} />
                <Skeleton variant='rounded' width={32} height={26} />
              </Stack>
            ))}
          </Stack>
        ) : items.length === 0 ? (
          <Typography py={1} fontSize={13} color='#9CA3AF'>
            No data
          </Typography>
        ) : (
          <Stack spacing={0}>
            {items.map((item, index) => (
              <Stack
                key={item.outletId}
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                py={0.75}
                borderBottom={index === items.length - 1 ? 'none' : '1px solid #F3F4F6'}
              >
                <Typography fontSize={13} fontWeight={700} color='#374151'>
                  {item.outletName}
                </Typography>
                <Box
                  sx={{
                    minWidth: 32,
                    height: 26,
                    borderRadius: '999px',
                    border: `1px solid ${borderColor}`,
                    bgcolor: '#ffffff',
                    color: accentColor,
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    px: 1,
                  }}
                >
                  {item.count}
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

export default function Overview() {
  useAuth();
  const [period, setPeriod] = useState<Period>('weekly');

  const trendlineTitle =
    period === 'daily'
      ? 'CSAT Trendline (Today)'
      : period === 'weekly'
        ? 'CSAT Trendline (Last Seven Days)'
        : 'CSAT Trendline (Last 30 Days)';
  const periodDescriptor =
    period === 'daily' ? 'today' : period === 'weekly' ? 'last seven days' : 'last 30 days';

  const {
    data: globalCsat,
    isLoading: isGlobalCsatLoading,
    isError: isGlobalCsatError,
  } = useApiQuery([...GLOBAL_CSAT_KEYS, period], () => reviewsApi.getGlobalCsat({ period }), {
    retry: false,
  });

  const {
    data: trendline,
    isLoading: isTrendlineLoading,
    isError: isTrendlineError,
  } = useApiQuery([...CSAT_TRENDLINE_KEYS, period], () => reviewsApi.getCsatTrendline(period), {
    retry: false,
  });

  const {
    data: outletFeedbackSummary,
    isLoading: isOutletFeedbackLoading,
    isFetching: isOutletFeedbackFetching,
    isError: isOutletFeedbackError,
    error: outletFeedbackError,
  } = useApiQuery(
    [...OUTLET_FEEDBACK_SUMMARY_KEYS, period],
    () => reviewsApi.getOutletFeedbackSummary(period),
    { retry: false },
  );

  const {
    data: quickInsightsData,
    isLoading: isQuickInsightsLoading,
    isError: isQuickInsightsError,
    error: quickInsightsError,
  } = useApiQuery([...QUICK_INSIGHTS_KEYS, period], () => reviewsApi.getQuickInsights(period), {
    retry: false,
  });

  const [lastQuickInsights, setLastQuickInsights] = useState<QuickInsightsResponse | null>(
    quickInsightsData ?? null,
  );
  if (quickInsightsData && quickInsightsData !== lastQuickInsights) {
    setLastQuickInsights(quickInsightsData);
  }

  const outletFeedbackItems = useMemo<OutletFeedbackSummaryItem[]>(
    () => outletFeedbackSummary?.items ?? [],
    [outletFeedbackSummary?.items],
  );

  const negativeFeedbackByOutlet = useMemo<OutletCount[]>(
    () =>
      outletFeedbackItems
        .map((item) => ({
          outletId: item.outletId,
          outletName: item.outletName,
          count: item.negativeFeedbacks ?? 0,
        }))
        .sort((first, second) => second.count - first.count),
    [outletFeedbackItems],
  );

  const totalFeedbackByOutlet = useMemo<OutletCount[]>(
    () =>
      outletFeedbackItems
        .map((item) => ({
          outletId: item.outletId,
          outletName: item.outletName,
          count: item.totalFeedbacks ?? 0,
        }))
        .sort((first, second) => second.count - first.count),
    [outletFeedbackItems],
  );

  const resolvedFeedbackByOutlet = useMemo<OutletCount[]>(
    () =>
      outletFeedbackItems
        .map((item) => ({
          outletId: item.outletId,
          outletName: item.outletName,
          count: item.resolvedFeedbacks ?? 0,
        }))
        .sort((first, second) => second.count - first.count),
    [outletFeedbackItems],
  );

  const isOutletFeedbackLoadingState = isOutletFeedbackLoading || isOutletFeedbackFetching;
  const outletFeedbackErrorMessage = isOutletFeedbackError
    ? (outletFeedbackError?.message ?? 'Failed to load data.')
    : null;

  const quickInsightsSource = quickInsightsData ?? lastQuickInsights;
  const isQuickInsightsLoadingState = isQuickInsightsLoading && !quickInsightsSource;
  const quickInsightsErrorMessage = isQuickInsightsError
    ? (quickInsightsError?.message ?? 'Failed to load quick insights.')
    : null;

  const bucketLabels = useMemo(
    () => Array.from({ length: 9 }, (_, index) => formatHourLabel(index * 3)),
    [],
  );

  const trendData = useMemo<TrendPoint[]>(() => {
    const labels = trendline?.currentPeriod.labels ?? [];
    const currentValues = trendline?.currentPeriod.values ?? [];
    const previousValues = trendline?.previousPeriod.values ?? [];

    if (labels.length > 0) {
      if (period === 'daily') {
        const currentSum = Array.from({ length: 8 }, () => 0);
        const currentCount = Array.from({ length: 8 }, () => 0);
        const previousSum = Array.from({ length: 8 }, () => 0);
        const previousCount = Array.from({ length: 8 }, () => 0);

        labels.forEach((label, index) => {
          const hourIndex = getIstHourIndex(label);
          if (hourIndex == null) return;
          const bucket = Math.floor(hourIndex / 3);
          if (bucket < 0 || bucket > 7) return;

          const currentValue = Number(currentValues[index] ?? 0);
          const previousValue = Number(previousValues[index] ?? 0);

          if (Number.isFinite(currentValue)) {
            currentSum[bucket] += currentValue;
            currentCount[bucket] += 1;
          }
          if (Number.isFinite(previousValue)) {
            previousSum[bucket] += previousValue;
            previousCount[bucket] += 1;
          }
        });

        return bucketLabels.map((label, bucket) => {
          if (bucket >= 8) {
            return { label, current: null, previous: null };
          }
          return {
            label,
            current:
              currentCount[bucket] > 0 ? round(currentSum[bucket] / currentCount[bucket], 2) : 0,
            previous:
              previousCount[bucket] > 0 ? round(previousSum[bucket] / previousCount[bucket], 2) : 0,
          };
        });
      }

      return labels.map((label, index) => ({
        label,
        current: round(currentValues[index] ?? 0, 2),
        previous: round(previousValues[index] ?? 0, 2),
      }));
    }

    if (period === 'daily') {
      return bucketLabels.map((label, index) => ({
        label,
        current: index >= 8 ? null : 0,
        previous: index >= 8 ? null : 0,
      }));
    }

    const fallbackPoints = PERIOD_META[period].offsets.length;
    return Array.from({ length: fallbackPoints }, (_, index) => ({
      label: String(index + 1),
      current: 0,
      previous: 0,
    }));
  }, [bucketLabels, period, trendline]);

  const globalCsatScore = round(globalCsat?.globalCsatScore ?? 0, 1);
  const totalGlobalRatings = globalCsat?.totalRatings ?? 0;
  const hasNoRatings = totalGlobalRatings === 0;
  const scoreDisplay = isGlobalCsatLoading || isGlobalCsatError ? '--' : globalCsatScore.toFixed(1);
  const scoreMetaLabel = isGlobalCsatError
    ? 'Unable to load CSAT from backend'
    : isGlobalCsatLoading
      ? 'Loading CSAT from backend...'
      : hasNoRatings
        ? `No ratings ${periodDescriptor}`
        : `${totalGlobalRatings.toLocaleString()} ratings ${periodDescriptor}`;
  const scoreMetaColor = isGlobalCsatError ? '#B91C1C' : '#6B7280';

  const quickInsights = useMemo(() => {
    const peakIncident = quickInsightsSource?.peakIncidentTime;
    const mostImproved = quickInsightsSource?.mostImprovedOutlet;
    const criticalFocus = quickInsightsSource?.criticalFocusArea;

    const peakValue = peakIncident?.label ?? 'No data';
    const mostImprovedValue = mostImproved
      ? `${mostImproved.outletName ?? 'Unknown Outlet'} (${mostImproved.improvement >= 0 ? '+' : ''}${mostImproved.improvement.toFixed(1)} CSAT)`
      : 'No data';
    const criticalValue = criticalFocus
      ? `${criticalFocus.outletName ?? 'Unknown Outlet'} (${criticalFocus.criticalIssues} critical ${criticalFocus.criticalIssues === 1 ? 'issue' : 'issues'})`
      : 'No data';

    return [
      {
        label: 'Peak Incident Time',
        value: peakValue,
        border: '#FED7AA',
        background: 'linear-gradient(180deg, #FFF9F0 0%, #FFF7ED 100%)',
        accent: '#EA580C',
      },
      {
        label: 'Most Improved Outlet',
        value: mostImprovedValue,
        border: '#BBF7D0',
        background: 'linear-gradient(180deg, #F3FFF8 0%, #ECFDF5 100%)',
        accent: '#16A34A',
      },
      {
        label: 'Critical Focus Area',
        value: criticalValue,
        border: '#FECDD3',
        background: 'linear-gradient(180deg, #FFF5F7 0%, #FFF1F2 100%)',
        accent: '#E11D48',
      },
    ];
  }, [quickInsightsSource]);

  const isTrendlineAllZero = trendData.every(
    (point) => point.current === 0 && point.previous === 0,
  );
  const yMin = 0;
  const yMax = 5;
  const yTicks = [0, 1, 2, 3, 4, 5];

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', lg: 'center' }}
        spacing={2.5}
        mb={4}
      >
        <Box>
          <Typography variant='h4' fontWeight={900} color='#1F2937' letterSpacing='-0.5px'>
            Global Feedback Dashboard
          </Typography>
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            Aggregated monitoring across all business units
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'inline-flex',
            p: 0.5,
            gap: 0.5,
            borderRadius: '999px',
            bgcolor: '#F3F4F6',
            border: '1px solid #E5E7EB',
          }}
        >
          {PERIOD_OPTIONS.map((option) => {
            const isActive = option.value === period;
            return (
              <ButtonBase
                key={option.value}
                onClick={() => setPeriod(option.value)}
                sx={{
                  px: 2.25,
                  py: 1,
                  borderRadius: '999px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: isActive ? '#111827' : '#6B7280',
                  bgcolor: isActive ? '#ffffff' : 'transparent',
                  boxShadow: isActive ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isActive ? '#ffffff' : '#E5E7EB',
                  },
                }}
              >
                {option.label}
              </ButtonBase>
            );
          })}
        </Box>
      </Stack>

      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              p: { xs: 3, md: 3.5 },
              minHeight: 305,
              borderRadius: '24px',
              border: '1px solid #D1FAE5',
              background: 'linear-gradient(180deg, #F7FFFB 0%, #EEFDF5 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Typography
              fontSize={12}
              fontWeight={800}
              letterSpacing='0.2em'
              textTransform='uppercase'
              color='#6B7280'
            >
              Global CSAT Score
            </Typography>

            <Stack direction='row' alignItems='flex-end' spacing={0.5} mt={2}>
              <Typography
                sx={{
                  fontSize: { xs: 60, md: 72 },
                  lineHeight: 0.95,
                  letterSpacing: '-0.06em',
                  fontWeight: 900,
                  color: '#059669',
                }}
              >
                {scoreDisplay}
              </Typography>
              <Typography sx={{ pb: 1.2, fontSize: 30, fontWeight: 800, color: '#94A3B8' }}>
                /5
              </Typography>
            </Stack>

            <Typography mt={2} fontSize={15} fontWeight={700} color={scoreMetaColor}>
              {scoreMetaLabel}
            </Typography>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Box
            sx={{
              p: { xs: 3, md: 3.5 },
              minHeight: 305,
              borderRadius: '24px',
              border: '1px solid #E5E7EB',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={1.5}
              mb={2}
            >
              <Typography fontSize={20} fontWeight={800} color='#111827'>
                {trendlineTitle}
              </Typography>
              <Stack direction='row' spacing={2.5}>
                <LegendItem color='#10B981' label='Current Period' />
                <LegendItem color='#94A3B8' label='Previous Period' />
              </Stack>
            </Stack>

            {isTrendlineError ? (
              <Box
                sx={{
                  width: '100%',
                  height: 235,
                  display: 'grid',
                  placeItems: 'center',
                  textAlign: 'center',
                  color: '#B91C1C',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Unable to load CSAT trendline
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 235 }}>
                {isTrendlineLoading && (
                  <Typography mb={1} fontSize={13} fontWeight={600} color='#6B7280'>
                    Loading CSAT trendline...
                  </Typography>
                )}
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke='#EEF2F7' vertical={false} />
                    <XAxis
                      dataKey='label'
                      axisLine={false}
                      tickLine={false}
                      interval={period === 'daily' ? 0 : 'preserveStartEnd'}
                      ticks={period === 'daily' ? bucketLabels : undefined}
                      tickFormatter={(value) => formatTrendLabel(String(value), period)}
                      tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                      domain={[yMin, yMax]}
                      ticks={yTicks}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 8px 28px rgba(15, 23, 42, 0.12)',
                      }}
                      cursor={{ stroke: '#CBD5E1', strokeDasharray: '4 4' }}
                      labelFormatter={(value) =>
                        period === 'daily' ? `${String(value)} IST` : formatDateLabel(String(value))
                      }
                    />
                    <Line
                      type='monotone'
                      dataKey='current'
                      name='Current Period'
                      stroke='#10B981'
                      strokeWidth={3}
                      dot={{ r: 4.5, strokeWidth: 0, fill: '#10B981' }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
                    />
                    <Line
                      type='monotone'
                      dataKey='previous'
                      name='Previous Period'
                      stroke='#94A3B8'
                      strokeWidth={2.5}
                      strokeDasharray='5 6'
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {isTrendlineAllZero && !isTrendlineLoading && (
                  <Typography
                    mt={1}
                    fontSize={12}
                    fontWeight={600}
                    color='#94A3B8'
                    textAlign='center'
                  >
                    {`No ratings ${periodDescriptor}`}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <IncidentSummaryCard
            icon={<AlertCircle size={20} />}
            title='Total Negative Feedbacks'
            description={`Negative feedbacks recorded ${periodDescriptor}.`}
            items={negativeFeedbackByOutlet}
            loading={isOutletFeedbackLoadingState}
            errorMessage={outletFeedbackErrorMessage}
            background='linear-gradient(180deg, #FFF5F7 0%, #FFF1F2 100%)'
            borderColor='#FECDD3'
            accentColor='#E11D48'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <IncidentSummaryCard
            icon={<AlertTriangle size={20} />}
            title='Total Feedback Received'
            description={`All feedback recorded ${periodDescriptor}.`}
            items={totalFeedbackByOutlet}
            loading={isOutletFeedbackLoadingState}
            errorMessage={outletFeedbackErrorMessage}
            background='linear-gradient(180deg, #FFF9F0 0%, #FFF7ED 100%)'
            borderColor='#FED7AA'
            accentColor='#EA580C'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <IncidentSummaryCard
            icon={<CheckCircle2 size={20} />}
            title='Total Feedbacks Resolved'
            description={`Resolved feedbacks ${periodDescriptor}.`}
            items={resolvedFeedbackByOutlet}
            loading={isOutletFeedbackLoadingState}
            errorMessage={outletFeedbackErrorMessage}
            background='linear-gradient(180deg, #F3FFF8 0%, #ECFDF5 100%)'
            borderColor='#BBF7D0'
            accentColor='#16A34A'
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          p: { xs: 3, md: 3.5 },
          mb: 2,
          borderRadius: '24px',
          border: '1px solid #E5E7EB',
          bgcolor: '#ffffff',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Typography
          fontSize={{ xs: 22, md: 26 }}
          fontWeight={800}
          color='#111827'
          letterSpacing='-0.02em'
        >
          Quick Insights
        </Typography>

        {quickInsightsErrorMessage && (
          <Typography mt={1} fontSize={12} color='#B91C1C' fontWeight={600}>
            {quickInsightsErrorMessage}
          </Typography>
        )}

        {isQuickInsightsLoadingState ? (
          <Stack spacing={2} mt={2.5}>
            {Array.from({ length: 3 }, (_, index) => (
              <Box
                key={index}
                sx={{
                  px: { xs: 2.25, md: 2.75 },
                  py: { xs: 2, md: 2.25 },
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  bgcolor: '#F8FAFC',
                }}
              >
                <Skeleton variant='text' width='40%' height={18} />
                <Skeleton variant='text' width='70%' height={22} />
              </Box>
            ))}
          </Stack>
        ) : (
          <Stack spacing={2} mt={2.5}>
            {quickInsights.map((insight) => (
              <Box
                key={insight.label}
                sx={{
                  px: { xs: 2.25, md: 2.75 },
                  py: { xs: 2, md: 2.25 },
                  borderRadius: '16px',
                  border: `1px solid ${insight.border}`,
                  background: insight.background,
                }}
              >
                <Stack direction='row' spacing={1.2} alignItems='center'>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: insight.accent,
                      flexShrink: 0,
                    }}
                  />
                  <Typography fontSize={{ xs: 13, md: 15 }} fontWeight={700} color='#6B7280'>
                    {insight.label}
                  </Typography>
                </Stack>
                <Typography
                  mt={0.6}
                  fontSize={{ xs: 15, md: 18 }}
                  lineHeight={1.35}
                  fontWeight={800}
                  color='#111827'
                  sx={{ wordBreak: 'break-word' }}
                >
                  {insight.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
