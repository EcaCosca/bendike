import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Avatar, Box, Button, Chip, Container, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { SocialLinks } from '../../components/site/SocialLinks';
import { ABOUT_TEASER_ASSETS, useLandingCopy } from './landing-content';

export function AboutSection() {
  const { aboutTeaser } = useLandingCopy();
  return (
    <Box component="section" id="about" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Avatar
                alt={ABOUT_TEASER_ASSETS.displayName}
                src={ABOUT_TEASER_ASSETS.portrait}
                sx={{
                  width: 200,
                  height: 200,
                  bgcolor: 'primary.main',
                }}
              />
              <Chip icon={<PlaceOutlinedIcon />} label={aboutTeaser.location} variant="outlined" />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Typography variant="overline" color="secondary" sx={{ letterSpacing: '0.18em', fontWeight: 700 }}>
                {aboutTeaser.eyebrow}
              </Typography>
              <Box>
                <Typography variant="h2" component="h2" sx={{ fontSize: { xs: '2rem', md: '2.75rem' } }}>
                  {ABOUT_TEASER_ASSETS.displayName}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {aboutTeaser.title}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontSize: '1.05rem' }}>
                {aboutTeaser.body}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Button variant="outlined" component={RouterLink} to={ABOUT_TEASER_ASSETS.to}>
                  {aboutTeaser.cta}
                </Button>
                <SocialLinks />
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
