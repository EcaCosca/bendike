import {
  Alert,
  Box,
  Button,
  Chip,
  Link,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  DUE_KINDS,
  GEAR_KINDS,
  Role,
  WORK_PAGE_SIZE,
  contactLink,
  todayIn,
  type DueKind,
  type GearKind,
  type VerificationRow,
  type WorkItem,
  type WorkQueueQuery,
  type WorkQueueResponse,
  type WorkSort,
  type WorkStatusFilter,
} from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { EntryDialog } from '../gear/EntryDialog';
import { verifyEntry } from '../gear/gear-api';
import { DUE_KIND_LABELS, describeDays } from '../gear/gear-status';
import { ENTRY_KIND_LABELS } from '../gear/entry-kinds';
import { KIND_LABELS } from '../gear/item-details';
import { StatusBadge } from '../gear/StatusBadge';
import { QuickRepackDialog } from './QuickRepackDialog';
import { GroundDialog } from '../bulletins/GroundDialog';
import { DigestSwitch } from './DigestSwitch';
import { getQueue } from './work-api';

const WINDOWS = [30, 60, 90, 180] as const;
const SORT_LABELS: Record<WorkSort, string> = {
  urgency: 'Most urgent first',
  due: 'Due date',
  owner: 'Customer or dropzone',
  rig: 'Rig',
};

type Dialog =
  | { type: 'repack'; work: WorkItem }
  | { type: 'work'; work: WorkItem }
  | { type: 'ground'; rigId: string; rigName: string }
  | null;

export function WorkQueuePage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<WorkQueueResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<WorkStatusFilter>('all');
  const [withinDays, setWithinDays] = useState<number | ''>(60);
  const [ownerId, setOwnerId] = useState('');
  const [kind, setKind] = useState<GearKind | ''>('');
  const [dueKind, setDueKind] = useState<DueKind | ''>('');
  const [sort, setSort] = useState<WorkSort>('urgency');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    if (!token) return;
    const query: WorkQueueQuery = {
      status,
      sort,
      page,
      pageSize: WORK_PAGE_SIZE,
      ...(withinDays === '' ? {} : { withinDays }),
      ...(ownerId ? { ownerId } : {}),
      ...(kind ? { kind } : {}),
      ...(dueKind ? { dueKind } : {}),
      ...(search ? { search } : {}),
    };
    setData(await getQueue(token, query));
  }, [token, status, withinDays, ownerId, kind, dueKind, sort, page, search]);

  useEffect(() => {
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the work queue'));
  }, [load]);

  if (!token || !user) return null;

  const refresh = () => {
    load().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not refresh'));
  };
  const change =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };
  const verify = (row: VerificationRow) => {
    verifyEntry(token, row.entryId).then(refresh, (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Could not verify the entry'),
    );
  };
  const toggleStatus = (next: WorkStatusFilter) => change(setStatus)(status === next ? 'all' : next);

  const pages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const counts = data?.counts;
  const summary: { key: WorkStatusFilter; label: string; count: number }[] = counts
    ? [
        { key: 'overdue', label: 'Overdue', count: counts.overdue },
        { key: 'due_soon', label: 'Due soon', count: counts.due_soon },
        { key: 'no_data', label: 'No data', count: counts.no_data },
        { key: 'grounded', label: 'Grounded', count: counts.grounded },
      ]
    : [];

  const contactFor = (work: WorkItem) =>
    contactLink(work.owner, {
      locale: work.owner.locale,
      ownerName: work.owner.displayName,
      riggerName: user.displayName,
      rigName: work.rig?.name ?? null,
      componentLabel: `${work.item.manufacturer} ${work.item.model}`,
      dueKind: work.dueKind,
      dueOn: work.dueOn,
      daysLeft: work.daysLeft,
    });

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Typography variant="h4" component="h1">
            Work queue
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/app/work/bulletins" variant="outlined">
              Service bulletins
            </Button>
            <Button component={RouterLink} to="/app/work/customers" variant="outlined">
              Customers
            </Button>
            <Button component={RouterLink} to="/app/riggers" variant="outlined">
              Add customer
            </Button>
          </Stack>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        <DigestSwitch token={token} />

        {counts && (
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            {summary.map(({ key, label, count }) => (
              <Chip
                key={key}
                label={`${label} ${count}`}
                onClick={() => toggleStatus(key)}
                color={status === key ? 'primary' : 'default'}
                variant={status === key ? 'filled' : 'outlined'}
              />
            ))}
            <Chip label={`Awaiting verification ${counts.awaitingVerification}`} variant="outlined" />
          </Stack>
        )}

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
          <TextField
            label="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            size="small"
            sx={{ minWidth: 200, flexGrow: 1 }}
          />
          <TextField
            select
            label="Customer or dropzone"
            value={ownerId}
            onChange={(e) => change(setOwnerId)(e.target.value)}
            size="small"
            sx={{ minWidth: 190 }}
          >
            <MenuItem value="">Everyone</MenuItem>
            {data?.owners.map((o) => (
              <MenuItem key={o.id} value={o.id}>
                {o.displayName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Component"
            value={kind}
            onChange={(e) => change(setKind)(e.target.value as GearKind | '')}
            size="small"
            sx={{ minWidth: 140 }}
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
            label="What is due"
            value={dueKind}
            onChange={(e) => change(setDueKind)(e.target.value as DueKind | '')}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">Anything</MenuItem>
            {DUE_KINDS.map((k) => (
              <MenuItem key={k} value={k}>
                {DUE_KIND_LABELS[k]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Due within"
            value={withinDays}
            onChange={(e) => change(setWithinDays)(e.target.value === '' ? '' : Number(e.target.value))}
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">Any time</MenuItem>
            {WINDOWS.map((d) => (
              <MenuItem key={d} value={d}>
                {d} days
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Sort by"
            value={sort}
            onChange={(e) => change(setSort)(e.target.value as WorkSort)}
            size="small"
            sx={{ minWidth: 170 }}
          >
            {(Object.keys(SORT_LABELS) as WorkSort[]).map((s) => (
              <MenuItem key={s} value={s}>
                {SORT_LABELS[s]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {data && data.groundedRigs.length > 0 && (
          <Box component="section" aria-label="Grounded rigs">
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Grounded rigs
            </Typography>
            <Stack spacing={1}>
              {data.groundedRigs.map((row) => (
                <Paper key={row.rig.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="baseline" sx={{ flexWrap: 'wrap' }}>
                      <Link
                        component={RouterLink}
                        to={`/app/gear/${row.rig.id}`}
                        color="inherit"
                        underline="hover"
                        sx={{ fontWeight: 600 }}
                      >
                        {row.rig.name}
                      </Link>
                      <Typography variant="body2" color="text.secondary">
                        {row.owner.displayName}
                      </Typography>
                    </Stack>
                    {row.reasons.map((reason, index) => (
                      <Typography key={index} variant="body2">
                        {reason}
                      </Typography>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {data && data.verifications.length > 0 && (
          <Box component="section" aria-label="Awaiting your verification">
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
              Awaiting your verification
            </Typography>
            <Stack spacing={1}>
              {data.verifications.map((row) => (
                <Paper key={row.entryId} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.owner.displayName}
                        {row.rig ? ` · ${row.rig.name}` : ''} · {row.item.manufacturer} {row.item.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {ENTRY_KIND_LABELS[row.kind]} on {row.performedOn}, packed by {row.performedByName}
                        {row.performedByContact ? ` (${row.performedByContact})` : ''}
                      </Typography>
                    </Box>
                    <Button size="small" variant="contained" onClick={() => verify(row)}>
                      Verify
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {data && data.items.length === 0 && (
          <Typography color="text.secondary">
            Nothing in this window. Widen the dates or clear a filter to see more.
          </Typography>
        )}
        {data && data.items.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Work queue">
              <TableHead>
                <TableRow>
                  <TableCell>Customer and rig</TableCell>
                  <TableCell>Component</TableCell>
                  <TableCell>Due</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {work.owner.displayName}
                      </Typography>
                      {work.rig ? (
                        <Link
                          component={RouterLink}
                          to={`/app/gear/${work.rig.id}`}
                          color="inherit"
                          underline="hover"
                          variant="body2"
                        >
                          {work.rig.name}
                        </Link>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Spare gear
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {KIND_LABELS[work.item.kind]}: {work.item.manufacturer} {work.item.model}
                        {work.item.serial ? ` #${work.item.serial}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                        {DUE_KIND_LABELS[work.dueKind]} {work.dueOn ?? ''}
                      </Typography>
                      <Typography variant="body2" color={work.status === 'overdue' ? 'error' : 'text.secondary'}>
                        {work.daysLeft === null ? 'No date on record' : describeDays(work.daysLeft)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <StatusBadge status={work.status} />
                        {work.rig?.grounded && <Chip size="small" label="Grounded rig" />}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {work.dueKind === 'repack' ? (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ whiteSpace: 'nowrap' }}
                            onClick={() => setDialog({ type: 'repack', work })}
                          >
                            Log repack
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ whiteSpace: 'nowrap' }}
                            onClick={() => setDialog({ type: 'work', work })}
                          >
                            Log work
                          </Button>
                        )}
                        {work.rig && !work.rig.grounded && (
                          <Button
                            size="small"
                            color="error"
                            sx={{ whiteSpace: 'nowrap' }}
                            onClick={() =>
                              work.rig && setDialog({ type: 'ground', rigId: work.rig.id, rigName: work.rig.name })
                            }
                          >
                            Ground rig
                          </Button>
                        )}
                        <Button size="small" component="a" href={contactFor(work)} target="_blank" rel="noreferrer">
                          Contact
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {pages > 1 && <Pagination count={pages} page={page} onChange={(_, next) => setPage(next)} />}
      </Stack>

      {dialog?.type === 'repack' && (
        <QuickRepackDialog
          token={token}
          itemId={dialog.work.item.id}
          label={`${dialog.work.owner.displayName}${dialog.work.rig ? ` · ${dialog.work.rig.name}` : ''} · ${dialog.work.item.manufacturer} ${dialog.work.item.model}`}
          today={todayIn(new Date())}
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      )}
      {dialog?.type === 'ground' && (
        <GroundDialog
          token={token}
          target={{ rigId: dialog.rigId }}
          label={dialog.rigName}
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      )}
      {dialog?.type === 'work' && (
        <EntryDialog
          token={token}
          item={dialog.work.item}
          role={Role.Rigger}
          today={todayIn(new Date())}
          previousEntries={[]}
          onClose={() => setDialog(null)}
          onSaved={refresh}
        />
      )}
    </AppShell>
  );
}
