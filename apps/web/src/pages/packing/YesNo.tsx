import { useId } from 'react';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';
import '../../i18n/i18n';

interface YesNoProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export function YesNo({ label, value, onChange }: YesNoProps) {
  const { t } = useTranslation();
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
        <FormControlLabel value="yes" control={<Radio />} label={t('packing.yesNo.yes')} />
        <FormControlLabel value="no" control={<Radio />} label={t('packing.yesNo.no')} />
      </RadioGroup>
    </FormControl>
  );
}
