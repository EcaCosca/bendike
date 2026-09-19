import { Divider, Stack } from '@mui/material';
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

  if (!clientId) {
    return null;
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
