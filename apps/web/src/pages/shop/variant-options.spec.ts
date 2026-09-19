import type { ProductVariant } from '@bendike/shared';
import { findVariant, optionNames, selectValue, valuesFor } from './variant-options';

function variant(id: string, optionValues: string[], overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id,
    sku: id,
    optionNames: ['size', 'color'],
    optionValues,
    listPriceUsd: null,
    active: true,
    ...overrides,
  };
}

const variants = [
  variant('m-red', ['M', 'red']),
  variant('m-blue', ['M', 'blue']),
  variant('l-red', ['L', 'red']),
  variant('l-off', ['L', 'green'], { active: false }),
];

describe('variant options', () => {
  test('optionNames come from the first variant', () => {
    expect(optionNames(variants)).toEqual(['size', 'color']);
    expect(optionNames([])).toEqual([]);
  });

  test('valuesFor the first option lists distinct active values in order', () => {
    expect(valuesFor(variants, [], 0)).toEqual(['M', 'L']);
  });

  test('valuesFor a later option only offers values that exist for the earlier choices', () => {
    expect(valuesFor(variants, ['M'], 1)).toEqual(['red', 'blue']);
    expect(valuesFor(variants, ['L'], 1)).toEqual(['red']);
  });

  test('selectValue sets a value and clears every later choice', () => {
    expect(selectValue(['M', 'red'], 0, 'L')).toEqual(['L']);
    expect(selectValue(['M'], 1, 'blue')).toEqual(['M', 'blue']);
  });

  test('findVariant returns the variant once every option is chosen', () => {
    expect(findVariant(variants, ['size', 'color'], ['M', 'blue'])?.id).toBe('m-blue');
  });

  test('findVariant is undefined until every option is chosen', () => {
    expect(findVariant(variants, ['size', 'color'], ['M'])).toBeUndefined();
  });

  test('findVariant ignores inactive variants', () => {
    expect(findVariant(variants, ['size', 'color'], ['L', 'green'])).toBeUndefined();
  });
});
