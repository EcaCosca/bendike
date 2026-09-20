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
import type { LibraryDocumentView } from '@bendike/shared';
import { archiveDocument } from './library-api';

interface ArchiveDocumentDialogProps {
  token: string;
  document: LibraryDocumentView;
  onClose: () => void;
  onSaved: () => void;
}

export function ArchiveDocumentDialog({ token, document, onClose, onSaved }: ArchiveDocumentDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await archiveDocument(token, document.id, reason.trim());
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not archive the document');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>Archive document</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">{document.title} will no longer be offered. The stored file is kept.</Typography>
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
          Archive
        </Button>
      </DialogActions>
    </Dialog>
  );
}
