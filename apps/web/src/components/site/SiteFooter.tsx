import { Box, Container, Stack, Typography } from '@mui/material';
import { FOOTER_TAGLINE, SITE_NAME } from './site-content';
import { SocialLinks } from './SocialLinks';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ py: 6, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.12em', color: 'primary.main' }}>
              {SITE_NAME}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {FOOTER_TAGLINE}
            </Typography>
          </Box>
          <SocialLinks />
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 4 }}>
          © {year} Bendike. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
