import { MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Locale } from '@bendike/shared';
import { LOCALES } from '@bendike/shared';
import { storeLocale } from '../../i18n/detect-locale';
import { buildLocaleSwitchPath } from '../../i18n/locale-path';
import { useLocale } from '../../i18n/useLocale';
import '../../i18n/i18n';

const LOCALE_LABELS: Record<Locale, string> = { en: 'EN', es: 'ES', pt: 'PT' };

export function LocaleSwitcher() {
  const { t } = useTranslation();
  const locale = useLocale();
  const location = useLocation();
  const navigate = useNavigate();

  function handleChange(event: SelectChangeEvent) {
    const next = event.target.value as Locale;
    storeLocale(next);
    navigate(buildLocaleSwitchPath(location.pathname, location.search, next));
  }

  return (
    <Select
      value={locale}
      onChange={handleChange}
      size="small"
      aria-label={t('localeSwitcher.label')}
      sx={{ minWidth: 76 }}
    >
      {LOCALES.map((option) => (
        <MenuItem key={option} value={option}>
          {LOCALE_LABELS[option]}
        </MenuItem>
      ))}
    </Select>
  );
}
