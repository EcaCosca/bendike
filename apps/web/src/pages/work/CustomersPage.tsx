import {
  Button,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { whatsappDigits, type CustomerSummary } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import '../../i18n/i18n';
import { getCustomers } from './work-api';

export function CustomersPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [customers, setCustomers] = useState<CustomerSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getCustomers(token)
      .then(setCustomers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('work.customers.loadFailed')));
  }, [token, t]);

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            {t('work.customers.title')}
          </Typography>
          <Button component={RouterLink} to="/app/work" variant="outlined">
            {t('work.customers.workQueue')}
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {customers?.length === 0 && (
          <Typography color="text.secondary">
            {t('work.customers.empty')}{' '}
            <Link component={RouterLink} to="/app/riggers">
              {t('work.customers.addOne')}
            </Link>
          </Typography>
        )}
        {customers && customers.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label={t('work.customers.table')}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('work.customers.customer')}</TableCell>
                  <TableCell align="right">{t('work.customers.rigs')}</TableCell>
                  <TableCell align="right">{t('work.customers.overdue')}</TableCell>
                  <TableCell align="right">{t('work.customers.dueSoon')}</TableCell>
                  <TableCell align="right">{t('work.customers.grounded')}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map(({ owner, rigs, overdue, dueSoon, grounded }) => (
                  <TableRow key={owner.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {owner.displayName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[owner.phone, owner.email].filter(Boolean).join(' · ')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{rigs}</TableCell>
                    <TableCell align="right">{overdue}</TableCell>
                    <TableCell align="right">{dueSoon}</TableCell>
                    <TableCell align="right">{grounded}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" component={RouterLink} to={`/app/gear?ownerId=${owner.id}`}>
                          {t('work.customers.viewFleet')}
                        </Button>
                        {owner.phone ? (
                          <Button
                            size="small"
                            component="a"
                            href={`https://wa.me/${whatsappDigits(owner.phone)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t('work.customers.whatsapp')}
                          </Button>
                        ) : (
                          <Button size="small" component="a" href={`mailto:${owner.email}`}>
                            {t('work.customers.email')}
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </AppShell>
  );
}
