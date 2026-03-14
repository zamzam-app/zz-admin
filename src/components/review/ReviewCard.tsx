import React from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { Star } from 'lucide-react';
import type { Review } from '../../lib/types/review';
import { getOutletName, getUserName } from '../../lib/types/review';
import { getReviewComment, type ComplaintBorder } from './reviewUtils';

const COMPLAINT_BORDER_COLORS: Record<ComplaintBorder, string> = {
  green: '#86efac',
  yellow: '#fde047',
  red: '#fca5a5',
};

const COMPLAINT_BG_COLORS: Record<ComplaintBorder, string> = {
  green: '#ecfdf5',
  yellow: '#fefce8',
  red: '#fef2f2',
};

type ReviewCardProps = {
  review: Review;
  onClick: () => void;
  complaintBorder?: ComplaintBorder;
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onClick, complaintBorder }) => {
  const borderColor = complaintBorder ? COMPLAINT_BORDER_COLORS[complaintBorder] : '#E5E7EB';
  const bgColor = complaintBorder ? COMPLAINT_BG_COLORS[complaintBorder] : '#FFFFFF';
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2.25,
        borderRadius: '14px',
        border: `1px solid ${borderColor}`,
        bgcolor: bgColor,
        boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.10)',
          borderColor: complaintBorder ? borderColor : '#D1D5DB',
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
