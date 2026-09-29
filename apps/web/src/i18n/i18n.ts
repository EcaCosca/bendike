import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Locale } from '@bendike/shared';
import { AREA_FILES, COMMON_FILES } from './locales';

function bundle(language: Locale): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...COMMON_FILES[language] };
  for (const file of AREA_FILES[language]) {
    Object.assign(merged, file);
  }
  return merged;
}

void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: bundle('en') },
    es: { translation: bundle('es') },
    pt: { translation: bundle('pt') },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18next;
