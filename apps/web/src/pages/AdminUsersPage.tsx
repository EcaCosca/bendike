import { ROLES, type Role, type UserSummary } from '@bendike/shared';
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
import { useTranslation } from 'react-i18next';
import { changeRole, listUsers } from '../auth/auth-api';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';
import '../i18n/i18n';
import { formatDate } from '../i18n/format-date';

export function AdminUsersPage() {
  const { t, i18n } = useTranslation();
  const { token, user: actor } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    listUsers(token)
      .then(setUsers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('app.accounts.loadFailed')));
  }, [token, t]);

  const handleRoleChange = async (target: UserSummary, role: Role) => {
    if (!token) {
      return;
    }
    setError(null);
    try {
      const updated = await changeRole(token, target.id, role);
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('app.accounts.changeFailed'));
    }
  };

  return (
    <AppShell>
      <Stack spacing={3}>
        <Typography variant="h4" component="h1">
          {t('app.accounts.title')}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label={t('app.accounts.table')}>
            <TableHead>
              <TableRow>
                <TableCell>{t('app.accounts.name')}</TableCell>
                <TableCell>{t('app.accounts.email')}</TableCell>
                <TableCell>{t('app.accounts.role')}</TableCell>
                <TableCell>{t('app.accounts.signIn')}</TableCell>
                <TableCell>{t('app.accounts.joined')}</TableCell>
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
                      inputProps={{ 'aria-label': t('app.accounts.roleFor', { email: u.email }) }}
                      onChange={(event) => void handleRoleChange(u, event.target.value)}
                    >
                      {ROLES.map((role) => (
                        <MenuItem key={role} value={role}>
                          {t(`app.role.${role}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {u.authMethods.map((method) => (
                        <Chip key={method} size="small" label={t(`app.accounts.method.${method}`)} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{formatDate(u.createdAt, i18n.language)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </AppShell>
  );
}
