import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
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
import { Link as RouterLink } from 'react-router-dom';
import type { BulletinMatchView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { KIND_LABELS } from '../gear/item-details';
import { SEVERITY_COLORS, SEVERITY_LABELS } from './bulletin-labels';
import { listMatches } from './bulletins-api';
import { GroundDialog } from './GroundDialog';
import { ResolveMatchDialog } from './ResolveMatchDialog';

type Dialog = { type: 'resolve'; match: BulletinMatchView } | { type: 'ground'; match: BulletinMatchView } | null;

export function BulletinMatchesPage() {
  const { token } = useAuth();
  const [matches, setMatches] = useState<BulletinMatchView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);

  const load = useCallback(async () => {
    if (token) setMatches(await listMatches(token, includeResolved ? undefined : 'open'));
  }, [token, includeResolved]);

  useEffect(() => {
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the matches'));
  }, [load]);

  const groups = useMemo(() => {
    const byBulletin = new Map<string, BulletinMatchView[]>();
    for (const match of matches ?? []) {
      byBulletin.set(match.bulletin.id, [...(byBulletin.get(match.bulletin.id) ?? []), match]);
    }
    return [...byBulletin.values()];
  }, [matches]);

  if (!token) return null;
  const refresh = () => {
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not refresh'));
  };

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Typography variant="h4" component="h1">
            Service bulletins
          </Typography>
          <Button component={RouterLink} to="/app/work" variant="outlined">
            Work queue
          </Button>
        </Stack>
        <Typography color="text.secondary">
          Components of the owners you look after that a published bulletin applies to. Resolve each one, and ground a
          rig when it should not be used until you say so.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <FormControlLabel
          control={<Checkbox checked={includeResolved} onChange={(e) => setIncludeResolved(e.target.checked)} />}
          label="Show resolved matches too"
        />
        {matches && matches.length === 0 && (
          <Typography color="text.secondary">No open matches. Nothing to review.</Typography>
        )}
        {groups.map((group) => {
          const bulletin = (group[0] as BulletinMatchView).bulletin;
          return (
            <Box key={bulletin.id} component="section" aria-label={bulletin.reference}>
              <Stack spacing={0.5} sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                  <Typography variant="h6" component="h2">
                    {bulletin.title}
                  </Typography>
                  <Chip
                    size="small"
                    color={SEVERITY_COLORS[bulletin.severity]}
                    label={SEVERITY_LABELS[bulletin.severity]}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {bulletin.manufacturer} · {bulletin.reference}
                  </Typography>
                </Stack>
                <Typography variant="body2">{bulletin.requiredAction}</Typography>
                {bulletin.sourceUrl && (
                  <Link href={bulletin.sourceUrl} target="_blank" rel="noreferrer" variant="body2">
                    Manufacturer bulletin
                  </Link>
                )}
              </Stack>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label={`Matches for ${bulletin.reference}`}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Customer</TableCell>
                      <TableCell>Rig</TableCell>
                      <TableCell>Component</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {group.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>{match.owner.displayName}</TableCell>
                        <TableCell>
                          {match.rig ? (
                            <Link
                              component={RouterLink}
                              to={`/app/gear/${match.rig.id}`}
                              color="inherit"
                              underline="hover"
                            >
                              {match.rig.name}
                            </Link>
                          ) : (
                            'Spare gear'
                          )}
                        </TableCell>
                        <TableCell>
                          {KIND_LABELS[match.item.kind]}: {match.item.manufacturer} {match.item.model}
                          {match.item.serial ? ` #${match.item.serial}` : ''}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                            {match.status === 'open' ? (
                              <Chip size="small" variant="outlined" label="Open" />
                            ) : (
                              <Chip
                                size="small"
                                color="success"
                                variant="outlined"
                                label={match.status === 'complied' ? 'Complied' : 'Not applicable'}
                              />
                            )}
                            {match.confidence === 'needs_review' && (
                              <Chip size="small" color="warning" label="Needs review" />
                            )}
                          </Stack>
                          {match.resolutionNote && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {match.resolutionNote}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {match.status === 'open' && (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setDialog({ type: 'resolve', match })}
                              >
                                Resolve
                              </Button>
                              <Button size="small" color="error" onClick={() => setDialog({ type: 'ground', match })}>
                                {match.rig ? 'Ground rig' : 'Ground component'}
                              </Button>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          );
        })}
      </Stack>
      {dialog?.type === 'resolve' && (
        <ResolveMatchDialog token={token} match={dialog.match} onClose={() => setDialog(null)} onSaved={refresh} />
      )}
      {dialog?.type === 'ground' && (
        <GroundDialog
          token={token}
          target={dialog.match.rig ? { rigId: dialog.match.rig.id } : { gearItemId: dialog.match.item.id }}
          label={
            dialog.match.rig ? dialog.match.rig.name : `${dialog.match.item.manufacturer} ${dialog.match.item.model}`
          }
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      )}
    </AppShell>
  );
}
