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
import type { BulletinView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { BulletinDialog } from './BulletinDialog';
import { SEVERITY_COLORS, SEVERITY_LABELS, STATUS_LABELS } from './bulletin-labels';
import { listBulletins, publishBulletin, withdrawBulletin } from './bulletins-api';

export function BulletinsPage() {
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
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the bulletins'));
  }, [reload]);

  if (!token) return null;

  const publish = (bulletin: BulletinView) => {
    setError(null);
    setNotice(null);
    publishBulletin(token, bulletin.id).then(
      (published) => {
        const n = published.matchCounts.total;
        setNotice(`Published ${published.reference}: matched ${n} component${n === 1 ? '' : 's'}.`);
        void reload();
      },
      (err: unknown) => setError(err instanceof Error ? err.message : 'Could not publish'),
    );
  };

  const withdraw = (bulletin: BulletinView) => {
    setError(null);
    setNotice(null);
    withdrawBulletin(token, bulletin.id).then(
      () => {
        setNotice(`Withdrew ${bulletin.reference}. The groundings it opened were cleared.`);
        void reload();
      },
      (err: unknown) => setError(err instanceof Error ? err.message : 'Could not withdraw'),
    );
  };

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Service bulletins
          </Typography>
          <Button variant="contained" onClick={() => setDialog({})}>
            New bulletin
          </Button>
        </Stack>
        <Typography color="text.secondary">
          Enter a manufacturer&apos;s bulletin once. When you publish it, Bendike finds every component it applies to
          and every rigger sees the matches on their customers&apos; gear.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {notice && <Alert severity="success">{notice}</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Service bulletins">
            <TableHead>
              <TableRow>
                <TableCell>Reference</TableCell>
                <TableCell>Bulletin</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Matches</TableCell>
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
                      {b.manufacturer} · issued {b.issuedOn}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={SEVERITY_COLORS[b.severity]} label={SEVERITY_LABELS[b.severity]} />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={STATUS_LABELS[b.status]} />
                  </TableCell>
                  <TableCell>
                    {b.status === 'draft' ? '—' : `${b.matchCounts.open} open of ${b.matchCounts.total}`}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {b.status !== 'withdrawn' && (
                        <Button size="small" onClick={() => setDialog({ bulletin: b })}>
                          Edit
                        </Button>
                      )}
                      {b.status === 'draft' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => (b.severity === 'grounding' ? setConfirming(b) : publish(b))}
                        >
                          Publish
                        </Button>
                      )}
                      {b.status === 'published' && (
                        <Button size="small" color="inherit" onClick={() => withdraw(b)}>
                          Withdraw
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
          <DialogTitle>Publish {confirming.reference}?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This is a grounding bulletin. Every rig with a matching component will be grounded until its rigger
              resolves the match.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirming(null)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                publish(confirming);
                setConfirming(null);
              }}
            >
              Publish and ground
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </AppShell>
  );
}
