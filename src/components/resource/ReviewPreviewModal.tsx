import React from 'react';
import { Box, Typography } from '@mui/material';
import { Star } from 'lucide-react';
import { Modal } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { NoDataFallback } from '../common/NoDataFallback';
import type { ApiReview } from '../../lib/types/review';

const questionTypeLabel: Record<string, string> = {
  short_answer: 'Short answer',
  paragraph: 'Comment',
  rating: 'Rating',
  multiple_choice: 'Multiple choice',
  checkbox: 'Checkbox',
};

function formatAnswer(answer: string | string[] | number): string {
  if (Array.isArray(answer)) {
    return answer.map((a) => String(a ?? '')).join(', ');
  }
  return String(answer ?? '');
}

type ReviewPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  review: ApiReview | null;
  loading?: boolean;
};

export const ReviewPreviewModal: React.FC<ReviewPreviewModalProps> = ({
  open,
  onClose,
  review,
  loading = false,
}) => {
  const formIdObj = review?.formId && typeof review.formId === 'object' ? review.formId : null;
  const questionMap = new Map(
    formIdObj?.questions?.map((q) => [q._id, { type: q.type, title: q.title }]) ?? [],
  );

  return (
    <Modal open={open} onClose={onClose} title='Complete Review' maxWidth='md'>
      {loading ? (
        <Box display='flex' justifyContent='center' alignItems='center' py={6}>
          <LoadingSpinner />
        </Box>
      ) : !review ? (
        <NoDataFallback title='No review data.' />
      ) : (
        <Box display='flex' flexDirection='column' gap={2}>
          {/* Meta */}
          <Box display='flex' flexWrap='wrap' gap={2} alignItems='center'>
            <Typography variant='body2' fontWeight={600} color='text.secondary'>
              {typeof review.outletId === 'object' && review.outletId?.name
                ? review.outletId.name
                : 'Outlet'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {new Date(review.createdAt).toLocaleDateString()}
            </Typography>
          </Box>

          {/* Questions / responses */}
          <Box
            component='ul'
            sx={{
              listStyle: 'none',
              pl: 0,
              m: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {(review.userResponses ?? []).map((res) => {
              const q = questionMap.get(res.questionId);
              const type = q?.type ?? 'paragraph';
              const label =
                q?.title && q.title.trim() !== '' ? q.title : (questionTypeLabel[type] ?? type);
              const isComplaint = res.isComplaint === true;

              return (
                <Box
                  component='li'
                  key={res.questionId}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: isComplaint ? 'error.main' : 'divider',
                    outline: isComplaint ? '2px solid' : 'none',
                    outlineColor: 'error.main',
                    outlineOffset: 1,
                    backgroundColor: isComplaint ? 'error.50' : 'transparent',
                  }}
                >
                  <Typography
                    variant='caption'
                    fontWeight={700}
                    color='text.secondary'
                    display='block'
                    mb={0.5}
                  >
                    {label}
                    {isComplaint && (
                      <Typography
                        component='span'
                        variant='caption'
                        fontWeight={700}
                        color='error.main'
                        sx={{ ml: 1 }}
                      >
                        (Complaint)
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant='body2'>
                    {type === 'rating'
                      ? `${formatAnswer(res.answer)} / 5`
                      : formatAnswer(res.answer) || '—'}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Overall Ratings - at bottom, bigger stars */}
          <Box mt={1}>
            <Typography variant='body2' fontWeight={700} sx={{ mb: 1 }}>
              Overall Ratings
            </Typography>
            <Box display='flex' gap={0.75} alignItems='center'>
              {[...Array(review.overallRating ?? 0)].map((_, i) => (
                <Star key={i} size={28} fill='#D4AF37' color='#D4AF37' />
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Modal>
  );
};
