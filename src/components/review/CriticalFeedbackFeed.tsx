import React from 'react';
import { Box, ButtonBase, Stack, Typography } from '@mui/material';
import { AlertTriangle, Phone } from 'lucide-react';
import type { Review } from '../../lib/types/review';
import { cardSx } from './reviewConstants';
import { getReviewComment, formatDateTime, getRatingBadgeStyle } from './reviewUtils';

export type CriticalFeedbackItem = {
  review: Review;
  outletName: string;
  managerPhone?: string;
  actionRequired: boolean;
};

type CriticalFeedbackFeedProps = {
  items: CriticalFeedbackItem[];
  actionRequiredCount: number;
  onViewTicket: (reviewId: string) => void;
  onCallManager: (phone?: string) => void;
};

export const CriticalFeedbackFeed: React.FC<CriticalFeedbackFeedProps> = ({
  items,
  actionRequiredCount,
  onViewTicket,
  onCallManager,
}) => {
  return (
    <Box sx={cardSx}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        px={3}
        py={2.5}
        borderBottom='1px solid #F3F4F6'
      >
        <Stack direction='row' spacing={1.2} alignItems='center'>
          <AlertTriangle size={20} color='#DC2626' />
          <Typography fontSize={30} fontWeight={900} color='#111827' letterSpacing='-0.04em'>
            Critical Feedback Feed (Bottom 10%)
          </Typography>
        </Stack>

        {actionRequiredCount > 0 && (
          <Box
            sx={{
              px: 1.6,
              py: 0.55,
              borderRadius: '999px',
              border: '1px solid #FCA5A5',
              bgcolor: '#FEF2F2',
              color: '#B91C1C',
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {actionRequiredCount} Action Required
          </Box>
        )}
      </Stack>

      <Stack spacing={0}>
        {items.length === 0 && (
          <Box px={3} py={5}>
            <Typography color='text.secondary'>No critical feedback for this filter.</Typography>
          </Box>
        )}

        {items.map((item, index) => {
          const badgeStyle = getRatingBadgeStyle(item.review.overallRating);

          return (
            <Box
              key={item.review._id}
              px={3}
              py={2.75}
              borderTop={index === 0 ? undefined : '1px solid #F3F4F6'}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent='space-between'
                alignItems={{ xs: 'flex-start', md: 'flex-start' }}
                spacing={2}
              >
                <Stack direction='row' spacing={1.5} alignItems='flex-start' flex={1}>
                  <Box
                    sx={{
                      minWidth: 42,
                      height: 42,
                      borderRadius: '12px',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: badgeStyle.backgroundColor,
                      color: badgeStyle.color,
                      fontSize: 18,
                      fontWeight: 900,
                    }}
                  >
                    {item.review.overallRating}★
                  </Box>

                  <Box>
                    <Typography fontSize={21} fontWeight={800} color='#111827'>
                      {item.outletName}
                    </Typography>
                    <Typography mt={0.5} fontSize={19} color='#4B5563' fontStyle='italic'>
                      "{getReviewComment(item.review)}"
                    </Typography>

                    <Stack direction='row' spacing={1.2} mt={1.5} flexWrap='wrap'>
                      <ButtonBase
                        onClick={() => onViewTicket(item.review._id)}
                        sx={{
                          height: 34,
                          px: 1.8,
                          borderRadius: '999px',
                          border: '1px solid #CBD5E1',
                          bgcolor: '#FFFFFF',
                          color: '#334155',
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        View Ticket
                      </ButtonBase>

                      <ButtonBase
                        onClick={() => onCallManager(item.managerPhone)}
                        disabled={!item.managerPhone}
                        sx={{
                          height: 34,
                          px: 1.8,
                          borderRadius: '999px',
                          border: '1px solid #A7F3D0',
                          bgcolor: '#ECFDF5',
                          color: '#047857',
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.7,
                          '&:disabled': {
                            borderColor: '#E5E7EB',
                            bgcolor: '#F9FAFB',
                            color: '#9CA3AF',
                          },
                        }}
                      >
                        <Phone size={13} />
                        Call Manager
                      </ButtonBase>
                    </Stack>
                  </Box>
                </Stack>

                <Typography fontSize={14} color='#9CA3AF' fontWeight={600}>
                  {formatDateTime(item.review.createdAt)}
                </Typography>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};
