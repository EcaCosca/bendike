import { detectLocale } from './detect-locale';

describe('detectLocale', () => {
  test('prefers a stored locale over everything else', () => {
    expect(detectLocale({ stored: 'es', browserLanguages: ['pt-BR'] })).toBe('es');
  });

  test('ignores an invalid stored value and falls back to the browser language', () => {
    expect(detectLocale({ stored: 'fr', browserLanguages: ['pt-BR', 'en-US'] })).toBe('pt');
  });

  test('matches the primary subtag of a browser language', () => {
    expect(detectLocale({ stored: null, browserLanguages: ['es-AR'] })).toBe('es');
  });

  test('tries each browser language in order until one matches', () => {
    expect(detectLocale({ stored: null, browserLanguages: ['fr-FR', 'de-DE', 'pt-PT'] })).toBe('pt');
  });

  test('defaults to English when nothing matches', () => {
    expect(detectLocale({ stored: null, browserLanguages: ['fr-FR'] })).toBe('en');
  });

  test('defaults to English with no stored value and no browser languages', () => {
    expect(detectLocale({ stored: null, browserLanguages: [] })).toBe('en');
  });
});
