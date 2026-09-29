import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { RigView } from '@bendike/shared';
import '../../i18n/i18n';
import { createRig, updateRig } from './gear-api';

interface RigDialogProps {
  token: string;
  rig?: RigView;
  ownerId?: string;
  onClose: () => void;
  onSaved: (rig: RigView) => void;
}

export function RigDialog({ token, rig, ownerId, onClose, onSaved }: RigDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(rig?.name ?? '');
  const [notes, setNotes] = useState(rig?.notes ?? '');
  const [active, setActive] = useState(rig?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(t('gear.rigDialog.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      const saved = rig
        ? await updateRig(token, rig.id, { name: name.trim(), notes, active })
        : await createRig(token, { name: name.trim(), ...(notes ? { notes } : {}), ...(ownerId ? { ownerId } : {}) });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('gear.rigDialog.saveFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{rig ? t('gear.rigDialog.editTitle') : t('gear.rigDialog.addTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label={t('gear.common.name')} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <TextField
            label={t('gear.common.notes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            minRows={2}
          />
          {rig && (
            <FormControlLabel
              control={<Switch checked={active} onChange={(e) => setActive(e.target.checked)} />}
              label={t('gear.rigDialog.inService')}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('gear.common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('gear.common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
