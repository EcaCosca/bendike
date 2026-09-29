import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { BulletinMatchView } from '@bendike/shared';
import '../../i18n/i18n';
import { resolveMatch } from './bulletins-api';

interface ResolveMatchDialogProps {
  token: string;
  match: BulletinMatchView;
  onClose: () => void;
  onSaved: () => void;
}

export function ResolveMatchDialog({ token, match, onClose, onSaved }: ResolveMatchDialogProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'complied' | 'not_applicable'>('complied');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) {
      setError(status === 'complied' ? t('bulletins.resolve.sayWhatWasDone') : t('bulletins.resolve.sayWhyNotApply'));
      return;
    }
    setSaving(true);
    try {
      await resolveMatch(token, match.id, { status, note: note.trim() });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('bulletins.resolve.failed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{t('bulletins.resolve.title', { reference: match.bulletin.reference })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">
            {match.item.manufacturer} {match.item.model}
            {match.item.serial ? ` #${match.item.serial}` : ''} · {match.owner.displayName}
            {match.rig ? ` · ${match.rig.name}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('bulletins.resolve.requiredAction', { action: match.bulletin.requiredAction })}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={status}
            onChange={(_, value: 'complied' | 'not_applicable' | null) => value && setStatus(value)}
            size="small"
          >
            <ToggleButton value="complied">{t('bulletins.resolve.complied')}</ToggleButton>
            <ToggleButton value="not_applicable">{t('bulletins.resolve.notApplicable')}</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label={status === 'complied' ? t('bulletins.resolve.whatWasDone') : t('bulletins.resolve.whyNotApply')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            autoFocus
          />
          {match.confidence === 'needs_review' && (
            <Alert severity="info">{t('bulletins.resolve.needsReviewNote')}</Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('bulletins.actions.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {status === 'complied' ? t('bulletins.resolve.markComplied') : t('bulletins.resolve.markNotApplicable')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
