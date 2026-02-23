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
import { type Review, type ResolveComplaintDto, ComplaintStatus } from '../../lib/types/review';

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
  const [expandedComplaintQuestionId, setExpandedComplaintQuestionId] = useState<string | null>(
    null,
  );
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    questionId: string;
    complaintStatus: ComplaintStatus;
  } | null>(null);

  const resolveMutation = useApiMutation(
    ({ ratingId, body }: { ratingId: string; body: ResolveComplaintDto }) =>
      reviewsApi.resolveComplaint(ratingId, body),
    [REVIEW_KEYS],
    {
      onSuccess: () => {
        message.success('Complaint updated.');
        setExpandedComplaintQuestionId(null);
        setResolutionNotes('');
        setPendingAction(null);
        onResolved?.();
      },
      onError: (e) => {
        message.error(e?.message ?? 'Failed to update complaint.');
      },
    },
  );

  const handleResolve = (questionId: string, complaintStatus: ComplaintStatus) => {
    if (!review || !user?.id) return;
    resolveMutation.mutate({
      ratingId: review._id,
      body: {
        questionId,
        complaintStatus,
        resolutionNotes: resolutionNotes.trim() || undefined,
        resolvedBy: user.id,
      },
    });
  };

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
            {(review.userResponses ?? []).map((res, index) => {
              const isComplaintPending = res.isComplaint === true;
              const isResolved = res.complaintStatus === 'resolved';
              const isDismissed = res.complaintStatus === 'dismissed';
              const isComplaintRelated = isComplaintPending || isResolved || isDismissed;
              const complaintStatus = isComplaintPending
                ? 'pending'
                : isResolved
                  ? 'resolved'
                  : isDismissed
                    ? 'dismissed'
                    : undefined;
              const qId =
                typeof res.questionId === 'object' && res.questionId !== null
                  ? res.questionId._id
                  : String(res.questionId);
              const questionTitle =
                typeof res.questionId === 'object' &&
                res.questionId !== null &&
                'title' in res.questionId
                  ? (res.questionId as { _id: string; title?: string }).title?.trim()
                  : null;
              const isExpanded = isComplaintPending && expandedComplaintQuestionId === qId;
              const isResolving = resolveMutation.isPending;

              const statusLabel =
                complaintStatus === 'pending'
                  ? 'Pending'
                  : complaintStatus === 'resolved'
                    ? 'Resolved'
                    : complaintStatus === 'dismissed'
                      ? 'Dismissed'
                      : null;

              const boxSx = {
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                outlineOffset: 1,
                ...(isComplaintRelated
                  ? {
                      ...(isResolved && {
                        borderColor: 'success.light',
                        outlineColor: 'success.main',
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                      }),
                      ...(isDismissed && {
                        borderColor: 'error.light',
                        backgroundColor: 'error.50',
                      }),
                      ...(isComplaintPending && {
                        borderColor: 'error.main',
                        backgroundColor: 'error.50',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'error.100' },
                      }),
                    }
                  : {
                      borderColor: 'divider',
                      backgroundColor: 'transparent',
                    }),
              };

              return (
                <Box
                  component='li'
                  key={`${qId}-${index}`}
                  sx={boxSx}
                  onClick={
                    isComplaintPending
                      ? () => setExpandedComplaintQuestionId((prev) => (prev === qId ? null : qId))
                      : undefined
                  }
                  role={isComplaintPending ? 'button' : undefined}
                  aria-expanded={isExpanded}
                >
                  <Typography
                    variant='subtitle2'
                    fontWeight={700}
                    color='text.primary'
                    display='block'
                    mb={0.5}
                  >
                    {questionTitle ?? 'Question'}
                    {isComplaintRelated && (
                      <>
                        <Typography
                          component='span'
                          variant='caption'
                          fontWeight={700}
                          color={
                            isResolved ? 'success.dark' : isDismissed ? 'error.main' : 'error.main'
                          }
                          sx={{ ml: 1 }}
                        >
                          (Complaint
                          {statusLabel != null ? ` · ${statusLabel}` : ''})
                        </Typography>
                      </>
                    )}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {Array.isArray(res.answer) ? res.answer.join(', ') : String(res.answer ?? '—')}
                  </Typography>

                  {(isResolved || isDismissed) && (res.resolutionNotes || res.resolvedAt) && (
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: isResolved
                          ? 'rgba(46, 125, 50, 0.12)'
                          : 'rgba(211, 47, 47, 0.12)',
                        borderColor: isResolved ? 'success.light' : 'error.light',
                      }}
                    >
                      {res.resolutionNotes && (
                        <Typography variant='caption' display='block' color='text.secondary'>
                          {res.resolutionNotes}
                        </Typography>
                      )}
                      {res.resolvedAt && (
                        <Typography
                          variant='caption'
                          display='block'
                          color='text.secondary'
                          sx={{ mt: 0.5, opacity: 0.9 }}
                        >
                          Resolved {new Date(res.resolvedAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {isExpanded && (
                    <Box
                      mt={2}
                      pt={2}
                      borderTop='1px solid'
                      borderColor='divider'
                      onClick={(e) => e.stopPropagation()}
                    >
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
                          disabled={isResolving || !user?.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingAction({
                              questionId: qId,
                              complaintStatus: ComplaintStatus.RESOLVED,
                            });
                          }}
                        >
                          Mark as resolved
                        </Button>
                        <Button
                          variant='outlined'
                          color='error'
                          size='small'
                          disabled={isResolving || !user?.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingAction({
                              questionId: qId,
                              complaintStatus: ComplaintStatus.DISMISSED,
                            });
                          }}
                        >
                          Mark as rejected
                        </Button>
                      </Box>
                    </Box>
                  )}
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
            handleResolve(pendingAction.questionId, pendingAction.complaintStatus);
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
