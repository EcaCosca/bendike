import { MenuItem, Select, type SelectChangeEvent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Locale } from '@bendike/shared';
import { LOCALES, isLocale } from '@bendike/shared';
import { detectLocaleFromEnvironment, storeLocale } from '../../i18n/detect-locale';
import { buildLocaleSwitchPath } from '../../i18n/locale-path';
import '../../i18n/i18n';

const LOCALE_LABELS: Record<Locale, string> = { en: 'EN', es: 'ES', pt: 'PT' };

export function LocaleSwitcher() {
  const { t, i18n } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const prefixed = isLocale(locale);
  const current: Locale = prefixed ? locale : detectLocaleFromEnvironment();

  function handleChange(event: SelectChangeEvent) {
    const next = event.target.value;
    if (!isLocale(next)) {
      return;
    }
    storeLocale(next);
    if (prefixed) {
      void navigate(buildLocaleSwitchPath(location.pathname, location.search, next));
    } else {
      void i18n.changeLanguage(next);
    }
  }

  return (
    <Select
      value={current}
      onChange={handleChange}
      size="small"
      aria-label={t('localeSwitcher.label')}
      inputProps={{ 'aria-label': t('localeSwitcher.label') }}
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
