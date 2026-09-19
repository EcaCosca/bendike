import freak6PageData from './fixtures/squirrel-freak6-page-data.json';
import type { SquirrelPageData } from './squirrel-normalizer';
import { normalizeSquirrelProduct } from './squirrel-normalizer';

describe('normalizeSquirrelProduct', () => {
  const normalized = normalizeSquirrelProduct(freak6PageData as never);

  test('reads the source reference from the Sanity document id', () => {
    expect(normalized.sourceRef).toBe('1cbf92c8-b59a-4ff8-a647-dfa912abb5ea');
  });

  test('reads the English name', () => {
    expect(normalized.name).toBe('Freak 6');
  });

  test('reads the USD price', () => {
    expect(normalized.priceUsd).toBe(2090);
  });

  test('a made-to-order product is flagged made to order', () => {
    expect(normalized.madeToOrder).toBe(true);
  });

  test('reads the category hint from mtoCategory', () => {
    expect(normalized.categoryHint).toBe('wingsuit');
  });

  test('picks the subtitle as the summary', () => {
    expect(normalized.summary).toBe('LESS DRAG = MORE POWER');
  });

  test('joins the header bullet content and detail sections into markdown', () => {
    expect(normalized.descriptionMd).toContain('Dragless arm inlets');
    expect(normalized.descriptionMd).toContain('Performance freestyle agility');
    expect(normalized.descriptionMd).toContain('benchmark for all-around performance');
  });

  test('extracts every slider image URL', () => {
    expect(normalized.images.length).toBe(24);
    expect(normalized.images[0]).toMatch(/^https:\/\/cdn\.sanity\.io\//);
  });

  test('splits each variant into option names and values', () => {
    const sized = normalized.variants.find((variant) => variant.sku === 'SQ-FREAK6-CUSTOM-REGULAR_ARM-M');
    expect(sized).toEqual({
      sku: 'SQ-FREAK6-CUSTOM-REGULAR_ARM-M',
      optionNames: ['size', 'arm-length', 'color'],
      optionValues: ['M', 'regular', 'custom'],
      priceUsd: 2090,
    });
  });

  test('excludes inactive variants', () => {
    expect(normalized.variants.every((variant) => variant !== null)).toBe(true);
  });
});

describe('normalizeSquirrelProduct against a junk placeholder variant', () => {
  test('skips a variant with null variantOption/variantValue (seen on Low-Ki 2: SQ-LOWKI2-PROTO)', () => {
    const pageData: SquirrelPageData = {
      result: {
        data: {
          product: {
            _id: 'test-id',
            name: 'Test Suit',
            productType: 'mto',
            stockedCategory: null,
            mtoCategory: 'wingsuit',
            price: 1000,
            images: { slider: { imageSlider: [] } },
            sections: [],
            variants: [
              {
                name: 'PROTO',
                price: null,
                sku: 'SQ-TEST-PROTO',
                variantOption: null,
                variantValue: null,
                active: true,
              },
              {
                name: 'M',
                price: '1000',
                sku: 'SQ-TEST-M',
                variantOption: 'size',
                variantValue: 'M',
                active: true,
              },
            ],
          },
        },
      },
    };

    const normalized = normalizeSquirrelProduct(pageData);

    expect(normalized.variants).toEqual([
      { sku: 'SQ-TEST-M', optionNames: ['size'], optionValues: ['M'], priceUsd: 1000 },
    ]);
  });
});
