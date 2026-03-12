import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Box, Stack, Typography } from '@mui/material';
import type { GlobalCsatPeriod } from '../../lib/types/review';

type TrendPoint = {
  label: string;
  current: number | null;
  previous: number | null;
};

type CsatTrendlineCardProps = {
  trendlineTitle: string;
  trendData: TrendPoint[];
  period: GlobalCsatPeriod;
  bucketLabels: string[];
  isTrendlineLoading: boolean;
  isTrendlineError: boolean;
  isTrendlineAllZero: boolean;
  yMin: number;
  yMax: number;
  yTicks: number[];
  tickFormatter: (value: string) => string;
  tooltipLabelFormatter: (value: string) => string;
};

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

export function CsatTrendlineCard({
  trendlineTitle,
  trendData,
  period,
  bucketLabels,
  isTrendlineLoading,
  isTrendlineError,
  isTrendlineAllZero,
  yMin,
  yMax,
  yTicks,
  tickFormatter,
  tooltipLabelFormatter,
}: CsatTrendlineCardProps) {
  return (
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
                tickFormatter={(value) => tickFormatter(String(value))}
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
                labelFormatter={(value) => tooltipLabelFormatter(String(value))}
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
            <Typography mt={1} fontSize={12} fontWeight={600} color='#94A3B8' textAlign='center'>
              No ratings {period === 'daily' ? 'today' : 'in selected period'}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
