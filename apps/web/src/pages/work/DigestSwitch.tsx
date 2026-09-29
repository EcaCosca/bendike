import { Alert, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../i18n/i18n';
import { getRiggerSettings, updateRiggerSettings } from './work-api';

export function DigestSwitch({ token }: { token: string }) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRiggerSettings(token)
      .then((settings) => setEnabled(settings.digestEnabled))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t('work.digest.loadFailed')));
  }, [token, t]);

  if (enabled === null) {
    return error ? <Alert severity="error">{error}</Alert> : null;
  }

  const change = (next: boolean) => {
    setError(null);
    updateRiggerSettings(token, { digestEnabled: next }).then(
      (saved) => setEnabled(saved.digestEnabled),
      (err: unknown) => setError(err instanceof Error ? err.message : t('work.digest.saveFailed')),
    );
  };

  return (
    <Stack spacing={0.5}>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(e) => change(e.target.checked)} />}
        label={t('work.digest.title')}
      />
      <Typography variant="caption" color="text.secondary">
        {t('work.digest.hint')}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
    </Stack>
  );
}
