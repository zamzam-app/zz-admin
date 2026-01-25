import React from 'react';
import { Button as MUIButton, SxProps, Theme } from '@mui/material';

export type ButtonVariant =
  | 'primary-cake'
  | 'primary-feedback'
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
        ...styles[variant],
      }}
      {...props}
    >
      {children}
    </MUIButton>
  );
};
