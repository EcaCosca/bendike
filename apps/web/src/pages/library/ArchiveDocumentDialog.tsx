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
import { useTranslation } from 'react-i18next';
import type { LibraryDocumentView } from '@bendike/shared';
import '../../i18n/i18n';
import { archiveDocument } from './library-api';

interface ArchiveDocumentDialogProps {
  token: string;
  document: LibraryDocumentView;
  onClose: () => void;
  onSaved: () => void;
}

export function ArchiveDocumentDialog({ token, document, onClose, onSaved }: ArchiveDocumentDialogProps) {
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t('library.archive.saveFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>{t('library.archive.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">{t('library.archive.body', { title: document.title })}</Typography>
          <TextField
            label={t('library.archive.reason')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('library.archive.cancel')}</Button>
        <Button type="submit" variant="contained" color="error" disabled={saving || reason.trim() === ''}>
          {t('library.archive.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
