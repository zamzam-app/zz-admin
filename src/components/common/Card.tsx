import React from 'react';
import { Card as MUICard, CardContent, SxProps, Theme } from '@mui/material';

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  sx?: SxProps<Theme>;
  disablePadding?: boolean;
};

export default function Card({
  children,
  onClick,
  className,
  style,
  sx,
  disablePadding = false,
}: Props) {
  return (
    <MUICard
      onClick={onClick}
      className={className}
      style={style}
      sx={[
        {
          borderRadius: 3,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          cursor: onClick ? 'pointer' : 'default',
          transition: '0.2s',
          '&:hover': {
            boxShadow: onClick ? '0 4px 12px rgba(0,0,0,0.08)' : undefined,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <CardContent sx={{ p: disablePadding ? '0 !important' : undefined }}>{children}</CardContent>
    </MUICard>
  );
}
