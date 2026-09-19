import { MenuItem, Select, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { ProductVariant } from '@bendike/shared';
import { optionNames, selectValue, valuesFor, type Selection } from './variant-options';

interface VariantPickerProps {
  variants: ProductVariant[];
  selection: Selection;
  onChange: (selection: Selection) => void;
}

export function VariantPicker({ variants, selection, onChange }: VariantPickerProps) {
  const { t } = useTranslation();

  return (
    <Stack spacing={2}>
      {optionNames(variants).map((name, index) => {
        const label = t(`product.options.${name}`, { defaultValue: name });
        return (
          <Select
            key={name}
            size="small"
            displayEmpty
            value={selection[index] ?? ''}
            disabled={index > 0 && selection[index - 1] === undefined}
            inputProps={{ 'aria-label': label }}
            onChange={(event) => onChange(selectValue(selection, index, event.target.value))}
          >
            <MenuItem value="" disabled>
              {label}
            </MenuItem>
            {valuesFor(variants, selection, index).map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        );
      })}
    </Stack>
  );
}
