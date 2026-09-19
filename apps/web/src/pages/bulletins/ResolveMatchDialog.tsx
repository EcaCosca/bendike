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
import type { BulletinMatchView } from '@bendike/shared';
import { resolveMatch } from './bulletins-api';

interface ResolveMatchDialogProps {
  token: string;
  match: BulletinMatchView;
  onClose: () => void;
  onSaved: () => void;
}

export function ResolveMatchDialog({ token, match, onClose, onSaved }: ResolveMatchDialogProps) {
  const [status, setStatus] = useState<'complied' | 'not_applicable'>('complied');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!note.trim()) {
      setError(status === 'complied' ? 'Say what was done.' : 'Say why it does not apply.');
      return;
    }
    setSaving(true);
    try {
      await resolveMatch(token, match.id, { status, note: note.trim() });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve the match');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>Resolve {match.bulletin.reference}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="body2">
            {match.item.manufacturer} {match.item.model}
            {match.item.serial ? ` #${match.item.serial}` : ''} · {match.owner.displayName}
            {match.rig ? ` · ${match.rig.name}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Required action: {match.bulletin.requiredAction}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={status}
            onChange={(_, value: 'complied' | 'not_applicable' | null) => value && setStatus(value)}
            size="small"
          >
            <ToggleButton value="complied">Complied</ToggleButton>
            <ToggleButton value="not_applicable">Not applicable</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            label={status === 'complied' ? 'What was done' : 'Why it does not apply'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            autoFocus
          />
          {match.confidence === 'needs_review' && (
            <Alert severity="info">
              The serial or the date of manufacture could not be compared automatically. Check the component against the
              bulletin.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {status === 'complied' ? 'Mark complied' : 'Mark not applicable'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
