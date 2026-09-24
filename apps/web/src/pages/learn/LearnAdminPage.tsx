import {
  Alert,
  Button,
  Chip,
  Link,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type {
  Brand,
  CreateLearnItemRequestBody,
  GearModelView,
  LearnCollectionSummary,
  LearnItemAdminDetail,
  ProductSummary,
} from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { listModels } from '../gear/gear-api';
import { listBrands, listProducts } from '../shop/catalog-api';
import { createLearnItem, listAllLearnCollections, listAllLearnItems, updateLearnItem } from './learn-admin-api';
import { LearnCollectionsPanel } from './LearnCollectionsPanel';
import { TOPIC_LABELS } from './learn-labels';
import { LearnItemCreateDialog, LearnItemEditDialog, LearnLinksDialog } from './LearnItemDialogs';

export function LearnAdminPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<LearnItemAdminDetail[]>([]);
  const [collections, setCollections] = useState<LearnCollectionSummary[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<GearModelView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listAllLearnItems(token)
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the items'));
    listAllLearnCollections(token)
      .then(setCollections)
      .catch(() => setCollections([]));
    listProducts({ pageSize: 48, includeSold: true })
      .then((page) => setProducts(page.items))
      .catch(() => setProducts([]));
    listBrands()
      .then(setBrands)
      .catch(() => setBrands([]));
    listModels(token, true)
      .then(setModels)
      .catch(() => setModels([]));
  }, [token]);

  function replaceItem(updated: LearnItemAdminDetail) {
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  function replaceCollection(saved: LearnCollectionSummary) {
    setCollections((current) =>
      current.some((collection) => collection.id === saved.id)
        ? current.map((collection) => (collection.id === saved.id ? saved : collection))
        : [...current, saved],
    );
  }

  async function toggleActive(item: LearnItemAdminDetail) {
    if (!token) return;
    setError(null);
    try {
      replaceItem(await updateLearnItem(token, item.id, { active: !item.active }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the item');
    }
  }

  async function handleCreate(body: CreateLearnItemRequestBody) {
    if (!token) return;
    const created = await createLearnItem(token, body);
    setItems((current) => [...current, created]);
  }

  if (!token) return null;
  const editing = items.find((item) => item.id === editingId);
  const linking = items.find((item) => item.id === linkingId);

  return (
    <AppShell wide>
      <Stack spacing={4}>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1">
              Learn
            </Typography>
            <Button variant="contained" onClick={() => setCreating(true)}>
              Add item
            </Button>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label="Learn items">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Topics</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell>Links</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Link href={item.url} target="_blank" rel="noopener noreferrer" underline="hover">
                        {item.title.en}
                      </Link>
                      {item.buyUrl && (
                        <Chip size="small" label={item.affiliate ? 'affiliate' : 'buy link'} sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{item.format}</TableCell>
                    <TableCell>{item.topics.map((topic) => TOPIC_LABELS[topic]).join(', ')}</TableCell>
                    <TableCell>{item.sourceName}</TableCell>
                    <TableCell>{item.embed ? item.embed.provider : ''}</TableCell>
                    <TableCell>{item.links.length}</TableCell>
                    <TableCell>
                      <Switch
                        checked={item.active}
                        onChange={() => void toggleActive(item)}
                        slotProps={{ input: { 'aria-label': `Active: ${item.title.en}` } }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Button size="small" onClick={() => setLinkingId(item.id)} aria-label={`Links ${item.title.en}`}>
                        Links
                      </Button>
                      <Button size="small" onClick={() => setEditingId(item.id)} aria-label={`Edit ${item.title.en}`}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
        <LearnCollectionsPanel
          token={token}
          items={items}
          collections={collections}
          onChanged={replaceCollection}
          onError={setError}
        />
      </Stack>
      {creating && <LearnItemCreateDialog onClose={() => setCreating(false)} onCreate={handleCreate} />}
      {editing && (
        <LearnItemEditDialog item={editing} token={token} onClose={() => setEditingId(null)} onSaved={replaceItem} />
      )}
      {linking && (
        <LearnLinksDialog
          item={linking}
          token={token}
          products={products}
          brands={brands}
          models={models}
          onClose={() => setLinkingId(null)}
          onSaved={replaceItem}
        />
      )}
    </AppShell>
  );
}
