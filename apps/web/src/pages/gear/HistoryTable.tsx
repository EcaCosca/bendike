import {
  Button,
  Chip,
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
import { SAFETY_KINDS, type MaintenanceEntryView } from '@bendike/shared';
import { ENTRY_KIND_LABELS } from './entry-kinds';

interface HistoryTableProps {
  entries: readonly MaintenanceEntryView[];
  canVerify: boolean;
  isAdmin: boolean;
  userId: string;
  itemLabels?: Record<string, string>;
  onVerify: (entry: MaintenanceEntryView) => void;
  onVoid: (entry: MaintenanceEntryView) => void;
}

export function HistoryTable({ entries, canVerify, isAdmin, userId, itemLabels, onVerify, onVoid }: HistoryTableProps) {
  if (entries.length === 0) {
    return <Typography color="text.secondary">No work recorded yet.</Typography>;
  }
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label="Maintenance history">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            {itemLabels && <TableCell>Component</TableCell>}
            <TableCell>Work</TableCell>
            <TableCell>Done by</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry) => {
            const voided = entry.voidedAt !== null;
            const unverified = entry.ownerReported && entry.verifiedAt === null && !voided;
            const needsVerifier = unverified && SAFETY_KINDS.includes(entry.kind);
            return (
              <TableRow key={entry.id}>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{entry.performedOn}</TableCell>
                {itemLabels && <TableCell>{itemLabels[entry.gearItemId] ?? ''}</TableCell>}
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ENTRY_KIND_LABELS[entry.kind]}
                      {entry.result ? `: ${entry.result.replace('_', ' ')}` : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ textDecoration: voided ? 'line-through' : 'none' }}>
                      {entry.description}
                    </Typography>
                    {voided && (
                      <Typography variant="caption" color="text.secondary">
                        Voided: {entry.voidReason}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">{entry.performedByName}</Typography>
                    {(entry.performedByContact || entry.performedByLicence) && (
                      <Typography variant="caption" color="text.secondary">
                        {[entry.performedByContact, entry.performedByLicence && `Licence ${entry.performedByLicence}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5}>
                      {unverified && <Chip size="small" color="warning" variant="outlined" label="Unverified" />}
                      {entry.verifiedAt !== null && !voided && (
                        <Chip size="small" color="success" variant="outlined" label="Verified" />
                      )}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {canVerify && needsVerifier && (
                      <Button size="small" onClick={() => onVerify(entry)}>
                        Verify
                      </Button>
                    )}
                    {!voided && entry.kind !== 'assembly' && (isAdmin || entry.performedById === userId) && (
                      <Button size="small" color="inherit" onClick={() => onVoid(entry)}>
                        Void
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
