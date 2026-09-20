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
import { useEffect, useState, type FormEvent } from 'react';
import {
  LIBRARY_DOCUMENT_KINDS,
  LIBRARY_MAX_BYTES,
  isHttpsUrl,
  type GearModelView,
  type LibraryDocumentKind,
} from '@bendike/shared';
import { KIND_LABELS as GEAR_KIND_LABELS } from '../gear/item-details';
import { listModels } from '../gear/gear-api';
import { KIND_LABELS, formatBytes } from './library-labels';
import { uploadDocument } from './library-api';

interface AddDocumentDialogProps {
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AddDocumentDialog({ token, onClose, onSaved }: AddDocumentDialogProps) {
  const [models, setModels] = useState<GearModelView[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<LibraryDocumentKind>('manual');
  const [modelId, setModelId] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [revision, setRevision] = useState('');
  const [language, setLanguage] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listModels(token)
      .then(setModels)
      .catch(() => setModels([]));
  }, [token]);

  const model = models.find((m) => m.id === modelId);

  function chooseFile(chosen: File | null) {
    setFile(chosen);
    if (chosen && title.trim() === '') {
      setTitle(chosen.name.replace(/\.pdf$/i, ''));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const problem = validate();
    if (problem || !file) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      await uploadDocument(token, file, {
        title,
        kind,
        ...(model ? { modelId: model.id } : { manufacturer }),
        revision,
        language,
        sourceUrl,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the document');
      setSaving(false);
    }
  }

  function validate(): string | null {
    if (!file) return 'Choose a PDF file';
    if (file.size > LIBRARY_MAX_BYTES) return 'The file is over the 25 MB limit';
    if (title.trim() === '') return 'Give the document a title';
    if (!model && manufacturer.trim() === '') return 'Choose a model or say which manufacturer it is from';
    if (sourceUrl.trim() !== '' && !isHttpsUrl(sourceUrl)) return 'The source link must start with https://';
    return null;
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>Add to the Library</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Box>
            <Button component="label" variant="outlined">
              Choose PDF
              <input
                hidden
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {file ? `${file.name} (${formatBytes(file.size)})` : 'PDF only, up to 25 MB'}
            </Typography>
          </Box>
          <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField select label="Kind" value={kind} onChange={(e) => setKind(e.target.value as LibraryDocumentKind)}>
            {LIBRARY_DOCUMENT_KINDS.map((k) => (
              <MenuItem key={k} value={k}>
                {KIND_LABELS[k]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Model"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          >
            <MenuItem value="">No specific model</MenuItem>
            {models.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {`${m.manufacturer} ${m.model} (${GEAR_KIND_LABELS[m.kind]})`}
              </MenuItem>
            ))}
          </TextField>
          {!model && (
            <TextField label="Manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Revision"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              helperText="For example Rev4"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              helperText="For example en"
              sx={{ flex: 1 }}
            />
          </Stack>
          <TextField
            label="Source link"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            helperText="Where it was downloaded from (kept as a reference)"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Add document
        </Button>
      </DialogActions>
    </Dialog>
  );
}
