import {
  Alert,
  Chip,
  Link,
  Pagination,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  AUTHORITY_PAGE_SIZE,
  type AuthorityGroundingRow,
  type AuthorityPage,
  type AuthoritySheetRow,
  type AuthorityWorkRow,
  type RiggerRegistryRow,
} from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { ENTRY_KIND_LABELS, INSPECTION_RESULT_LABELS } from '../gear/entry-kinds';
import { getRigger, getRiggerGroundings, getRiggerSheets, getRiggerWork } from './authority-api';

type LogTab = 'sheets' | 'work' | 'groundings';

const day = (iso: string) => iso.slice(0, 10);

function PagedTable<T extends { id: string }>({
  label,
  empty,
  head,
  load,
  row,
}: {
  label: string;
  empty: string;
  head: string[];
  load: (page: number) => Promise<AuthorityPage<T>>;
  row: (item: T) => ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuthorityPage<T> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    load(page).then(
      (result) => {
        if (current) {
          setError(null);
          setData(result);
        }
      },
      (err: unknown) => {
        if (current) setError(err instanceof Error ? err.message : 'Could not load the log');
      },
    );
    return () => {
      current = false;
    };
  }, [load, page]);

  const pages = data ? Math.ceil(data.total / AUTHORITY_PAGE_SIZE) : 0;
  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {data?.rows.length === 0 && <Typography color="text.secondary">{empty}</Typography>}
      {data && data.rows.length > 0 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label={label}>
            <TableHead>
              <TableRow>
                {head.map((title) => (
                  <TableCell key={title}>{title}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>{data.rows.map((item) => row(item))}</TableBody>
          </Table>
        </TableContainer>
      )}
      {pages > 1 && <Pagination count={pages} page={page} onChange={(_, next) => setPage(next)} />}
    </Stack>
  );
}

function SheetRow({ sheet }: { sheet: AuthoritySheetRow }) {
  return (
    <TableRow key={sheet.id} hover>
      <TableCell>
        <Link
          component={RouterLink}
          to={`/app/gear/${sheet.rigId}/packing/${sheet.id}/print`}
          underline="hover"
          sx={{ fontWeight: 600 }}
        >
          {sheet.sheetNo}
        </Link>
      </TableCell>
      <TableCell>{sheet.performedOn}</TableCell>
      <TableCell>{sheet.rigName}</TableCell>
      <TableCell>{sheet.ownerName}</TableCell>
      <TableCell>{sheet.missingCount === 0 ? 'Complete' : `${sheet.missingCount} items not complete`}</TableCell>
      <TableCell>{sheet.voided ? <Chip label="Void" color="error" size="small" /> : 'Signed'}</TableCell>
    </TableRow>
  );
}

function WorkRow({ entry }: { entry: AuthorityWorkRow }) {
  return (
    <TableRow key={entry.id} hover>
      <TableCell>{entry.performedOn}</TableCell>
      <TableCell>{entry.relation === 'performed' ? 'Performed' : 'Verified'}</TableCell>
      <TableCell>
        <Typography variant="body2">{ENTRY_KIND_LABELS[entry.kind]}</Typography>
        {entry.result && (
          <Typography variant="caption" color="text.secondary">
            {INSPECTION_RESULT_LABELS[entry.result]}
          </Typography>
        )}
      </TableCell>
      <TableCell>{entry.componentLabel}</TableCell>
      <TableCell>{entry.rigName ?? '—'}</TableCell>
      <TableCell>{entry.ownerName}</TableCell>
      <TableCell sx={{ maxWidth: 320 }}>{entry.description}</TableCell>
      <TableCell>{entry.voided ? `Void: ${entry.voidReason ?? ''}` : ''}</TableCell>
    </TableRow>
  );
}

function GroundingRow({ grounding }: { grounding: AuthorityGroundingRow }) {
  return (
    <TableRow key={grounding.id} hover>
      <TableCell>{grounding.rigName ?? '—'}</TableCell>
      <TableCell sx={{ maxWidth: 320 }}>{grounding.reason}</TableCell>
      <TableCell>{`${day(grounding.openedAt)} by ${grounding.openedByName}`}</TableCell>
      <TableCell>
        {grounding.closedAt
          ? `Cleared ${day(grounding.closedAt)} by ${grounding.closedByName ?? ''}${grounding.closeNote ? `: ${grounding.closeNote}` : ''}`
          : 'Still grounded'}
      </TableCell>
    </TableRow>
  );
}

export function AuthorityRiggerPage() {
  const { riggerId = '' } = useParams();
  const { token } = useAuth();
  const [rigger, setRigger] = useState<RiggerRegistryRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<LogTab>('sheets');

  useEffect(() => {
    if (!token) return;
    getRigger(token, riggerId).then(setRigger, (err: unknown) =>
      setError(err instanceof Error ? err.message : 'Could not load the rigger'),
    );
  }, [token, riggerId]);

  const loadSheets = useCallback((page: number) => getRiggerSheets(token ?? '', riggerId, page), [token, riggerId]);
  const loadWork = useCallback((page: number) => getRiggerWork(token ?? '', riggerId, page), [token, riggerId]);
  const loadGroundings = useCallback(
    (page: number) => getRiggerGroundings(token ?? '', riggerId, page),
    [token, riggerId],
  );

  if (!token) return null;

  return (
    <AppShell wide>
      <Stack spacing={3}>
        <Link component={RouterLink} to="/app/authority/riggers" underline="hover">
          Back to the riggers
        </Link>
        {error && <Alert severity="error">{error}</Alert>}
        {rigger && (
          <Stack spacing={1}>
            <Typography variant="h4" component="h1">
              {rigger.displayName}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
              <Typography color="text.secondary">{rigger.email}</Typography>
              {rigger.phone && <Typography color="text.secondary">{rigger.phone}</Typography>}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Chip label={rigger.licence ? `Licence ${rigger.licence}` : 'No licence recorded'} />
              <Chip label={`${rigger.signedSheets} signed sheets`} variant="outlined" />
              <Chip label={`${rigger.workRecorded} pieces of work`} variant="outlined" />
              <Chip
                label={`${rigger.customers} ${rigger.customers === 1 ? 'customer' : 'customers'}`}
                variant="outlined"
              />
              {rigger.lastActivityAt && (
                <Chip label={`Last activity ${day(rigger.lastActivityAt)}`} variant="outlined" />
              )}
            </Stack>
          </Stack>
        )}
        <Tabs value={tab} onChange={(_, next: LogTab) => setTab(next)} aria-label="Rigger log">
          <Tab value="sheets" label="Signed sheets" />
          <Tab value="work" label="Work recorded" />
          <Tab value="groundings" label="Groundings" />
        </Tabs>
        {tab === 'sheets' && (
          <PagedTable
            key="sheets"
            label="Signed sheets"
            empty="No signed sheets yet."
            head={['Sheet', 'Date', 'Rig', 'Owner', 'Checklist', 'Status']}
            load={loadSheets}
            row={(sheet) => <SheetRow key={sheet.id} sheet={sheet} />}
          />
        )}
        {tab === 'work' && (
          <PagedTable
            key="work"
            label="Work recorded"
            empty="No work recorded yet."
            head={['Date', 'Role', 'Work', 'Component', 'Rig', 'Owner', 'Description', 'Status']}
            load={loadWork}
            row={(entry) => <WorkRow key={entry.id} entry={entry} />}
          />
        )}
        {tab === 'groundings' && (
          <PagedTable
            key="groundings"
            label="Groundings"
            empty="No groundings yet."
            head={['Rig', 'Reason', 'Opened', 'Outcome']}
            load={loadGroundings}
            row={(grounding) => <GroundingRow key={grounding.id} grounding={grounding} />}
          />
        )}
      </Stack>
    </AppShell>
  );
}
