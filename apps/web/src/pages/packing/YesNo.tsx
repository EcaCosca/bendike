import { useId } from 'react';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';

interface YesNoProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export function YesNo({ label, value, onChange }: YesNoProps) {
  const labelId = useId();
  return (
    <FormControl>
      <FormLabel id={labelId}>{label}</FormLabel>
      <RadioGroup
        row
        aria-labelledby={labelId}
        value={value === null ? '' : value ? 'yes' : 'no'}
        onChange={(e) => onChange(e.target.value === 'yes')}
      >
        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
        <FormControlLabel value="no" control={<Radio />} label="No" />
      </RadioGroup>
    </FormControl>
  );
}
