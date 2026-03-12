import { Box, ButtonBase } from '@mui/material';
import type { GlobalCsatPeriod } from '../../lib/types/review';

type Period = GlobalCsatPeriod;

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

type PeriodToggleProps = {
  period: Period;
  onChange: (next: Period) => void;
};

export function PeriodToggle({ period, onChange }: PeriodToggleProps) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        p: 0.5,
        gap: 0.5,
        borderRadius: '999px',
        bgcolor: '#F3F4F6',
        border: '1px solid #E5E7EB',
      }}
    >
      {PERIOD_OPTIONS.map((option) => {
        const isActive = option.value === period;
        return (
          <ButtonBase
            key={option.value}
            onClick={() => onChange(option.value)}
            sx={{
              px: 2.25,
              py: 1,
              borderRadius: '999px',
              fontSize: 13,
              fontWeight: 700,
              color: isActive ? '#111827' : '#6B7280',
              bgcolor: isActive ? '#ffffff' : 'transparent',
              boxShadow: isActive ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: isActive ? '#ffffff' : '#E5E7EB',
              },
            }}
          >
            {option.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
