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
import { useTranslation } from 'react-i18next';
import {
  LIBRARY_DOCUMENT_KINDS,
  LIBRARY_MAX_BYTES,
  isHttpsUrl,
  type GearModelView,
  type LibraryDocumentKind,
} from '@bendike/shared';
import '../../i18n/i18n';
import { KIND_LABEL_KEYS as GEAR_KIND_LABEL_KEYS } from '../gear/item-details';
import { listModels } from '../gear/gear-api';
import { KIND_LABEL_KEYS, formatBytes } from './library-labels';
import { uploadDocument } from './library-api';

interface AddDocumentDialogProps {
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

export function AddDocumentDialog({ token, onClose, onSaved }: AddDocumentDialogProps) {
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t('library.add.saveFailed'));
      setSaving(false);
    }
  }

  function validate(): string | null {
    if (!file) return t('library.add.needFile');
    if (file.size > LIBRARY_MAX_BYTES) return t('library.add.tooLarge');
    if (title.trim() === '') return t('library.add.needTitle');
    if (!model && manufacturer.trim() === '') return t('library.add.needModelOrManufacturer');
    if (sourceUrl.trim() !== '' && !isHttpsUrl(sourceUrl)) return t('library.add.badSourceUrl');
    return null;
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>{t('library.add.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Box>
            <Button component="label" variant="outlined">
              {t('library.add.choosePdf')}
              <input
                hidden
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
              />
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {file ? `${file.name} (${formatBytes(file.size)})` : t('library.add.pdfOnly')}
            </Typography>
          </Box>
          <TextField label={t('library.add.docTitle')} value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField
            select
            label={t('library.add.kind')}
            value={kind}
            onChange={(e) => setKind(e.target.value as LibraryDocumentKind)}
          >
            {LIBRARY_DOCUMENT_KINDS.map((k) => (
              <MenuItem key={k} value={k}>
                {t(KIND_LABEL_KEYS[k])}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label={t('library.add.model')}
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
          >
            <MenuItem value="">{t('library.add.noModel')}</MenuItem>
            {models.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {`${m.manufacturer} ${m.model} (${t(GEAR_KIND_LABEL_KEYS[m.kind])})`}
              </MenuItem>
            ))}
          </TextField>
          {!model && (
            <TextField
              label={t('library.add.manufacturer')}
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
            />
          )}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('library.add.revision')}
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              helperText={t('library.add.revisionHint')}
              sx={{ flex: 1 }}
            />
            <TextField
              label={t('library.add.language')}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              helperText={t('library.add.languageHint')}
              sx={{ flex: 1 }}
            />
          </Stack>
          <TextField
            label={t('library.add.sourceUrl')}
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            helperText={t('library.add.sourceUrlHint')}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('library.add.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('library.add.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
