import { Role } from '@bendike/shared';
import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';

const ROLE_GREETINGS: Record<Role, string> = {
  user: 'You are signed in as a user.',
  rigger: 'You are signed in as a rigger.',
  dropzone: 'You are signed in as a dropzone.',
  authority: 'You are signed in as an authority. You can read the riggers and their logs.',
  admin: 'You are signed in as an admin.',
};

export function DashboardPage() {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Hi, {user.displayName}
        </Typography>
        <Typography color="text.secondary">{ROLE_GREETINGS[user.role]}</Typography>
        <Stack direction="row" spacing={2}>
          {user.role === Role.Authority ? (
            <Button variant="contained" color="secondary" component={RouterLink} to="/app/authority/riggers">
              Register of riggers
            </Button>
          ) : (
            <>
              <Button variant="contained" color="secondary" component={RouterLink} to="/app/gear">
                {user.role === Role.Dropzone ? 'Fleet' : 'My gear'}
              </Button>
              {(user.role === Role.Rigger || user.role === Role.Admin) && (
                <Button variant="contained" color="secondary" component={RouterLink} to="/app/work">
                  Work queue
                </Button>
              )}
              <Button variant="outlined" component={RouterLink} to="/app/riggers">
                {user.role === Role.Rigger ? 'Customers and dropzones' : 'My riggers'}
              </Button>
            </>
          )}
          <Button variant="outlined" component={RouterLink} to="/app/profile">
            Your details
          </Button>
        </Stack>
        {user.role === Role.Admin && (
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
            <Button variant="contained" component={RouterLink} to="/app/authority/riggers">
              Register of riggers
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/users">
              Manage accounts
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/services">
              Manage services
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/used-gear">
              Manage used gear
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/gear-models">
              Gear models
            </Button>
            <Button variant="contained" component={RouterLink} to="/app/admin/bulletins">
              Service bulletins
            </Button>
          </Stack>
        )}
      </Stack>
    </AppShell>
  );
}
