import React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';

type ReviewsPageHeaderProps = {
  selectedOutlet: string;
  onOutletChange: (value: string) => void;
  outletOptions: [string, string][];
  showOutletFilter: boolean;
};

export const ReviewsPageHeader: React.FC<ReviewsPageHeaderProps> = ({
  selectedOutlet,
  onOutletChange,
  outletOptions,
  showOutletFilter,
}) => {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent='space-between'
      alignItems={{ xs: 'flex-start', sm: 'center' }}
      spacing={2}
      mb={2}
      flexShrink={0}
    >
      <Box>
        <Typography variant='h4' fontWeight={800} sx={{ fontSize: 32 }}>
          Reviews
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Franchise Ranking, Universal Metrics Heatmap and critical feedback intelligence.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {showOutletFilter && (
          <FormControl size='small' sx={{ minWidth: 220 }}>
            <InputLabel>Filter by Outlet</InputLabel>
            <Select
              value={selectedOutlet}
              label='Filter by Outlet'
              onChange={(event) => onOutletChange(event.target.value)}
            >
              <MenuItem value='all'>All Outlets</MenuItem>
              {outletOptions.map(([id, name]) => (
                <MenuItem key={id} value={id}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>
    </Stack>
  );
};
