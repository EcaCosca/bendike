import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type ChangeEvent } from 'react';
import type { Brand, Category, Locale, PriceCurrency, UsedItemAdminDetail } from '@bendike/shared';
import { LOCALES, PRICE_CURRENCIES, pickLocalized } from '@bendike/shared';
import { parsePriceInput } from '../services/price-input';
import {
  deleteProductImage,
  updateUsedItem,
  updateUsedItemCopy,
  uploadProductImages,
  type UsedItemCopyField,
} from './used-gear-admin-api';

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';
const COPY_FIELDS: { field: UsedItemCopyField; label: string; multiline: boolean }[] = [
  { field: 'name', label: 'Name', multiline: false },
  { field: 'summary', label: 'Summary', multiline: true },
  { field: 'descriptionMd', label: 'Description', multiline: true },
];

type CopyValues = Record<Locale, Record<UsedItemCopyField, string>>;

function initialCopy(item: UsedItemAdminDetail): CopyValues {
  const values = {} as CopyValues;
  for (const locale of LOCALES) {
    values[locale] = {
      name: item.name[locale],
      summary: item.summary[locale],
      descriptionMd: item.descriptionMd[locale],
    };
  }
  return values;
}

interface UsedItemEditDialogProps {
  item: UsedItemAdminDetail;
  token: string;
  brands: Brand[];
  categories: Category[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}

export function UsedItemEditDialog({ item, token, brands, categories, onClose, onChanged }: UsedItemEditDialogProps) {
  const [amount, setAmount] = useState(item.priceAmount === null ? '' : String(item.priceAmount));
  const [currency, setCurrency] = useState<PriceCurrency | ''>(item.priceCurrency ?? '');
  const [brandId, setBrandId] = useState(item.brand.id);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [listed, setListed] = useState(item.active);
  const [locale, setLocale] = useState<Locale>('en');
  const [copy, setCopy] = useState<CopyValues>(() => initialCopy(item));
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);

  async function run(action: () => Promise<void>, success: string) {
    try {
      await action();
      await onChanged();
      setMessage({ severity: 'success', text: success });
    } catch (err) {
      setMessage({ severity: 'error', text: err instanceof Error ? err.message : 'Something went wrong' });
    }
  }

  async function saveDetails() {
    const price = parsePriceInput(amount, currency);
    if (price === 'incomplete' || price === 'invalid' || price.priceAmount === null || price.priceCurrency === null) {
      setMessage({ severity: 'error', text: 'Enter a price and choose a currency.' });
      return;
    }
    await run(async () => {
      await updateUsedItem(token, item.id, {
        priceAmount: price.priceAmount ?? undefined,
        priceCurrency: price.priceCurrency ?? undefined,
        brandId,
        categoryId,
        active: listed,
      });
    }, 'Details saved.');
  }

  async function saveCopy() {
    const original = initialCopy(item);
    await run(async () => {
      for (const targetLocale of LOCALES) {
        for (const { field } of COPY_FIELDS) {
          const value = copy[targetLocale][field];
          if (value !== original[targetLocale][field]) {
            await updateUsedItemCopy(token, item.id, { field, locale: targetLocale, value });
          }
        }
      }
    }, 'Copy saved.');
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    await run(async () => {
      await uploadProductImages(token, item.id, files);
    }, 'Photos added.');
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit: {item.name.en}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {message && <Alert severity={message.severity}>{message.text}</Alert>}

          <Typography variant="subtitle1" component="h3">
            Price and details
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Price amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Currency"
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Brand"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              sx={{ flex: 1 }}
            >
              {brands.map((brand) => (
                <MenuItem key={brand.id} value={brand.id}>
                  {brand.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              sx={{ flex: 1 }}
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {pickLocalized(category.name, 'en')}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <FormControlLabel
            control={<Switch checked={listed} onChange={(e) => setListed(e.target.checked)} />}
            label="Listed in the shop"
          />
          <Button variant="outlined" onClick={() => void saveDetails()} sx={{ alignSelf: 'flex-start' }}>
            Save details
          </Button>

          <Divider />

          <Typography variant="subtitle1" component="h3">
            Photos
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
            {item.images.map((image, index) => (
              <Box key={image.id} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={image.url}
                  alt={`Photo ${index + 1}`}
                  sx={{ height: 88, width: 88, objectFit: 'cover', borderRadius: 1, display: 'block' }}
                />
                <IconButton
                  size="small"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => void run(() => deleteProductImage(token, image.id), 'Photo removed.')}
                  sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper' }}
                >
                  ✕
                </IconButton>
              </Box>
            ))}
          </Stack>
          <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            Add photos
            <input
              type="file"
              hidden
              multiple
              accept={IMAGE_TYPES}
              aria-label="Add photos"
              onChange={(event) => void addPhotos(event)}
            />
          </Button>

          <Divider />

          <Typography variant="subtitle1" component="h3">
            Copy
          </Typography>
          <Tabs value={locale} onChange={(_event, value: Locale) => setLocale(value)} aria-label="Language">
            {LOCALES.map((option) => (
              <Tab key={option} value={option} label={option.toUpperCase()} />
            ))}
          </Tabs>
          <Stack spacing={2}>
            {COPY_FIELDS.map(({ field, label, multiline }) => (
              <TextField
                key={`${locale}-${field}`}
                label={label}
                value={copy[locale][field]}
                multiline={multiline}
                minRows={field === 'descriptionMd' ? 6 : undefined}
                onChange={(e) =>
                  setCopy((current) => ({ ...current, [locale]: { ...current[locale], [field]: e.target.value } }))
                }
              />
            ))}
          </Stack>
          <Button variant="outlined" onClick={() => void saveCopy()} sx={{ alignSelf: 'flex-start' }}>
            Save copy
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
