import { Box, Button, Container, Link, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useConsent } from './use-consent';

export function CookieBanner() {
  const { choice, acceptAll, rejectAll, openSettings } = useConsent();
  if (choice !== null) return null;

  return (
    <Paper
      component="section"
      aria-label="Cookie consent"
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
              Your privacy on Bendike
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We store a few things on your device. The necessary ones keep you signed in and remember your language.
              With your permission we also remember your view choices and can load Google sign-in. Read our{' '}
              <Link component={RouterLink} to="/cookies">
                cookie policy
              </Link>
              .
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexShrink: 0 }}>
            <Button variant="text" onClick={openSettings}>
              Manage
            </Button>
            <Button variant="contained" onClick={rejectAll}>
              Reject non-essential
            </Button>
            <Button variant="contained" onClick={acceptAll}>
              Accept all
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Paper>
  );
}
