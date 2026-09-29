import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALES, normalizePhone, type Locale } from '@bendike/shared';
import { updateContact } from '../auth/auth-api';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';
import '../i18n/i18n';
import { storeLocale } from '../i18n/detect-locale';

const LANGUAGE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English', pt: 'Português' };

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, token, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [locale, setLocale] = useState<Locale>(user?.locale ?? 'es');
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
      setError(t('app.profile.nameRequired'));
      return;
    }
    if (!normalizePhone(phone).valid) {
      setError(t('app.profile.phoneInvalid'));
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const updated = await updateContact(token, {
        displayName: displayName.trim(),
        phone: phone.trim() || null,
        locale,
      });
      updateUser?.(updated);
      storeLocale(updated.locale);
      if (i18n.language !== updated.locale) {
        void i18n.changeLanguage(updated.locale);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('app.profile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <Stack component="form" spacing={3} maxWidth={480} onSubmit={(event) => void submit(event)}>
        <Typography variant="h4" component="h1">
          {t('app.profile.title')}
        </Typography>
        <Typography color="text.secondary">{t('app.profile.intro')}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {saved && <Alert severity="success">{t('app.profile.saved')}</Alert>}
        <Typography variant="body2">
          {t('app.profile.signedInAs')} <strong>{user.email}</strong>
        </Typography>
        <TextField
          label={t('app.profile.displayName')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <TextField
          label={t('app.profile.phone')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+54 9 341 555 0000"
          helperText={t('app.profile.phoneHint')}
        />
        <TextField
          select
          label={t('app.profile.language')}
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
        >
          {LOCALES.map((l) => (
            <MenuItem key={l} value={l}>
              {LANGUAGE_NAMES[l]}
            </MenuItem>
          ))}
        </TextField>
        <Button type="submit" variant="contained" size="large" disabled={saving}>
          {t('app.profile.save')}
        </Button>
      </Stack>
    </AppShell>
  );
}
