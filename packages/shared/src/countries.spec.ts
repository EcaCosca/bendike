import { COUNTRY_CODES, isCountryCode } from './countries';

describe('countries', () => {
  it('lists the ISO 3166-1 alpha-2 codes once each, in capitals', () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
    expect(COUNTRY_CODES.length).toBeGreaterThanOrEqual(249);
    for (const code of COUNTRY_CODES) {
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it('includes the countries Bendike serves today', () => {
    for (const code of ['AR', 'BR', 'UY', 'CL', 'PY', 'US', 'ES']) {
      expect(isCountryCode(code)).toBe(true);
    }
  });

  it('accepts only exact capital codes', () => {
    expect(isCountryCode('ar')).toBe(false);
    expect(isCountryCode('ARG')).toBe(false);
    expect(isCountryCode('XX')).toBe(false);
    expect(isCountryCode('')).toBe(false);
    expect(isCountryCode(null)).toBe(false);
    expect(isCountryCode(54)).toBe(false);
  });
});
