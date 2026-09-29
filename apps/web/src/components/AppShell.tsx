import { AppBar, Box, Button, Chip, Container, MenuItem, Select, Toolbar, Typography } from '@mui/material';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { LOCALES, Role, isLocale, type Locale } from '@bendike/shared';
import { updateContact } from '../auth/auth-api';
import { useAuth } from '../auth/use-auth';
import { storeLocale } from '../i18n/detect-locale';
import '../i18n/i18n';
import { BrandMark } from './site/BrandMark';
import { WhatsAppFab } from './site/WhatsAppFab';

const LOCALE_LABELS: Record<Locale, string> = { en: 'EN', es: 'ES', pt: 'PT' };

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { t, i18n } = useTranslation();
  const { user, token, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [savingLanguage, setSavingLanguage] = useState(false);

  const handleLogout = () => {
    logout();
    void navigate('/');
  };

  const changeLanguage = async (value: string) => {
    if (!isLocale(value) || !user || !token) {
      return;
    }
    storeLocale(value);
    void i18n.changeLanguage(value);
    setSavingLanguage(true);
    try {
      updateUser?.(await updateContact(token, { locale: value }));
    } catch {
      updateUser?.({ ...user, locale: value });
    } finally {
      setSavingLanguage(false);
    }
  };

  const language = isLocale(i18n.language) ? i18n.language : 'en';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ '@media print': { display: 'none' } }}>
        <Toolbar sx={{ gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', py: { xs: 1, sm: 0 } }}>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              color: 'inherit',
              textDecoration: 'none',
              flexGrow: 1,
            }}
          >
            <BrandMark tone="white" height={32} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 700, letterSpacing: '0.14em' }}>
              BENDIKE
            </Typography>
          </Box>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/app/gear">
                {t('app.shell.gear')}
              </Button>
              {(user.role === Role.Rigger || user.role === Role.Admin) && (
                <Button color="inherit" component={RouterLink} to="/app/work">
                  {t('app.shell.work')}
                </Button>
              )}
              {(user.role === Role.Rigger || user.role === Role.Admin) && (
                <Button color="inherit" component={RouterLink} to="/app/library">
                  {t('app.shell.library')}
                </Button>
              )}
              <Button color="inherit" component={RouterLink} to="/app/riggers">
                {user.role === Role.Rigger ? t('app.shell.customers') : t('app.shell.riggers')}
              </Button>
              <Chip label={t(`app.role.${user.role}`)} color="secondary" size="small" />
              <Select
                size="small"
                value={language}
                disabled={savingLanguage}
                onChange={(event) => void changeLanguage(event.target.value)}
                inputProps={{ 'aria-label': t('app.shell.language') }}
                sx={{
                  color: 'inherit',
                  minWidth: 72,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                  '.MuiSvgIcon-root': { color: 'inherit' },
                }}
              >
                {LOCALES.map((option) => (
                  <MenuItem key={option} value={option}>
                    {LOCALE_LABELS[option]}
                  </MenuItem>
                ))}
              </Select>
              <Button
                color="inherit"
                component={RouterLink}
                to="/app/profile"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                {user.displayName}
              </Button>
              <Button color="inherit" onClick={handleLogout}>
                {t('app.shell.logout')}
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                {t('app.shell.login')}
              </Button>
              <Button variant="contained" color="secondary" component={RouterLink} to="/register">
                {t('app.shell.signup')}
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth={wide ? 'xl' : 'md'} sx={{ pt: 4, pb: 12 }}>
        {children}
      </Container>
      <Box sx={{ '@media print': { display: 'none' } }}>
        <WhatsAppFab />
      </Box>
    </Box>
  );
}
