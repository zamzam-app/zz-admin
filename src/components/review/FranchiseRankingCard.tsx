import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { Star } from 'lucide-react';
import type { OutletAggregate } from './reviewConstants';
import { cardSx, overflowScrollSx } from './reviewConstants';

type FranchiseRankingCardProps = {
  outletAggregates: OutletAggregate[];
};

export const FranchiseRankingCard: React.FC<FranchiseRankingCardProps> = ({ outletAggregates }) => {
  return (
    <Box sx={{ ...cardSx, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack
        direction='column'
        justifyContent='space-between'
        alignItems='left'
        px={3}
        py={2.5}
        borderBottom='1px solid #F3F4F6'
        flexShrink={0}
      >
        <Typography fontSize={20} fontWeight={900} color='#111827' letterSpacing='-0.04em'>
          Franchise Ranking
        </Typography>
        <Typography fontSize={10} fontWeight={700} color='#9CA3AF' textTransform='uppercase'>
          Sorted by CSAT
        </Typography>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, ...overflowScrollSx }}>
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
                    Managers:{' '}
                    {row.managerNames.length > 0
                      ? row.managerNames.join(', ')
                      : 'No managers assigned'}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction='row' spacing={0.6} alignItems='center'>
                <Star size={10} fill='#D4AF37' color='#D4AF37' />
                <Typography fontSize={20} fontWeight={900} color='#111827' letterSpacing='-0.03em'>
                  {row.csat.toFixed(1)}
                </Typography>
              </Stack>
            </Stack>
          ))
        )}
      </Box>
    </Box>
  );
};
