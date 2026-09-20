import { COUNTRY_CODES } from '@bendike/shared';
import { countryName, countryOptions } from './country-names';

describe('country names', () => {
  it('names a country in the language asked for', () => {
    expect(countryName('AR', 'en')).toBe('Argentina');
    expect(countryName('BR', 'es')).toBe('Brasil');
    expect(countryName('DE', 'pt')).toBe('Alemanha');
  });

  it('falls back to the code when the code is malformed', () => {
    expect(countryName('not-a-code', 'en')).toBe('not-a-code');
  });

  it('lists every country once, sorted by name in that language', () => {
    const options = countryOptions('es');
    expect(options).toHaveLength(COUNTRY_CODES.length);
    const names = options.map((option) => option.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')));
    expect(options.find((option) => option.code === 'AR')?.name).toBe('Argentina');
  });
});
