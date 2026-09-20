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
import { describeProblem, sheetProblems, signingBlockers, todayIn, type PackingElements } from '@bendike/shared';
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
      setError(err instanceof Error ? err.message : 'Could not sign the sheet');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(e) => void submit(e)}>
      <DialogTitle>Sign packing sheet</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {problems.length === 0 ? (
            <Typography>Everything is ticked and answered.</Typography>
          ) : (
            <Alert severity="warning">
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                These are not complete. Explain them in the notes before you sign:
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
                      <summary>{ticks.length} checklist items are not ticked</summary>
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
            label="Notes"
            value={draft.notes}
            onChange={(e) => onNotesChange(e.target.value)}
            multiline
            minRows={2}
            helperText="For example: No MARD on this unit. Completed service bulletin 123xx. Changed the AAD."
          />
          <TextField
            label="Licence number"
            value={licence}
            onChange={(e) => setLicence(e.target.value)}
            helperText="Your rigger licence, printed on the sheet next to your name"
          />
          {ownerEmail.trim() !== '' && (
            <FormControlLabel
              control={<Checkbox checked={notifyOwner} onChange={(e) => setNotifyOwner(e.target.checked)} />}
              label={`Email the owner that the repack is done (${ownerEmail.trim()})`}
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
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving || blockers.length > 0}>
          Sign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
