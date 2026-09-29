import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { GoogleSignInSection } from '../auth/GoogleSignInSection';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';
import '../i18n/i18n';
import { usePublicLanguage } from '../i18n/use-public-language';

export function LoginPage() {
  const { t } = useTranslation();
  usePublicLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      void navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.login.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <Stack component="form" spacing={3} maxWidth={420} mx="auto" onSubmit={(event) => void handleSubmit(event)}>
        <Typography variant="h4" component="h1">
          {t('auth.login.title')}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label={t('auth.login.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <TextField
          label={t('auth.login.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          {t('auth.login.submit')}
        </Button>
        <GoogleSignInSection onSignedIn={() => void navigate(from, { replace: true })} onError={setError} />
        <Typography variant="body2">
          {t('auth.login.newHere')} <RouterLink to="/register">{t('auth.login.createAccount')}</RouterLink>
        </Typography>
      </Stack>
    </AppShell>
  );
}
