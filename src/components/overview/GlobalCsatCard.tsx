import { Box, Stack, Typography } from '@mui/material';

type GlobalCsatCardProps = {
  scoreDisplay: string;
  scoreMetaLabel: string;
  scoreMetaColor: string;
};

export function GlobalCsatCard({
  scoreDisplay,
  scoreMetaLabel,
  scoreMetaColor,
}: GlobalCsatCardProps) {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 3.5 },
        minHeight: 305,
        borderRadius: '24px',
        border: '1px solid #D1FAE5',
        background: 'linear-gradient(180deg, #F7FFFB 0%, #EEFDF5 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Typography
        fontSize={12}
        fontWeight={800}
        letterSpacing='0.2em'
        textTransform='uppercase'
        color='#6B7280'
      >
        Global CSAT Score
      </Typography>

      <Stack direction='row' alignItems='flex-end' spacing={0.5} mt={2}>
        <Typography
          sx={{
            fontSize: { xs: 60, md: 72 },
            lineHeight: 0.95,
            letterSpacing: '-0.06em',
            fontWeight: 900,
            color: '#059669',
          }}
        >
          {scoreDisplay}
        </Typography>
        <Typography sx={{ pb: 1.2, fontSize: 30, fontWeight: 800, color: '#94A3B8' }}>
          /5
        </Typography>
      </Stack>

      <Typography mt={2} fontSize={15} fontWeight={700} color={scoreMetaColor}>
        {scoreMetaLabel}
      </Typography>
    </Box>
  );
}
