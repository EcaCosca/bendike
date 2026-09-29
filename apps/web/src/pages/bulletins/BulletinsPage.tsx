import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { BulletinView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import '../../i18n/i18n';
import { BulletinDialog } from './BulletinDialog';
import { SEVERITY_COLORS, SEVERITY_LABEL_KEYS, STATUS_LABEL_KEYS } from './bulletin-labels';
import { listBulletins, publishBulletin, withdrawBulletin } from './bulletins-api';

export function BulletinsPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [bulletins, setBulletins] = useState<BulletinView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ bulletin?: BulletinView } | null>(null);
  const [confirming, setConfirming] = useState<BulletinView | null>(null);

  const reload = useCallback(async () => {
    if (token) setBulletins(await listBulletins(token));
  }, [token]);

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : t('bulletins.list.loadFailed')));
  }, [reload, t]);

  if (!token) return null;

  const publish = (bulletin: BulletinView) => {
    setError(null);
    setNotice(null);
    publishBulletin(token, bulletin.id).then(
      (published) => {
        setNotice(
          t('bulletins.list.published', { reference: published.reference, count: published.matchCounts.total }),
        );
        void reload();
      },
      (err: unknown) => setError(err instanceof Error ? err.message : t('bulletins.list.publishFailed')),
    );
  };

  const withdraw = (bulletin: BulletinView) => {
    setError(null);
    setNotice(null);
    withdrawBulletin(token, bulletin.id).then(
      () => {
        setNotice(t('bulletins.list.withdrew', { reference: bulletin.reference }));
        void reload();
      },
      (err: unknown) => setError(err instanceof Error ? err.message : t('bulletins.list.withdrawFailed')),
    );
  };

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            {t('bulletins.list.title')}
          </Typography>
          <Button variant="contained" onClick={() => setDialog({})}>
            {t('bulletins.list.newBulletin')}
          </Button>
        </Stack>
        <Typography color="text.secondary">{t('bulletins.list.intro')}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {notice && <Alert severity="success">{notice}</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label={t('bulletins.list.table')}>
            <TableHead>
              <TableRow>
                <TableCell>{t('bulletins.list.reference')}</TableCell>
                <TableCell>{t('bulletins.list.bulletin')}</TableCell>
                <TableCell>{t('bulletins.list.severity')}</TableCell>
                <TableCell>{t('bulletins.list.status')}</TableCell>
                <TableCell>{t('bulletins.list.matches')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {bulletins.map((b) => (
                <TableRow key={b.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{b.reference}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {b.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('bulletins.list.issued', { manufacturer: b.manufacturer, date: b.issuedOn })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={SEVERITY_COLORS[b.severity]} label={t(SEVERITY_LABEL_KEYS[b.severity])} />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={t(STATUS_LABEL_KEYS[b.status])} />
                  </TableCell>
                  <TableCell>
                    {b.status === 'draft'
                      ? '—'
                      : t('bulletins.list.openOf', { open: b.matchCounts.open, total: b.matchCounts.total })}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {b.status !== 'withdrawn' && (
                        <Button size="small" onClick={() => setDialog({ bulletin: b })}>
                          {t('bulletins.list.edit')}
                        </Button>
                      )}
                      {b.status === 'draft' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => (b.severity === 'grounding' ? setConfirming(b) : publish(b))}
                        >
                          {t('bulletins.list.publish')}
                        </Button>
                      )}
                      {b.status === 'published' && (
                        <Button size="small" color="inherit" onClick={() => withdraw(b)}>
                          {t('bulletins.list.withdraw')}
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
      {dialog && (
        <BulletinDialog
          token={token}
          {...(dialog.bulletin ? { bulletin: dialog.bulletin } : {})}
          onClose={() => setDialog(null)}
          onSaved={() => void reload()}
        />
      )}
      {confirming && (
        <Dialog open onClose={() => setConfirming(null)}>
          <DialogTitle>{t('bulletins.list.confirmTitle', { reference: confirming.reference })}</DialogTitle>
          <DialogContent>
            <DialogContentText>{t('bulletins.list.confirmBody')}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirming(null)}>{t('bulletins.actions.cancel')}</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                publish(confirming);
                setConfirming(null);
              }}
            >
              {t('bulletins.list.publishAndGround')}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AppShell>
  );
}
