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
import { useTranslation } from 'react-i18next';
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
import '../../i18n/i18n';
import { createItem, getOverview, listModels, updateItem } from './gear-api';
import { KIND_LABEL_KEYS } from './item-details';

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
  const { t } = useTranslation();
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
      setError(t('gear.itemDialog.enterManufacturerModel'));
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
      setError(err instanceof Error ? err.message : t('gear.itemDialog.saveFailed'));
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
      setError(err instanceof Error ? err.message : t('gear.itemDialog.changeFailed'));
      setSaving(false);
    }
  }

  const kindFields: Record<GearKind, ReactNode> = {
    container: (
      <>
        <TextField
          label={t('gear.itemDialog.harnessSize')}
          value={harnessSize}
          onChange={(e) => setHarnessSize(e.target.value)}
        />
        <TextField label={t('gear.itemDialog.tso')} value={tso} onChange={(e) => setTso(e.target.value)} />
      </>
    ),
    main: (
      <>
        <TextField
          label={t('gear.itemDialog.sizeSqft')}
          type="number"
          value={sizeSqft}
          onChange={(e) => setSizeSqft(e.target.value)}
        />
        <TextField
          label={t('gear.itemDialog.lineType')}
          value={lineType}
          onChange={(e) => setLineType(e.target.value)}
        />
      </>
    ),
    reserve: (
      <>
        <TextField
          label={t('gear.itemDialog.sizeSqft')}
          type="number"
          value={sizeSqft}
          onChange={(e) => setSizeSqft(e.target.value)}
        />
        <TextField
          label={t('gear.itemDialog.repackCycle')}
          type="number"
          value={repackCycle}
          onChange={(e) => setRepackCycle(e.target.value)}
          helperText={t('gear.itemDialog.repackCycleHint')}
        />
      </>
    ),
    aad: (
      <>
        <TextField label={t('gear.itemDialog.mode')} value={mode} onChange={(e) => setMode(e.target.value)} />
        <DateField
          label={t('gear.itemDialog.batteryInstalledOn')}
          value={batteryInstalledOn}
          onChange={setBatteryInstalledOn}
        />
        <TextField
          label={t('gear.itemDialog.batteryCycle')}
          type="number"
          value={batteryCycle}
          onChange={(e) => setBatteryCycle(e.target.value)}
        />
        <DateField label={t('gear.itemDialog.serviceDueOn')} value={serviceDueOn} onChange={setServiceDueOn} />
        <DateField label={t('gear.itemDialog.expiresOn')} value={expiresOn} onChange={setExpiresOn} />
      </>
    ),
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>
        {editing ? t('gear.itemDialog.editTitle', { kind: t(KIND_LABEL_KEYS[kind]) }) : t('gear.itemDialog.addTitle')}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {!editing && !fixedKind && (
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
          {catalogue.length > 0 && (
            <TextField
              select
              label={t('gear.itemDialog.catalogueModel')}
              value={modelId}
              onChange={(e) => chooseModel(e.target.value)}
              helperText={t('gear.itemDialog.catalogueHint')}
            >
              <MenuItem value={NONE}>{t('gear.itemDialog.notInCatalogue')}</MenuItem>
              {catalogue.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.manufacturer} {m.model}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label={t('gear.common.manufacturer')}
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
          />
          <TextField label={t('gear.common.model')} value={model} onChange={(e) => setModel(e.target.value)} />
          <TextField label={t('gear.common.serial')} value={serial} onChange={(e) => setSerial(e.target.value)} />
          <DateField label={t('gear.common.dateOfManufacture')} value={manufacturedOn} onChange={setManufacturedOn} />
          {kindFields[kind]}
          <TextField
            label={t('gear.common.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={2}
          />
          <TextField
            select
            label={t('gear.common.rig')}
            value={assignedRig}
            onChange={(e) => setAssignedRig(e.target.value)}
          >
            <MenuItem value={NONE}>{t('gear.itemDialog.noRig')}</MenuItem>
            {rigList.map((r) => (
              <MenuItem key={r.id} value={r.id}>
                {r.name}
              </MenuItem>
            ))}
          </TextField>
          {editing && (
            <Typography variant="body2" color="text.secondary">
              {t('gear.itemDialog.retireHint')}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        {editing && (
          <Button color="error" onClick={() => void setRetired(item.retiredAt === null)} sx={{ mr: 'auto' }}>
            {item.retiredAt === null ? t('gear.itemDialog.retire') : t('gear.itemDialog.restore')}
          </Button>
        )}
        <Button onClick={onClose}>{t('gear.common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('gear.common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
