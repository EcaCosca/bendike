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
import type { MaintenanceEntryView } from '@bendike/shared';
import { voidEntry } from './gear-api';

interface VoidDialogProps {
  token: string;
  entry: MaintenanceEntryView;
  onClose: () => void;
  onVoided: () => void;
}

export function VoidDialog({ token, entry, onClose, onVoided }: VoidDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Say why the entry is void.');
      return;
    }
    setSaving(true);
    try {
      await voidEntry(token, entry.id, reason.trim());
      onVoided();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not void the entry');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>Void this entry</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">
            The record stays in the history, marked void, and no longer counts towards due dates. To correct it, add a
            new entry.
          </Typography>
          <TextField label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" color="error" variant="contained" disabled={saving}>
          Void entry
        </Button>
      </DialogActions>
    </Dialog>
  );
}
