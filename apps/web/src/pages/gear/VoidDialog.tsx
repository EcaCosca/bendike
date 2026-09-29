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
import type { MaintenanceEntryView } from '@bendike/shared';
import '../../i18n/i18n';
import { voidEntry } from './gear-api';

interface VoidDialogProps {
  token: string;
  entry: MaintenanceEntryView;
  onClose: () => void;
  onVoided: () => void;
}

export function VoidDialog({ token, entry, onClose, onVoided }: VoidDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      setError(t('gear.void.reasonRequired'));
      return;
    }
    setSaving(true);
    try {
      await voidEntry(token, entry.id, reason.trim());
      onVoided();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('gear.void.failed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{t('gear.void.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">{t('gear.void.body')}</Typography>
          <TextField
            label={t('gear.void.reason')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('gear.common.cancel')}</Button>
        <Button type="submit" color="error" variant="contained" disabled={saving}>
          {t('gear.void.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
