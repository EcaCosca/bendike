import { Alert, Link, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Role, type GearItemDetailView, type MaintenanceEntryView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { canSignOff } from './entry-kinds';
import { getItem, verifyEntry } from './gear-api';
import { GearItemCard } from './GearItemCard';
import { GroundedBanner } from './GroundedBanner';
import { HistoryTable } from './HistoryTable';
import { PackingLog } from '../packing/PackingLog';
import { useComponentActions } from './use-component-actions';
import { VoidDialog } from './VoidDialog';

export function ItemPage() {
  const { itemId = '' } = useParams();
  const { token, user } = useAuth();
  const [item, setItem] = useState<GearItemDetailView | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiding, setVoiding] = useState<MaintenanceEntryView | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setItem(await getItem(token, itemId));
  }, [token, itemId]);

  useEffect(() => {
    reload().catch(() => setUnavailable(true));
  }, [reload]);

  const onChanged = useCallback(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not refresh'));
  }, [reload]);

  const { actions, dialogs } = useComponentActions({
    token: token ?? '',
    role: user?.role ?? Role.User,
    previousEntries: item?.entries ?? [],
    onChanged,
    onError: setError,
  });

  if (!token || !user) return null;
  const verify = (entryId: string) => {
    verifyEntry(token, entryId).then(onChanged, (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Could not verify the entry'),
    );
  };
  const canEdit = user.role === Role.Admin || item?.ownerId === user.id;

  return (
    <AppShell>
      <Stack spacing={3}>
        <Link component={RouterLink} to={item?.rigId ? `/app/gear/${item.rigId}` : '/app/gear'} underline="hover">
          Back
        </Link>
        {unavailable && <Alert severity="warning">This component is not available.</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {item && (
          <>
            <GroundedBanner
              reasons={
                item.pendingVerification.length > 0
                  ? [{ type: 'pending_verification', entries: item.pendingVerification }]
                  : []
              }
              canVerify={canSignOff(user.role)}
              onVerify={verify}
            />
            <GearItemCard
              item={item}
              canEdit={canEdit}
              onEdit={() => actions.edit(item)}
              onLogWork={() => actions.logWork(item)}
              onAddPart={() => actions.addPart(item)}
              onEditPart={(part) => actions.editPart(item, part)}
              onDeletePart={actions.removePart}
            />
            {item.kind === 'reserve' && (
              <PackingLog token={token} role={user.role} scope={{ reserveItemId: item.id }} />
            )}
            <Typography variant="h5" component="h2">
              History
            </Typography>
            <HistoryTable
              entries={item.entries}
              canVerify={canSignOff(user.role)}
              isAdmin={user.role === Role.Admin}
              userId={user.id}
              onVerify={(entry) => verify(entry.id)}
              onVoid={setVoiding}
            />
          </>
        )}
      </Stack>
      {dialogs}
      {voiding && <VoidDialog token={token} entry={voiding} onClose={() => setVoiding(null)} onVoided={onChanged} />}
    </AppShell>
  );
}
