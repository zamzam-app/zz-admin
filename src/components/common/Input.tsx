import React from 'react';
import { TextField } from '@mui/material';

type Props = {
  label?: string;
} & React.ComponentProps<typeof TextField>;

export default function Input({ label, ...props }: Props) {
  return (
    <TextField
      label={label}
      fullWidth
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          bgcolor: '#F9FAFB',
          '&:hover fieldset': { borderColor: '#D4AF37' },
          '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
        },
      }}
      {...props}
    />
  );
}
