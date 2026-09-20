import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './auth/auth-context';
import { GoogleClientIdContext } from './auth/google-client-id';
import { ConsentProvider } from './consent/ConsentProvider';
import { CookieConsent } from './consent/CookieConsent';
import { theme } from './theme/theme';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element in index.html');
}

const googleClientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined;

createRoot(container).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <GoogleClientIdContext.Provider value={googleClientId}>
          <ConsentProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
            <CookieConsent />
          </ConsentProvider>
        </GoogleClientIdContext.Provider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
);
