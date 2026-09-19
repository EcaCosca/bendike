import {
  Alert,
  Box,
  Button,
  Chip,
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
import { useCallback, useEffect, useState } from 'react';
import type { Brand, Category, UsedItemAdminDetail } from '@bendike/shared';
import { formatMoney } from '@bendike/shared';
import { useAuth } from '../../auth/use-auth';
import { AppShell } from '../../components/AppShell';
import { listBrands, listCategories } from '../shop/catalog-api';
import { UsedItemCreateDialog } from './UsedItemCreateDialog';
import { UsedItemEditDialog } from './UsedItemEditDialog';
import { listUsedItems, updateUsedItem } from './used-gear-admin-api';

export function UsedGearAdminPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<UsedItemAdminDetail[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) {
      return;
    }
    setItems(await listUsedItems(token));
  }, [token]);

  useEffect(() => {
    reload().catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load used items'));
    listBrands()
      .then(setBrands)
      .catch(() => undefined);
    listCategories()
      .then(setCategories)
      .catch(() => undefined);
  }, [reload]);

  function replaceItem(updated: UsedItemAdminDetail) {
    setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function toggleSold(item: UsedItemAdminDetail) {
    if (!token) {
      return;
    }
    setError(null);
    try {
      replaceItem(await updateUsedItem(token, item.id, { sold: !item.sold }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the item');
    }
  }

  const editing = items.find((item) => item.id === editingId);

  return (
    <AppShell>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1">
            Used gear
          </Typography>
          <Button variant="contained" onClick={() => setCreating(true)}>
            Add used item
          </Button>
        </Stack>
        {error && <Alert severity="error">{error}</Alert>}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Used items">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Item</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sold</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ width: 64 }}>
                    {item.images[0] && (
                      <Box
                        component="img"
                        src={item.images[0].url}
                        alt=""
                        sx={{ height: 48, width: 48, objectFit: 'cover', borderRadius: 1, display: 'block' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.name.en}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.brand.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {item.priceAmount !== null && item.priceCurrency !== null
                      ? formatMoney(item.priceAmount, item.priceCurrency)
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {item.sold ? (
                      <Chip size="small" color="error" label="Sold" />
                    ) : item.active ? (
                      <Chip size="small" color="success" label="Listed" />
                    ) : (
                      <Chip size="small" label="Hidden" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.sold}
                      onChange={() => void toggleSold(item)}
                      slotProps={{ input: { 'aria-label': `Sold: ${item.name.en}` } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setEditingId(item.id)} aria-label={`Edit ${item.name.en}`}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
      {creating && token && (
        <UsedItemCreateDialog
          token={token}
          brands={brands}
          categories={categories}
          onClose={() => setCreating(false)}
          onCreated={(created, newBrand) => {
            if (newBrand) {
              setBrands((current) => [...current, newBrand]);
            }
            setItems((current) => [created, ...current]);
            reload().catch((err: unknown) =>
              setError(err instanceof Error ? err.message : 'Could not load used items'),
            );
          }}
        />
      )}
      {editing && token && (
        <UsedItemEditDialog
          key={editing.id}
          item={editing}
          token={token}
          brands={brands}
          categories={categories}
          onClose={() => setEditingId(null)}
          onChanged={reload}
        />
      )}
    </AppShell>
  );
}
