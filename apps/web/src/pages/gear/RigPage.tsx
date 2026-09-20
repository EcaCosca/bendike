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
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  GEAR_KINDS,
  Role,
  type GroundingView,
  type MaintenanceEntryView,
  type RigDetailView,
  type RigPhotoView,
} from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
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
import { canRemovePhoto } from '../rigphotos/rig-photo-access';
import { listPhotos } from '../rigphotos/rig-photos-api';
import { RigCover } from '../rigphotos/RigCover';
import { RigPhotos } from '../rigphotos/RigPhotos';
import { KIND_LABELS } from './item-details';
import { RigDialog } from './RigDialog';
import { GroundedBadge, StatusBadge } from './StatusBadge';
import { useComponentActions } from './use-component-actions';
import { VoidDialog } from './VoidDialog';

export function RigPage() {
  const { rigId = '' } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [rig, setRig] = useState<RigDetailView | null>(null);
  const [photos, setPhotos] = useState<RigPhotoView[]>([]);
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

  const onChanged = useCallback(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not refresh the rig'));
  }, [reload]);

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
      if (item) labels[item.id] = `${KIND_LABELS[item.kind]} ${item.manufacturer} ${item.model}`;
    }
    return labels;
  }, [rig]);

  if (!token || !user) return null;

  const verify = (entryId: string) => {
    verifyEntry(token, entryId).then(onChanged, (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Could not verify the entry'),
    );
  };
  const startRepack = () => {
    startSheet(token, rigId).then(
      (job) => void navigate(`/app/gear/${rigId}/packing/${job.sheet.id}`),
      (err: unknown) => setError(err instanceof Error ? err.message : 'Could not start the repack'),
    );
  };
  const canEdit = user.role === Role.Admin || rig?.ownerId === user.id;
  const canGround = canSignOff(user.role);

  return (
    <AppShell>
      <Stack spacing={3}>
        <Link component={RouterLink} to="/app/gear" underline="hover">
          Back to gear
        </Link>
        {unavailable && <Alert severity="warning">This rig is not available.</Alert>}
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
                  Inactive
                </Alert>
              )}
              {canGround && rig.active && rig.slots.reserve && (
                <Button variant="contained" onClick={startRepack}>
                  Start repack
                </Button>
              )}
              {canGround && rig.active && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setGrounding({ type: 'ground', target: { rigId: rig.id }, label: rig.name })}
                >
                  Ground rig
                </Button>
              )}
              {canEdit && (
                <Button variant="outlined" onClick={() => setEditingRig(true)}>
                  Edit rig
                </Button>
              )}
              <Button variant="outlined" component={RouterLink} to={`/app/gear/${rig.id}/label`}>
                QR label
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
                  const label = kind === 'aad' ? 'AAD' : kind;
                  return canEdit ? (
                    <Button
                      key={kind}
                      variant="outlined"
                      sx={{ minHeight: 96, borderStyle: 'dashed' }}
                      aria-label={`Add ${label}`}
                      onClick={() => actions.addComponent(kind, rig.id)}
                    >
                      Add {label}
                    </Button>
                  ) : (
                    <Typography key={kind} color="text.secondary">
                      No {label}
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
            {rig.groundingHistory.length > 0 && (
              <>
                <Typography variant="h5" component="h2">
                  Grounding history
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small" aria-label="Grounding history">
                    <TableHead>
                      <TableRow>
                        <TableCell>Grounded</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Cleared</TableCell>
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
                                  Cleared by {g.closedByName} on {g.closedAt.slice(0, 10)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {g.closeNote}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="error">
                                Still grounded
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
                  setError(err instanceof Error ? err.message : 'Could not refresh the photos'),
                );
              }}
            />
            <PackingLog token={token} role={user.role} scope={{ rigId: rig.id }} />
            <Typography variant="h5" component="h2">
              History
            </Typography>
            <HistoryTable
              entries={rig.entries}
              canVerify={canSignOff(user.role)}
              isAdmin={user.role === Role.Admin}
              userId={user.id}
              itemLabels={itemLabels}
              onVerify={(entry) => verify(entry.id)}
              onVoid={setVoiding}
            />
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
