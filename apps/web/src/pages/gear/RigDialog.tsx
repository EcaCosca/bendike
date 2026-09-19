import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import type { RigView } from '@bendike/shared';
import { createRig, updateRig } from './gear-api';

interface RigDialogProps {
  token: string;
  rig?: RigView;
  ownerId?: string;
  onClose: () => void;
  onSaved: (rig: RigView) => void;
}

export function RigDialog({ token, rig, ownerId, onClose, onSaved }: RigDialogProps) {
  const [name, setName] = useState(rig?.name ?? '');
  const [notes, setNotes] = useState(rig?.notes ?? '');
  const [active, setActive] = useState(rig?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Give the rig a name.');
      return;
    }
    setSaving(true);
    try {
      const saved = rig
        ? await updateRig(token, rig.id, { name: name.trim(), notes, active })
        : await createRig(token, { name: name.trim(), ...(notes ? { notes } : {}), ...(ownerId ? { ownerId } : {}) });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the rig');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{rig ? 'Edit rig' : 'Add rig'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} />
          {rig && (
            <FormControlLabel
              control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
              label="In service (turn off to mark the rig inactive)"
            />
          )}
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
