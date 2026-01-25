import React from 'react';
import { Card as MUICard, CardContent } from '@mui/material';

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export default function Card({ children, onClick, className }: Props) {
  return (
    <MUICard
      onClick={onClick}
      className={className}
      sx={{
        borderRadius: 3,
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        cursor: onClick ? 'pointer' : 'default',
        transition: '0.2s',
        '&:hover': {
          boxShadow: onClick ? '0 4px 12px rgba(0,0,0,0.08)' : undefined,
        },
      }}
    >
      <CardContent>{children}</CardContent>
    </MUICard>
  );
}
