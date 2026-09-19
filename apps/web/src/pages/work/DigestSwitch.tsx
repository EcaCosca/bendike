import { Alert, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { getRiggerSettings, updateRiggerSettings } from './work-api';

export function DigestSwitch({ token }: { token: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRiggerSettings(token)
      .then((settings) => setEnabled(settings.digestEnabled))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load your settings'));
  }, [token]);

  if (enabled === null) {
    return error ? <Alert severity="error">{error}</Alert> : null;
  }

  const change = (next: boolean) => {
    setError(null);
    updateRiggerSettings(token, { digestEnabled: next }).then(
      (saved) => setEnabled(saved.digestEnabled),
      (err: unknown) => setError(err instanceof Error ? err.message : 'Could not save'),
    );
  };

  return (
    <Stack spacing={0.5}>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(e) => change(e.target.checked)} />}
        label="Daily digest email"
      />
      <Typography variant="caption" color="text.secondary">
        One email a day, only when something needs you, with each customer&apos;s contact and a WhatsApp link.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
