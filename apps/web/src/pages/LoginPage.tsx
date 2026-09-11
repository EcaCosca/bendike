import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/use-auth';
import { AppShell } from '../components/AppShell';

export function LoginPage() {
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
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <Stack component="form" spacing={3} maxWidth={420} mx="auto" onSubmit={(event) => void handleSubmit(event)}>
        <Typography variant="h4" component="h1">
          Log in
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          Log in
        </Button>
        <Typography variant="body2">
          New here? <RouterLink to="/register">Create an account</RouterLink>
        </Typography>
      </Stack>
    </AppShell>
  );
}
