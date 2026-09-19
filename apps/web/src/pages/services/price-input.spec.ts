import { parsePriceInput } from './price-input';

describe('parsePriceInput', () => {
  test.each([
    ['55000', 55000],
    ['55.000', 55000],
    ['1.250.000', 1250000],
    ['55.000,50', 55000.5],
    ['12,5', 12.5],
    ['12.5', 12.5],
    ['  90000  ', 90000],
  ])('reads "%s" as %d', (text, expected) => {
    expect(parsePriceInput(text, 'ARS')).toEqual({ priceAmount: expected, priceCurrency: 'ARS' });
  });

  test('empty amount and no currency means the price varies', () => {
    expect(parsePriceInput('', '')).toEqual({ priceAmount: null, priceCurrency: null });
  });

  test('an amount without a currency is incomplete', () => {
    expect(parsePriceInput('100', '')).toBe('incomplete');
  });

  test('a currency without an amount is incomplete', () => {
    expect(parsePriceInput('', 'USD')).toBe('incomplete');
  });

  test.each(['abc', '12..5', '-5', '1,2,3'])('rejects "%s"', (text) => {
    expect(parsePriceInput(text, 'ARS')).toBe('invalid');
  });
});
