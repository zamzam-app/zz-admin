import React, { useState } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
  label?: string;
} & React.ComponentProps<typeof TextField>;

export default function Input({ label, type, ...props }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <TextField
      label={label}
      type={isPassword ? (showPassword ? 'text' : 'password') : type}
      fullWidth
      variant='outlined'
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          bgcolor: '#F9FAFB',
          '&:hover fieldset': { borderColor: '#D4AF37' },
          '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
        },
      }}
      slotProps={{
        input: {
          endAdornment: isPassword ? (
            <InputAdornment position='end'>
              <IconButton onClick={handleTogglePassword} edge='end' size='small'>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
      {...props}
    />
  );
}
