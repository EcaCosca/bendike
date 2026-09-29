import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  GEAR_KINDS,
  Role,
  type GroundingView,
  type MaintenanceEntryView,
  type LearnRigSection,
  type RigDetailView,
  type RigPhotoView,
} from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { detectLocaleFromEnvironment } from '../../i18n/detect-locale';
import '../../i18n/i18n';
import { listLearnForRig } from '../learn/learn-api';
import { LearnSection } from '../learn/LearnSection';
import { ClearGroundingDialog } from '../bulletins/ClearGroundingDialog';
import { GroundDialog } from '../bulletins/GroundDialog';
import { canSignOff } from './entry-kinds';
import { getRig, verifyEntry } from './gear-api';
import { GearItemCard } from './GearItemCard';
import { GroundedBanner } from './GroundedBanner';
import { HistoryTable } from './HistoryTable';
import { LastInspection } from './LastInspection';
import { startSheet } from '../packing/packing-api';
import { PackingLog } from '../packing/PackingLog';
import { RigTimeline } from '../history/RigTimeline';
import { canRemovePhoto } from '../rigphotos/rig-photo-access';
import { listPhotos } from '../rigphotos/rig-photos-api';
import { RigCover } from '../rigphotos/RigCover';
import { RigPhotos } from '../rigphotos/RigPhotos';
import { KIND_LABEL_KEYS } from './item-details';
import { RigDialog } from './RigDialog';
import { GroundedBadge, StatusBadge } from './StatusBadge';
import { useComponentActions } from './use-component-actions';
import { VoidDialog } from './VoidDialog';

export function RigPage() {
  const { t } = useTranslation();
  const { rigId = '' } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [rig, setRig] = useState<RigDetailView | null>(null);
  const [photos, setPhotos] = useState<RigPhotoView[]>([]);
  const [learnSections, setLearnSections] = useState<LearnRigSection[]>([]);
  const [historyView, setHistoryView] = useState<'timeline' | 'table'>('timeline');
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRig, setEditingRig] = useState(false);
  const [voiding, setVoiding] = useState<MaintenanceEntryView | null>(null);
  const [grounding, setGrounding] = useState<
    | { type: 'ground'; target: { rigId: string } | { gearItemId: string }; label: string }
    | { type: 'clear'; grounding: GroundingView }
    | null
  >(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setRig(await getRig(token, rigId));
  }, [token, rigId]);

  useEffect(() => {
    reload().catch(() => setUnavailable(true));
  }, [reload]);

  const reloadPhotos = useCallback(async () => {
    if (!token) return;
    setPhotos(await listPhotos(token, rigId));
  }, [token, rigId]);

  useEffect(() => {
    reloadPhotos().catch(() => setPhotos([]));
  }, [reloadPhotos]);

  useEffect(() => {
    if (!token) return;
    listLearnForRig(token, rigId).then(setLearnSections, () => setLearnSections([]));
  }, [token, rigId]);

  const onChanged = useCallback(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : t('gear.rig.refreshFailed')));
  }, [reload, t]);

  const { actions, dialogs } = useComponentActions({
    token: token ?? '',
    role: user?.role ?? Role.User,
    ownerId: rig?.ownerId ?? '',
    previousEntries: rig?.entries ?? [],
    onChanged,
    onError: setError,
  });

  const itemLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const item of Object.values(rig?.slots ?? {})) {
      if (item) labels[item.id] = `${t(KIND_LABEL_KEYS[item.kind])} ${item.manufacturer} ${item.model}`;
    }
    return labels;
  }, [rig, t]);

  if (!token || !user) return null;

  const verify = (entryId: string) => {
    verifyEntry(token, entryId).then(onChanged, (err: unknown) =>
      setError(err instanceof Error ? err.message : t('gear.rig.verifyFailed')),
    );
  };
  const startRepack = () => {
    startSheet(token, rigId).then(
      (job) => void navigate(`/app/gear/${rigId}/packing/${job.sheet.id}`),
      (err: unknown) => setError(err instanceof Error ? err.message : t('gear.rig.startRepackFailed')),
    );
  };
  const canEdit = user.role === Role.Admin || rig?.ownerId === user.id;
  const canGround = canSignOff(user.role);

  return (
    <AppShell>
      <Stack spacing={3}>
        <Link component={RouterLink} to="/app/gear" underline="hover">
          {t('gear.rig.backToGear')}
        </Link>
        {unavailable && <Alert severity="warning">{t('gear.rig.unavailable')}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {rig && (
          <>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <RigCover photoId={photos[0]?.id} rigName={rig.name} size={64} />
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
                {rig.name}
              </Typography>
              {rig.readiness.state === 'grounded' && <GroundedBadge size="medium" />}
              {rig.active ? (
                <StatusBadge status={rig.status} size="medium" />
              ) : (
                <Alert severity="info" icon={false} sx={{ py: 0 }}>
                  {t('gear.common.inactive')}
                </Alert>
              )}
              {canGround && rig.active && rig.slots.reserve && (
                <Button variant="contained" onClick={startRepack}>
                  {t('gear.rig.startRepack')}
                </Button>
              )}
              {canGround && rig.active && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setGrounding({ type: 'ground', target: { rigId: rig.id }, label: rig.name })}
                >
                  {t('gear.rig.groundRig')}
                </Button>
              )}
              {canEdit && (
                <Button variant="outlined" onClick={() => setEditingRig(true)}>
                  {t('gear.rig.editRig')}
                </Button>
              )}
              <Button variant="outlined" component={RouterLink} to={`/app/gear/${rig.id}/label`}>
                {t('gear.rig.qrLabel')}
              </Button>
            </Stack>
            {rig.notes && <Typography color="text.secondary">{rig.notes}</Typography>}
            <LastInspection inspection={rig.lastInspection} riggers={rig.riggers} />
            <GroundedBanner
              reasons={rig.readiness.reasons}
              canVerify={canGround}
              onVerify={verify}
              canClear={canGround}
              onClear={(g) => setGrounding({ type: 'clear', grounding: g })}
            />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
              {GEAR_KINDS.map((kind) => {
                const item = rig.slots[kind];
                if (!item) {
                  const kindName = t(KIND_LABEL_KEYS[kind]);
                  const label = kind === 'aad' ? kindName : kindName.toLowerCase();
                  return canEdit ? (
                    <Button
                      key={kind}
                      variant="outlined"
                      sx={{ minHeight: 96, borderStyle: 'dashed' }}
                      aria-label={t('gear.rig.addKind', { kind: label })}
                      onClick={() => actions.addComponent(kind, rig.id)}
                    >
                      {t('gear.rig.addKind', { kind: label })}
                    </Button>
                  ) : (
                    <Typography key={kind} color="text.secondary">
                      {t('gear.rig.noKind', { kind: label })}
                    </Typography>
                  );
                }
                return (
                  <GearItemCard
                    key={kind}
                    item={item}
                    canEdit={canEdit}
                    linkToItem
                    canGround={canGround}
                    onGround={() =>
                      setGrounding({
                        type: 'ground',
                        target: { gearItemId: item.id },
                        label: `${item.manufacturer} ${item.model}`,
                      })
                    }
                    onEdit={() => actions.edit(item)}
                    onLogWork={() => actions.logWork(item)}
                    onAddPart={() => actions.addPart(item)}
                    onEditPart={(part) => actions.editPart(item, part)}
                    onDeletePart={actions.removePart}
                  />
                );
              })}
            </Box>
            {learnSections.length > 0 && (
              <Stack spacing={2} component="section" aria-label={t('gear.rig.learnAboutYourGear')}>
                <Typography variant="h5" component="h2">
                  {t('gear.rig.learnAboutYourGear')}
                </Typography>
                {learnSections.map((section) => (
                  <LearnSection
                    key={section.gearItemId}
                    title={section.label}
                    items={section.items}
                    locale={detectLocaleFromEnvironment()}
                    headingLevel="h3"
                  />
                ))}
              </Stack>
            )}
            {rig.groundingHistory.length > 0 && (
              <>
                <Typography variant="h5" component="h2">
                  {t('gear.rig.groundingHistory')}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" aria-label={t('gear.rig.groundingHistory')}>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('gear.rig.grounded')}</TableCell>
                        <TableCell>{t('gear.rig.reason')}</TableCell>
                        <TableCell>{t('gear.rig.cleared')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rig.groundingHistory.map((g) => (
                        <TableRow key={g.id}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {g.openedAt.slice(0, 10)}
                            <br />
                            {g.openedByName}
                          </TableCell>
                          <TableCell>{g.reason}</TableCell>
                          <TableCell>
                            {g.closedAt ? (
                              <>
                                <Typography variant="body2">
                                  {t('gear.rig.clearedBy', { name: g.closedByName, date: g.closedAt.slice(0, 10) })}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {g.closeNote}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="error">
                                {t('gear.rig.stillGrounded')}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
            <RigPhotos
              token={token}
              rigId={rig.id}
              photos={photos}
              entries={rig.entries}
              itemLabels={itemLabels}
              canRemove={(photo) => canRemovePhoto(photo, user, rig.ownerId)}
              onChanged={() => {
                reloadPhotos().catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : t('gear.rig.refreshPhotosFailed')),
                );
              }}
            />
            <PackingLog token={token} role={user.role} scope={{ rigId: rig.id }} />
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ flexWrap: 'wrap', rowGap: 1 }}
            >
              <Typography variant="h5" component="h2">
                {t('gear.common.history')}
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={historyView}
                onChange={(_, next: 'timeline' | 'table' | null) => next && setHistoryView(next)}
                aria-label={t('gear.rig.historyView')}
              >
                <ToggleButton value="timeline">{t('gear.rig.timeline')}</ToggleButton>
                <ToggleButton value="table">{t('gear.rig.table')}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {historyView === 'timeline' ? (
              <RigTimeline
                token={token}
                rigId={rig.id}
                entries={rig.entries}
                groundings={rig.groundingHistory}
                photos={photos}
                itemLabels={itemLabels}
              />
            ) : (
              <HistoryTable
                entries={rig.entries}
                canVerify={canSignOff(user.role)}
                isAdmin={user.role === Role.Admin}
                userId={user.id}
                itemLabels={itemLabels}
                onVerify={(entry) => verify(entry.id)}
                onVoid={setVoiding}
              />
            )}
          </>
        )}
      </Stack>
      {dialogs}
      {editingRig && rig && (
        <RigDialog token={token} rig={rig} onClose={() => setEditingRig(false)} onSaved={onChanged} />
      )}
      {grounding?.type === 'ground' && (
        <GroundDialog
          token={token}
          target={grounding.target}
          label={grounding.label}
          onClose={() => setGrounding(null)}
          onSaved={onChanged}
        />
      )}
      {grounding?.type === 'clear' && (
        <ClearGroundingDialog
          token={token}
          grounding={grounding.grounding}
          onClose={() => setGrounding(null)}
          onSaved={onChanged}
        />
      )}
      {voiding && <VoidDialog token={token} entry={voiding} onClose={() => setVoiding(null)} onVoided={onChanged} />}
    </AppShell>
  );
}
