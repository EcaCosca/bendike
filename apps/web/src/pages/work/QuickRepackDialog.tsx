import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { addEntry } from '../gear/gear-api';

interface QuickRepackDialogProps {
  token: string;
  itemId: string;
  label: string;
  today: string;
  onClose: () => void;
  onSaved: () => void;
}

export function QuickRepackDialog({ token, itemId, label, today, onClose, onSaved }: QuickRepackDialogProps) {
  const [performedOn, setPerformedOn] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await addEntry(token, itemId, { kind: 'repack', performedOn, description: note.trim() || 'Repack' });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log the repack');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>Log repack</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">{label}</Typography>
          <TextField
            label="Date"
            type="date"
            value={performedOn}
            onChange={(e) => setPerformedOn(e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
          />
          <TextField label="Note" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Log repack
        </Button>
      </DialogActions>
    </Dialog>
  );
}
