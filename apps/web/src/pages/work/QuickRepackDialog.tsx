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
import { addEntry } from '../gear/gear-api';

interface QuickRepackDialogProps {
  token: string;
  itemId: string;
  label: string;
  today: string;
  onClose: () => void;
  onSaved: () => void;
}

export function QuickRepackDialog({ token, itemId, label, today, onClose, onSaved }: QuickRepackDialogProps) {
  const { t } = useTranslation();
  const [performedOn, setPerformedOn] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await addEntry(token, itemId, { kind: 'repack', performedOn, description: note.trim() || 'Repack' });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('work.repack.saveFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{t('work.repack.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">{label}</Typography>
          <TextField
            label={t('work.repack.date')}
            type="date"
            value={performedOn}
            onChange={(e) => setPerformedOn(e.target.value)}
            required
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: today } }}
          />
          <TextField
            label={t('work.repack.note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('work.repack.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('work.repack.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
