import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Link,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { Role, type GearOverview, type RigView } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { inspectionLine } from './entry-kinds';
import { getOverview } from './gear-api';
import { filterRigs, filterSpares, sortRigs, type RigSort, type StatusFilter } from './gear-filters';
import { readGearView, saveGearView, type GearView } from './gear-view';
import { GearGrid } from './GearGrid';
import { STATUS_META } from './gear-status';
import { GearItemDialog } from './GearItemDialog';
import { KIND_LABELS, identityLine } from './item-details';
import { RigDialog } from './RigDialog';
import { DueLine, GroundedBadge, StatusBadge } from './StatusBadge';
import { mostUrgentDue } from './gear-status';
import { GEAR_KINDS, type GearKind } from '@bendike/shared';

const SUMMARY: { key: StatusFilter; label: string }[] = [
  { key: 'overdue', label: STATUS_META.overdue.label },
  { key: 'due_soon', label: STATUS_META.due_soon.label },
  { key: 'no_data', label: STATUS_META.no_data.label },
  { key: 'grounded', label: 'Grounded' },
];

function RigCard({ rig }: { rig: RigView }) {
  const grounded = rig.readiness.state === 'grounded';
  return (
    <Card variant="outlined" data-testid="rig-card">
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
              <Link component={RouterLink} to={`/app/gear/${rig.id}`} color="inherit" underline="hover">
                {rig.name}
              </Link>
            </Typography>
            {grounded && <GroundedBadge />}
            {rig.active && <StatusBadge status={rig.status} />}
          </Stack>
          {rig.readiness.reasons.some((r) => r.type === 'pending_verification') && (
            <Typography variant="body2" color="text.secondary">
              Work awaiting verification by a rigger
            </Typography>
          )}
          {rig.readiness.reasons.map((r) =>
            r.type === 'grounding' ? (
              <Typography key={r.grounding.id} variant="body2" color="text.secondary">
                {r.grounding.source === 'bulletin' ? r.grounding.reason : `Grounded by a rigger: ${r.grounding.reason}`}
              </Typography>
            ) : null,
          )}
          {rig.readiness.reasons.some((r) => r.type === 'inspection_grounded') && (
            <Typography variant="body2" color="text.secondary">
              Grounded at an inspection
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            {inspectionLine(rig.lastInspection)}
          </Typography>
          {GEAR_KINDS.map((kind) => {
            const item = rig.slots[kind];
            const due = item ? mostUrgentDue(item.dues) : null;
            return (
              <Box key={kind}>
                <Typography variant="body2">
                  <strong>{KIND_LABELS[kind]}</strong>: {item ? identityLine(item) : <em>Empty</em>}
                </Typography>
                {due && <DueLine due={due} />}
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section" aria-label={title}>
      <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export function GearPage() {
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();
  const otherOwner = searchParams.get('ownerId') ?? undefined;
  const viewingOther = otherOwner !== undefined && otherOwner !== user?.id;
  const canAdd = !viewingOther || user?.role === Role.Admin;
  const [overview, setOverview] = useState<GearOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter | ''>('');
  const [kind, setKind] = useState<GearKind | ''>('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RigSort>('urgent');
  const [dialog, setDialog] = useState<'rig' | 'component' | null>(null);
  const [view, setView] = useState<GearView>(readGearView);

  const chooseView = (next: GearView | null) => {
    if (next) {
      setView(next);
      saveGearView(next);
    }
  };

  const reload = useCallback(async () => {
    if (!token) return;
    setOverview(await getOverview(token, otherOwner));
  }, [token, otherOwner]);

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load your gear'));
  }, [reload]);

  const filters = useMemo(
    () => ({ ...(status ? { status } : {}), ...(kind ? { kind } : {}), search }),
    [status, kind, search],
  );
  const title = viewingOther || user?.role === Role.Dropzone ? 'Fleet' : 'My gear';
  const activeRigs = useMemo(
    () => sortRigs(filterRigs(overview?.rigs.filter((r) => r.active) ?? [], filters), sort),
    [overview, filters, sort],
  );
  const inactiveRigs = useMemo(
    () => sortRigs(filterRigs(overview?.rigs.filter((r) => !r.active) ?? [], filters), sort),
    [overview, filters, sort],
  );
  const spares = useMemo(() => filterSpares(overview?.spares ?? [], filters), [overview, filters]);

  if (!token) return null;

  return (
    <AppShell wide={view === 'grid'}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Typography variant="h4" component="h1">
            {title}
          </Typography>
          {canAdd && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setDialog('component')}>
                Add component
              </Button>
              <Button variant="contained" onClick={() => setDialog('rig')}>
                Add rig
              </Button>
            </Stack>
          )}
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {overview && (
          <>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {SUMMARY.map(({ key, label }) => {
                const count = key === 'grounded' ? overview.summary.grounded : overview.summary[key];
                return (
                  <Chip
                    key={key}
                    label={`${label} ${count}`}
                    onClick={() => setStatus(status === key ? '' : key)}
                    color={status === key ? 'primary' : 'default'}
                    variant={status === key ? 'filled' : 'outlined'}
                  />
                );
              })}
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flexGrow: 1 }}
                size="small"
              />
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter | '')}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Any status</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
                <MenuItem value="due_soon">Due soon</MenuItem>
                <MenuItem value="no_data">No data</MenuItem>
                <MenuItem value="ok">OK</MenuItem>
                <MenuItem value="grounded">Grounded</MenuItem>
              </TextField>
              <TextField
                select
                label="Component"
                value={kind}
                onChange={(e) => setKind(e.target.value as GearKind | '')}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">Any component</MenuItem>
                {GEAR_KINDS.map((k) => (
                  <MenuItem key={k} value={k}>
                    {KIND_LABELS[k]}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Sort by"
                value={sort}
                onChange={(e) => setSort(e.target.value as RigSort)}
                size="small"
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="urgent">Most urgent first</MenuItem>
                <MenuItem value="name">Name</MenuItem>
              </TextField>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={view}
                onChange={(_, next: GearView | null) => chooseView(next)}
                aria-label="View"
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              >
                <ToggleButton value="grid">
                  <GridViewIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Grid
                </ToggleButton>
                <ToggleButton value="cards">
                  <ViewAgendaOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                  Cards
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {overview.rigs.length === 0 && overview.spares.length === 0 && (
              <Typography color="text.secondary">
                You have no rigs yet. Add a rig, then add its container, main, reserve and AAD.
              </Typography>
            )}

            {view === 'grid' && (overview.rigs.length > 0 || overview.spares.length > 0) && (
              <GearGrid overview={overview} filters={filters} sort={sort} />
            )}

            {view === 'cards' && activeRigs.length > 0 && (
              <Section title="Rigs">
                <Box
                  sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}
                >
                  {activeRigs.map((rig) => (
                    <RigCard key={rig.id} rig={rig} />
                  ))}
                </Box>
              </Section>
            )}

            {view === 'cards' && spares.length > 0 && (
              <Section title="Spare gear">
                <Stack spacing={1}>
                  {spares.map((item) => (
                    <Card key={item.id} variant="outlined">
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body1" sx={{ flexGrow: 1 }}>
                            <strong>{KIND_LABELS[item.kind]}</strong>:{' '}
                            <Link
                              component={RouterLink}
                              to={`/app/gear/items/${item.id}`}
                              color="inherit"
                              underline="hover"
                            >
                              {identityLine(item)}
                            </Link>
                          </Typography>
                          {item.dues.length > 0 && <StatusBadge status={item.status} />}
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Section>
            )}

            {view === 'cards' && inactiveRigs.length > 0 && (
              <Section title="Inactive">
                <Box
                  sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}
                >
                  {inactiveRigs.map((rig) => (
                    <RigCard key={rig.id} rig={rig} />
                  ))}
                </Box>
              </Section>
            )}
          </>
        )}
      </Stack>
      {dialog === 'rig' && (
        <RigDialog
          token={token}
          {...(otherOwner ? { ownerId: otherOwner } : {})}
          onClose={() => setDialog(null)}
          onSaved={() => void reload()}
        />
      )}
      {dialog === 'component' && (
        <GearItemDialog
          token={token}
          {...(otherOwner ? { ownerId: otherOwner } : {})}
          rigs={overview?.rigs.filter((r) => r.active) ?? []}
          onClose={() => setDialog(null)}
          onSaved={() => void reload()}
        />
      )}
    </AppShell>
  );
}
