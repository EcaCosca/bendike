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
import { AUTHORITY_PAGE_SIZE, type AuthorityPage, type AuthorityRigRow, type RigResidence } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { countryName } from '../../i18n/country-names';
import { getRigs } from './authority-api';

export function AuthorityRigsPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState<AuthorityPage<AuthorityRigRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [residence, setResidence] = useState<RigResidence>('all');
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
    getRigs(token, { ...(search ? { search } : {}), ...(residence === 'all' ? {} : { residence }), page }).then(
      (result) => {
        if (current) {
          setError(null);
          setData(result);
        }
      },
      (err: unknown) => {
        if (current) setError(err instanceof Error ? err.message : 'Could not load the rigs');
      },
    );
    return () => {
      current = false;
    };
  }, [token, search, residence, page]);

  if (!user) return null;

  const ownCountry = user.country;
  const pages = data ? Math.ceil(data.total / AUTHORITY_PAGE_SIZE) : 0;
  const localLabel = ownCountry ? `Local (${countryName(ownCountry, user.locale)})` : 'Local';

  return (
    <AppShell wide>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Packed rigs
          </Typography>
          <Typography color="text.secondary">
            Every rig one of the riggers has packed and signed. Open one to read its latest packing sheet.
            {data ? ` ${data.total} in total.` : ''}
          </Typography>
        </Stack>
        {!ownCountry && (
          <Alert severity="info">
            To keep only the rigs of jumpers who live in your country, your account needs one.{' '}
            <Link component={RouterLink} to="/app/profile">
              Set your country in your details
            </Link>
          </Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search"
            placeholder="Rig, owner, reserve serial or rigger"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            size="small"
            sx={{ minWidth: 220, flexGrow: 1 }}
          />
          <TextField
            select
            label="Where the owner lives"
            value={residence}
            onChange={(e) => {
              setResidence(e.target.value as RigResidence);
              setPage(1);
            }}
            size="small"
            sx={{ minWidth: 240 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="local" disabled={!ownCountry}>
              {localLabel}
            </MenuItem>
            <MenuItem value="abroad" disabled={!ownCountry}>
              Abroad
            </MenuItem>
            <MenuItem value="unknown">Not stated</MenuItem>
          </TextField>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        {data?.rows.length === 0 && <Typography color="text.secondary">No packed rigs match.</Typography>}
        {data && data.rows.length > 0 && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Packed rigs">
              <TableHead>
                <TableRow>
                  <TableCell>Rig</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Reserve</TableCell>
                  <TableCell>Last packed</TableCell>
                  <TableCell>Packed by</TableCell>
                  <TableCell align="right">Signed sheets</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.rigId} hover>
                    <TableCell>
                      <Link
                        component={RouterLink}
                        to={`/app/gear/${row.rigId}/packing/${row.latestSheetId}/print`}
                        underline="hover"
                        sx={{ fontWeight: 600 }}
                      >
                        {row.rigName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.ownerName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.ownerCountry ? countryName(row.ownerCountry, user.locale) : 'Not stated'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.reserve}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.reserveSerial ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.lastPackedOn}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.riggerName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.riggerLicence ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{row.sheets}</TableCell>
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
