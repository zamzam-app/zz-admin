import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import type { OutletAggregate } from './reviewConstants';
import { METRIC_ORDER, METRIC_LABEL, cardSx } from './reviewConstants';
import { getHeatCellStyle } from './reviewUtils';

type UniversalMetricsHeatmapProps = {
  outletAggregates: OutletAggregate[];
};

export const UniversalMetricsHeatmap: React.FC<UniversalMetricsHeatmapProps> = ({
  outletAggregates,
}) => {
  return (
    <Box sx={cardSx}>
      <Box px={3} py={2.5} borderBottom='1px solid #F3F4F6'>
        <Typography fontSize={30} fontWeight={900} color='#111827' letterSpacing='-0.04em'>
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
            <Typography fontSize={13} fontWeight={800} color='#9CA3AF' textTransform='uppercase'>
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

                <Box
                  sx={{
                    height: 38,
                    borderRadius: '10px',
                    border: `1px solid ${getHeatCellStyle(row.csat).borderColor}`,
                    bgcolor: getHeatCellStyle(row.csat).backgroundColor,
                    color: getHeatCellStyle(row.csat).color,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 16,
                    fontWeight: 900,
                  }}
                >
                  {row.csat.toFixed(1)}
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};
