import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { MaintenanceEntryView } from '@bendike/shared';
import '../../i18n/i18n';
import { resizeImage } from './resize-image';
import { uploadPhoto } from './rig-photos-api';
import { workLabel } from './work-labels';

interface AddPhotoDialogProps {
  token: string;
  rigId: string;
  entries: readonly MaintenanceEntryView[];
  itemLabels: Record<string, string>;
  onClose: () => void;
  onSaved: () => void;
}

const MAX_LISTED_WORK = 30;

export function AddPhotoDialog({ token, rigId, entries, itemLabels, onClose, onSaved }: AddPhotoDialogProps) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [entryId, setEntryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const work = entries.filter((entry) => entry.voidedAt === null).slice(0, MAX_LISTED_WORK);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError(t('gear.photos.chooseRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const prepared = await resizeImage(file);
      await uploadPhoto(token, prepared, { rigId, caption, ...(entryId ? { entryId } : {}) });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('gear.photos.addFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>{t('gear.photos.addTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Box>
            <Button component="label" variant="outlined">
              {t('gear.photos.choosePhoto')}
              <input hidden type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {file ? file.name : t('gear.photos.fileHint')}
            </Typography>
          </Box>
          <TextField label={t('gear.photos.caption')} value={caption} onChange={(e) => setCaption(e.target.value)} />
          <TextField
            select
            label={t('gear.photos.relatedWork')}
            value={entryId}
            onChange={(e) => setEntryId(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          >
            <MenuItem value="">{t('gear.photos.notLinked')}</MenuItem>
            {work.map((entry) => (
              <MenuItem key={entry.id} value={entry.id}>
                {workLabel(entry, itemLabels, t)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('gear.common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('gear.photos.upload')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
