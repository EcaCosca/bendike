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
import type { GroundingView } from '@bendike/shared';
import { closeGrounding } from './bulletins-api';

interface ClearGroundingDialogProps {
  token: string;
  grounding: GroundingView;
  onClose: () => void;
  onSaved: () => void;
}

export function ClearGroundingDialog({ token, grounding, onClose, onSaved }: ClearGroundingDialogProps) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) {
      setError('Say what was done before clearing it.');
      return;
    }
    setSaving(true);
    try {
      await closeGrounding(token, grounding.id, { note: note.trim() });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear it');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>Give the green light</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">Grounded because: {grounding.reason}</Typography>
          <TextField
            label="What was done"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Clear grounding
        </Button>
      </DialogActions>
    </Dialog>
  );
}
