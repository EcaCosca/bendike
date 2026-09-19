import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { isLocale } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { detectLocaleFromEnvironment } from '../../i18n/detect-locale';
import { BrandMark } from './BrandMark';
import { LocaleSwitcher } from './LocaleSwitcher';
import { NAV_LINKS, SITE_NAME } from './site-content';

export function SiteNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { i18n } = useTranslation();
  const { locale } = useParams<{ locale: string }>();
  const activeLocale = isLocale(locale) ? locale : undefined;
  const shopPath = `/${activeLocale ?? detectLocaleFromEnvironment()}/shop`;
  const shopLabel = activeLocale ? i18n.getFixedT(activeLocale)('nav.shop') : 'Shop';
  const servicesPath = shopPath.replace(/\/shop$/, '/services');
  const servicesLabel = activeLocale ? i18n.getFixedT(activeLocale)('nav.services') : 'Services';

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{ gap: { xs: 1, md: 2 }, minHeight: 72, flexWrap: { xs: 'wrap', md: 'nowrap' }, py: { xs: 1, md: 0 } }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            component={RouterLink}
            to="/"
            sx={{ color: 'primary.main', textDecoration: 'none' }}
          >
            <BrandMark height={36} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 700, letterSpacing: '0.14em' }}>
              {SITE_NAME}
            </Typography>
          </Stack>
          <Box
            component="nav"
            aria-label="Site"
            sx={{
              display: 'flex',
              gap: 1,
              ml: { xs: 0, md: 4 },
              order: { xs: 3, md: 0 },
              flexBasis: { xs: '100%', md: 'auto' },
              overflowX: 'auto',
            }}
          >
            {NAV_LINKS.map((link) => (
              <Button
                key={link.to}
                component={RouterLink}
                to={link.to}
                color="inherit"
                aria-current={pathname === link.to ? 'page' : undefined}
                sx={{ color: pathname === link.to ? 'primary.main' : 'text.secondary' }}
              >
                {link.label}
              </Button>
            ))}
            <Button
              component={RouterLink}
              to={shopPath}
              color="inherit"
              aria-current={pathname === shopPath ? 'page' : undefined}
              sx={{ color: pathname === shopPath ? 'primary.main' : 'text.secondary' }}
            >
              {shopLabel}
            </Button>
            <Button
              component={RouterLink}
              to={servicesPath}
              color="inherit"
              aria-current={pathname === servicesPath ? 'page' : undefined}
              sx={{ color: pathname === servicesPath ? 'primary.main' : 'text.secondary' }}
            >
              {servicesLabel}
            </Button>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1.5} alignItems="center">
            {activeLocale && <LocaleSwitcher />}
            {user ? (
              <Button variant="contained" component={RouterLink} to="/app">
                Open app
              </Button>
            ) : (
              <>
                <Button variant="outlined" component={RouterLink} to="/login">
                  Log in
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  component={RouterLink}
                  to="/register"
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  Sign up
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
