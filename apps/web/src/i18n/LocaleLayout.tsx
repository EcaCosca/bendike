import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useParams } from 'react-router-dom';
import { isLocale } from '@bendike/shared';
import { NotFoundPage } from '../pages/NotFoundPage';
import { CurrencyProvider } from '../currency/CurrencyProvider';
import { storeLocale } from './detect-locale';
import './i18n';

export function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>();
  const { i18n } = useTranslation();
  const valid = isLocale(locale);

  useEffect(() => {
    if (!valid) {
      return;
    }
    storeLocale(locale);
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, valid, i18n]);

  if (!valid) {
    // The same 404 the rest of the site shows. The bespoke message this used to
    // render had no navigation at all, so an unsupported locale was a dead end.
    return <NotFoundPage />;
  }

  return (
    <CurrencyProvider locale={locale}>
      <Outlet />
    </CurrencyProvider>
  );
}
