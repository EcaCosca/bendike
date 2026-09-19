import { Brand } from './entities/brand.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';
import { pickPrimaryImage, toProductDetail, toProductSummary } from './product-mapper';

function buildBrand(): Brand {
  return Object.assign(new Brand(), {
    id: 'brand-1',
    slug: 'squirrel',
    name: 'Squirrel',
    websiteUrl: 'https://squirrel.ws',
    active: true,
  });
}

function buildImage(overrides: Partial<ProductImage> = {}): ProductImage {
  return Object.assign(new ProductImage(), {
    id: 'image-1',
    url: 'https://cdn.example/freak6.jpg',
    alt: 'Freak 6',
    position: 0,
    ...overrides,
  });
}

function buildProduct(overrides: Partial<Product> = {}): Product {
  return Object.assign(new Product(), {
    id: 'product-1',
    slug: 'freak6',
    brandId: 'brand-1',
    categoryId: 'category-1',
    name: { en: 'Freak 6', es: 'Freak 6', pt: 'Freak 6' },
    summary: { en: 'A wingsuit', es: 'Un traje de alas', pt: 'Um wingsuit' },
    descriptionMd: { en: '# Freak 6', es: '# Freak 6', pt: '# Freak 6' },
    translationOverrides: {},
    listPriceUsd: '2090.00',
    markupPercent: '20.00',
    condition: 'new',
    priceAmount: null,
    priceCurrency: null,
    soldAt: null,
    madeToOrder: false,
    active: true,
    images: [],
    variants: [],
    ...overrides,
  });
}

describe('pickPrimaryImage', () => {
  test('returns null with no images', () => {
    expect(pickPrimaryImage([])).toBeNull();
  });

  test('returns the image with the lowest position', () => {
    const first = buildImage({ id: 'a', position: 2 });
    const second = buildImage({ id: 'b', position: 0 });

    expect(pickPrimaryImage([first, second])).toBe(second);
  });
});

describe('toProductSummary', () => {
  test('converts numeric-as-string columns to numbers', () => {
    const summary = toProductSummary(buildProduct(), buildBrand());

    expect(summary.listPriceUsd).toBe(2090);
    expect(summary.markupPercent).toBe(20);
  });

  test('a product with no price stays null', () => {
    const summary = toProductSummary(buildProduct({ listPriceUsd: null }), buildBrand());

    expect(summary.listPriceUsd).toBeNull();
  });

  test('picks the primary image', () => {
    const image = buildImage();
    const summary = toProductSummary(buildProduct({ images: [image] }), buildBrand());

    expect(summary.primaryImage).toEqual({ id: 'image-1', url: image.url, alt: 'Freak 6', position: 0 });
  });
});

describe('used gear fields', () => {
  test('a new product maps as new, unsold, with no direct price', () => {
    const summary = toProductSummary(buildProduct(), buildBrand());

    expect(summary).toMatchObject({ condition: 'new', priceAmount: null, priceCurrency: null, sold: false });
  });

  test('a used item maps its direct price as a number and its currency', () => {
    const summary = toProductSummary(
      buildProduct({ condition: 'used', listPriceUsd: null, priceAmount: '450000.00', priceCurrency: 'ARS' }),
      buildBrand(),
    );

    expect(summary).toMatchObject({ condition: 'used', listPriceUsd: null, priceAmount: 450000, priceCurrency: 'ARS' });
  });

  test('an item with a sold date is sold', () => {
    const summary = toProductSummary(
      buildProduct({ condition: 'used', soldAt: new Date('2026-09-19T12:00:00Z') }),
      buildBrand(),
    );

    expect(summary.sold).toBe(true);
  });
});

describe('toProductDetail', () => {
  test('includes description, images sorted by position and variants', () => {
    const variant = Object.assign(new ProductVariant(), {
      id: 'variant-1',
      sku: 'FREAK6-M',
      optionNames: ['Size'],
      optionValues: ['M'],
      listPriceUsd: null,
      active: true,
    });
    const product = buildProduct({
      images: [buildImage({ id: 'b', position: 1 }), buildImage({ id: 'a', position: 0 })],
      variants: [variant],
    });

    const detail = toProductDetail(product, buildBrand());

    expect(detail.descriptionMd).toEqual({ en: '# Freak 6', es: '# Freak 6', pt: '# Freak 6' });
    expect(detail.images.map((image) => image.id)).toEqual(['a', 'b']);
    expect(detail.variants).toEqual([
      {
        id: 'variant-1',
        sku: 'FREAK6-M',
        optionNames: ['Size'],
        optionValues: ['M'],
        listPriceUsd: null,
        active: true,
      },
    ]);
  });
});
