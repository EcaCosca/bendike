import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { GoogleSignInSection } from '../auth/GoogleSignInSection';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';

const PASSWORD_MIN_LENGTH = 8;

export function RegisterPage() {
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
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <Stack component="form" spacing={3} maxWidth={420} mx="auto" onSubmit={(event) => void handleSubmit(event)}>
        <Typography variant="h4" component="h1">
          Create an account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Every new account starts as a user. An admin can make you a rigger later.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoFocus
        />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          slotProps={{ htmlInput: { minLength: PASSWORD_MIN_LENGTH } }}
          helperText={`At least ${PASSWORD_MIN_LENGTH} characters`}
        />
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          Sign up
        </Button>
        <GoogleSignInSection onSignedIn={() => void navigate('/app', { replace: true })} onError={setError} />
        <Typography variant="body2">
          Already have an account? <RouterLink to="/login">Log in</RouterLink>
        </Typography>
      </Stack>
    </AppShell>
  );
}
