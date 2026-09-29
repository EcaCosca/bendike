import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Brand, Category, CreateUsedItemRequestBody, PriceCurrency, UsedItemAdminDetail } from '@bendike/shared';
import { PRICE_CURRENCIES, pickLocalized, slugify } from '@bendike/shared';
import '../../i18n/i18n';
import { parsePriceInput } from '../services/price-input';
import { createBrand, createUsedItem, uploadProductImages } from './used-gear-admin-api';

const NEW_BRAND = '__new__';
const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';

interface UsedItemCreateDialogProps {
  token: string;
  brands: Brand[];
  categories: Category[];
  onClose: () => void;
  onCreated: (item: UsedItemAdminDetail, newBrand?: Brand) => void;
}

export function UsedItemCreateDialog({ token, brands, categories, onClose, onCreated }: UsedItemCreateDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [newBrandName, setNewBrandName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<PriceCurrency | ''>('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    setPhotos(Array.from(event.target.files ?? []));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const price = parsePriceInput(amount, currency);
    if (price === 'invalid') {
      setError(t('admin.usedGear.create.amountInvalid'));
      return;
    }
    if (price === 'incomplete' || price.priceAmount === null || price.priceCurrency === null) {
      setError(t('admin.usedGear.create.priceIncomplete'));
      return;
    }
    if (!brandId || (brandId === NEW_BRAND && !newBrandName.trim())) {
      setError(t('admin.usedGear.create.chooseBrand'));
      return;
    }
    if (!categoryId) {
      setError(t('admin.usedGear.create.chooseCategory'));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      let resolvedBrandId = brandId;
      let createdBrand: Brand | undefined;
      if (brandId === NEW_BRAND) {
        const slug = slugify(newBrandName);
        createdBrand = brands.find((brand) => brand.slug === slug);
        if (!createdBrand) {
          createdBrand = await createBrand(token, { slug, name: newBrandName.trim() });
          resolvedBrandId = createdBrand.id;
        } else {
          resolvedBrandId = createdBrand.id;
          createdBrand = undefined;
        }
      }

      const body: CreateUsedItemRequestBody = {
        name: name.trim(),
        summary: summary.trim(),
        descriptionMd: description.trim(),
        brandId: resolvedBrandId,
        categoryId,
        priceAmount: price.priceAmount,
        priceCurrency: price.priceCurrency,
      };
      const created = await createUsedItem(token, body);
      if (photos.length > 0) {
        await uploadProductImages(token, created.id, photos);
      }
      onCreated(created, createdBrand);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.usedGear.create.createFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{t('admin.usedGear.add')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Alert severity="info">{t('admin.usedGear.create.intro')}</Alert>
          <TextField label={t('admin.common.name')} value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField
            label={t('admin.common.summary')}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
          <TextField
            label={t('admin.common.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={4}
            required
          />
          <TextField
            select
            label={t('admin.common.brand')}
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            {brands.map((brand) => (
              <MenuItem key={brand.id} value={brand.id}>
                {brand.name}
              </MenuItem>
            ))}
            <MenuItem value={NEW_BRAND}>{t('admin.usedGear.create.newBrand')}</MenuItem>
          </TextField>
          {brandId === NEW_BRAND && (
            <TextField
              label={t('admin.usedGear.create.newBrandName')}
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
            />
          )}
          <TextField
            select
            label={t('admin.common.category')}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {pickLocalized(category.name, 'en')}
              </MenuItem>
            ))}
          </TextField>
          <Stack direction="row" spacing={2}>
            <TextField
              label={t('admin.common.priceAmount')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label={t('admin.common.currency')}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as PriceCurrency)}
              sx={{ flex: 1 }}
            >
              {PRICE_CURRENCIES.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Stack spacing={1}>
            <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
              {t('admin.usedGear.create.choosePhotos')}
              <input
                type="file"
                hidden
                multiple
                accept={IMAGE_TYPES}
                aria-label={t('admin.usedGear.create.photos')}
                onChange={choosePhotos}
              />
            </Button>
            {photos.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {photos.map((photo) => photo.name).join(', ')}
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('admin.common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('admin.usedGear.create.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
