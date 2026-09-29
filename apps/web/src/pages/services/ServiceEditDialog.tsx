import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale, PriceCurrency, ServiceAdminDetail, ServiceCategory, ServiceCopyField } from '@bendike/shared';
import { LOCALES, PRICE_CURRENCIES, SERVICE_CATEGORIES } from '@bendike/shared';
import '../../i18n/i18n';
import { parsePriceInput, PRICE_MESSAGE_KEYS } from './price-input';
import { updateService, updateServiceCopy } from './services-admin-api';

interface ServiceEditDialogProps {
  service: ServiceAdminDetail;
  token: string;
  onClose: () => void;
  onSaved: (updated: ServiceAdminDetail) => void;
}

const COPY_FIELDS: { field: ServiceCopyField; labelKey: string; multiline: boolean }[] = [
  { field: 'name', labelKey: 'admin.common.name', multiline: false },
  { field: 'summary', labelKey: 'admin.common.summary', multiline: true },
  { field: 'descriptionMd', labelKey: 'admin.common.description', multiline: true },
  { field: 'turnaroundNote', labelKey: 'admin.services.turnaroundNote', multiline: false },
];

type CopyValues = Record<Locale, Record<ServiceCopyField, string>>;

function initialCopy(service: ServiceAdminDetail): CopyValues {
  const values = {} as CopyValues;
  for (const locale of LOCALES) {
    values[locale] = {
      name: service.name[locale],
      summary: service.summary[locale],
      descriptionMd: service.descriptionMd[locale],
      turnaroundNote: service.turnaroundNote?.[locale] ?? '',
    };
  }
  return values;
}

export function ServiceEditDialog({ service, token, onClose, onSaved }: ServiceEditDialogProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(service.priceAmount === null ? '' : String(service.priceAmount));
  const [currency, setCurrency] = useState<PriceCurrency | ''>(service.priceCurrency ?? '');
  const [category, setCategory] = useState<ServiceCategory>(service.category);
  const [position, setPosition] = useState(String(service.position));
  const [locale, setLocale] = useState<Locale>('en');
  const [copy, setCopy] = useState<CopyValues>(() => initialCopy(service));
  const [saved, setSaved] = useState<ServiceAdminDetail>(service);
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);

  async function saveDetails() {
    const price = parsePriceInput(amount, currency);
    if (price === 'incomplete' || price === 'invalid') {
      setMessage({ severity: 'error', text: t(PRICE_MESSAGE_KEYS[price]) });
      return;
    }
    try {
      const updated = await updateService(token, service.id, {
        ...price,
        category,
        position: Number.parseInt(position, 10) || 0,
      });
      setSaved(updated);
      onSaved(updated);
      setMessage({ severity: 'success', text: t('admin.common.detailsSaved') });
    } catch (err) {
      setMessage({ severity: 'error', text: err instanceof Error ? err.message : t('admin.common.saveFailed') });
    }
  }

  async function saveCopy() {
    const original = initialCopy(saved);
    let latest = saved;
    try {
      for (const targetLocale of LOCALES) {
        for (const { field } of COPY_FIELDS) {
          const value = copy[targetLocale][field];
          if (value !== original[targetLocale][field]) {
            latest = await updateServiceCopy(token, service.id, { field, locale: targetLocale, value });
          }
        }
      }
      setSaved(latest);
      setCopy(initialCopy(latest));
      onSaved(latest);
      setMessage({ severity: 'success', text: t('admin.common.copySaved') });
    } catch (err) {
      setMessage({ severity: 'error', text: err instanceof Error ? err.message : t('admin.common.saveFailed') });
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t('admin.common.editTitle', { name: service.name.en })}</DialogTitle>
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
              onChange={(e) => setCurrency(e.target.value as PriceCurrency | '')}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">{t('admin.services.noPrice')}</MenuItem>
              {PRICE_CURRENCIES.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label={t('admin.common.category')}
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              sx={{ flex: 1 }}
            >
              {SERVICE_CATEGORIES.map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`admin.services.category.${option}`)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('admin.common.position')}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              sx={{ width: 110 }}
            />
          </Stack>
          <Button variant="outlined" onClick={() => void saveDetails()} sx={{ alignSelf: 'flex-start' }}>
            {t('admin.common.saveDetails')}
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
