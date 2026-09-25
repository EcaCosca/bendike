import { clearConsent, writeConsent } from '../consent/consent-storage';
import { CURRENCY_KEY, readStoredCurrency, storeCurrency } from './currency-storage';

describe('currency storage', () => {
  beforeEach(() => {
    clearConsent();
    localStorage.clear();
  });
  afterEach(() => clearConsent());

  test('writes and reads the currency once preference storage is allowed', () => {
    writeConsent({ preferences: true, thirdParty: false });

    storeCurrency('BRL');

    expect(localStorage.getItem(CURRENCY_KEY)).toBe('BRL');
    expect(readStoredCurrency()).toBe('BRL');
  });

  test('writes nothing and reads nothing without preference consent', () => {
    storeCurrency('ARS');

    expect(localStorage.getItem(CURRENCY_KEY)).toBeNull();
    localStorage.setItem(CURRENCY_KEY, 'ARS');
    expect(readStoredCurrency()).toBeNull();
  });

  test('ignores a stored value that is not a display currency', () => {
    writeConsent({ preferences: true, thirdParty: false });
    localStorage.setItem(CURRENCY_KEY, 'EUR');

    expect(readStoredCurrency()).toBeNull();
  });

  test('withdrawing preference consent removes the stored currency', () => {
    writeConsent({ preferences: true, thirdParty: false });
    storeCurrency('USD');

    writeConsent({ preferences: false, thirdParty: false });

    expect(localStorage.getItem(CURRENCY_KEY)).toBeNull();
  });
});
