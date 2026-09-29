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
import { openGrounding } from './bulletins-api';

interface GroundDialogProps {
  token: string;
  target: { rigId: string } | { gearItemId: string };
  label: string;
  onClose: () => void;
  onSaved: () => void;
}

export function GroundDialog({ token, target, label, onClose, onSaved }: GroundDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) {
      setError(t('bulletins.ground.sayWhy'));
      return;
    }
    setSaving(true);
    try {
      await openGrounding(token, { ...target, reason: reason.trim() });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bulletins.ground.failed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{t('bulletins.ground.title', { label })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">{t('bulletins.ground.body')}</Typography>
          <TextField
            label={t('bulletins.ground.reason')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('bulletins.actions.cancel')}</Button>
        <Button type="submit" variant="contained" color="error" disabled={saving}>
          {t('bulletins.ground.ground')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
