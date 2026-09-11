import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/use-auth';
import { NAV_LINKS, SITE_NAME } from './site-content';

export function SiteNav() {
  const { user } = useAuth();
  const { pathname } = useLocation();

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
        <Toolbar disableGutters sx={{ gap: 2, minHeight: 72 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 800, letterSpacing: '0.12em' }}
          >
            {SITE_NAME}
          </Typography>
          <Box component="nav" aria-label="Site" sx={{ display: 'flex', gap: 1, ml: { xs: 1, md: 4 } }}>
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
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1.5}>
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
