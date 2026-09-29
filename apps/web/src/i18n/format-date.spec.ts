import { formatDate, formatMonth, intlLocale } from './format-date';

describe('formatDate', () => {
  test('formats a date-only string on the day it names, in the language asked for', () => {
    expect(formatDate('2026-09-20', 'en')).toBe('20 Sept 2026');
    expect(formatDate('2026-09-20', 'es')).toBe('20 de sept de 2026');
    expect(formatDate('2026-09-20', 'pt')).toBe('20 de set. de 2026');
  });

  test('formats a timestamp and accepts region-tagged languages', () => {
    expect(formatDate('2026-09-20T15:00:00.000Z', 'es-AR', { year: 'numeric', month: 'long', timeZone: 'UTC' })).toBe(
      'septiembre de 2026',
    );
    expect(formatDate(new Date(Date.UTC(2026, 0, 5)), 'en', { year: 'numeric', month: 'short', timeZone: 'UTC' })).toBe(
      'Jan 2026',
    );
  });

  test('returns nothing for a value that is not a date', () => {
    expect(formatDate('not a date', 'en')).toBe('');
  });
});

describe('formatMonth', () => {
  test('names the month and year in the language, in UTC', () => {
    expect(formatMonth('2026-09-01T00:00:00.000Z', 'en')).toBe('September 2026');
    expect(formatMonth('2026-09-01', 'pt')).toBe('setembro de 2026');
  });
});

describe('intlLocale', () => {
  test('maps the three site languages and falls back to British English', () => {
    expect(intlLocale('es')).toBe('es-AR');
    expect(intlLocale('pt-BR')).toBe('pt-BR');
    expect(intlLocale('fr')).toBe('en-GB');
  });
});
