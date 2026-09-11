import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { HERO } from './landing-content';

export function HeroSection() {
  return (
    <Box
      component="section"
      sx={{
        color: 'common.white',
        background: 'linear-gradient(135deg, #0B2545 0%, #13315C 55%, #1F4E8C 100%)',
        py: { xs: 10, md: 16 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3} maxWidth={760}>
          <Typography variant="overline" sx={{ color: 'secondary.light', letterSpacing: '0.18em', fontWeight: 700 }}>
            {HERO.eyebrow}
          </Typography>
          <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.75rem' }, lineHeight: 1.1 }}>
            {HERO.headline}
          </Typography>
          <Typography variant="h6" component="p" sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 400 }}>
            {HERO.body}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
            <Button variant="contained" color="secondary" size="large" component={RouterLink} to={HERO.primaryCta.to}>
              {HERO.primaryCta.label}
            </Button>
            <Button
              variant="outlined"
              size="large"
              href={HERO.secondaryCta.href}
              sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.5)' }}
            >
              {HERO.secondaryCta.label}
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 2 }}>
            {HERO.highlights.map((item) => (
              <Chip
                key={item}
                label={item}
                variant="outlined"
                sx={{ color: 'common.white', borderColor: 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
