import { isAllowed } from '../consent/consent-storage';

export const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

export interface GoogleCredentialResponse {
  credential: string;
}

export interface GoogleAccountsId {
  initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, string | number>) => void;
}

interface GoogleWindow {
  google?: { accounts?: { id?: GoogleAccountsId } };
}

function loadedAccountsId(): GoogleAccountsId | undefined {
  return (window as unknown as GoogleWindow).google?.accounts?.id;
}

export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (!isAllowed('thirdParty')) {
    return Promise.reject(new Error('Google sign-in needs your permission to load'));
  }
  const ready = loadedAccountsId();
  if (ready) {
    return Promise.resolve(ready);
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_URL}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => {
      const id = loadedAccountsId();
      if (id) {
        resolve(id);
      } else {
        reject(new Error('Google sign-in is unavailable'));
      }
    });
    script.addEventListener('error', () => {
      script.remove();
      reject(new Error('Could not load Google sign-in'));
    });
    if (!existing) {
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}
