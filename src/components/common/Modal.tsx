import React from 'react';
import { Modal as MUIModal, Fade, Backdrop } from '@mui/material';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, className = '' }) => {
  return (
    <MUIModal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <Fade in={open}>
        <div
          className={`bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl focus:outline-none ${className}`}
        >
          {title && <h3 className='text-2xl font-black text-[#1F2937] mb-4'>{title}</h3>}
          {children}
        </div>
      </Fade>
    </MUIModal>
  );
};
