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
import { Link as RouterLink } from 'react-router-dom';
import { whatsappDigits, type CustomerSummary } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { getCustomers } from './work-api';

export function CustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<CustomerSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getCustomers(token)
      .then(setCustomers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load your customers'));
  }, [token]);

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Customers and dropzones
          </Typography>
          <Button component={RouterLink} to="/app/work" variant="outlined">
            Work queue
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {customers?.length === 0 && (
          <Typography color="text.secondary">
            You look after no customers or dropzones yet.{' '}
            <Link component={RouterLink} to="/app/riggers">
              Add a customer
            </Link>
          </Typography>
        )}
        {customers && customers.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Customers and dropzones">
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell align="right">Rigs</TableCell>
                  <TableCell align="right">Overdue</TableCell>
                  <TableCell align="right">Due soon</TableCell>
                  <TableCell align="right">Grounded</TableCell>
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
                          View fleet
                        </Button>
                        {owner.phone ? (
                          <Button
                            size="small"
                            component="a"
                            href={`https://wa.me/${whatsappDigits(owner.phone)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            WhatsApp
                          </Button>
                        ) : (
                          <Button size="small" component="a" href={`mailto:${owner.email}`}>
                            Email
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
