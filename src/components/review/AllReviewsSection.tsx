import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Star } from 'lucide-react';
import type { Review } from '../../lib/types/review';
import type { ComplaintStatusValue } from '../../lib/types/review';
import { ReviewCard } from './ReviewCard';
import { cardSx } from './reviewConstants';
import { getComplaintBorder } from './reviewUtils';

type AllReviewsSectionProps = {
  groupedReviews: Record<number, Review[]>;
  ratingOrder: number[];
  totalCount: number;
  onReviewClick: (reviewId: string) => void;
  statusFilter: ComplaintStatusValue | null;
  onStatusFilterChange: (next: ComplaintStatusValue | null) => void;
};

export const AllReviewsSection: React.FC<AllReviewsSectionProps> = ({
  groupedReviews,
  ratingOrder,
  totalCount,
  onReviewClick,
  statusFilter,
  onStatusFilterChange,
}) => {
  const pills: Array<{ key: ComplaintStatusValue; label: string }> = [
    { key: 'resolved', label: 'Resolved' },
    { key: 'pending', label: 'Pending' },
  ];

  return (
    <Box
      sx={{
        ...cardSx,
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
        <Stack
          direction='row'
          spacing={1}
          alignItems='center'
          flexWrap='wrap'
          justifyContent='flex-end'
        >
          <Stack direction='row' spacing={1} alignItems='center'>
            {pills.map((pill) => {
              const active = statusFilter === pill.key;
              return (
                <Button
                  key={pill.key}
                  size='small'
                  variant={active ? 'contained' : 'outlined'}
                  onClick={() => onStatusFilterChange(active ? null : pill.key)}
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 800,
                    px: 1.5,
                    minWidth: 0,
                    ...(active
                      ? {}
                      : {
                          borderColor: 'divider',
                          color: '#374151',
                          backgroundColor: 'transparent',
                        }),
                  }}
                >
                  {pill.label}
                </Button>
              );
            })}
          </Stack>

          <Typography fontSize={14} color='#6B7280' fontWeight={600}>
            {totalCount} review{totalCount === 1 ? '' : 's'}
          </Typography>
        </Stack>
      </Stack>

      {totalCount === 0 ? (
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
                    <ReviewCard
                      key={review._id}
                      review={review}
                      onClick={() => onReviewClick(review._id)}
                      complaintBorder={getComplaintBorder(review)}
                    />
                  ))}
                </Box>
              </Box>
            ) : null,
          )}
        </Stack>
      )}
    </Box>
  );
};
