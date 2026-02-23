import React from 'react';
import { Modal as MUIModal, Fade, Backdrop, Box } from '@mui/material';
import { X } from 'lucide-react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  titleAlign?: 'left' | 'center';
  /** Rendered in the header before the close button (e.g. "Add" action) */
  headerAction?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  contentClassName?: string;
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  titleAlign = 'left',
  headerAction,
  children,
  maxWidth = 'sm',
  className = '',
  contentClassName = 'p-8 cursor-default',
}) => {
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
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
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
            borderRadius: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            outline: 'none',
            overflow: 'hidden',
          }}
          className={className}
        >
          {/* Header Section */}
          <div className='flex items-center justify-between p-6 border-b border-gray-50'>
            {titleAlign === 'center' ? (
              <>
                <div className='w-10 shrink-0' aria-hidden />
                <h3 className='text-xl font-black text-[#1F2937] tracking-tight text-center flex-1'>
                  {title}
                </h3>
                <div className='flex items-center gap-2'>
                  {headerAction}
                  <button
                    onClick={onClose}
                    className='p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 shrink-0 cursor-pointer'
                  >
                    <X size={20} />
                  </button>
                </div>
              </>
            ) : (
              <>
                {title && (
                  <h3 className='text-xl font-black text-[#1F2937] tracking-tight cursor-default'>
                    {title}
                  </h3>
                )}
                <div className='flex items-center gap-2 ml-auto'>
                  {headerAction}
                  <button
                    onClick={onClose}
                    className='p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 shrink-0 cursor-pointer'
                  >
                    <X size={20} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Content Section */}
          <div className={contentClassName}>{children}</div>
        </Box>
      </Fade>
    </MUIModal>
  );
};
