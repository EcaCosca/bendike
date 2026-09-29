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
import { useTranslation } from 'react-i18next';
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
import '../../i18n/i18n';
import { AddDocumentDialog } from './AddDocumentDialog';
import { ArchiveDocumentDialog } from './ArchiveDocumentDialog';
import { downloadDocument, listDocuments } from './library-api';
import { KIND_LABEL_KEYS, formatBytes } from './library-labels';

const SEARCH_DELAY_MS = 300;
const HEADERS = ['title', 'kind', 'manufacturer', 'model', 'revision', 'language', 'size', 'added', 'by'] as const;

export function LibraryPage() {
  const { t } = useTranslation();
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
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : t('library.list.loadFailed')));
  }, [reload, t]);

  async function download(document: LibraryDocumentView) {
    if (!token) return;
    try {
      await downloadDocument(token, document);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('library.list.downloadFailed'));
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
              {t('library.list.title')}
            </Typography>
            <Typography color="text.secondary">{t('library.list.intro')}</Typography>
          </Box>
          <Button variant="contained" onClick={() => setAdding(true)}>
            {t('library.list.addDocument')}
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label={t('library.list.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
          />
          <TextField
            select
            label={t('library.list.kind')}
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as LibraryDocumentKind | '');
              setPage(1);
            }}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">{t('library.list.anyKind')}</MenuItem>
            {LIBRARY_DOCUMENT_KINDS.map((k) => (
              <MenuItem key={k} value={k}>
                {t(KIND_LABEL_KEYS[k])}
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
              label={t('library.list.showArchived')}
            />
          )}
        </Stack>

        {data && data.documents.length === 0 && (
          <Typography color="text.secondary">
            {query || kind ? t('library.list.noMatch') : t('library.list.empty')}
          </Typography>
        )}

        {data && data.documents.length > 0 && (
          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" aria-label={t('library.list.table')}>
              <TableHead>
                <TableRow>
                  {HEADERS.map((header) => (
                    <TableCell key={header} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {t(`library.list.header.${header}`)}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} />
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
                          {t('library.list.archived', { reason: doc.archiveReason ?? '' })}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{t(KIND_LABEL_KEYS[doc.kind])}</TableCell>
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
                          {t('library.list.download')}
                        </Button>
                        {doc.sourceUrl && (
                          <Link href={doc.sourceUrl} target="_blank" rel="noopener noreferrer" variant="body2">
                            {t('library.list.source')}
                          </Link>
                        )}
                        {isAdmin && !doc.archivedAt && (
                          <Button size="small" color="error" onClick={() => setArchiving(doc)}>
                            {t('library.list.archive')}
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
              {t('library.list.count', { count: data.total })}
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
