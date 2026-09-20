import { Button, Divider, Stack, Typography } from '@mui/material';
import { useConsent } from '../consent/use-consent';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useGoogleClientId } from './google-client-id';
import { useAuth } from './use-auth';

interface GoogleSignInSectionProps {
  onSignedIn: () => void;
  onError: (message: string) => void;
}

export function GoogleSignInSection({ onSignedIn, onError }: GoogleSignInSectionProps) {
  const { loginWithGoogle } = useAuth();
  const clientId = useGoogleClientId();
  const { allows, choice, save } = useConsent();

  if (!clientId) {
    return null;
  }

  if (!allows('thirdParty')) {
    return (
      <Stack spacing={1.5}>
        <Divider>or</Divider>
        <Typography variant="body2" color="text.secondary">
          Google sign-in loads a script from Google, which may set cookies. It stays off until you allow third-party
          services.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => save({ preferences: choice?.preferences ?? false, thirdParty: true })}
        >
          Allow Google sign-in
        </Button>
      </Stack>
    );
  }

  const handleCredential = (idToken: string) => {
    loginWithGoogle(idToken).then(onSignedIn, (err: unknown) =>
      onError(err instanceof Error ? err.message : 'Google sign-in failed'),
    );
  };

  return (
    <Stack spacing={2}>
      <Divider>or</Divider>
      <GoogleSignInButton clientId={clientId} onCredential={handleCredential} onError={onError} />
    </Stack>
  );
}
