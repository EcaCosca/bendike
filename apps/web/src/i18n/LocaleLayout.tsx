import { Container, Typography } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useParams } from 'react-router-dom';
import { isLocale } from '@bendike/shared';
import { CurrencyProvider } from '../currency/CurrencyProvider';
import { storeLocale } from './detect-locale';
import './i18n';

export function LocaleLayout() {
  const { locale } = useParams<{ locale: string }>();
  const { t, i18n } = useTranslation();
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
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('notFound.title')}
        </Typography>
        <Typography color="text.secondary">{t('notFound.body')}</Typography>
      </Container>
    );
  }

  return (
    <CurrencyProvider locale={locale}>
      <Outlet />
    </CurrencyProvider>
  );
}
