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
import { useTranslation } from 'react-i18next';
import type { CreateServiceRequestBody, ServiceAdminDetail } from '@bendike/shared';
import { formatMoney } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import '../../i18n/i18n';
import { ServiceCreateDialog } from './ServiceCreateDialog';
import { ServiceEditDialog } from './ServiceEditDialog';
import { createService, listAllServices, updateService } from './services-admin-api';

export function ServicesAdminPage() {
  const { t } = useTranslation();
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
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('admin.services.loadFailed')));
  }, [token, t]);

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
      setError(err instanceof Error ? err.message : t('admin.services.changeFailed'));
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
            {t('admin.services.title')}
          </Typography>
          <Button variant="contained" onClick={() => setCreating(true)}>
            {t('admin.services.add')}
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label={t('admin.services.table')}>
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.common.name')}</TableCell>
                <TableCell>{t('admin.common.category')}</TableCell>
                <TableCell>{t('admin.common.price')}</TableCell>
                <TableCell>{t('admin.common.active')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name.en}</TableCell>
                  <TableCell>{t(`admin.services.category.${service.category}`)}</TableCell>
                  <TableCell>
                    {service.priceAmount === null || service.priceCurrency === null
                      ? t('admin.services.varies')
                      : formatMoney(service.priceAmount, service.priceCurrency)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={service.active}
                      onChange={() => void toggleActive(service)}
                      slotProps={{ input: { 'aria-label': t('admin.common.activeAria', { name: service.name.en }) } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      onClick={() => setEditingId(service.id)}
                      aria-label={t('admin.common.editAria', { name: service.name.en })}
                    >
                      {t('admin.common.edit')}
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
