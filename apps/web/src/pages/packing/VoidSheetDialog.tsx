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
import '../../i18n/i18n';
import { voidSheet } from './packing-api';

interface VoidSheetDialogProps {
  token: string;
  sheetId: string;
  sheetNo: number | null;
  onClose: () => void;
  onVoided: () => void;
}

export function VoidSheetDialog({ token, sheetId, sheetNo, onClose, onVoided }: VoidSheetDialogProps) {
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t('packing.void.failed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>{t('packing.void.title', { sheetNo: sheetNo ?? '' })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">{t('packing.void.body')}</Typography>
          <TextField
            label={t('packing.void.reason')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('packing.actions.cancel')}</Button>
        <Button type="submit" variant="contained" color="error" disabled={saving || reason.trim() === ''}>
          {t('packing.void.void')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
