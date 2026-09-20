import {
  Alert,
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
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AUTHORITY_PAGE_SIZE,
  type AuthorityPage,
  type RiggerRegistryRow,
  type RiggerRegistrySort,
} from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { getRiggers } from './authority-api';

const SORT_LABELS: Record<RiggerRegistrySort, string> = { name: 'Name', activity: 'Last activity' };

export function AuthorityRiggersPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AuthorityPage<RiggerRegistryRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RiggerRegistrySort>('name');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!token) return;
    let current = true;
    getRiggers(token, { ...(search ? { search } : {}), sort, page }).then(
      (result) => {
        if (current) {
          setError(null);
          setData(result);
        }
      },
      (err: unknown) => {
        if (current) setError(err instanceof Error ? err.message : 'Could not load the riggers');
      },
    );
    return () => {
      current = false;
    };
  }, [token, search, sort, page]);

  const pages = data ? Math.ceil(data.total / AUTHORITY_PAGE_SIZE) : 0;

  return (
    <AppShell wide>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Riggers
          </Typography>
          <Typography color="text.secondary">
            Every rigger on Bendike. Open one to read their virtual log.
            {data ? ` ${data.total} in total.` : ''}
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search"
            placeholder="Name, email or licence"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            size="small"
            sx={{ minWidth: 220, flexGrow: 1 }}
          />
          <TextField
            select
            label="Sort by"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as RiggerRegistrySort);
              setPage(1);
            }}
            size="small"
            sx={{ minWidth: 180 }}
          >
            {(Object.keys(SORT_LABELS) as RiggerRegistrySort[]).map((key) => (
              <MenuItem key={key} value={key}>
                {SORT_LABELS[key]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {data?.rows.length === 0 && <Typography color="text.secondary">No riggers match.</Typography>}
        {data && data.rows.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Riggers">
              <TableHead>
                <TableRow>
                  <TableCell>Rigger</TableCell>
                  <TableCell>WhatsApp</TableCell>
                  <TableCell>Licence</TableCell>
                  <TableCell align="right">Signed sheets</TableCell>
                  <TableCell align="right">Work recorded</TableCell>
                  <TableCell>Last activity</TableCell>
                  <TableCell align="right">Customers</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.rows.map((rigger) => (
                  <TableRow key={rigger.id} hover>
                    <TableCell>
                      <Link
                        component={RouterLink}
                        to={`/app/authority/riggers/${rigger.id}`}
                        underline="hover"
                        sx={{ fontWeight: 600 }}
                      >
                        {rigger.displayName}
                      </Link>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {rigger.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{rigger.phone ?? '—'}</TableCell>
                    <TableCell>{rigger.licence ?? '—'}</TableCell>
                    <TableCell align="right">{rigger.signedSheets}</TableCell>
                    <TableCell align="right">{rigger.workRecorded}</TableCell>
                    <TableCell>{rigger.lastActivityAt ? rigger.lastActivityAt.slice(0, 10) : '—'}</TableCell>
                    <TableCell align="right">{rigger.customers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {pages > 1 && <Pagination count={pages} page={page} onChange={(_, next) => setPage(next)} />}
      </Stack>
    </AppShell>
  );
}
