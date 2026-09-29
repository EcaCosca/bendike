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
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { CreateServiceRequestBody, PriceCurrency, ServiceCategory } from '@bendike/shared';
import { PRICE_CURRENCIES, SERVICE_CATEGORIES } from '@bendike/shared';
import '../../i18n/i18n';
import { parsePriceInput, PRICE_MESSAGE_KEYS } from './price-input';

interface ServiceCreateDialogProps {
  onClose: () => void;
  onCreate: (body: CreateServiceRequestBody) => Promise<void>;
}

export function ServiceCreateDialog({ onClose, onCreate }: ServiceCreateDialogProps) {
  const { t } = useTranslation();
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('other');
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [turnaround, setTurnaround] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<PriceCurrency | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const price = parsePriceInput(amount, currency);
    if (price === 'incomplete' || price === 'invalid') {
      setError(t(PRICE_MESSAGE_KEYS[price]));
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onCreate({
        slug: slug.trim(),
        category,
        name: name.trim(),
        summary: summary.trim(),
        descriptionMd: description.trim(),
        ...(turnaround.trim() ? { turnaroundNote: turnaround.trim() } : {}),
        priceAmount: price.priceAmount,
        priceCurrency: price.priceCurrency,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.services.createFailed'));
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{t('admin.services.add')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Alert severity="info">{t('admin.common.writeInEnglish')}</Alert>
          <TextField label={t('admin.services.slug')} value={slug} onChange={(e) => setSlug(e.target.value)} required />
          <TextField
            select
            label={t('admin.common.category')}
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
          >
            {SERVICE_CATEGORIES.map((option) => (
              <MenuItem key={option} value={option}>
                {t(`admin.services.category.${option}`)}
              </MenuItem>
            ))}
          </TextField>
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
            label={t('admin.services.turnaroundOptional')}
            value={turnaround}
            onChange={(e) => setTurnaround(e.target.value)}
          />
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
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('admin.common.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {t('admin.services.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
