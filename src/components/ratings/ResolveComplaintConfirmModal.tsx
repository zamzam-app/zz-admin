import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Modal } from '../common/Modal';

type ResolveComplaintConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
  confirmColor?: 'primary' | 'success' | 'error';
};

export const ResolveComplaintConfirmModal: React.FC<ResolveComplaintConfirmModalProps> = ({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false,
  confirmColor = 'primary',
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth='xs'>
      <Box display='flex' flexDirection='column' gap={2}>
        <Typography variant='body2' color='text.secondary'>
          {description}
        </Typography>
        <Box display='flex' gap={1} justifyContent='flex-end' flexWrap='wrap'>
          <Button variant='outlined' onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant='contained'
            color={confirmColor}
            onClick={handleConfirm}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color='inherit' /> : null}
          >
            {confirmLabel}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};
