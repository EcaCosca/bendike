import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { describeProblem, sheetProblems, signingBlockers, todayIn, type PackingElements } from '@bendike/shared';
import '../../i18n/i18n';
import type { Draft } from './packing-draft';

const MAX_LISTED_TICKS = 5;

interface SignDialogProps {
  draft: Draft;
  elements: PackingElements;
  initialLicence: string;
  ownerEmail: string;
  onNotesChange: (notes: string) => void;
  onSign: (licence: string, notifyOwner: boolean) => Promise<void>;
  onClose: () => void;
}

export function SignDialog({
  draft,
  elements,
  initialLicence,
  ownerEmail,
  onNotesChange,
  onSign,
  onClose,
}: SignDialogProps) {
  const { t } = useTranslation();
  const [licence, setLicence] = useState(initialLicence);
  const [notifyOwner, setNotifyOwner] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const state = {
    checkedIds: draft.checkedIds,
    bulletinsChecked: draft.bulletinsChecked,
    mardConnected: draft.mardConnected,
    elements,
  };
  const problems = sheetProblems(state);
  const ticks = problems.filter((problem) => problem.code === 'item_unticked');
  const others = problems.filter((problem) => problem.code !== 'item_unticked');
  const blockers = signingBlockers({
    ...state,
    notes: draft.notes,
    riggerLicence: licence,
    performedOn: draft.performedOn,
    today: todayIn(new Date()),
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSign(licence.trim(), ownerEmail.trim() !== '' && notifyOwner);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('packing.sign.failed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>{t('packing.sign.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {problems.length === 0 ? (
            <Typography>{t('packing.sign.allDone')}</Typography>
          ) : (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t('packing.sign.incomplete')}
              </Typography>
              <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                {others.map((problem, index) => (
                  <li key={index}>{describeProblem(problem)}</li>
                ))}
                {ticks.length > 0 &&
                  ticks.length <= MAX_LISTED_TICKS &&
                  ticks.map((problem) => <li key={describeProblem(problem)}>{describeProblem(problem)}</li>)}
                {ticks.length > MAX_LISTED_TICKS && (
                  <li>
                    <details>
                      <summary>{t('packing.sign.unticked', { count: ticks.length })}</summary>
                      <ul style={{ paddingLeft: 20 }}>
                        {ticks.map((problem) => (
                          <li key={describeProblem(problem)}>{describeProblem(problem)}</li>
                        ))}
                      </ul>
                    </details>
                  </li>
                )}
              </ul>
            </Alert>
          )}
          <TextField
            label={t('packing.sign.notes')}
            value={draft.notes}
            onChange={(e) => onNotesChange(e.target.value)}
            multiline
            minRows={2}
            helperText={t('packing.sign.notesHint')}
          />
          <TextField
            label={t('packing.sign.licence')}
            value={licence}
            onChange={(e) => setLicence(e.target.value)}
            helperText={t('packing.sign.licenceHint')}
          />
          {ownerEmail.trim() !== '' && (
            <FormControlLabel
              control={<Checkbox checked={notifyOwner} onChange={(e) => setNotifyOwner(e.target.checked)} />}
              label={t('packing.sign.emailOwner', { email: ownerEmail.trim() })}
            />
          )}
          {blockers.length > 0 && (
            <Alert severity="info">
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {blockers.map((blocker) => (
                  <li key={blocker}>{blocker}</li>
                ))}
              </ul>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('packing.actions.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving || blockers.length > 0}>
          {t('packing.sign.sign')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
