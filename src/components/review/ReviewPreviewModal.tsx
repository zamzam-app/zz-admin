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
  type UserResponseQuestionRef,
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
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  /** After resolve, show the updated review from the API so resolution notes appear immediately */
  const [updatedReview, setUpdatedReview] = useState<Review | null>(null);

  const resolveMutation = useApiMutation(
    ({ reviewId, body }: { reviewId: string; body: ResolveComplaintDto }) =>
      reviewsApi.resolveComplaint(reviewId, body),
    [REVIEW_KEYS],
    {
      onSuccess: (data: Review) => {
        message.success('Complaint updated.');
        setResolutionNotes('');
        setShowResolveConfirm(false);
        setUpdatedReview(data);
        onResolved?.();
      },
      onError: (e) => {
        message.error(e?.message ?? 'Failed to update complaint.');
      },
    },
  );

  const handleResolve = () => {
    if (!review || !user?.id) return;
    const body: ResolveComplaintDto = {
      complaintStatus: ComplaintStatus.RESOLVED,
      resolvedBy: user.id,
      resolutionNotes: resolutionNotes.trim() || undefined,
    };
    resolveMutation.mutate({ reviewId: review._id, body });
  };

  /** Use API-updated review only when it matches the current modal review; otherwise avoid stale state */
  const displayReview =
    updatedReview && review && updatedReview._id === review._id ? updatedReview : review;

  const isComplaintPending =
    displayReview?.isComplaint === true &&
    displayReview?.complaintStatus === ComplaintStatus.PENDING;
  const isComplaintResolved = displayReview?.complaintStatus === ComplaintStatus.RESOLVED;
  const isComplaintDismissed = displayReview?.complaintStatus === ComplaintStatus.DISMISSED;

  const isComplaint = displayReview?.isComplaint === true;

  /** Show resolution UI for pending complaints or for low-rated reviews (including those not marked as complaints) */
  const showResolutionActions =
    isComplaintPending ||
    ((displayReview?.overallRating ?? 0) < 2.5 && !isComplaintResolved && !isComplaintDismissed);

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
              {getOutletName(displayReview!)}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {new Date(displayReview!.createdAt ?? '').toLocaleDateString()}
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
            {(displayReview!.userResponses ?? []).map((res, index) => {
              const question =
                typeof res.questionId === 'object' && res.questionId != null
                  ? (res.questionId as UserResponseQuestionRef)
                  : null;
              const qId =
                typeof res.questionId === 'string'
                  ? res.questionId
                  : (question?._id ?? `q-${index}`);
              const questionTitle = question?.title ?? 'Question';
              const questionType = question?.type;
              const options = question?.options ?? [];
              const maxRatings = question?.maxRatings ?? 5;

              const answerDisplay = Array.isArray(res.answer)
                ? res.answer.join(', ')
                : typeof res.answer === 'number'
                  ? String(res.answer)
                  : String(res.answer ?? '—');

              /** For multiple_choice/checkbox, answer is option text(s) – match by opt.text */
              const answerTexts =
                typeof res.answer === 'number'
                  ? []
                  : Array.isArray(res.answer)
                    ? res.answer.map(String)
                    : res.answer != null
                      ? [String(res.answer)]
                      : [];
              const selectedTextSet = new Set(answerTexts);

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
                    {questionTitle}
                  </Typography>
                  {questionType === 'rating' && typeof res.answer === 'number' ? (
                    <Box display='flex' gap={0.5} alignItems='center' flexWrap='wrap'>
                      {[...Array(Math.min(maxRatings, 5))].map((_, i) => {
                        const value = i + 1;
                        const filled = value <= Math.round(res.answer as number);
                        return (
                          <Star
                            key={i}
                            size={22}
                            fill={filled ? '#D4AF37' : 'transparent'}
                            color={filled ? '#D4AF37' : '#E0E0E0'}
                          />
                        );
                      })}
                    </Box>
                  ) : (questionType === 'multiple_choice' || questionType === 'checkbox') &&
                    options.length > 0 ? (
                    <Box component='ul' sx={{ listStyle: 'none', pl: 0, m: 0 }}>
                      {options.map((opt, optIdx) => {
                        const isOther = opt.text === 'Other:';
                        const selected = isOther
                          ? answerTexts.some((a) => String(a).toLowerCase().startsWith('other:'))
                          : selectedTextSet.has(opt.text);
                        return (
                          <Box
                            component='li'
                            key={optIdx}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              py: 0.25,
                              color: selected ? 'text.primary' : 'text.secondary',
                              fontWeight: selected ? 600 : 400,
                            }}
                          >
                            <Box
                              component='span'
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: questionType === 'checkbox' ? 0.5 : '50%',
                                border: '2px solid',
                                borderColor: selected ? 'primary.main' : 'divider',
                                bgcolor: selected ? 'primary.main' : 'transparent',
                              }}
                            />
                            <Typography variant='body2'>{opt.text}</Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography
                      variant='body2'
                      color='text.secondary'
                      sx={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {answerDisplay}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Complaint raised by user (shown for any complaint: pending, resolved, or dismissed) */}
          {isComplaint && (displayReview!.complaintReason ?? '').trim() && (
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
                {displayReview!.complaintReason}
              </Typography>
            </Box>
          )}

          {/* Review-level resolution (when resolved or dismissed – shows notes and timestamp) */}
          {(isComplaintResolved || isComplaintDismissed) &&
            (displayReview!.resolutionNotes || displayReview!.resolvedAt) && (
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
                {displayReview!.resolutionNotes && (
                  <Typography variant='caption' display='block' color='text.secondary'>
                    {displayReview!.resolutionNotes}
                  </Typography>
                )}
                {displayReview!.resolvedAt && (
                  <Typography
                    variant='caption'
                    display='block'
                    color='text.secondary'
                    sx={{ mt: 0.5, opacity: 0.9 }}
                  >
                    {isComplaintResolved ? 'Resolved' : 'Dismissed'}{' '}
                    {new Date(displayReview!.resolvedAt).toLocaleString()}
                    {displayReview!.resolvedBy ? ` by ${displayReview!.resolvedBy}` : ''}
                  </Typography>
                )}
              </Box>
            )}

          {/* Resolve complaint / low-rating section (pending complaints or overallRating < 2.5) */}
          {showResolutionActions && (
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
                  onClick={() => setShowResolveConfirm(true)}
                >
                  Mark as resolved
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
              {[...Array(Math.round(displayReview!.overallRating ?? 0))].map((_, i) => (
                <Star key={i} size={28} fill='#D4AF37' color='#D4AF37' />
              ))}
            </Box>
          </Box>
        </Box>
      )}

      <ResolveComplaintConfirmModal
        open={showResolveConfirm}
        onClose={() => setShowResolveConfirm(false)}
        title='Mark as resolved'
        description='Are you sure you want to mark this complaint as resolved?'
        confirmLabel='Resolve'
        cancelLabel='Cancel'
        onConfirm={handleResolve}
        loading={resolveMutation.isPending}
        confirmColor='success'
      />
    </Modal>
  );
};
