import { TextField, MenuItem } from '@mui/material';

type Props = {
  label?: string;
  options: string[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Select({
  label,
  options,
  value,
  onChange,
}: Props) {
  return (
    <TextField
      select
      label={label}
      value={value || ''}
      onChange={onChange}
      fullWidth
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          bgcolor: '#F9FAFB',
          '&:hover fieldset': { borderColor: '#D4AF37' },
          '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
        },
      }}
    >
      {options.map(opt => (
        <MenuItem key={opt} value={opt}>
          {opt}
        </MenuItem>
      ))}
    </TextField>
  );
}
