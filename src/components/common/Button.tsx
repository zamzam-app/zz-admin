import React from 'react';
import { Button as MUIButton, SxProps, Theme } from '@mui/material';

export type ButtonVariant =
  | 'primary-cake'
  | 'primary-feedback'
  | 'primary-outlet'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'admin-primary';

type ButtonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof MUIButton>, 'variant'>;

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary-cake',
  fullWidth = false,
  ...props
}) => {
  const styles: Record<ButtonVariant, SxProps<Theme>> = {
    'primary-cake': {
      bgcolor: '#F5E6CA',
      color: '#1F2937',
      '&:hover': { bgcolor: '#ebd8b1' },
    },
    'primary-feedback': {
      bgcolor: '#10B981',
      color: '#fff',
      '&:hover': { bgcolor: '#0da673' },
    },
    'primary-outlet': {
      bgcolor: '#705E0C',
      color: '#fff',
      fontSize: '0.75rem',
      px: 2,
      py: 1,
      minWidth: 'auto',
      borderRadius: '12px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      '&:hover': { bgcolor: '#5c4d0a' },
      '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
    },
    'admin-primary': {
      bgcolor: '#1F2937',
      color: '#fff',
      '&:hover': { bgcolor: '#111827' },
    },
    outline: {
      border: '2px solid #E5E7EB',
      color: '#1F2937',
      '&:hover': { borderColor: '#D4AF37', bgcolor: '#fafafa' },
    },
    ghost: {
      color: '#4B5563',
      '&:hover': { bgcolor: '#F3F4F6' },
    },
    danger: {
      bgcolor: '#FEF2F2',
      color: '#E11D48',
      '&:hover': { bgcolor: '#FEE2E2' },
    },
  };

  return (
    <MUIButton
      fullWidth={fullWidth}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 700,
        px: 3,
        py: 1.5,
        outline: 'none',
        '&:focus': { outline: 'none' },
        ...styles[variant],
      }}
      {...props}
    >
      {children}
    </MUIButton>
  );
};
