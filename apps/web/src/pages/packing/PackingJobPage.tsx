import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { sanitizeCheckedIds, type PackingComponents, type PackingJobView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import '../../i18n/i18n';
import { ChecklistSection } from './ChecklistSection';
import { ComponentsSection } from './ComponentsSection';
import { getSheet, notifyOwner, saveDraft, signSheet } from './packing-api';
import { elementsOf, readLicence, saveLicence, toBody, toDraft, type Draft } from './packing-draft';
import type { SheetNotice } from './packing-draft';
import { SignDialog } from './SignDialog';

const AUTOSAVE_DELAY_MS = 400;

type SaveState = 'idle' | 'saving' | 'saved' | { error: string };

export function PackingJobPage() {
  const { t } = useTranslation();
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
      (err: unknown) => setError(err instanceof Error ? err.message : t('packing.job.loadFailed')),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        (err: unknown) => setSaveState({ error: err instanceof Error ? err.message : t('packing.job.unknownError') }),
      );
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editCount]);

  const refreshComponents = useCallback(() => {
    if (!token) return;
    getSheet(token, sheetId).then(
      (fresh) => setComponents(fresh.components),
      (err: unknown) => setError(err instanceof Error ? err.message : t('packing.job.refreshFailed')),
    );
  }, [token, sheetId, t]);

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
          message: err instanceof Error ? err.message : t('packing.job.unknownError'),
        }),
      );
    }
    void navigate(`/app/gear/${rigId}/packing/${sheetId}/print`, { replace: true, state: { notice } });
  }

  return (
    <AppShell wide>
      <Stack spacing={3}>
        <Link component={RouterLink} to={`/app/gear/${rigId}`} underline="hover">
          {t('packing.job.backToRig')}
        </Link>
        {error && <Alert severity="error">{error}</Alert>}
        {job && draft && components && (
          <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                {t('packing.job.title', { rig: job.sheet.rigName })}
              </Typography>
              <Typography variant="body2" color="text.secondary" role="status">
                {saveState === 'saving' && t('packing.job.saving')}
                {saveState === 'saved' && t('packing.job.saved')}
                {typeof saveState === 'object' && t('packing.job.saveFailed', { error: saveState.error })}
              </Typography>
            </Stack>

            <Paper variant="outlined" component="section" aria-label={t('packing.job.ownerAndDate')} sx={{ p: 2 }}>
              <Box
                sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}
              >
                <TextField
                  label={t('packing.job.date')}
                  type="date"
                  value={draft.performedOn}
                  onChange={(e) => change({ performedOn: e.target.value })}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label={t('packing.job.ownerName')}
                  value={draft.ownerName}
                  onChange={(e) => change({ ownerName: e.target.value })}
                />
                <TextField
                  label={t('packing.job.ownerAddress')}
                  value={draft.ownerAddress}
                  onChange={(e) => change({ ownerAddress: e.target.value })}
                />
                <TextField
                  label={t('packing.job.ownerPhone')}
                  value={draft.ownerPhone}
                  onChange={(e) => change({ ownerPhone: e.target.value })}
                />
                <TextField
                  label={t('packing.job.ownerEmail')}
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

            <Paper variant="outlined" component="section" aria-label={t('packing.job.notesSection')} sx={{ p: 2 }}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label={t('packing.job.notes')}
                value={draft.notes}
                onChange={(e) => change({ notes: e.target.value })}
                helperText={t('packing.job.notesHint')}
              />
            </Paper>

            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" size="large" onClick={() => setSigning(true)}>
                {t('packing.job.reviewAndSign')}
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
