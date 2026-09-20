import { CookieBanner } from './CookieBanner';
import { CookieSettingsDialog } from './CookieSettingsDialog';

export function CookieConsent() {
  return (
    <>
      <CookieBanner />
      <CookieSettingsDialog />
    </>
  );
}
