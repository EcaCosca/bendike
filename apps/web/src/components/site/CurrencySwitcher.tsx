import { MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Currency } from '@bendike/shared';
import { DISPLAY_CURRENCIES, isCurrency } from '@bendike/shared';
import { useCurrency } from '../../currency/use-currency';
import '../../i18n/i18n';

const CURRENCY_LABELS: Record<Currency, string> = { USD: 'US$', ARS: 'AR$', BRL: 'R$' };

export function CurrencySwitcher() {
  const { t } = useTranslation();
  const { currency, setCurrency } = useCurrency();

  if (!currency) {
    return null;
  }

  function handleChange(event: SelectChangeEvent) {
    if (isCurrency(event.target.value)) {
      setCurrency(event.target.value);
    }
  }

  return (
    <Select
      value={currency}
      onChange={handleChange}
      size="small"
      aria-label={t('nav.currency')}
      inputProps={{ 'aria-label': t('nav.currency') }}
      sx={{ minWidth: 88 }}
    >
      {DISPLAY_CURRENCIES.map((option) => (
        <MenuItem key={option} value={option}>
          {CURRENCY_LABELS[option]}
        </MenuItem>
      ))}
    </Select>
  );
}
