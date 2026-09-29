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
import { useTranslation } from 'react-i18next';
import { SAFETY_KINDS, type MaintenanceEntryView } from '@bendike/shared';
import '../../i18n/i18n';
import { ENTRY_KIND_LABEL_KEYS, INSPECTION_RESULT_LABEL_KEYS } from './entry-kinds';

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
  const { t } = useTranslation();
  if (entries.length === 0) {
    return <Typography color="text.secondary">{t('gear.history.empty')}</Typography>;
  }
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small" aria-label={t('gear.history.table')}>
        <TableHead>
          <TableRow>
            <TableCell>{t('gear.common.date')}</TableCell>
            {itemLabels && <TableCell>{t('gear.common.component')}</TableCell>}
            <TableCell>{t('gear.history.work')}</TableCell>
            <TableCell>{t('gear.history.doneBy')}</TableCell>
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
                      {t(ENTRY_KIND_LABEL_KEYS[entry.kind])}
                      {entry.result ? `: ${t(INSPECTION_RESULT_LABEL_KEYS[entry.result])}` : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ textDecoration: voided ? 'line-through' : 'none' }}>
                      {entry.description}
                    </Typography>
                    {voided && (
                      <Typography variant="caption" color="text.secondary">
                        {t('gear.history.voided', { reason: entry.voidReason ?? '' })}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2">{entry.performedByName}</Typography>
                    {(entry.performedByContact || entry.performedByLicence) && (
                      <Typography variant="caption" color="text.secondary">
                        {[
                          entry.performedByContact,
                          entry.performedByLicence && t('gear.history.licence', { number: entry.performedByLicence }),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5}>
                      {unverified && (
                        <Chip size="small" color="warning" variant="outlined" label={t('gear.history.unverified')} />
                      )}
                      {entry.verifiedAt !== null && !voided && (
                        <Chip size="small" color="success" variant="outlined" label={t('gear.history.verified')} />
                      )}
                    </Stack>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {canVerify && needsVerifier && (
                      <Button size="small" onClick={() => onVerify(entry)}>
                        {t('gear.common.verify')}
                      </Button>
                    )}
                    {!voided && entry.kind !== 'assembly' && (isAdmin || entry.performedById === userId) && (
                      <Button size="small" color="inherit" onClick={() => onVoid(entry)}>
                        {t('gear.history.void')}
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
