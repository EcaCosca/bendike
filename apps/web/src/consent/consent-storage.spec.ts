import { CURRENCY_KEY } from '../currency/currency-storage';
import { GEAR_VIEW_KEY } from '../pages/gear/gear-view';
import { LICENCE_KEY } from '../pages/packing/packing-draft';
import {
  ACCEPT_ALL,
  CONSENT_COOKIE,
  CONSENT_VERSION,
  PREFERENCE_STORAGE_KEYS,
  REJECT_ALL,
  clearConsent,
  isAllowed,
  readConsent,
  writeConsent,
} from './consent-storage';

function setRawCookie(value: unknown) {
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(typeof value === 'string' ? value : JSON.stringify(value))}; path=/`;
}

describe('consent storage', () => {
  beforeEach(() => {
    clearConsent();
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    clearConsent();
    localStorage.clear();
  });

  test('has no choice until one is made', () => {
    expect(readConsent()).toBeNull();
    expect(isAllowed('preferences')).toBe(false);
    expect(isAllowed('thirdParty')).toBe(false);
  });

  test('records a choice with its version and date, and reads it back', () => {
    const choice = writeConsent({ preferences: true, thirdParty: false }, new Date('2026-09-20T12:00:00.000Z'));

    expect(choice).toEqual({
      version: CONSENT_VERSION,
      preferences: true,
      thirdParty: false,
      decidedAt: '2026-09-20T12:00:00.000Z',
    });
    expect(readConsent()).toEqual(choice);
    expect(isAllowed('preferences')).toBe(true);
    expect(isAllowed('thirdParty')).toBe(false);
  });

  test('keeps the choice in a first-party cookie for twelve months', () => {
    const setter = jest.spyOn(document, 'cookie', 'set');

    writeConsent(ACCEPT_ALL);

    const written = setter.mock.calls[0]?.[0] as string;
    expect(written).toContain(`${CONSENT_COOKIE}=`);
    expect(written).toContain('max-age=31536000');
    expect(written).toContain('path=/');
    expect(written).toContain('SameSite=Lax');
  });

  test.each([
    ['garbage', 'not json'],
    [
      'a choice of another version',
      { version: CONSENT_VERSION - 1, preferences: true, thirdParty: true, decidedAt: 'x' },
    ],
    [
      'a choice with the wrong types',
      { version: CONSENT_VERSION, preferences: 'yes', thirdParty: true, decidedAt: 'x' },
    ],
  ])('ignores %s, so the visitor is asked again', (_name, value) => {
    setRawCookie(value);

    expect(readConsent()).toBeNull();
    expect(isAllowed('preferences')).toBe(false);
  });

  test('accept all and reject all are the two ends', () => {
    expect(ACCEPT_ALL).toEqual({ preferences: true, thirdParty: true });
    expect(REJECT_ALL).toEqual({ preferences: false, thirdParty: false });
  });

  test('withdrawing preferences deletes the remembered gear view and licence number, keeping the rest', () => {
    localStorage.setItem(GEAR_VIEW_KEY, 'cards');
    localStorage.setItem(LICENCE_KEY, 'AR-1');
    localStorage.setItem('bendike.locale', 'es');
    localStorage.setItem('bendike.token', 'jwt');

    writeConsent({ preferences: true, thirdParty: false });
    expect(localStorage.getItem(GEAR_VIEW_KEY)).toBe('cards');

    writeConsent(REJECT_ALL);

    expect(localStorage.getItem(GEAR_VIEW_KEY)).toBeNull();
    expect(localStorage.getItem(LICENCE_KEY)).toBeNull();
    expect(localStorage.getItem('bendike.locale')).toBe('es');
    expect(localStorage.getItem('bendike.token')).toBe('jwt');
  });

  test('the preference keys are exactly the ones the code uses', () => {
    expect([...PREFERENCE_STORAGE_KEYS].sort()).toEqual([GEAR_VIEW_KEY, LICENCE_KEY, CURRENCY_KEY].sort());
  });
});
