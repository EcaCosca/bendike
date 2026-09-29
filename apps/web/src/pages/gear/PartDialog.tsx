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
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PART_KINDS, type ComponentPartView, type PartKind } from '@bendike/shared';
import '../../i18n/i18n';
import { addPart, updatePart } from './gear-api';

const PART_LABEL_KEYS: Record<PartKind, string> = {
  bridle: 'gear.partKind.bridle',
  pilot_chute: 'gear.partKind.pilot_chute',
  risers: 'gear.partKind.risers',
  toggles: 'gear.partKind.toggles',
  handles: 'gear.partKind.handles',
  other: 'gear.partKind.other',
};

interface PartDialogProps {
  token: string;
  itemId: string;
  part?: ComponentPartView;
  onClose: () => void;
  onSaved: () => void;
}

export function PartDialog({ token, itemId, part, onClose, onSaved }: PartDialogProps) {
  const { t } = useTranslation();
  const [kind, setKind] = useState<PartKind>(part?.kind ?? 'bridle');
  const [description, setDescription] = useState(part?.description ?? '');
  const [serial, setSerial] = useState(part?.serial ?? '');
  const [manufacturedOn, setManufacturedOn] = useState(part?.manufacturedOn ?? '');
  const [notes, setNotes] = useState(part?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!description.trim()) {
      setError(t('gear.part.describePart'));
      return;
    }
    setSaving(true);
    try {
      if (part) {
        await updatePart(token, part.id, {
          kind,
          description: description.trim(),
          serial: serial || null,
          manufacturedOn: manufacturedOn || null,
          notes,
        });
      } else {
        await addPart(token, itemId, {
          kind,
          description: description.trim(),
          ...(serial ? { serial } : {}),
          ...(manufacturedOn ? { manufacturedOn } : {}),
          ...(notes ? { notes } : {}),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('gear.part.saveFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{part ? t('gear.part.editTitle') : t('gear.part.addTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            select
            label={t('gear.part.kindOfPart')}
            value={kind}
            onChange={(e) => setKind(e.target.value as PartKind)}
          >
            {PART_KINDS.map((k) => (
              <MenuItem key={k} value={k}>
                {t(PART_LABEL_KEYS[k])}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('gear.common.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField label={t('gear.common.serial')} value={serial} onChange={(e) => setSerial(e.target.value)} />
          <TextField
            label={t('gear.common.dateOfManufacture')}
            type="date"
            value={manufacturedOn}
            onChange={(e) => setManufacturedOn(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t('gear.common.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={2}
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
