import { Box, Skeleton, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export type OutletCount = {
  outletId: string;
  outletName: string;
  count: number;
};

type IncidentSummaryCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  items: OutletCount[];
  loading: boolean;
  errorMessage?: string | null;
  background: string;
  borderColor: string;
  accentColor: string;
};

export function IncidentSummaryCard({
  icon,
  title,
  description,
  items,
  loading,
  errorMessage,
  background,
  borderColor,
  accentColor,
}: IncidentSummaryCardProps) {
  return (
    <Box
      sx={{
        p: 3,
        minHeight: 260,
        borderRadius: '20px',
        border: `1px solid ${borderColor}`,
        background,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction='row' alignItems='center' spacing={1.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            border: `1px solid ${borderColor}`,
            color: accentColor,
            bgcolor: '#ffffff',
          }}
        >
          {icon}
        </Box>
        <Typography fontSize={18} fontWeight={800} color='#111827'>
          {title}
        </Typography>
      </Stack>

      <Typography mt={1.5} fontSize={13} color='#6B7280'>
        {description}
      </Typography>

      {errorMessage && (
        <Typography mt={1} fontSize={12} color='#B91C1C' fontWeight={600}>
          {errorMessage}
        </Typography>
      )}

      <Box
        sx={{
          mt: 2,
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          bgcolor: '#ffffff',
          px: 1.5,
          py: 1,
          maxHeight: 180,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {loading ? (
          <Stack spacing={1} py={0.5}>
            {Array.from({ length: 3 }, (_, index) => (
              <Stack
                key={index}
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                py={0.5}
              >
                <Skeleton variant='text' width='65%' height={18} />
                <Skeleton variant='rounded' width={32} height={26} />
              </Stack>
            ))}
          </Stack>
        ) : items.length === 0 ? (
          <Typography py={1} fontSize={13} color='#9CA3AF'>
            No data
          </Typography>
        ) : (
          <Stack spacing={0}>
            {items.map((item, index) => (
              <Stack
                key={item.outletId}
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                py={0.75}
                borderBottom={index === items.length - 1 ? 'none' : '1px solid #F3F4F6'}
              >
                <Typography fontSize={13} fontWeight={700} color='#374151'>
                  {item.outletName}
                </Typography>
                <Box
                  sx={{
                    minWidth: 32,
                    height: 26,
                    borderRadius: '999px',
                    border: `1px solid ${borderColor}`,
                    bgcolor: '#ffffff',
                    color: accentColor,
                    fontSize: 12,
                    fontWeight: 800,
                    display: 'grid',
                    placeItems: 'center',
                    px: 1,
                  }}
                >
                  {item.count}
                </Box>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
