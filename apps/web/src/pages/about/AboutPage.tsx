import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { Avatar, Box, Button, Chip, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { SitePage } from '../../components/site/SitePage';
import { SocialLinks } from '../../components/site/SocialLinks';
import { ABOUT_PAGE } from './about-content';

const HEADING_SIZE = { xs: '2rem', md: '2.75rem' };

export function AboutPage() {
  const { founder, sections, cta } = ABOUT_PAGE;

  return (
    <SitePage>
      <Box component="section" sx={{ bgcolor: 'primary.main', color: 'common.white', py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <Stack spacing={3} maxWidth={760}>
            <Typography variant="overline" sx={{ color: 'secondary.light', letterSpacing: '0.18em', fontWeight: 700 }}>
              {ABOUT_PAGE.eyebrow}
            </Typography>
            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, lineHeight: 1.1 }}>
              {ABOUT_PAGE.title}
            </Typography>
            <Typography variant="h6" component="p" sx={{ color: 'rgba(255,255,255,0.82)', fontWeight: 400 }}>
              {ABOUT_PAGE.intro}
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Box component="section" id="founder" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 5, md: 8 }} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
                <Avatar
                  sx={{
                    width: 220,
                    height: 220,
                    fontSize: '4.5rem',
                    fontWeight: 700,
                    bgcolor: 'primary.main',
                    color: 'common.white',
                  }}
                >
                  {founder.initials}
                </Avatar>
                <Chip icon={<PlaceOutlinedIcon />} label={founder.location} variant="outlined" />
                <SocialLinks />
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h2" component="h2" sx={{ fontSize: HEADING_SIZE }}>
                    {founder.displayName}
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    {founder.title}
                  </Typography>
                </Box>
                {founder.paragraphs.map((paragraph) => (
                  <Typography key={paragraph} sx={{ fontSize: '1.05rem' }}>
                    {paragraph}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 4, md: 6 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {sections.map((section) => (
              <Grid key={section.id} size={{ xs: 12, md: 4 }}>
                <Paper id={section.id} variant="outlined" sx={{ p: 4, height: '100%' }}>
                  <Stack spacing={2}>
                    <Typography variant="h5" component="h2">
                      {section.heading}
                    </Typography>
                    {section.paragraphs.map((paragraph) => (
                      <Typography key={paragraph} color="text.secondary">
                        {paragraph}
                      </Typography>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box component="section" sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography variant="h2" component="h2" sx={{ fontSize: HEADING_SIZE }}>
              {cta.heading}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.05rem' }}>
              {cta.body}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" color="secondary" size="large" component={RouterLink} to={cta.primary.to}>
                {cta.primary.label}
              </Button>
              <Button variant="outlined" size="large" component={RouterLink} to={cta.secondary.to}>
                {cta.secondary.label}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </SitePage>
  );
}
