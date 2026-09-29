import { Box, Button, Container, Link, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import '../i18n/i18n';
import { useConsent } from './use-consent';

export function CookieBanner() {
  const { t } = useTranslation();
  const { choice, acceptAll, rejectAll, openSettings } = useConsent();
  if (choice !== null) return null;

  return (
    <Paper
      component="section"
      aria-label={t('consent.banner.region')}
      elevation={8}
      square
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.snackbar,
        borderTop: 1,
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom, 0px)',
        '@media print': { display: 'none' },
      }}
    >
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {t('consent.banner.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('consent.banner.body')}{' '}
              <Link component={RouterLink} to="/cookies">
                {t('consent.banner.policyLink')}
              </Link>
              .
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexShrink: 0 }}>
            <Button variant="text" onClick={openSettings}>
              {t('consent.banner.manage')}
            </Button>
            <Button variant="contained" onClick={rejectAll}>
              {t('consent.banner.reject')}
            </Button>
            <Button variant="contained" onClick={acceptAll}>
              {t('consent.banner.accept')}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Paper>
  );
}
