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
import { PART_KINDS, type ComponentPartView, type PartKind } from '@bendike/shared';
import { addPart, updatePart } from './gear-api';

const PART_LABELS: Record<PartKind, string> = {
  bridle: 'Bridle',
  pilot_chute: 'Pilot chute',
  risers: 'Risers',
  toggles: 'Toggles',
  handles: 'Handles',
  other: 'Other',
};

interface PartDialogProps {
  token: string;
  itemId: string;
  part?: ComponentPartView;
  onClose: () => void;
  onSaved: () => void;
}

export function PartDialog({ token, itemId, part, onClose, onSaved }: PartDialogProps) {
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
      setError('Describe the part.');
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
      setError(err instanceof Error ? err.message : 'Could not save the part');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{part ? 'Edit part' : 'Add part'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField select label="Kind of part" value={kind} onChange={(e) => setKind(e.target.value as PartKind)}>
            {PART_KINDS.map((k) => (
              <MenuItem key={k} value={k}>
                {PART_LABELS[k]}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <TextField label="Serial" value={serial} onChange={(e) => setSerial(e.target.value)} />
          <TextField
            label="Date of manufacture"
            type="date"
            value={manufacturedOn}
            onChange={(e) => setManufacturedOn(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />
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
