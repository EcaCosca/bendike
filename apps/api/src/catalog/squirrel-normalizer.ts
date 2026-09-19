export interface SquirrelVariant {
  name: string;
  price: string | null;
  sku: string;
  variantOption: string | null;
  variantValue: string | null;
  active: boolean;
}

interface SquirrelSliderImage {
  image: {
    asset: {
      gatsbyImageData: {
        images: {
          fallback: { src: string };
        };
      };
    };
  } | null;
}

interface SquirrelSection {
  _type: string;
  rightLayout?: Array<{ _type: string; subtitle?: string; content?: string }>;
  details?: Array<{ content?: string }>;
}

export interface SquirrelProduct {
  _id: string;
  name: string;
  productType: string;
  stockedCategory: string | null;
  mtoCategory: string | null;
  price: number;
  images: {
    slider: {
      imageSlider: SquirrelSliderImage[];
    };
  };
  variants: SquirrelVariant[];
  sections: SquirrelSection[];
}

export interface SquirrelPageData {
  result: {
    data: {
      product: SquirrelProduct;
    };
  };
}

export interface NormalizedVariant {
  sku: string;
  optionNames: string[];
  optionValues: string[];
  priceUsd: number | null;
}

export interface NormalizedSquirrelProduct {
  sourceRef: string;
  name: string;
  summary: string;
  descriptionMd: string;
  priceUsd: number;
  madeToOrder: boolean;
  categoryHint: string;
  images: string[];
  variants: NormalizedVariant[];
}

function splitOptionList(value: string): string[] {
  return value
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function normalizeSquirrelProduct(pageData: SquirrelPageData): NormalizedSquirrelProduct {
  const product = pageData.result.data.product;

  const header = product.sections.find((section) => section._type === 'sectionPDPHeader');
  const rightLayout = header?.rightLayout ?? [];
  const subtitleItem = rightLayout.find((item) => item._type === 'productSubtitle');
  const headerContentItem = rightLayout.find((item) => item._type === 'productContent');

  const detailParagraphs = product.sections
    .filter((section) => section._type === 'sectionProductDetail')
    .flatMap((section) => section.details ?? [])
    .map((detail) => detail.content)
    .filter((content): content is string => Boolean(content));

  const descriptionParts = [headerContentItem?.content, ...detailParagraphs].filter((part): part is string =>
    Boolean(part),
  );

  const images = product.images.slider.imageSlider
    .map((entry) => entry.image?.asset.gatsbyImageData.images.fallback.src)
    .filter((url): url is string => Boolean(url));

  const variants: NormalizedVariant[] = product.variants
    .filter((variant): variant is SquirrelVariant & { variantOption: string; variantValue: string } =>
      Boolean(variant.active && variant.variantOption && variant.variantValue),
    )
    .map((variant) => ({
      sku: variant.sku,
      optionNames: splitOptionList(variant.variantOption),
      optionValues: splitOptionList(variant.variantValue),
      priceUsd: variant.price ? Number(variant.price) : null,
    }));

  return {
    sourceRef: product._id,
    name: product.name,
    summary: subtitleItem?.subtitle ?? descriptionParts[0]?.slice(0, 160) ?? product.name,
    descriptionMd: descriptionParts.join('\n\n'),
    priceUsd: product.price,
    madeToOrder: product.productType === 'mto',
    categoryHint: product.mtoCategory ?? product.stockedCategory ?? 'uncategorized',
    images,
    variants,
  };
}
