import { ACCEPT_ALL, REJECT_ALL, clearConsent, writeConsent } from '../../consent/consent-storage';
import { LICENCE_KEY, readLicence, saveLicence } from './packing-draft';

describe('remembered licence number', () => {
  beforeEach(() => {
    clearConsent();
    localStorage.clear();
  });
  afterEach(() => clearConsent());

  test('is remembered when preferences are allowed', () => {
    writeConsent(ACCEPT_ALL);

    saveLicence('AR-1234');

    expect(localStorage.getItem(LICENCE_KEY)).toBe('AR-1234');
    expect(readLicence()).toBe('AR-1234');
  });

  test('is neither written nor read when preferences are not allowed', () => {
    saveLicence('AR-1234');
    expect(localStorage.getItem(LICENCE_KEY)).toBeNull();

    localStorage.setItem(LICENCE_KEY, 'AR-9999');
    expect(readLicence()).toBe('');

    writeConsent(REJECT_ALL);
    expect(readLicence()).toBe('');
  });
});
