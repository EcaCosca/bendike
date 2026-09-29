import { Box, CircularProgress } from '@mui/material';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { storeLocale } from '../i18n/detect-locale';
import '../i18n/i18n';
import { useAuth } from './use-auth';

export function RequireAuth() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();
  const accountLanguage = user?.locale;

  useEffect(() => {
    if (!accountLanguage) {
      return;
    }
    storeLocale(accountLanguage);
    if (i18n.language !== accountLanguage) {
      void i18n.changeLanguage(accountLanguage);
    }
  }, [accountLanguage, i18n]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress aria-label={t('auth.loadingSession')} />
      </Box>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
