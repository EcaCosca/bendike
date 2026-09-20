import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { sanitizeCheckedIds, type PackingComponents, type PackingJobView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { ChecklistSection } from './ChecklistSection';
import { ComponentsSection } from './ComponentsSection';
import { getSheet, notifyOwner, saveDraft, signSheet } from './packing-api';
import { elementsOf, readLicence, saveLicence, toBody, toDraft, type Draft } from './packing-draft';
import type { SheetNotice } from './packing-draft';
import { SignDialog } from './SignDialog';

const AUTOSAVE_DELAY_MS = 400;

type SaveState = 'idle' | 'saving' | 'saved' | { error: string };

export function PackingJobPage() {
  const { rigId = '', sheetId = '' } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<PackingJobView | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [components, setComponents] = useState<PackingComponents | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [signing, setSigning] = useState(false);
  const edits = useRef(0);
  const [editCount, setEditCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    getSheet(token, sheetId).then(
      (loaded) => {
        setJob(loaded);
        setDraft(toDraft(loaded.sheet));
        setComponents(loaded.components);
      },
      (err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the packing sheet'),
    );
  }, [token, sheetId]);

  const change = useCallback((patch: Partial<Draft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    edits.current += 1;
    setEditCount(edits.current);
  }, []);

  useEffect(() => {
    if (!token || !draft || editCount === 0) return;
    const timer = setTimeout(() => {
      setSaveState('saving');
      saveDraft(token, sheetId, toBody(draft)).then(
        () => setSaveState('saved'),
        (err: unknown) => setSaveState({ error: err instanceof Error ? err.message : 'Unknown error' }),
      );
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCount]);

  const refreshComponents = useCallback(() => {
    if (!token) return;
    getSheet(token, sheetId).then(
      (fresh) => setComponents(fresh.components),
      (err: unknown) => setError(err instanceof Error ? err.message : 'Could not refresh the components'),
    );
  }, [token, sheetId]);

  if (!token) return null;
  if (job?.sheet.status === 'signed') {
    return <Navigate to={`/app/gear/${rigId}/packing/${sheetId}/print`} replace />;
  }

  async function sign(licence: string, notify: boolean) {
    if (!draft || !token) return;
    await saveDraft(token, sheetId, toBody(draft));
    await signSheet(token, sheetId, licence);
    saveLicence(licence);
    let notice: SheetNotice | undefined;
    if (notify) {
      notice = await notifyOwner(token, sheetId).then(
        (): SheetNotice => ({ kind: 'sent', to: draft.ownerEmail.trim() }),
        (err: unknown): SheetNotice => ({
          kind: 'error',
          whileSigning: true,
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
      );
    }
    void navigate(`/app/gear/${rigId}/packing/${sheetId}/print`, { replace: true, state: { notice } });
  }

  return (
    <AppShell wide>
      <Stack spacing={3}>
        <Link component={RouterLink} to={`/app/gear/${rigId}`} underline="hover">
          Back to the rig
        </Link>
        {error && <Alert severity="error">{error}</Alert>}
        {job && draft && components && (
          <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                {`Repack: ${job.sheet.rigName}`}
              </Typography>
              <Typography variant="body2" color="text.secondary" role="status">
                {saveState === 'saving' && 'Saving…'}
                {saveState === 'saved' && 'Saved'}
                {typeof saveState === 'object' && `Could not save: ${saveState.error}`}
              </Typography>
            </Stack>

            <Paper variant="outlined" component="section" aria-label="Owner and date" sx={{ p: 2 }}>
              <Box
                sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}
              >
                <TextField
                  label="Date"
                  type="date"
                  value={draft.performedOn}
                  onChange={(e) => change({ performedOn: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Owner name"
                  value={draft.ownerName}
                  onChange={(e) => change({ ownerName: e.target.value })}
                />
                <TextField
                  label="Owner address"
                  value={draft.ownerAddress}
                  onChange={(e) => change({ ownerAddress: e.target.value })}
                />
                <TextField
                  label="Owner phone"
                  value={draft.ownerPhone}
                  onChange={(e) => change({ ownerPhone: e.target.value })}
                />
                <TextField
                  label="Owner email"
                  value={draft.ownerEmail}
                  onChange={(e) => change({ ownerEmail: e.target.value })}
                />
              </Box>
            </Paper>

            <ComponentsSection
              token={token}
              components={components}
              bulletinsChecked={draft.bulletinsChecked}
              manualDocumentId={draft.manualDocumentId}
              manualLabel={job.sheet.manualLabel}
              onBulletinsChange={(value) => change({ bulletinsChecked: value })}
              onManualChange={(id) => change({ manualDocumentId: id })}
              onLinkSaved={refreshComponents}
              onError={setError}
            />

            <ChecklistSection
              checkedIds={draft.checkedIds}
              mardConnected={draft.mardConnected}
              onToggle={(id, checked) =>
                change({
                  checkedIds: sanitizeCheckedIds(
                    checked ? [...draft.checkedIds, id] : draft.checkedIds.filter((existing) => existing !== id),
                  ),
                })
              }
              onMardChange={(value) => change({ mardConnected: value })}
            />

            <Paper variant="outlined" component="section" aria-label="Notes" sx={{ p: 2 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Notes on this pack job"
                value={draft.notes}
                onChange={(e) => change({ notes: e.target.value })}
                helperText="For example: No MARD on this unit. Completed service bulletin 123xx. Changed the AAD."
              />
            </Paper>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" size="large" onClick={() => setSigning(true)}>
                Review and sign
              </Button>
            </Stack>
          </>
        )}
      </Stack>
      {signing && draft && components && (
        <SignDialog
          draft={draft}
          elements={elementsOf(components)}
          initialLicence={readLicence()}
          ownerEmail={draft.ownerEmail}
          onNotesChange={(notes) => change({ notes })}
          onSign={sign}
          onClose={() => setSigning(false)}
        />
      )}
    </AppShell>
  );
}
