import { type ReactNode, useMemo, useState } from 'react';
import { Box, ButtonBase, Grid, Stack, Typography } from '@mui/material';
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
import { storesList } from '../__mocks__/managers';
import { reviewsApi } from '../lib/services/api/review.api';
import { useApiQuery } from '../lib/react-query/use-api-hooks';
import {
  CSAT_TRENDLINE_KEYS,
  ComplaintStatus,
  type ComplaintStatusValue,
  GLOBAL_CSAT_KEYS,
  INCIDENTS_OVERVIEW_KEYS,
  REVIEW_KEYS,
  type GlobalCsatPeriod,
  type Review,
  getOutletId,
  getOutletName,
} from '../lib/types/review';

type Period = GlobalCsatPeriod;
type IncidentStatus = ComplaintStatusValue | 'none';

type IncidentRecord = {
  outletId: string;
  rating: number;
  createdAt: string;
  isComplaint: boolean;
  status: IncidentStatus;
  resolvedAt?: string;
};

type TrendPoint = {
  label: string;
  current: number;
  previous: number;
};

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const INCIDENT_TIME_SLOTS = [
  { startHour: 0, endHour: 3, label: '00:00 - 03:00', context: 'Late Night' },
  { startHour: 3, endHour: 6, label: '03:00 - 06:00', context: 'Early Morning' },
  { startHour: 6, endHour: 9, label: '06:00 - 09:00', context: 'Breakfast Rush' },
  { startHour: 9, endHour: 12, label: '09:00 - 12:00', context: 'Morning Window' },
  { startHour: 12, endHour: 15, label: '12:00 - 15:00', context: 'Lunch Rush' },
  { startHour: 15, endHour: 18, label: '15:00 - 18:00', context: 'Afternoon Window' },
  { startHour: 18, endHour: 21, label: '18:00 - 21:00', context: 'Dinner Rush' },
  { startHour: 21, endHour: 24, label: '21:00 - 24:00', context: 'Late Evening' },
] as const;

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
    title: 'CSAT Trendline (8 Weeks)',
    compareLabel: 'vs previous 8 weeks',
    offsets: [-49, -42, -35, -28, -21, -14, -7, 0],
    bucketLength: 7,
    previousOffset: 56,
    rangeInDays: 56,
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

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function shiftDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function isBetween(source: string, start: Date, end: Date) {
  if (!source) return false;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
}

function getIncidentSlotIndex(source: string) {
  if (!source) return 0;
  const date = new Date(source);
  if (Number.isNaN(date.getTime())) return 0;
  const hour = date.getHours();
  const matchIndex = INCIDENT_TIME_SLOTS.findIndex(
    (slot) => hour >= slot.startHour && hour < slot.endHour,
  );
  return matchIndex >= 0 ? matchIndex : 0;
}

function normalizeReviews(reviews: Review[]): IncidentRecord[] {
  return reviews.map((review) => {
    let status: IncidentStatus = 'none';
    const isComplaint = review.isComplaint === true || review.complaintStatus != null;
    if (isComplaint) {
      status = review.complaintStatus ?? ComplaintStatus.PENDING;
    }

    return {
      outletId: getOutletId(review) ?? 'unknown-outlet',
      rating: review.overallRating || 0,
      createdAt: review.createdAt ?? '',
      isComplaint,
      status,
      resolvedAt: review.resolvedAt,
    };
  });
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

function IncidentCard({
  icon,
  title,
  value,
  description,
  background,
  borderColor,
  accentColor,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  description: string;
  background: string;
  borderColor: string;
  accentColor: string;
}) {
  return (
    <Box
      sx={{
        p: 3,
        minHeight: 158,
        borderRadius: '20px',
        border: `1px solid ${borderColor}`,
        background,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction='row' justifyContent='space-between' alignItems='flex-start'>
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
        <Typography
          sx={{
            fontSize: { xs: 34, md: 42 },
            lineHeight: 1,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: accentColor,
          }}
        >
          {value}
        </Typography>
      </Stack>

      <Box mt='auto'>
        <Typography fontSize={18} fontWeight={800} color='#111827'>
          {title}
        </Typography>
        <Typography mt={0.75} fontSize={13} color='#6B7280'>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

export default function Overview() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('monthly');

  const referenceDate = useMemo(() => startOfDay(new Date()), []);

  const { data } = useApiQuery(REVIEW_KEYS, () => reviewsApi.getAll(), { retry: false });

  const visibleStores = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return storesList;
    return storesList.filter((store) => user.outletId?.includes(store.outletId) ?? false);
  }, [user]);

  const visibleOutletIds = useMemo(() => {
    if (user?.role === 'admin') return null;
    if (user?.outletId && user.outletId.length > 0) return new Set(user.outletId);
    if (visibleStores.length > 0) return new Set(visibleStores.map((store) => store.outletId));
    return null;
  }, [user, visibleStores]);

  const apiRecords = useMemo(() => normalizeReviews(data?.data ?? []), [data?.data]);

  const scopedRecords = useMemo(() => {
    if (!visibleOutletIds) return apiRecords;
    return apiRecords.filter((record) => visibleOutletIds.has(record.outletId));
  }, [apiRecords, visibleOutletIds]);

  const outletNameLookup = useMemo(() => {
    const map = new Map<string, string>();

    storesList.forEach((store) => {
      map.set(store.outletId, store.name);
    });

    (data?.data ?? []).forEach((review) => {
      const outletId = getOutletId(review);
      if (outletId) {
        map.set(outletId, getOutletName(review));
      }
    });

    return map;
  }, [data?.data]);

  const periodMeta = PERIOD_META[period];

  const currentRangeStart = useMemo(
    () => startOfDay(shiftDays(referenceDate, -(periodMeta.rangeInDays - 1))),
    [periodMeta.rangeInDays, referenceDate],
  );
  const currentRangeEnd = useMemo(() => endOfDay(referenceDate), [referenceDate]);

  const previousRangeStart = useMemo(
    () => shiftDays(currentRangeStart, -periodMeta.rangeInDays),
    [currentRangeStart, periodMeta.rangeInDays],
  );
  const previousRangeEnd = useMemo(
    () => shiftDays(currentRangeEnd, -periodMeta.rangeInDays),
    [currentRangeEnd, periodMeta.rangeInDays],
  );

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

  const trendData = useMemo<TrendPoint[]>(() => {
    const labels = trendline?.currentPeriod.labels ?? [];
    const currentValues = trendline?.currentPeriod.values ?? [];
    const previousValues = trendline?.previousPeriod.values ?? [];

    if (labels.length > 0) {
      return labels.map((label, index) => ({
        label,
        current: round(currentValues[index] ?? 0, 2),
        previous: round(previousValues[index] ?? 0, 2),
      }));
    }

    const fallbackPoints = PERIOD_META[period].offsets.length;
    return Array.from({ length: fallbackPoints }, (_, index) => ({
      label: String(index + 1),
      current: 0,
      previous: 0,
    }));
  }, [period, trendline]);

  const globalCsatScore = round(globalCsat?.globalCsatScore ?? 0, 1);
  const totalGlobalRatings = globalCsat?.totalRatings ?? 0;
  const hasNoRatings = totalGlobalRatings === 0;
  const scoreDisplay = isGlobalCsatLoading || isGlobalCsatError ? '--' : globalCsatScore.toFixed(1);
  const scoreMetaLabel = isGlobalCsatError
    ? 'Unable to load CSAT from backend'
    : isGlobalCsatLoading
      ? 'Loading CSAT from backend...'
      : hasNoRatings
        ? 'No ratings in selected period'
        : `${totalGlobalRatings.toLocaleString()} ratings in selected period`;
  const scoreMetaColor = isGlobalCsatError ? '#B91C1C' : '#6B7280';

  const {
    data: incidentsOverview,
    isLoading: isIncidentsOverviewLoading,
    isError: isIncidentsOverviewError,
  } = useApiQuery(
    [...INCIDENTS_OVERVIEW_KEYS, period],
    () => reviewsApi.getIncidentsOverview({ period }),
    { retry: false },
  );

  const totalOpenIncidents = incidentsOverview?.totalOpenIncidents ?? 0;
  const totalCriticalIssues = incidentsOverview?.criticalIssues ?? 0;
  const totalResolvedToday = incidentsOverview?.incidentsResolvedToday ?? 0;
  const resolvedTodayDateLabel =
    incidentsOverview?.resolvedTodayDate ?? referenceDate.toISOString().slice(0, 10);
  const incidentsOverviewStatus = isIncidentsOverviewError
    ? 'Failed to load incidents overview.'
    : isIncidentsOverviewLoading
      ? 'Loading incidents overview...'
      : null;

  const peakIncidentTime = useMemo(() => {
    const pendingRecords = scopedRecords.filter(
      (record) =>
        record.isComplaint &&
        record.status === ComplaintStatus.PENDING &&
        isBetween(record.createdAt, currentRangeStart, currentRangeEnd),
    );

    if (pendingRecords.length === 0) return 'No open incidents in selected period';

    const slotCounts = Array.from({ length: INCIDENT_TIME_SLOTS.length }, () => 0);
    pendingRecords.forEach((record) => {
      slotCounts[getIncidentSlotIndex(record.createdAt)] += 1;
    });

    const peakIndex = slotCounts.reduce(
      (bestIndex, count, index, source) => (count > source[bestIndex] ? index : bestIndex),
      0,
    );

    const slot = INCIDENT_TIME_SLOTS[peakIndex];
    return `${slot.label} (${slot.context})`;
  }, [currentRangeEnd, currentRangeStart, scopedRecords]);

  const mostImprovedOutlet = useMemo(() => {
    const outletIds = Array.from(new Set(scopedRecords.map((record) => record.outletId)));

    if (outletIds.length === 0) return 'Not enough trend data yet';

    let bestOutletId = '';
    let bestDelta = Number.NEGATIVE_INFINITY;

    outletIds.forEach((outletId) => {
      const currentRatings = scopedRecords
        .filter(
          (record) =>
            record.outletId === outletId &&
            isBetween(record.createdAt, currentRangeStart, currentRangeEnd),
        )
        .map((record) => record.rating);

      const previousRatings = scopedRecords
        .filter(
          (record) =>
            record.outletId === outletId &&
            isBetween(record.createdAt, previousRangeStart, previousRangeEnd),
        )
        .map((record) => record.rating);

      if (currentRatings.length === 0 && previousRatings.length === 0) return;

      const currentAverage = currentRatings.length > 0 ? average(currentRatings) : 0;
      const previousAverage =
        previousRatings.length > 0 ? average(previousRatings) : currentAverage;
      const delta = currentAverage - previousAverage;

      if (delta > bestDelta) {
        bestDelta = delta;
        bestOutletId = outletId;
      }
    });

    if (!bestOutletId || !Number.isFinite(bestDelta)) return 'Not enough trend data yet';

    const outletName = outletNameLookup.get(bestOutletId) ?? 'Unknown Outlet';
    return `${outletName} (${bestDelta >= 0 ? '+' : ''}${bestDelta.toFixed(1)} CSAT)`;
  }, [
    currentRangeEnd,
    currentRangeStart,
    outletNameLookup,
    previousRangeEnd,
    previousRangeStart,
    scopedRecords,
  ]);

  const criticalFocusArea = useMemo(() => {
    const criticalByOutlet = new Map<string, number>();

    scopedRecords.forEach((record) => {
      if (
        record.isComplaint &&
        record.status === ComplaintStatus.PENDING &&
        record.rating < 2 &&
        isBetween(record.createdAt, currentRangeStart, currentRangeEnd)
      ) {
        criticalByOutlet.set(record.outletId, (criticalByOutlet.get(record.outletId) ?? 0) + 1);
      }
    });

    if (criticalByOutlet.size === 0) return 'No critical incidents in selected period';

    let focusOutletId = '';
    let maxIssues = 0;

    criticalByOutlet.forEach((issues, outletId) => {
      if (issues > maxIssues) {
        maxIssues = issues;
        focusOutletId = outletId;
      }
    });

    const outletName = outletNameLookup.get(focusOutletId) ?? 'Unknown Outlet';
    return `${outletName} (${maxIssues} critical ${maxIssues === 1 ? 'issue' : 'issues'})`;
  }, [currentRangeEnd, currentRangeStart, outletNameLookup, scopedRecords]);

  const quickInsights = useMemo(
    () => [
      { label: 'Peak Incident Time', value: peakIncidentTime },
      { label: 'Most Improved Outlet', value: mostImprovedOutlet },
      { label: 'Critical Focus Area', value: criticalFocusArea },
    ],
    [criticalFocusArea, mostImprovedOutlet, peakIncidentTime],
  );

  const isTrendlineAllZero = trendData.every(
    (point) => point.current === 0 && point.previous === 0,
  );
  const yValues = trendData.flatMap((point) => [point.current, point.previous]);
  const yMin = isTrendlineAllZero
    ? 0
    : yValues.length
      ? Math.max(1, Math.floor((Math.min(...yValues) - 0.2) * 2) / 2)
      : 1;
  const yMax = isTrendlineAllZero
    ? 1
    : yValues.length
      ? Math.min(5, Math.ceil((Math.max(...yValues) + 0.2) * 2) / 2)
      : 5;

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
                {periodMeta.title}
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
                      tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                      domain={[yMin, yMax]}
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
                    No ratings in selected period
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      <Grid container spacing={3} mb={5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <IncidentCard
            icon={<AlertCircle size={20} />}
            title='Total Open Incidents'
            value={totalOpenIncidents}
            description={incidentsOverviewStatus ?? 'Pending complaints in the selected period.'}
            background='linear-gradient(180deg, #FFF5F7 0%, #FFF1F2 100%)'
            borderColor='#FECDD3'
            accentColor='#E11D48'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <IncidentCard
            icon={<AlertTriangle size={20} />}
            title='Critical Issues (< 2 Stars)'
            value={totalCriticalIssues}
            description={
              incidentsOverviewStatus ?? 'High-risk complaints requiring immediate action.'
            }
            background='linear-gradient(180deg, #FFF9F0 0%, #FFF7ED 100%)'
            borderColor='#FED7AA'
            accentColor='#EA580C'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <IncidentCard
            icon={<CheckCircle2 size={20} />}
            title='Incidents Resolved Today'
            value={totalResolvedToday}
            description={incidentsOverviewStatus ?? `Resolved on ${resolvedTodayDateLabel}.`}
            background='linear-gradient(180deg, #F3FFF8 0%, #ECFDF5 100%)'
            borderColor='#BBF7D0'
            accentColor='#16A34A'
          />
        </Grid>
      </Grid>

      <Box
        sx={{
          p: { xs: 3, md: 4 },
          mb: 2,
          borderRadius: '24px',
          border: '1px solid #E5E7EB',
          bgcolor: '#ffffff',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        }}
      >
        <Typography
          fontSize={{ xs: 28, md: 34 }}
          fontWeight={900}
          color='#111827'
          letterSpacing='-0.04em'
        >
          Quick Insights
        </Typography>

        <Stack spacing={2.5} mt={3}>
          {quickInsights.map((insight) => (
            <Box
              key={insight.label}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: '18px',
                border: '1px solid #E5E7EB',
                bgcolor: '#F8FAFC',
              }}
            >
              <Typography fontSize={{ xs: 18, md: 22 }} fontWeight={700} color='#6B7280'>
                {insight.label}
              </Typography>
              <Typography
                mt={0.5}
                fontSize={{ xs: 20, md: 30 }}
                lineHeight={1.2}
                fontWeight={800}
                color='#111827'
                sx={{ wordBreak: 'break-word' }}
              >
                {insight.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
