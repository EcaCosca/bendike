import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Link,
  MenuItem,
  Pagination,
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
import {
  LIBRARY_DOCUMENT_KINDS,
  LIBRARY_PAGE_SIZE,
  Role,
  type LibraryDocumentKind,
  type LibraryListResponse,
  type LibraryDocumentView,
} from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { AddDocumentDialog } from './AddDocumentDialog';
import { ArchiveDocumentDialog } from './ArchiveDocumentDialog';
import { downloadDocument, listDocuments } from './library-api';
import { KIND_LABELS, formatBytes } from './library-labels';

const SEARCH_DELAY_MS = 300;

export function LibraryPage() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === Role.Admin;
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<LibraryDocumentKind | ''>('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LibraryListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [archiving, setArchiving] = useState<LibraryDocumentView | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const reload = useCallback(async () => {
    if (!token) return;
    setData(
      await listDocuments(token, {
        ...(kind ? { kind } : {}),
        search: query,
        includeArchived,
        page,
      }),
    );
  }, [token, kind, query, includeArchived, page]);

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the Library'));
  }, [reload]);

  async function download(document: LibraryDocumentView) {
    if (!token) return;
    try {
      await downloadDocument(token, document);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download the document');
    }
  }

  if (!token) return null;
  const pages = data ? Math.max(1, Math.ceil(data.total / LIBRARY_PAGE_SIZE)) : 1;

  return (
    <AppShell wide>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Box>
            <Typography variant="h4" component="h1">
              Library
            </Typography>
            <Typography color="text.secondary">Manuals and bulletins kept by Bendike, for riggers.</Typography>
          </Box>
          <Button variant="contained" onClick={() => setAdding(true)}>
            Add document
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            label="Kind"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as LibraryDocumentKind | '');
              setPage(1);
            }}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Any kind</MenuItem>
            {LIBRARY_DOCUMENT_KINDS.map((k) => (
              <MenuItem key={k} value={k}>
                {KIND_LABELS[k]}
              </MenuItem>
            ))}
          </TextField>
          {isAdmin && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeArchived}
                  onChange={(e) => {
                    setIncludeArchived(e.target.checked);
                    setPage(1);
                  }}
                />
              }
              label="Show archived"
            />
          )}
        </Stack>

        {data && data.documents.length === 0 && (
          <Typography color="text.secondary">
            {query || kind
              ? 'No documents match these filters.'
              : 'The Library is empty. Add the first manual with "Add document".'}
          </Typography>
        )}

        {data && data.documents.length > 0 && (
          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" aria-label="Library documents">
              <TableHead>
                <TableRow>
                  {['Title', 'Kind', 'Manufacturer', 'Model', 'Revision', 'Language', 'Size', 'Added', 'By', ''].map(
                    (header, index) => (
                      <TableCell key={`${header}-${index}`} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {header}
                      </TableCell>
                    ),
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.documents.map((doc) => (
                  <TableRow key={doc.id} hover sx={doc.archivedAt ? { opacity: 0.6 } : undefined}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {doc.title}
                      </Typography>
                      {doc.archivedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Archived: {doc.archiveReason}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{KIND_LABELS[doc.kind]}</TableCell>
                    <TableCell>{doc.manufacturer}</TableCell>
                    <TableCell>{doc.modelName ?? '—'}</TableCell>
                    <TableCell>{doc.revision ?? '—'}</TableCell>
                    <TableCell>{doc.language ?? '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatBytes(doc.sizeBytes)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{doc.createdAt.slice(0, 10)}</TableCell>
                    <TableCell>{doc.addedByName}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Button size="small" onClick={() => void download(doc)}>
                          Download
                        </Button>
                        {doc.sourceUrl && (
                          <Link href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" variant="body2">
                            Source
                          </Link>
                        )}
                        {isAdmin && !doc.archivedAt && (
                          <Button size="small" color="error" onClick={() => setArchiving(doc)}>
                            Archive
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {data && (
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ flexWrap: 'wrap', rowGap: 1 }}
          >
            <Typography variant="body2" color="text.secondary">
              {data.total} {data.total === 1 ? 'document' : 'documents'}
            </Typography>
            {pages > 1 && <Pagination count={pages} page={page} onChange={(_, next) => setPage(next)} />}
          </Stack>
        )}
      </Stack>
      {adding && <AddDocumentDialog token={token} onClose={() => setAdding(false)} onSaved={() => void reload()} />}
      {archiving && (
        <ArchiveDocumentDialog
          token={token}
          document={archiving}
          onClose={() => setArchiving(null)}
          onSaved={() => void reload()}
        />
      )}
    </AppShell>
  );
}
