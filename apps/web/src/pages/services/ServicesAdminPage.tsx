import {
  Alert,
  Button,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { CreateServiceRequestBody, ServiceAdminDetail } from '@bendike/shared';
import { formatMoney } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { ServiceCreateDialog } from './ServiceCreateDialog';
import { ServiceEditDialog } from './ServiceEditDialog';
import { createService, listAllServices, updateService } from './services-admin-api';

export function ServicesAdminPage() {
  const { token } = useAuth();
  const [services, setServices] = useState<ServiceAdminDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    listAllServices(token)
      .then(setServices)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load services'));
  }, [token]);

  function replace(updated: ServiceAdminDetail) {
    setServices((current) => current.map((service) => (service.id === updated.id ? updated : service)));
  }

  async function toggleActive(service: ServiceAdminDetail) {
    if (!token) {
      return;
    }
    setError(null);
    try {
      replace(await updateService(token, service.id, { active: !service.active }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the service');
    }
  }

  async function handleCreate(body: CreateServiceRequestBody) {
    if (!token) {
      return;
    }
    const created = await createService(token, body);
    setServices((current) => [...current, created]);
  }

  const editing = services.find((service) => service.id === editingId);

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Services
          </Typography>
          <Button variant="contained" onClick={() => setCreating(true)}>
            Add service
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Services">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Active</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name.en}</TableCell>
                  <TableCell>{service.category}</TableCell>
                  <TableCell>
                    {service.priceAmount === null || service.priceCurrency === null
                      ? 'Varies'
                      : formatMoney(service.priceAmount, service.priceCurrency)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={service.active}
                      onChange={() => void toggleActive(service)}
                      slotProps={{ input: { 'aria-label': `Active: ${service.name.en}` } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => setEditingId(service.id)}
                      aria-label={`Edit ${service.name.en}`}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
      {creating && <ServiceCreateDialog onClose={() => setCreating(false)} onCreate={handleCreate} />}
      {editing && token && (
        <ServiceEditDialog service={editing} token={token} onClose={() => setEditingId(null)} onSaved={replace} />
      )}
    </AppShell>
  );
}
