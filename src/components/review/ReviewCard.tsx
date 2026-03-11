import React from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { Star } from 'lucide-react';
import type { Review } from '../../lib/types/review';
import { getOutletName, getUserName } from '../../lib/types/review';
import { getReviewComment } from './reviewUtils';

type ReviewCardProps = {
  review: Review;
  onClick: () => void;
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onClick }) => {
  return (
    <Box
      onClick={onClick}
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
      <Stack direction='row' justifyContent='space-between' alignItems='flex-start' mb={1}>
        <Stack direction='row' spacing={1} alignItems='center'>
          <Avatar sx={{ width: 32, height: 32 }}>{getUserName(review).charAt(0)}</Avatar>
          <Typography fontSize={14} fontWeight={700} color='#111827'>
            {getUserName(review)}
          </Typography>
        </Stack>
        <Typography fontSize={12} color='#9CA3AF'>
          {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : '—'}
        </Typography>
      </Stack>

      <Typography fontSize={12} fontWeight={700} color='#6B7280' textTransform='uppercase'>
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
  );
};
