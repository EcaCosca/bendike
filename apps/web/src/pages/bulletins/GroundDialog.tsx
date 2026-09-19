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
import { openGrounding } from './bulletins-api';

interface GroundDialogProps {
  token: string;
  target: { rigId: string } | { gearItemId: string };
  label: string;
  onClose: () => void;
  onSaved: () => void;
}

export function GroundDialog({ token, target, label, onClose, onSaved }: GroundDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Say why it is grounded.');
      return;
    }
    setSaving(true);
    try {
      await openGrounding(token, { ...target, reason: reason.trim() });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not ground it');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>Ground {label}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">
            The dropzone and the owner will see it as grounded, with your name and this reason, until you clear it. It
            is a record, not a lock.
          </Typography>
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" color="error" disabled={saving}>
          Ground
        </Button>
      </DialogActions>
    </Dialog>
  );
}
