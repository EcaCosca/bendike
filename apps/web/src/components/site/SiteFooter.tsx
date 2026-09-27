import { Box, Button, Container, Link, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { isLocale } from '@bendike/shared';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/use-auth';
import { useConsent } from '../../consent/use-consent';
import { detectLocaleFromEnvironment } from '../../i18n/detect-locale';
import '../../i18n/i18n';
import { BrandMark } from './BrandMark';
import { CONTACT_EMAIL, SITE_NAME, WHATSAPP_HREF } from './site-content';
import { SocialLinks } from './SocialLinks';

const LINK_SX = {
  color: 'rgba(255,255,255,0.78)',
  textDecoration: 'none',
  '&:hover': { color: '#F3C233', textDecoration: 'underline' },
} as const;

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="nav" aria-label={title}>
      <Typography
        variant="overline"
        component="h2"
        sx={{ color: '#F3C233', fontWeight: 700, letterSpacing: '0.14em', display: 'block', mb: 1 }}
      >
        {title}
      </Typography>
      <Stack spacing={1} alignItems="flex-start">
        {children}
      </Stack>
    </Box>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { openSettings } = useConsent();
  const { locale } = useParams<{ locale: string }>();
  const activeLocale = isLocale(locale) ? locale : detectLocaleFromEnvironment();
  // Bound to the locale in the URL rather than i18n's current language, so the
  // labels and the hrefs always agree. The nav does the same.
  const t = i18n.getFixedT(activeLocale);

  return (
    <Box component="footer" sx={{ bgcolor: 'primary.main', color: 'common.white', pt: { xs: 6, md: 8 }, pb: 4 }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 5 },
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: '1.7fr 1fr 1fr 1.3fr 1fr' },
          }}
        >
          <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <BrandMark tone="white" height={40} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '0.14em', lineHeight: 1.2 }}>
                  {SITE_NAME}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {t('site.tagline')}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', maxWidth: 360, mb: 2 }}>
              {t('site.blurb')}
            </Typography>
            <SocialLinks color="inherit" />
          </Box>

          <Column title={t('site.explore')}>
            <Link component={RouterLink} to={`/${activeLocale}`} sx={LINK_SX}>
              {t('site.home')}
            </Link>
            <Link component={RouterLink} to={`/${activeLocale}/about`} sx={LINK_SX}>
              {t('site.about')}
            </Link>
            <Link component={RouterLink} to={`/${activeLocale}/shop`} sx={LINK_SX}>
              {t('nav.shop')}
            </Link>
            <Link component={RouterLink} to={`/${activeLocale}/services`} sx={LINK_SX}>
              {t('nav.services')}
            </Link>
            <Link component={RouterLink} to={`/${activeLocale}/learn`} sx={LINK_SX}>
              {t('nav.learn')}
            </Link>
          </Column>

          <Column title={t('site.account')}>
            {user ? (
              <Link component={RouterLink} to="/app/gear" sx={LINK_SX}>
                {t('site.myGear')}
              </Link>
            ) : (
              <>
                <Link component={RouterLink} to="/login" sx={LINK_SX}>
                  {t('site.login')}
                </Link>
                <Link component={RouterLink} to="/register" sx={LINK_SX}>
                  {t('site.signup')}
                </Link>
              </>
            )}
          </Column>

          <Column title={t('site.contact')}>
            <Link href={`mailto:${CONTACT_EMAIL}`} sx={{ ...LINK_SX, wordBreak: 'break-word' }}>
              {CONTACT_EMAIL}
            </Link>
            <Link href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" sx={LINK_SX}>
              {t('site.whatsapp')}
            </Link>
          </Column>

          <Column title={t('site.legal')}>
            <Link component={RouterLink} to="/cookies" sx={LINK_SX}>
              {t('site.cookiePolicy')}
            </Link>
            <Button
              variant="text"
              onClick={openSettings}
              sx={{ ...LINK_SX, p: 0, minWidth: 0, textTransform: 'none', fontWeight: 400, fontSize: 'inherit' }}
            >
              {t('site.cookieSettings')}
            </Button>
          </Column>
        </Box>

        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.18)', mt: 6, pt: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={1}
            sx={{ color: 'rgba(255,255,255,0.7)', pr: 9 }}
          >
            <Typography variant="caption">{`© ${year} Bendike. ${t('site.rights')}`}</Typography>
            <Typography variant="caption">{t('site.motto')}</Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
