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
import { useTranslation } from 'react-i18next';
import type { Brand, Category, Locale, PriceCurrency, UsedItemAdminDetail } from '@bendike/shared';
import { LOCALES, PRICE_CURRENCIES, pickLocalized } from '@bendike/shared';
import '../../i18n/i18n';
import { parsePriceInput } from '../services/price-input';
import {
  deleteProductImage,
  updateUsedItem,
  updateUsedItemCopy,
  uploadProductImages,
  type UsedItemCopyField,
} from './used-gear-admin-api';

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp';
const COPY_FIELDS: { field: UsedItemCopyField; labelKey: string; multiline: boolean }[] = [
  { field: 'name', labelKey: 'admin.common.name', multiline: false },
  { field: 'summary', labelKey: 'admin.common.summary', multiline: true },
  { field: 'descriptionMd', labelKey: 'admin.common.description', multiline: true },
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
  const { t } = useTranslation();
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
      setMessage({ severity: 'error', text: err instanceof Error ? err.message : t('admin.common.somethingWrong') });
    }
  }

  async function saveDetails() {
    const price = parsePriceInput(amount, currency);
    if (price === 'incomplete' || price === 'invalid' || price.priceAmount === null || price.priceCurrency === null) {
      setMessage({ severity: 'error', text: t('admin.usedGear.create.priceIncomplete') });
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
    }, t('admin.common.detailsSaved'));
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
    }, t('admin.common.copySaved'));
  }

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    await run(async () => {
      await uploadProductImages(token, item.id, files);
    }, t('admin.usedGear.edit.photosAdded'));
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t('admin.common.editTitle', { name: item.name.en })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {message && <Alert severity={message.severity}>{message.text}</Alert>}

          <Typography variant="subtitle1" component="h3">
            {t('admin.common.priceAndDetails')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label={t('admin.common.brand')}
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
              label={t('admin.common.category')}
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
            label={t('admin.usedGear.edit.listed')}
          />
          <Button variant="outlined" onClick={() => void saveDetails()} sx={{ alignSelf: 'flex-start' }}>
            {t('admin.common.saveDetails')}
          </Button>

          <Divider />

          <Typography variant="subtitle1" component="h3">
            {t('admin.usedGear.edit.photos')}
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', rowGap: 1.5 }}>
            {item.images.map((image, index) => (
              <Box key={image.id} sx={{ position: 'relative' }}>
                <Box
                  component="img"
                  src={image.url}
                  alt={t('admin.usedGear.edit.photo', { n: index + 1 })}
                  sx={{ height: 88, width: 88, objectFit: 'cover', borderRadius: 1, display: 'block' }}
                />
                <IconButton
                  size="small"
                  aria-label={t('admin.usedGear.edit.removePhoto', { n: index + 1 })}
                  onClick={() =>
                    void run(() => deleteProductImage(token, image.id), t('admin.usedGear.edit.photoRemoved'))
                  }
                  sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'background.paper' }}
                >
                  ✕
                </IconButton>
              </Box>
            ))}
          </Stack>
          <Button component="label" variant="outlined" sx={{ alignSelf: 'flex-start' }}>
            {t('admin.usedGear.edit.addPhotos')}
            <input
              type="file"
              hidden
              multiple
              accept={IMAGE_TYPES}
              aria-label={t('admin.usedGear.edit.addPhotos')}
              onChange={(event) => void addPhotos(event)}
            />
          </Button>

          <Divider />

          <Typography variant="subtitle1" component="h3">
            {t('admin.common.copy')}
          </Typography>
          <Tabs
            value={locale}
            onChange={(_event, value: Locale) => setLocale(value)}
            aria-label={t('admin.common.copyLanguage')}
          >
            {LOCALES.map((option) => (
              <Tab key={option} value={option} label={option.toUpperCase()} />
            ))}
          </Tabs>
          <Stack spacing={2}>
            {COPY_FIELDS.map(({ field, labelKey, multiline }) => (
              <TextField
                key={`${locale}-${field}`}
                label={t(labelKey)}
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
            {t('admin.common.saveCopy')}
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('admin.common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
