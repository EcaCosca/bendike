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
import type { CreateServiceRequestBody, PriceCurrency, ServiceCategory } from '@bendike/shared';
import { PRICE_CURRENCIES, SERVICE_CATEGORIES } from '@bendike/shared';
import { parsePriceInput, PRICE_MESSAGES } from './price-input';

interface ServiceCreateDialogProps {
  onClose: () => void;
  onCreate: (body: CreateServiceRequestBody) => Promise<void>;
}

export function ServiceCreateDialog({ onClose, onCreate }: ServiceCreateDialogProps) {
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
      setError(PRICE_MESSAGES[price]);
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
      setError(err instanceof Error ? err.message : 'Could not create the service');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>Add service</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Alert severity="info">
            Write it in English. Spanish and Portuguese are translated automatically, and you can edit them afterwards.
          </Alert>
          <TextField label="Slug (used in the URL)" value={slug} onChange={(e) => setSlug(e.target.value)} required />
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
          >
            {SERVICE_CATEGORIES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextField label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} required />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={4}
            required
          />
          <TextField
            label="Turnaround note (optional)"
            value={turnaround}
            onChange={(e) => setTurnaround(e.target.value)}
          />
          <Stack direction="row" spacing={2}>
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
              onChange={(e) => setCurrency(e.target.value as PriceCurrency | '')}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">No price (varies)</MenuItem>
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
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          Create service
        </Button>
      </DialogActions>
    </Dialog>
  );
}
