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
import type { GroundingView } from '@bendike/shared';
import '../../i18n/i18n';
import { closeGrounding } from './bulletins-api';

interface ClearGroundingDialogProps {
  token: string;
  grounding: GroundingView;
  onClose: () => void;
  onSaved: () => void;
}

export function ClearGroundingDialog({ token, grounding, onClose, onSaved }: ClearGroundingDialogProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) {
      setError(t('bulletins.clear.sayWhatWasDone'));
      return;
    }
    setSaving(true);
    try {
      await closeGrounding(token, grounding.id, { note: note.trim() });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bulletins.clear.failed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{t('bulletins.clear.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">{t('bulletins.clear.groundedBecause', { reason: grounding.reason })}</Typography>
          <TextField
            label={t('bulletins.clear.whatWasDone')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('bulletins.actions.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('bulletins.clear.clear')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
