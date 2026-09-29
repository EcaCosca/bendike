import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { detectLocaleFromEnvironment } from './detect-locale';
import './i18n';

export function usePublicLanguage(): void {
  const { i18n } = useTranslation();
  useEffect(() => {
    const language = detectLocaleFromEnvironment();
    if (i18n.language !== language) {
      void i18n.changeLanguage(language);
    }
  }, [i18n]);
}
