import { Button, Divider, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useConsent } from '../consent/use-consent';
import '../i18n/i18n';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useGoogleClientId } from './google-client-id';
import { useAuth } from './use-auth';

interface GoogleSignInSectionProps {
  onSignedIn: () => void;
  onError: (message: string) => void;
}

export function GoogleSignInSection({ onSignedIn, onError }: GoogleSignInSectionProps) {
  const { t } = useTranslation();
  const { loginWithGoogle } = useAuth();
  const clientId = useGoogleClientId();
  const { allows, choice, save } = useConsent();

  if (!clientId) {
    return null;
  }

  if (!allows('thirdParty')) {
    return (
      <Stack spacing={1.5}>
        <Divider>{t('auth.google.or')}</Divider>
        <Typography variant="body2" color="text.secondary">
          {t('auth.google.notice')}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => save({ preferences: choice?.preferences ?? false, thirdParty: true })}
        >
          {t('auth.google.allow')}
        </Button>
      </Stack>
    );
  }

  const handleCredential = (idToken: string) => {
    loginWithGoogle(idToken).then(onSignedIn, (err: unknown) =>
      onError(err instanceof Error ? err.message : t('auth.google.failed')),
    );
  };

  return (
    <Stack spacing={2}>
      <Divider>{t('auth.google.or')}</Divider>
      <GoogleSignInButton clientId={clientId} onCredential={handleCredential} onError={onError} />
    </Stack>
  );
}
