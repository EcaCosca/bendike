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
import type { MaintenanceEntryView } from '@bendike/shared';
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
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [entryId, setEntryId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const work = entries.filter((entry) => entry.voidedAt === null).slice(0, MAX_LISTED_WORK);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Choose a photo');
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
      setError(err instanceof Error ? err.message : 'Could not add the photo');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>Add a photo</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Box>
            <Button component="label" variant="outlined">
              Choose photo
              <input hidden type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {file ? file.name : 'JPEG, PNG or WebP; large photos are shrunk for you'}
            </Typography>
          </Box>
          <TextField label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
          <TextField
            select
            label="Related work"
            value={entryId}
            onChange={(e) => setEntryId(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          >
            <MenuItem value="">Not linked to any work</MenuItem>
            {work.map((entry) => (
              <MenuItem key={entry.id} value={entry.id}>
                {workLabel(entry, itemLabels)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
