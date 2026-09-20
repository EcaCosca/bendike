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
import { GEAR_KINDS, isHttpsUrl, type GearKind, type GearModelView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { createModel, listModels, updateModel } from './gear-api';
import { KIND_LABELS } from './item-details';

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
      setError('Enter the manufacturer and the model.');
      return;
    }
    const link = bulletinsUrl.trim();
    if (link !== '' && !isHttpsUrl(link)) {
      setError('The bulletins link must start with https://');
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
      setError(err instanceof Error ? err.message : 'Could not save the model');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{model ? 'Edit model' : 'Add model'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {!model && (
            <TextField select label="Kind" value={kind} onChange={(e) => setKind(e.target.value as GearKind)}>
              {GEAR_KINDS.map((k) => (
                <MenuItem key={k} value={k}>
                  {KIND_LABELS[k]}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField label="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          <TextField label="Model" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="Repack cycle (days)"
            type="number"
            value={repack}
            onChange={(e) => setRepack(e.target.value)}
            helperText="Reserves. Empty means 180 days"
          />
          <TextField
            label="Service interval (months)"
            type="number"
            value={service}
            onChange={(e) => setService(e.target.value)}
            helperText="AADs"
          />
          <TextField
            label="Battery cycle (months)"
            type="number"
            value={battery}
            onChange={(e) => setBattery(e.target.value)}
            helperText="AADs"
          />
          <TextField
            label="Life (years)"
            type="number"
            value={life}
            onChange={(e) => setLife(e.target.value)}
            helperText="Counted from the date of manufacture"
          />
          <TextField
            label="Bulletins link"
            value={bulletinsUrl}
            onChange={(e) => setBulletinsUrl(e.target.value)}
            helperText="The manufacturer's service bulletins page, offered to riggers at every repack"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function GearModelsPage() {
  const { token } = useAuth();
  const [models, setModels] = useState<GearModelView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ model?: GearModelView } | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setModels(await listModels(token, true));
  }, [token]);

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the catalogue'));
  }, [reload]);

  if (!token) return null;

  const toggle = (model: GearModelView) => {
    updateModel(token, model.id, { active: !model.active }).then(
      () => void reload(),
      (err: unknown) => setError(err instanceof Error ? err.message : 'Could not change the model'),
    );
  };

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Gear models
          </Typography>
          <Button variant="contained" onClick={() => setDialog({})}>
            Add model
          </Button>
        </Stack>
        <Typography color="text.secondary">
          The rules a component inherits: repack cycle for reserves, and service interval, battery cycle and life for
          AADs. Enter the manufacturer&apos;s figures; a component can still override them.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Gear models">
            <TableHead>
              <TableRow>
                <TableCell>Manufacturer</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Kind</TableCell>
                <TableCell>Repack</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Battery</TableCell>
                <TableCell>Life</TableCell>
                <TableCell>Active</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.manufacturer}</TableCell>
                  <TableCell>{m.model}</TableCell>
                  <TableCell>{KIND_LABELS[m.kind]}</TableCell>
                  <TableCell>{m.repackCycleDays ? `${m.repackCycleDays} days` : ''}</TableCell>
                  <TableCell>{m.serviceIntervalMonths ? `${m.serviceIntervalMonths} months` : ''}</TableCell>
                  <TableCell>{m.batteryCycleMonths ? `${m.batteryCycleMonths} months` : ''}</TableCell>
                  <TableCell>{m.lifeYears ? `${m.lifeYears} years` : ''}</TableCell>
                  <TableCell>
                    <Switch
                      checked={m.active}
                      onChange={() => toggle(m)}
                      slotProps={{ input: { 'aria-label': `Active: ${m.manufacturer} ${m.model}` } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setDialog({ model: m })}>
                      Edit
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
