import { TextField, MenuItem } from '@mui/material';

type Option = string | { label: string; value: string | number };

type Props = {
  label: string;
  options: Option[];
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function Select({ label, options, value, onChange }: Props) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={onChange}
      fullWidth
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 3,
          bgcolor: 'white',
        },
      }}
    >
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;

        return (
          <MenuItem key={optionValue} value={optionValue}>
            {optionLabel}
          </MenuItem>
        );
      })}
    </TextField>
  );
}
