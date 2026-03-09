import React, { useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { Star } from 'lucide-react';
import { message } from 'antd';
import { Modal } from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { NoDataFallback } from '../common/NoDataFallback';
import { ResolveComplaintConfirmModal } from './ResolveComplaintConfirmModal';
import { useAuth } from '../../lib/context/AuthContext';
import { useApiMutation } from '../../lib/react-query/use-api-hooks';
import { reviewsApi } from '../../lib/services/api/review.api';
import { REVIEW_KEYS } from '../../lib/types/review';
import {
  type Review,
  type ResolveComplaintDto,
  ComplaintStatus,
  getOutletName,
} from '../../lib/types/review';

type ReviewPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  review: Review | null;
  loading?: boolean;
  onResolved?: () => void;
};

export const ReviewPreviewModal: React.FC<ReviewPreviewModalProps> = ({
  open,
  onClose,
  review,
  loading = false,
  onResolved,
}) => {
  const { user } = useAuth();
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [pendingAction, setPendingAction] = useState<{ complaintStatus: ComplaintStatus } | null>(
    null,
  );

  const resolveMutation = useApiMutation(
    ({ reviewId, body }: { reviewId: string; body: ResolveComplaintDto }) =>
      reviewsApi.resolveComplaint(reviewId, body),
    [REVIEW_KEYS],
    {
      onSuccess: () => {
        message.success('Complaint updated.');
        setResolutionNotes('');
        setPendingAction(null);
        onResolved?.();
      },
      onError: (e) => {
        message.error(e?.message ?? 'Failed to update complaint.');
      },
    },
  );

  const handleResolve = (complaintStatus: ComplaintStatus) => {
    if (!review || !user?.id) return;
    const body: ResolveComplaintDto = {
      complaintStatus,
      resolvedBy: user.id,
      resolutionNotes: resolutionNotes.trim() || undefined,
    };
    resolveMutation.mutate({ reviewId: review._id, body });
  };

  const isComplaintPending =
    review?.isComplaint === true && review?.complaintStatus === ComplaintStatus.PENDING;
  const isComplaintResolved =
    review?.isComplaint === true && review?.complaintStatus === ComplaintStatus.RESOLVED;
  const isComplaintDismissed =
    review?.isComplaint === true && review?.complaintStatus === ComplaintStatus.DISMISSED;

  const isComplaint = review?.isComplaint === true;

  return (
    <Modal open={open} onClose={onClose} title='Complete Review' maxWidth='md' scrollableContent>
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
              {getOutletName(review)}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {new Date(review.createdAt ?? '').toLocaleDateString()}
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
            {(review.userResponses ?? []).map((res, index) => {
              const qId = res.questionId;
              const answerDisplay = Array.isArray(res.answer)
                ? res.answer.join(', ')
                : typeof res.answer === 'number'
                  ? String(res.answer)
                  : String(res.answer ?? '—');
              return (
                <Box
                  component='li'
                  key={`${qId}-${index}`}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'transparent',
                  }}
                >
                  <Typography
                    variant='subtitle2'
                    fontWeight={700}
                    color='text.primary'
                    display='block'
                    mb={0.5}
                  >
                    Question
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {answerDisplay}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Complaint raised by user (shown for any complaint: pending, resolved, or dismissed) */}
          {isComplaint && (review.complaintReason ?? '').trim() && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'warning.light',
                backgroundColor: 'warning.50',
              }}
            >
              <Typography variant='subtitle2' fontWeight={700} color='warning.dark' sx={{ mb: 1 }}>
                Complaint raised by user
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {review.complaintReason}
              </Typography>
            </Box>
          )}

          {/* Review-level resolution (when complaint was resolved or dismissed) */}
          {(isComplaintResolved || isComplaintDismissed) &&
            (review.resolutionNotes || review.resolvedAt) && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: isComplaintResolved
                    ? 'rgba(46, 125, 50, 0.12)'
                    : 'rgba(211, 47, 47, 0.12)',
                  border: '1px solid',
                  borderColor: isComplaintResolved ? 'success.light' : 'error.light',
                }}
              >
                {review.resolutionNotes && (
                  <Typography variant='caption' display='block' color='text.secondary'>
                    {review.resolutionNotes}
                  </Typography>
                )}
                {review.resolvedAt && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                    sx={{ mt: 0.5, opacity: 0.9 }}
                  >
                    {isComplaintResolved ? 'Resolved' : 'Dismissed'}{' '}
                    {new Date(review.resolvedAt).toLocaleString()}
                    {review.resolvedBy ? ` by ${review.resolvedBy}` : ''}
                  </Typography>
                )}
              </Box>
            )}

          {/* Resolve complaint section (review-level, only when pending) */}
          {isComplaintPending && (
            <Box
              sx={{
                mt: 1,
                pt: 2,
                borderTop: '1px solid',
                borderTopColor: 'divider',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.main',
                backgroundColor: 'error.50',
              }}
            >
              <Typography variant='subtitle2' fontWeight={700} color='error.main' sx={{ mb: 1 }}>
                Pending complaint — resolution
              </Typography>
              <TextField
                fullWidth
                size='small'
                label='Resolution notes'
                placeholder='Describe the resolution or dismissal'
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                multiline
                minRows={2}
                sx={{ mb: 2 }}
              />
              <Box display='flex' gap={1} flexWrap='wrap'>
                <Button
                  variant='contained'
                  color='success'
                  size='small'
                  disabled={resolveMutation.isPending || !user?.id}
                  onClick={() => setPendingAction({ complaintStatus: ComplaintStatus.RESOLVED })}
                >
                  Mark as resolved
                </Button>
                <Button
                  variant='outlined'
                  color='error'
                  size='small'
                  disabled={resolveMutation.isPending || !user?.id}
                  onClick={() => setPendingAction({ complaintStatus: ComplaintStatus.DISMISSED })}
                >
                  Mark as rejected
                </Button>
              </Box>
            </Box>
          )}

          {/* Overall rating */}
          <Box mt={1}>
            <Typography variant='body2' fontWeight={700} sx={{ mb: 1 }}>
              Overall rating
            </Typography>
            <Box display='flex' gap={0.75} alignItems='center'>
              {[...Array(Math.round(review.overallRating ?? 0))].map((_, i) => (
                <Star key={i} size={28} fill='#D4AF37' color='#D4AF37' />
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <ResolveComplaintConfirmModal
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        title={
          pendingAction?.complaintStatus === ComplaintStatus.RESOLVED
            ? 'Mark as resolved'
            : 'Mark as rejected'
        }
        description={
          pendingAction?.complaintStatus === ComplaintStatus.RESOLVED
            ? 'Are you sure you want to mark this complaint as resolved?'
            : 'Are you sure you want to mark this complaint as rejected (dismissed)?'
        }
        confirmLabel={
          pendingAction?.complaintStatus === ComplaintStatus.RESOLVED ? 'Resolve' : 'Reject'
        }
        cancelLabel='Cancel'
        onConfirm={() => {
          if (pendingAction) {
            handleResolve(pendingAction.complaintStatus);
          }
        }}
        loading={resolveMutation.isPending}
        confirmColor={
          pendingAction?.complaintStatus === ComplaintStatus.RESOLVED ? 'success' : 'error'
        }
      />
    </Modal>
  );
};
