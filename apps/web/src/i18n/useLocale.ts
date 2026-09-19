import { useParams } from 'react-router-dom';
import type { Locale } from '@bendike/shared';

// Only valid nested under LocaleLayout, which already gates an unsupported locale before this renders.
export function useLocale(): Locale {
  const { locale } = useParams<{ locale: Locale }>();
  return locale as Locale;
}
