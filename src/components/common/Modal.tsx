import React from 'react';
import { Modal as MUIModal, Fade, Backdrop, Box } from '@mui/material';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm', // Default to a standard size
  className = '',
}) => {
  // Mapping maxWidth to pixel values for the reusable container
  const widthMap = {
    xs: 320,
    sm: 448,
    md: 576,
    lg: 800,
    xl: 1000,
  };

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
            backgroundColor: 'rgba(15, 23, 42, 0.7)', // Deep slate overlay
            backdropFilter: 'blur(4px)', // Soft blur on background only
          },
        },
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            maxWidth: widthMap[maxWidth],
            bgcolor: 'background.paper',
            borderRadius: '28px', // Proper rounded corners
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            outline: 'none',
            overflow: 'hidden', // Keeps children inside the rounded corners
          }}
          className={className}
        >
          {/* Header Section */}
          <div className='flex items-center justify-between p-6 border-b border-gray-50'>
            {title && <h3 className='text-xl font-black text-[#1F2937] tracking-tight'>{title}</h3>}
            <button
              onClick={onClose}
              className='p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400'
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Section */}
          <div className='p-8'>{children}</div>
        </Box>
      </Fade>
    </MUIModal>
  );
};
