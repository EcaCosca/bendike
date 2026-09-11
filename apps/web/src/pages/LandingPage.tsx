import { ROLES, type Role } from '@bendike/shared';
import { Button, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AppShell } from '../components/AppShell';

export const LANDING_HEADLINE = 'Bendike';
export const LANDING_TAGLINE = 'Where users, riggers and dropzones meet.';

const ROLE_BLURBS: Record<Role, string> = {
  user: 'Sign up, browse, and request what you need.',
  rigger: 'Offer your rigging skills and take on requests.',
  dropzone: 'Run your dropzone, list what you offer, and work with riggers.',
  admin: 'Keep the community safe and assign roles.',
};

export function LandingPage() {
  return (
    <AppShell>
      <Stack spacing={6} alignItems="center" textAlign="center" sx={{ mt: 6 }}>
        <Stack spacing={2} alignItems="center">
          <Typography variant="h2" component="h1" fontWeight={700}>
            {LANDING_HEADLINE}
          </Typography>
          <Typography variant="h5" color="text.secondary">
            {LANDING_TAGLINE}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" size="large" component={RouterLink} to="/register">
              Create an account
            </Button>
            <Button variant="outlined" size="large" component={RouterLink} to="/login">
              Log in
            </Button>
          </Stack>
        </Stack>
        <Grid container spacing={3} justifyContent="center">
          {ROLES.map((role) => (
            <Grid key={role} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" component="h2" sx={{ textTransform: 'capitalize' }}>
                    {role}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {ROLE_BLURBS[role]}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </AppShell>
  );
}
