import { useState, useEffect } from 'react';
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import type { OutletCount } from './IncidentSummaryCard';

type InsightItem = {
  label: string;
  value: string;
  border: string;
  background: string;
  accent: string;
};

type QuickInsightsCardProps = {
  insights: InsightItem[];
  loading: boolean;
  errorMessage?: string | null;
  openComplaints?: OutletCount[];
  openComplaintsLoading?: boolean;
};

export function QuickInsightsCard({
  insights,
  loading,
  errorMessage,
  openComplaints = [],
  openComplaintsLoading = false,
}: QuickInsightsCardProps) {
  const [currentComplaintIndex, setCurrentComplaintIndex] = useState(0);

  useEffect(() => {
    if (openComplaints.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentComplaintIndex((prev) => (prev + 1) % openComplaints.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [openComplaints.length]);

  const currentOutlet = openComplaints[currentComplaintIndex];

  return (
    <Box
      sx={{
        p: { xs: 3, md: 3.5 },
        mb: 2,
        borderRadius: '24px',
        border: '1px solid #E5E7EB',
        bgcolor: '#ffffff',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <Typography
        fontSize={{ xs: 22, md: 26 }}
        fontWeight={800}
        color='#111827'
        letterSpacing='-0.02em'
      >
        Quick Insights
      </Typography>

      {errorMessage && (
        <Typography mt={1} fontSize={12} color='#B91C1C' fontWeight={600}>
          {errorMessage}
        </Typography>
      )}

      {loading ? (
        <Stack spacing={2} mt={2.5}>
          {Array.from({ length: 3 }, (_, index) => (
            <Box
              key={index}
              sx={{
                px: { xs: 2.25, md: 2.75 },
                py: { xs: 2, md: 2.25 },
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                bgcolor: '#F8FAFC',
              }}
            >
              <Skeleton variant='text' width='40%' height={18} />
              <Skeleton variant='text' width='70%' height={22} />
            </Box>
          ))}
        </Stack>
      ) : (
        <Stack spacing={2} mt={2.5}>
          {openComplaintsLoading ? (
            <Box
              sx={{
                px: { xs: 2.25, md: 2.75 },
                py: { xs: 2, md: 2.25 },
                borderRadius: '16px',
                border: '1px solid #E5E7EB',
                bgcolor: '#F8FAFC',
              }}
            >
              <Skeleton variant='text' width='40%' height={18} />
              <Skeleton variant='text' width='70%' height={22} />
            </Box>
          ) : currentOutlet ? (
            <Box
              sx={{
                px: { xs: 2.25, md: 2.75 },
                py: { xs: 2, md: 2.25 },
                borderRadius: '16px',
                border: '1px solid #FECDD3',
                background: 'linear-gradient(180deg, #FFF5F7 0%, #FFF1F2 100%)',
              }}
            >
              <Stack direction='row' spacing={1.2} alignItems='center' mb={0.6}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#E11D48',
                    flexShrink: 0,
                  }}
                />
                <Typography fontSize={{ xs: 13, md: 15 }} fontWeight={700} color='#6B7280'>
                  Live Open Complaints
                </Typography>
              </Stack>
              <Box
                key={currentComplaintIndex}
                className='animate-flip-in'
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 2.5,
                }}
              >
                <Typography
                  fontSize={{ xs: 15, md: 18 }}
                  lineHeight={1.35}
                  fontWeight={800}
                  color='#111827'
                  sx={{ wordBreak: 'break-word' }}
                >
                  {currentOutlet.outletName}
                </Typography>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.25,
                    borderRadius: '20px',
                    border: '1px solid #FECDD3',
                    bgcolor: '#fff',
                    color: '#E11D48',
                    fontWeight: 800,
                    fontSize: { xs: 14, md: 16 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 32,
                  }}
                >
                  {currentOutlet.count}
                </Box>
              </Box>
            </Box>
          ) : null}

          {insights.map((insight) => (
            <Box
              key={insight.label}
              sx={{
                px: { xs: 2.25, md: 2.75 },
                py: { xs: 2, md: 2.25 },
                borderRadius: '16px',
                border: `1px solid ${insight.border}`,
                background: insight.background,
              }}
            >
              <Stack direction='row' spacing={1.2} alignItems='center'>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: insight.accent,
                    flexShrink: 0,
                  }}
                />
                <Typography fontSize={{ xs: 13, md: 15 }} fontWeight={700} color='#6B7280'>
                  {insight.label}
                </Typography>
              </Stack>
              <Typography
                mt={0.6}
                fontSize={{ xs: 15, md: 18 }}
                lineHeight={1.35}
                fontWeight={800}
                color='#111827'
                sx={{ wordBreak: 'break-word' }}
              >
                {insight.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
