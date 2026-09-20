import { Box, Button, Container, Link, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { isLocale } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { useConsent } from '../../consent/use-consent';
import { detectLocaleFromEnvironment } from '../../i18n/detect-locale';
import { BrandMark } from './BrandMark';
import { CONTACT_EMAIL, FOOTER_BLURB, FOOTER_TAGLINE, SITE_NAME, WHATSAPP_HREF } from './site-content';
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
  const { user } = useAuth();
  const { openSettings } = useConsent();
  const { locale } = useParams<{ locale: string }>();
  const activeLocale = isLocale(locale) ? locale : detectLocaleFromEnvironment();

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
                  {FOOTER_TAGLINE}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', maxWidth: 360, mb: 2 }}>
              {FOOTER_BLURB}
            </Typography>
            <SocialLinks color="inherit" />
          </Box>

          <Column title="Explore">
            <Link component={RouterLink} to="/" sx={LINK_SX}>
              Home
            </Link>
            <Link component={RouterLink} to="/about" sx={LINK_SX}>
              About
            </Link>
            <Link component={RouterLink} to={`/${activeLocale}/shop`} sx={LINK_SX}>
              Shop
            </Link>
            <Link component={RouterLink} to={`/${activeLocale}/services`} sx={LINK_SX}>
              Services
            </Link>
          </Column>

          <Column title="Account">
            {user ? (
              <Link component={RouterLink} to="/app/gear" sx={LINK_SX}>
                My gear
              </Link>
            ) : (
              <>
                <Link component={RouterLink} to="/login" sx={LINK_SX}>
                  Log in
                </Link>
                <Link component={RouterLink} to="/register" sx={LINK_SX}>
                  Sign up
                </Link>
              </>
            )}
          </Column>

          <Column title="Contact">
            <Link href={`mailto:${CONTACT_EMAIL}`} sx={{ ...LINK_SX, wordBreak: 'break-word' }}>
              {CONTACT_EMAIL}
            </Link>
            <Link href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" sx={LINK_SX}>
              Message Eca on WhatsApp
            </Link>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Based in Argentina
            </Typography>
          </Column>

          <Column title="Legal">
            <Link component={RouterLink} to="/cookies" sx={LINK_SX}>
              Cookie policy
            </Link>
            <Button
              variant="text"
              onClick={openSettings}
              sx={{ ...LINK_SX, p: 0, minWidth: 0, textTransform: 'none', fontWeight: 400, fontSize: 'inherit' }}
            >
              Cookie settings
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
            <Typography variant="caption">{`© ${year} Bendike. All rights reserved.`}</Typography>
            <Typography variant="caption">Built by a rigger, in Argentina.</Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
