import { Box, Skeleton, Stack, Typography } from '@mui/material';

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
};

export function QuickInsightsCard({ insights, loading, errorMessage }: QuickInsightsCardProps) {
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
