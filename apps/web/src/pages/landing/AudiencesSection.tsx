import { Box, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { AUDIENCES, AUDIENCES_HEADING } from './landing-content';

export function AudiencesSection() {
  return (
    <Box
      component="section"
      id="audiences"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: 'primary.main', color: 'common.white' }}
    >
      <Container maxWidth="lg">
        <Stack spacing={5}>
          <Typography variant="h2" component="h2" sx={{ fontSize: { xs: '2rem', md: '2.75rem' } }}>
            {AUDIENCES_HEADING}
          </Typography>
          <Grid container spacing={3}>
            {AUDIENCES.map((audience) => (
              <Grid key={audience.role} size={{ xs: 12, md: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    height: '100%',
                    bgcolor: 'rgba(255,255,255,0.06)',
                    color: 'inherit',
                    border: '1px solid rgba(255,255,255,0.14)',
                  }}
                >
                  <Typography variant="h5" component="h3" gutterBottom>
                    {audience.role}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{audience.body}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
