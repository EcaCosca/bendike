import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { GEAR_KINDS, isHttpsUrl, type GearKind, type GearModelView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import '../../i18n/i18n';
import { createModel, listModels, updateModel } from './gear-api';
import { KIND_LABEL_KEYS } from './item-details';

function toNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

function ModelDialog({
  token,
  model,
  onClose,
  onSaved,
}: {
  token: string;
  model?: GearModelView;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<GearKind>(model?.kind ?? 'aad');
  const [manufacturer, setManufacturer] = useState(model?.manufacturer ?? '');
  const [name, setName] = useState(model?.model ?? '');
  const [repack, setRepack] = useState(model?.repackCycleDays?.toString() ?? '');
  const [service, setService] = useState(model?.serviceIntervalMonths?.toString() ?? '');
  const [battery, setBattery] = useState(model?.batteryCycleMonths?.toString() ?? '');
  const [life, setLife] = useState(model?.lifeYears?.toString() ?? '');
  const [bulletinsUrl, setBulletinsUrl] = useState(model?.bulletinsUrl ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!manufacturer.trim() || !name.trim()) {
      setError(t('gear.models.enterManufacturerModel'));
      return;
    }
    const link = bulletinsUrl.trim();
    if (link !== '' && !isHttpsUrl(link)) {
      setError(t('gear.models.bulletinsHttps'));
      return;
    }
    setSaving(true);
    try {
      if (model) {
        await updateModel(token, model.id, {
          manufacturer: manufacturer.trim(),
          model: name.trim(),
          repackCycleDays: toNumber(repack),
          serviceIntervalMonths: toNumber(service),
          batteryCycleMonths: toNumber(battery),
          lifeYears: toNumber(life),
          bulletinsUrl: link === '' ? null : link,
        });
      } else {
        const rules = {
          repackCycleDays: toNumber(repack),
          serviceIntervalMonths: toNumber(service),
          batteryCycleMonths: toNumber(battery),
          lifeYears: toNumber(life),
        };
        await createModel(token, {
          kind,
          manufacturer: manufacturer.trim(),
          model: name.trim(),
          ...Object.fromEntries(Object.entries(rules).filter(([, v]) => v !== null)),
          ...(link === '' ? {} : { bulletinsUrl: link }),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('gear.models.saveFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{model ? t('gear.models.editTitle') : t('gear.models.add')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {!model && (
            <TextField
              select
              label={t('gear.common.kind')}
              value={kind}
              onChange={(e) => setKind(e.target.value as GearKind)}
            >
              {GEAR_KINDS.map((k) => (
                <MenuItem key={k} value={k}>
                  {t(KIND_LABEL_KEYS[k])}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label={t('gear.common.manufacturer')}
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
          />
          <TextField label={t('gear.common.model')} value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label={t('gear.models.repackCycle')}
            type="number"
            value={repack}
            onChange={(e) => setRepack(e.target.value)}
            helperText={t('gear.models.repackCycleHint')}
          />
          <TextField
            label={t('gear.models.serviceInterval')}
            type="number"
            value={service}
            onChange={(e) => setService(e.target.value)}
            helperText={t('gear.models.aads')}
          />
          <TextField
            label={t('gear.models.batteryCycle')}
            type="number"
            value={battery}
            onChange={(e) => setBattery(e.target.value)}
            helperText={t('gear.models.aads')}
          />
          <TextField
            label={t('gear.models.lifeYears')}
            type="number"
            value={life}
            onChange={(e) => setLife(e.target.value)}
            helperText={t('gear.models.lifeHint')}
          />
          <TextField
            label={t('gear.models.bulletinsLink')}
            value={bulletinsUrl}
            onChange={(e) => setBulletinsUrl(e.target.value)}
            helperText={t('gear.models.bulletinsHint')}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('gear.common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('gear.common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function GearModelsPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [models, setModels] = useState<GearModelView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ model?: GearModelView } | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setModels(await listModels(token, true));
  }, [token]);

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : t('gear.models.loadFailed')));
  }, [reload, t]);

  if (!token) return null;

  const toggle = (model: GearModelView) => {
    updateModel(token, model.id, { active: !model.active }).then(
      () => void reload(),
      (err: unknown) => setError(err instanceof Error ? err.message : t('gear.models.changeFailed')),
    );
  };

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            {t('gear.models.title')}
          </Typography>
          <Button variant="contained" onClick={() => setDialog({})}>
            {t('gear.models.add')}
          </Button>
        </Stack>
        <Typography color="text.secondary">{t('gear.models.intro')}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label={t('gear.models.title')}>
            <TableHead>
              <TableRow>
                <TableCell>{t('gear.common.manufacturer')}</TableCell>
                <TableCell>{t('gear.common.model')}</TableCell>
                <TableCell>{t('gear.common.kind')}</TableCell>
                <TableCell>{t('gear.models.repack')}</TableCell>
                <TableCell>{t('gear.models.service')}</TableCell>
                <TableCell>{t('gear.models.battery')}</TableCell>
                <TableCell>{t('gear.models.life')}</TableCell>
                <TableCell>{t('gear.models.active')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.manufacturer}</TableCell>
                  <TableCell>{m.model}</TableCell>
                  <TableCell>{t(KIND_LABEL_KEYS[m.kind])}</TableCell>
                  <TableCell>{m.repackCycleDays ? t('gear.models.days', { count: m.repackCycleDays }) : ''}</TableCell>
                  <TableCell>
                    {m.serviceIntervalMonths ? t('gear.models.months', { count: m.serviceIntervalMonths }) : ''}
                  </TableCell>
                  <TableCell>
                    {m.batteryCycleMonths ? t('gear.models.months', { count: m.batteryCycleMonths }) : ''}
                  </TableCell>
                  <TableCell>{m.lifeYears ? t('gear.models.years', { count: m.lifeYears }) : ''}</TableCell>
                  <TableCell>
                    <Switch
                      checked={m.active}
                      onChange={() => toggle(m)}
                      slotProps={{
                        input: {
                          'aria-label': t('gear.models.activeFor', { model: `${m.manufacturer} ${m.model}` }),
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setDialog({ model: m })}>
                      {t('gear.common.edit')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
      {dialog && (
        <ModelDialog
          token={token}
          {...(dialog.model ? { model: dialog.model } : {})}
          onClose={() => setDialog(null)}
          onSaved={() => void reload()}
        />
      )}
    </AppShell>
  );
}
