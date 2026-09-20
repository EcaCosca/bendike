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
import { voidSheet } from './packing-api';

interface VoidSheetDialogProps {
  token: string;
  sheetId: string;
  sheetNo: number | null;
  onClose: () => void;
  onVoided: () => void;
}

export function VoidSheetDialog({ token, sheetId, sheetNo, onClose, onVoided }: VoidSheetDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await voidSheet(token, sheetId, reason.trim());
      onVoided();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not void the sheet');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>Void sheet {sheetNo}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">
            The sheet and its repack entry stay in the log, marked void. Sign a new sheet to record the repack again.
          </Typography>
          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" color="error" disabled={saving || reason.trim() === ''}>
          Void
        </Button>
      </DialogActions>
    </Dialog>
  );
}
