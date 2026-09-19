import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  GEAR_KINDS,
  type AadDetails,
  type ContainerDetails,
  type GearItemView,
  type GearKind,
  type GearModelView,
  type MainDetails,
  type ReserveDetails,
  type RigView,
} from '@bendike/shared';
import { createItem, getOverview, listModels, updateItem } from './gear-api';
import { KIND_LABELS } from './item-details';

interface GearItemDialogProps {
  token: string;
  kind?: GearKind;
  item?: GearItemView;
  rigId?: string;
  rigs?: RigView[];
  ownerId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const NONE = '';

function toNumber(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <TextField
      label={label}
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
}

export function GearItemDialog({
  token,
  kind: fixedKind,
  item,
  rigId,
  rigs,
  ownerId,
  onClose,
  onSaved,
}: GearItemDialogProps) {
  const editing = item !== undefined;
  const [kind, setKind] = useState<GearKind>(item?.kind ?? fixedKind ?? 'reserve');
  const [manufacturer, setManufacturer] = useState(item?.manufacturer ?? '');
  const [model, setModel] = useState(item?.model ?? '');
  const [modelId, setModelId] = useState(item?.modelId ?? NONE);
  const [serial, setSerial] = useState(item?.serial ?? '');
  const [manufacturedOn, setManufacturedOn] = useState(item?.manufacturedOn ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [assignedRig, setAssignedRig] = useState(item?.rigId ?? rigId ?? NONE);
  const [models, setModels] = useState<GearModelView[]>([]);
  const [rigList, setRigList] = useState<RigView[]>(rigs ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const details = (item?.details ?? {}) as Partial<ContainerDetails & MainDetails & ReserveDetails & AadDetails>;
  const [harnessSize, setHarnessSize] = useState(details.harnessSize ?? '');
  const [tso, setTso] = useState(details.tso ?? '');
  const [sizeSqft, setSizeSqft] = useState(details.sizeSqft?.toString() ?? '');
  const [lineType, setLineType] = useState(details.lineType ?? '');
  const [repackCycle, setRepackCycle] = useState(details.repackCycleDays?.toString() ?? '');
  const [mode, setMode] = useState(details.mode ?? '');
  const [batteryInstalledOn, setBatteryInstalledOn] = useState(details.batteryInstalledOn ?? '');
  const [batteryCycle, setBatteryCycle] = useState(details.batteryCycleMonths?.toString() ?? '');
  const [serviceDueOn, setServiceDueOn] = useState(details.serviceDueOn ?? '');
  const [expiresOn, setExpiresOn] = useState(details.expiresOn ?? '');

  useEffect(() => {
    listModels(token)
      .then(setModels)
      .catch(() => undefined);
    if (!rigs) {
      getOverview(token, ownerId ?? item?.ownerId)
        .then((overview) => setRigList(overview.rigs.filter((r) => r.active)))
        .catch(() => undefined);
    }
  }, [token, rigs, ownerId, item?.ownerId]);

  const catalogue = models.filter((m) => m.kind === kind);

  function chooseModel(id: string) {
    setModelId(id);
    const chosen = catalogue.find((m) => m.id === id);
    if (chosen) {
      setManufacturer(chosen.manufacturer);
      setModel(chosen.model);
    }
  }

  function buildDetails() {
    switch (kind) {
      case 'container':
        return { harnessSize: harnessSize || null, tso: tso || null };
      case 'main':
        return { sizeSqft: toNumber(sizeSqft), lineType: lineType || null };
      case 'reserve':
        return { sizeSqft: toNumber(sizeSqft), repackCycleDays: toNumber(repackCycle) };
      case 'aad':
        return {
          mode: mode || null,
          batteryInstalledOn: batteryInstalledOn || null,
          batteryCycleMonths: toNumber(batteryCycle),
          serviceDueOn: serviceDueOn || null,
          expiresOn: expiresOn || null,
        };
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!manufacturer.trim() || !model.trim()) {
      setError('Enter the manufacturer and the model.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateItem(token, item.id, {
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          serial: serial.trim() || null,
          manufacturedOn: manufacturedOn || null,
          notes,
          modelId: modelId || null,
          rigId: assignedRig || null,
          details: buildDetails(),
        });
      } else {
        await createItem(token, {
          kind,
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          ...(serial.trim() ? { serial: serial.trim() } : {}),
          ...(manufacturedOn ? { manufacturedOn } : {}),
          ...(notes ? { notes } : {}),
          ...(modelId ? { modelId } : {}),
          ...(assignedRig ? { rigId: assignedRig } : {}),
          ...(ownerId ? { ownerId } : {}),
          details: buildDetails(),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the component');
      setSaving(false);
    }
  }

  async function setRetired(retired: boolean) {
    if (!item) return;
    setSaving(true);
    try {
      await updateItem(token, item.id, { retired });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the component');
      setSaving(false);
    }
  }

  const kindFields: Record<GearKind, ReactNode> = {
    container: (
      <>
        <TextField label="Harness size" value={harnessSize} onChange={(e) => setHarnessSize(e.target.value)} />
        <TextField label="TSO" value={tso} onChange={(e) => setTso(e.target.value)} />
      </>
    ),
    main: (
      <>
        <TextField label="Size (sq ft)" type="number" value={sizeSqft} onChange={(e) => setSizeSqft(e.target.value)} />
        <TextField label="Line type" value={lineType} onChange={(e) => setLineType(e.target.value)} />
      </>
    ),
    reserve: (
      <>
        <TextField label="Size (sq ft)" type="number" value={sizeSqft} onChange={(e) => setSizeSqft(e.target.value)} />
        <TextField
          label="Repack cycle (days)"
          type="number"
          value={repackCycle}
          onChange={(e) => setRepackCycle(e.target.value)}
          helperText="Leave empty to use the model's cycle, or 180 days"
        />
      </>
    ),
    aad: (
      <>
        <TextField label="Mode" value={mode} onChange={(e) => setMode(e.target.value)} />
        <DateField label="Battery installed on" value={batteryInstalledOn} onChange={setBatteryInstalledOn} />
        <TextField
          label="Battery cycle (months)"
          type="number"
          value={batteryCycle}
          onChange={(e) => setBatteryCycle(e.target.value)}
        />
        <DateField label="Service due on" value={serviceDueOn} onChange={setServiceDueOn} />
        <DateField label="Expires on" value={expiresOn} onChange={setExpiresOn} />
      </>
    ),
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{editing ? `Edit ${KIND_LABELS[kind]}` : 'Add component'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {!editing && !fixedKind && (
            <TextField select label="Kind" value={kind} onChange={(e) => setKind(e.target.value as GearKind)}>
              {GEAR_KINDS.map((k) => (
                <MenuItem key={k} value={k}>
                  {KIND_LABELS[k]}
                </MenuItem>
              ))}
            </TextField>
          )}
          {catalogue.length > 0 && (
            <TextField
              select
              label="Catalogue model"
              value={modelId}
              onChange={(e) => chooseModel(e.target.value)}
              helperText="Picks the manufacturer, model and their rules"
            >
              <MenuItem value={NONE}>Not in the catalogue</MenuItem>
              {catalogue.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.manufacturer} {m.model}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField label="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          <TextField label="Model" value={model} onChange={(e) => setModel(e.target.value)} />
          <TextField label="Serial" value={serial} onChange={(e) => setSerial(e.target.value)} />
          <DateField label="Date of manufacture" value={manufacturedOn} onChange={setManufacturedOn} />
          {kindFields[kind]}
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />
          <TextField select label="Rig" value={assignedRig} onChange={(e) => setAssignedRig(e.target.value)}>
            <MenuItem value={NONE}>No rig (spare gear)</MenuItem>
            {rigList.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
          {editing && (
            <Typography variant="body2" color="text.secondary">
              Retiring keeps the history but takes the component off its rig and out of the due dates.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {editing && (
          <Button color="error" onClick={() => void setRetired(item.retiredAt === null)} sx={{ mr: 'auto' }}>
            {item.retiredAt === null ? 'Retire' : 'Restore'}
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
