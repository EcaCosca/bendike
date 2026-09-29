import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { GoogleSignInSection } from '../auth/GoogleSignInSection';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';
import '../i18n/i18n';
import { usePublicLanguage } from '../i18n/use-public-language';

const PASSWORD_MIN_LENGTH = 8;

export function RegisterPage() {
  const { t } = useTranslation();
  usePublicLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({ displayName, email, password });
      void navigate('/app', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.register.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <Stack component="form" spacing={3} maxWidth={420} mx="auto" onSubmit={(event) => void handleSubmit(event)}>
        <Typography variant="h4" component="h1">
          {t('auth.register.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('auth.register.intro')}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label={t('auth.register.displayName')}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoFocus
        />
        <TextField
          label={t('auth.register.email')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label={t('auth.register.password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          slotProps={{ htmlInput: { minLength: PASSWORD_MIN_LENGTH } }}
          helperText={t('auth.register.passwordHint', { min: PASSWORD_MIN_LENGTH })}
        />
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          {t('auth.register.submit')}
        </Button>
        <GoogleSignInSection onSignedIn={() => void navigate('/app', { replace: true })} onError={setError} />
        <Typography variant="body2">
          {t('auth.register.haveAccount')} <RouterLink to="/login">{t('auth.register.login')}</RouterLink>
        </Typography>
      </Stack>
    </AppShell>
  );
}
