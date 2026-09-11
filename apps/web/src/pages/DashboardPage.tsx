import { Role } from '@bendike/shared';
import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';

const ROLE_GREETINGS: Record<Role, string> = {
  user: 'You are signed in as a user.',
  rigger: 'You are signed in as a rigger.',
  dropzone: 'You are signed in as a dropzone.',
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
        {user.role === Role.Admin && (
          <Button variant="contained" component={RouterLink} to="/app/admin/users" sx={{ alignSelf: 'flex-start' }}>
            Manage accounts
          </Button>
        )}
      </Stack>
    </AppShell>
  );
}
