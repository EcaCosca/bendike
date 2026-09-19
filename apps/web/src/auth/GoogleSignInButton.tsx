import { Box } from '@mui/material';
import { useEffect, useRef } from 'react';
import { loadGoogleIdentity } from './google-identity';

interface GoogleSignInButtonProps {
  clientId: string;
  onCredential: (idToken: string) => void;
  onError: (message: string) => void;
}

export function GoogleSignInButton({ clientId, onCredential, onError }: GoogleSignInButtonProps) {
  const container = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onCredential, onError });
  handlers.current = { onCredential, onError };

  useEffect(() => {
    let cancelled = false;
    loadGoogleIdentity()
      .then((id) => {
        if (cancelled || !container.current) {
          return;
        }
        id.initialize({
          client_id: clientId,
          callback: (response) => handlers.current.onCredential(response.credential),
        });
        id.renderButton(container.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          handlers.current.onError(err instanceof Error ? err.message : 'Could not load Google sign-in');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return <Box ref={container} sx={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />;
}
