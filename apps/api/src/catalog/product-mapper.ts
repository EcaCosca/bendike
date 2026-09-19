import type { Brand as BrandContract, ProductDetail, ProductSummary } from '@bendike/shared';
import { Brand } from './entities/brand.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';

function toBrandContract(brand: Brand): BrandContract {
  return { id: brand.id, slug: brand.slug, name: brand.name, websiteUrl: brand.websiteUrl, active: brand.active };
}

export function pickPrimaryImage(images: ProductImage[]): ProductImage | null {
  if (images.length === 0) {
    return null;
  }
  return [...images].sort((a, b) => a.position - b.position)[0]!;
}

export function toProductSummary(product: Product, brand: Brand): ProductSummary {
  const primaryImage = pickPrimaryImage(product.images ?? []);

  return {
    id: product.id,
    slug: product.slug,
    brand: toBrandContract(brand),
    categoryId: product.categoryId,
    name: product.name,
    summary: product.summary,
    listPriceUsd: product.listPriceUsd === null ? null : Number(product.listPriceUsd),
    markupPercent: Number(product.markupPercent),
    condition: product.condition,
    priceAmount: product.priceAmount === null ? null : Number(product.priceAmount),
    priceCurrency: product.priceCurrency,
    sold: product.soldAt !== null,
    madeToOrder: product.madeToOrder,
    active: product.active,
    primaryImage: primaryImage
      ? { id: primaryImage.id, url: primaryImage.url, alt: primaryImage.alt, position: primaryImage.position }
      : null,
  };
}

export function toProductDetail(product: Product, brand: Brand): ProductDetail {
  const images = [...(product.images ?? [])].sort((a, b) => a.position - b.position);
  const variants: ProductVariant[] = product.variants ?? [];

  return {
    ...toProductSummary(product, brand),
    descriptionMd: product.descriptionMd,
    images: images.map((image) => ({ id: image.id, url: image.url, alt: image.alt, position: image.position })),
    variants: variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      optionNames: variant.optionNames,
      optionValues: variant.optionValues,
      listPriceUsd: variant.listPriceUsd === null ? null : Number(variant.listPriceUsd),
      active: variant.active,
    })),
  };
}
