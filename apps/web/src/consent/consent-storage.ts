export const CONSENT_COOKIE = 'bendike_consent';
export const CONSENT_VERSION = 1;
const MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

export type ConsentCategory = 'preferences' | 'thirdParty';

export interface ConsentSelection {
  preferences: boolean;
  thirdParty: boolean;
}

export interface ConsentChoice extends ConsentSelection {
  version: number;
  decidedAt: string;
}

export const ACCEPT_ALL: ConsentSelection = { preferences: true, thirdParty: true };
export const REJECT_ALL: ConsentSelection = { preferences: false, thirdParty: false };

export const PREFERENCE_STORAGE_KEYS = ['bendike.gear.view', 'bendike.riggerLicence', 'bendike.currency'] as const;

function cookieValue(): string | null {
  const prefix = `${CONSENT_COOKIE}=`;
  const found = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}

export function readConsent(): ConsentChoice | null {
  const raw = cookieValue();
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentChoice>;
    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.preferences !== 'boolean' ||
      typeof parsed.thirdParty !== 'boolean' ||
      typeof parsed.decidedAt !== 'string'
    ) {
      return null;
    }
    return parsed as ConsentChoice;
  } catch {
    return null;
  }
}

export function isAllowed(category: ConsentCategory): boolean {
  return readConsent()?.[category] === true;
}

function clearPreferenceStorage(): void {
  try {
    for (const key of PREFERENCE_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    return;
  }
}

export function writeConsent(selection: ConsentSelection, now: Date = new Date()): ConsentChoice {
  const choice: ConsentChoice = {
    version: CONSENT_VERSION,
    preferences: selection.preferences,
    thirdParty: selection.thirdParty,
    decidedAt: now.toISOString(),
  };
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(choice))}; max-age=${MAX_AGE_SECONDS}; path=/; SameSite=Lax${secure}`;
  if (!choice.preferences) {
    clearPreferenceStorage();
  }
  return choice;
}

export function clearConsent(): void {
  document.cookie = `${CONSENT_COOKIE}=; max-age=0; path=/`;
}
