import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { LOCALES, isCountryCode, normalizePhone, type CountryCode, type Locale } from '@bendike/shared';
import { updateContact } from '../auth/auth-api';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';
import { countryOptions } from '../i18n/country-names';

const LANGUAGE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English', pt: 'Português' };

export function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [locale, setLocale] = useState<Locale>(user?.locale ?? 'es');
  const [country, setCountry] = useState<CountryCode | ''>(user?.country ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user || !token) {
    return null;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    if (!displayName.trim()) {
      setError('Enter your name.');
      return;
    }
    if (!normalizePhone(phone).valid) {
      setError('Enter the phone with the country code, for example +54 9 341 555 0000.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await updateContact(token, {
        displayName: displayName.trim(),
        phone: phone.trim() || null,
        locale,
        country: country || null,
      });
      updateUser?.(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <Stack component="form" spacing={3} maxWidth={480} onSubmit={(event) => void submit(event)}>
        <Typography variant="h4" component="h1">
          Your details
        </Typography>
        <Typography color="text.secondary">
          Your rigger and your dropzone use your WhatsApp phone to reach you, in the language you choose here.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {saved && <Alert severity="success">Saved</Alert>}
        <Typography variant="body2">
          Signed in as <strong>{user.email}</strong>
        </Typography>
        <TextField label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <TextField
          label="WhatsApp phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+54 9 341 555 0000"
          helperText="With the country code"
        />
        <TextField select label="Language" value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
          {LOCALES.map((l) => (
            <MenuItem key={l} value={l}>
              {LANGUAGE_NAMES[l]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Country"
          value={country}
          onChange={(e) => setCountry(isCountryCode(e.target.value) ? e.target.value : '')}
          helperText="Where you live. An authority uses it to tell local jumpers from visitors."
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Not stated</MenuItem>
          {countryOptions(user.locale).map(({ code, name }) => (
            <MenuItem key={code} value={code}>
              {name}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" size="large" disabled={saving}>
          Save
        </Button>
      </Stack>
    </AppShell>
  );
}
