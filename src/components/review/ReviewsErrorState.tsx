import React from 'react';
import { Box, Typography } from '@mui/material';
import { NoDataFallback } from '../common/NoDataFallback';
import { Button as CommonButton } from '../common/Button';

type ReviewsErrorStateProps = {
  error: Error;
  onRetry: () => void;
};

export const ReviewsErrorState: React.FC<ReviewsErrorStateProps> = ({ error, onRetry }) => {
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
            <CommonButton variant='admin-primary' onClick={onRetry} className='rounded-2xl'>
              Try again
            </CommonButton>
          }
        />
      </Box>
    </Box>
  );
};
