import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { isLocale } from '@bendike/shared';
import { SitePage } from '../components/site/SitePage';
import { detectLocaleFromEnvironment } from '../i18n/detect-locale';
import '../i18n/i18n';

/**
 * What an unknown address gets. It used to be a silent redirect to the landing
 * page, which told a reader with a mistyped or dead link nothing at all — and hid
 * broken links from us too, since nobody ever reported one.
 */
export function NotFoundPage() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  // This page sits on a catch-all and on the locale layout's invalid-locale branch,
  // so there is no `:locale` param to read — the first path segment is the only clue
  // to what language the reader was asking for.
  const [, first] = pathname.split('/');
  const activeLocale = isLocale(first) ? first : detectLocaleFromEnvironment();
  const t = i18n.getFixedT(activeLocale);

  return (
    <SitePage>
      <Container maxWidth="sm" sx={{ py: { xs: 10, md: 16 }, textAlign: 'center' }}>
        <Typography
          variant="h1"
          sx={{ fontSize: { xs: 72, md: 104 }, fontWeight: 700, color: 'secondary.main', lineHeight: 1 }}
        >
          404
        </Typography>
        <Typography variant="h5" component="p" sx={{ mt: 2, fontWeight: 600 }}>
          {t('notFoundPage.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5, mb: 4 }}>
          {t('notFoundPage.body')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
          <Button component={RouterLink} to={`/${activeLocale}`} variant="contained">
            {t('notFoundPage.home')}
          </Button>
          <Button component={RouterLink} to={`/${activeLocale}/shop`} variant="outlined">
            {t('notFoundPage.shop')}
          </Button>
        </Stack>
        <Box sx={{ mt: 5 }}>
          <Typography variant="caption" color="text.secondary">
            {t('notFoundPage.help')}
          </Typography>
        </Box>
      </Container>
    </SitePage>
  );
}
