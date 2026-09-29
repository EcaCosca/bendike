import {
  Alert,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { Role, type PackingSheetSummary } from '@bendike/shared';
import '../../i18n/i18n';
import { listSheets } from './packing-api';

interface PackingLogProps {
  token: string;
  role: Role;
  scope: { rigId: string } | { reserveItemId: string };
}

export function PackingLog({ token, role, scope }: PackingLogProps) {
  const { t } = useTranslation();
  const [sheets, setSheets] = useState<PackingSheetSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scopeKey = 'rigId' in scope ? `rig:${scope.rigId}` : `reserve:${scope.reserveItemId}`;

  useEffect(() => {
    listSheets(token, scope).then(setSheets, (err: unknown) =>
      setError(err instanceof Error ? err.message : t('packing.log.loadFailed')),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, scopeKey]);

  const isRigger = role === Role.Rigger || role === Role.Admin;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!sheets || (sheets.length === 0 && !isRigger)) return null;

  const headers = [
    t('packing.log.sheet'),
    t('packing.log.date'),
    t('packing.log.rigger'),
    t('packing.log.checklist'),
    '',
  ];

  return (
    <Stack spacing={1}>
      <Typography variant="h5" component="h2">
        {t('packing.log.title')}
      </Typography>
      {sheets.length === 0 ? (
        <Typography color="text.secondary">{t('packing.log.empty')}</Typography>
      ) : (
        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small" aria-label={t('packing.log.title')}>
            <TableHead>
              <TableRow>
                {headers.map((header, index) => (
                  <TableCell key={`${header}-${index}`} sx={{ fontWeight: 700 }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sheets.map((sheet) => (
                <TableRow
                  key={sheet.id}
                  sx={sheet.voided ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}
                >
                  <TableCell>{sheet.sheetNo}</TableCell>
                  <TableCell>{sheet.performedOn}</TableCell>
                  <TableCell>{sheet.riggerName}</TableCell>
                  <TableCell>
                    {sheet.missingCount > 0
                      ? t('packing.log.notComplete', { count: sheet.missingCount })
                      : t('packing.log.complete')}
                  </TableCell>
                  <TableCell>
                    {sheet.voided && (
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ mr: 1, fontWeight: 700, textDecoration: 'none' }}
                      >
                        {t('packing.log.void')}
                      </Typography>
                    )}
                    <Link
                      component={RouterLink}
                      to={`/app/gear/${sheet.rigId}/packing/${sheet.id}/print`}
                      aria-label={t('packing.log.openSheet', { sheetNo: sheet.sheetNo })}
                    >
                      {t('packing.log.open')}
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
