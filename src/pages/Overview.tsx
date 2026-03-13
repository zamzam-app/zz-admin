import { useMemo, useState } from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
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
import { PeriodToggle } from '../components/overview/PeriodToggle';
import { GlobalCsatCard } from '../components/overview/GlobalCsatCard';
import { CsatTrendlineCard } from '../components/overview/CsatTrendlineCard';
import { FeedbackSummaryCards } from '../components/overview/FeedbackSummaryCards';
import { QuickInsightsCard } from '../components/overview/QuickInsightsCard';
import type { OutletCount } from '../components/overview/IncidentSummaryCard';

type Period = GlobalCsatPeriod;

type TrendPoint = {
  label: string;
  current: number | null;
  previous: number | null;
};

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

export default function Overview() {
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

  const openComplaintsByOutlet = useMemo<OutletCount[]>(
    () =>
      outletFeedbackItems
        .map((item) => ({
          outletId: item.outletId,
          outletName: item.outletName,
          count: Math.max(0, (item.negativeFeedbacks ?? 0) - (item.resolvedFeedbacks ?? 0)),
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

        <PeriodToggle period={period} onChange={setPeriod} />
      </Stack>

      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <GlobalCsatCard
            scoreDisplay={scoreDisplay}
            scoreMetaLabel={scoreMetaLabel}
            scoreMetaColor={scoreMetaColor}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <CsatTrendlineCard
            trendlineTitle={trendlineTitle}
            trendData={trendData}
            period={period}
            bucketLabels={bucketLabels}
            isTrendlineLoading={isTrendlineLoading}
            isTrendlineError={isTrendlineError}
            isTrendlineAllZero={isTrendlineAllZero}
            yMin={yMin}
            yMax={yMax}
            yTicks={yTicks}
            tickFormatter={(value) => formatTrendLabel(value, period)}
            tooltipLabelFormatter={(value) =>
              period === 'daily' ? `${value} IST` : formatDateLabel(value)
            }
          />
        </Grid>
      </Grid>

      <FeedbackSummaryCards
        negativeItems={negativeFeedbackByOutlet}
        totalItems={totalFeedbackByOutlet}
        resolvedItems={resolvedFeedbackByOutlet}
        loading={isOutletFeedbackLoadingState}
        errorMessage={outletFeedbackErrorMessage}
        periodDescriptor={periodDescriptor}
      />

      <QuickInsightsCard
        insights={quickInsights}
        loading={isQuickInsightsLoadingState}
        errorMessage={quickInsightsErrorMessage}
        openComplaints={openComplaintsByOutlet}
        openComplaintsLoading={isOutletFeedbackLoadingState}
      />
    </Box>
  );
}
