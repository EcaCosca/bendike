import { isLocale, LOCALES, pickLocalized } from './locale';

describe('locale', () => {
  test('exposes exactly the three Bendike locales in order', () => {
    expect(LOCALES).toEqual(['en', 'es', 'pt']);
  });

  describe('isLocale', () => {
    test.each(LOCALES)('accepts "%s"', (locale) => {
      expect(isLocale(locale)).toBe(true);
    });

    test.each(['fr', 'EN', '', 42, null, undefined])('rejects %p', (value) => {
      expect(isLocale(value)).toBe(false);
    });
  });

  describe('pickLocalized', () => {
    const text = { en: 'Wingsuits', es: 'Trajes de alas', pt: 'Trajes de asa' };

    test.each([
      ['en', 'Wingsuits'],
      ['es', 'Trajes de alas'],
      ['pt', 'Trajes de asa'],
    ] as const)('returns the %s text', (locale, expected) => {
      expect(pickLocalized(text, locale)).toBe(expected);
    });

    test('falls back to English when the requested locale is blank', () => {
      expect(pickLocalized({ en: 'Freak 6', es: '', pt: '' }, 'es')).toBe('Freak 6');
    });
  });
});
