import { ROLES, type AuthMethod, type Role, type UserSummary } from '@bendike/shared';
import {
  Alert,
  Chip,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { changeRole, listUsers } from '../auth/auth-api';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';

const AUTH_METHOD_LABELS: Record<AuthMethod, string> = { password: 'Password', google: 'Google' };

export function AdminUsersPage() {
  const { token, user: actor } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    listUsers(token)
      .then(setUsers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load accounts'));
  }, [token]);

  const handleRoleChange = async (target: UserSummary, role: Role) => {
    if (!token) {
      return;
    }
    setError(null);
    try {
      const updated = await changeRole(token, target.id, role);
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change role');
    }
  };

  return (
    <AppShell>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          Accounts
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Accounts">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Sign-in</TableCell>
                <TableCell>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.displayName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={u.role}
                      disabled={u.id === actor?.id}
                      inputProps={{ 'aria-label': `Role for ${u.email}` }}
                      onChange={(event) => void handleRoleChange(u, event.target.value)}
                    >
                      {ROLES.map((role) => (
                        <MenuItem key={role} value={role} sx={{ textTransform: 'capitalize' }}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {u.authMethods.map((method) => (
                        <Chip key={method} size="small" label={AUTH_METHOD_LABELS[method]} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </AppShell>
  );
}
