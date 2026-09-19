import { normalizePhone, whatsappDigits } from './phone';

describe('normalizePhone', () => {
  test.each([
    ['+54 9 341 555 0000', '+5493415550000'],
    ['+54 (9) 341-555.0000', '+5493415550000'],
    ['  +598 99 123 456 ', '+59899123456'],
    ['+1 (415) 555-2671', '+14155552671'],
  ])('%s becomes %s', (input, expected) => {
    expect(normalizePhone(input)).toEqual({ valid: true, phone: expected });
  });

  test.each(['', '   '])('blank %p means no phone', (input) => {
    expect(normalizePhone(input)).toEqual({ valid: true, phone: null });
  });

  test.each([
    '341 555 0000',
    '5493415550000',
    '+54',
    '+123',
    'call me',
    '+54 341 abc 0000',
    '+0 341 555 0000',
    '+' + '1'.repeat(16),
  ])('rejects %p: it needs a + and the country code, with 8 to 15 digits', (input) => {
    expect(normalizePhone(input)).toEqual({ valid: false });
  });
});

describe('whatsappDigits', () => {
  test('is the number without the plus, as wa.me wants it', () => {
    expect(whatsappDigits('+5493415550000')).toBe('5493415550000');
  });
});
