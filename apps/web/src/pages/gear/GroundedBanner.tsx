import { Alert, AlertTitle, Button, Link, List, ListItem, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { GroundingView, InspectionSummary, PendingVerification, ReadinessReason } from '@bendike/shared';
import { ENTRY_KIND_LABELS } from './entry-kinds';

interface GroundedBannerProps {
  reasons: readonly ReadinessReason[];
  canVerify: boolean;
  onVerify: (entryId: string) => void;
  canClear?: boolean;
  onClear?: (grounding: GroundingView) => void;
}

function describePending(entry: PendingVerification): string {
  const contact = entry.performedByContact ? ` (${entry.performedByContact})` : '';
  return `${ENTRY_KIND_LABELS[entry.kind]} on ${entry.performedOn}, packed by ${entry.performedByName}${contact}`;
}

function describeInspection(inspection: InspectionSummary): string {
  return `Inspection on ${inspection.performedOn} by ${inspection.performedByName}: ${inspection.description}`;
}

export function GroundedBanner({ reasons, canVerify, onVerify, canClear = false, onClear }: GroundedBannerProps) {
  const pending = reasons.flatMap((reason) => (reason.type === 'pending_verification' ? reason.entries : []));
  const inspections = reasons.flatMap((reason) => (reason.type === 'inspection_grounded' ? [reason.inspection] : []));
  const groundings = reasons.flatMap((reason) => (reason.type === 'grounding' ? [reason.grounding] : []));
  if (pending.length === 0 && inspections.length === 0 && groundings.length === 0) {
    return null;
  }
  const kinds = [pending.length > 0, inspections.length > 0, groundings.length > 0].filter(Boolean).length;
  const title =
    kinds > 1
      ? 'GROUNDED'
      : pending.length > 0
        ? 'GROUNDED: work awaiting verification'
        : inspections.length > 0
          ? 'GROUNDED: failed inspection'
          : 'GROUNDED';
  return (
    <Alert
      severity="error"
      icon={false}
      sx={{ bgcolor: '#1B1B1F', color: '#fff', '& .MuiAlert-message': { width: '100%' } }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>{title}</AlertTitle>
      {pending.length > 0 && (
        <Typography variant="body2">
          Someone outside Bendike did work on this rig. A rigger must verify it before the rig is released. This is a
          record for the dropzone and the owner, not a lock: the rigger clears it.
        </Typography>
      )}
      {inspections.length > 0 && (
        <Typography variant="body2">
          A rigger grounded this rig at an inspection. It stays grounded until a rigger records a passed inspection.
        </Typography>
      )}
      {groundings.length > 0 && (
        <Typography variant="body2">
          A rigger grounded this rig or one of its components. This is advisory: Bendike records and shows it, and the
          rigger clears it.
        </Typography>
      )}
      <List dense disablePadding sx={{ mt: 1 }}>
        {groundings.map((grounding) => (
          <ListItem key={grounding.id} disableGutters>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {grounding.reason} · {grounding.openedByName}, {grounding.openedAt.slice(0, 10)}
              </Typography>
              {canClear && grounding.source === 'manual' && (
                <Button size="small" variant="contained" color="secondary" onClick={() => onClear?.(grounding)}>
                  Clear
                </Button>
              )}
              {canClear && grounding.source === 'bulletin' && (
                <Link component={RouterLink} to="/app/work/bulletins" color="inherit" variant="body2">
                  Resolve it in Service bulletins
                </Link>
              )}
            </Stack>
          </ListItem>
        ))}
        {inspections.map((inspection) => (
          <ListItem key={inspection.entryId} disableGutters>
            <Typography variant="body2">{describeInspection(inspection)}</Typography>
          </ListItem>
        ))}
        {pending.map((entry) => (
          <ListItem key={entry.entryId} disableGutters>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {describePending(entry)}
              </Typography>
              {canVerify && (
                <Button size="small" variant="contained" color="secondary" onClick={() => onVerify(entry.entryId)}>
                  Verify
                </Button>
              )}
            </Stack>
          </ListItem>
        ))}
      </List>
    </Alert>
  );
}
