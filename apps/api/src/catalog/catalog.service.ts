import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CatalogQuery, Page, ProductDetail, ProductSummary } from '@bendike/shared';
import { isLocale } from '@bendike/shared';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { toProductDetail, toProductSummary } from './product-mapper';

const PRICE_IN_USD = `COALESCE(
  product.list_price_usd * (1 + product.markup_percent / 100),
  CASE product.price_currency
    WHEN 'USD' THEN product.price_amount
    WHEN 'ARS' THEN product.price_amount / NULLIF((SELECT er.usd_rate FROM exchange_rates er WHERE er.currency = 'ARS'), 0)
  END
)`;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  findBrands(): Promise<Brand[]> {
    return this.brands.find({ where: { active: true }, order: { name: 'ASC' } });
  }

  findCategories(): Promise<Category[]> {
    return this.categories.find({ order: { position: 'ASC' } });
  }

  private async resolveCategoryIds(categorySlug?: string): Promise<string[] | undefined> {
    if (!categorySlug) {
      return undefined;
    }
    const category = await this.categories.findOne({ where: { slug: categorySlug } });
    if (!category) {
      return [];
    }
    const children = await this.categories.find({ where: { parentId: category.id } });
    return [category.id, ...children.map((child) => child.id)];
  }

  private async resolveBrandId(brandSlug?: string): Promise<string | null | undefined> {
    if (!brandSlug) {
      return undefined;
    }
    const brand = await this.brands.findOne({ where: { slug: brandSlug } });
    return brand ? brand.id : null;
  }

  async findProducts(query: CatalogQuery): Promise<Page<ProductSummary>> {
    const page = query.page ?? DEFAULT_PAGE;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const locale = isLocale(query.locale) ? query.locale : 'en';

    const categoryIds = await this.resolveCategoryIds(query.categorySlug);
    if (categoryIds && categoryIds.length === 0) {
      return { items: [], page, pageSize, total: 0 };
    }

    const brandId = await this.resolveBrandId(query.brandSlug);
    if (brandId === null) {
      return { items: [], page, pageSize, total: 0 };
    }

    const qb = this.products
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.active = true');

    if (categoryIds) {
      qb.andWhere('product.category_id IN (:...categoryIds)', { categoryIds });
    }
    if (brandId) {
      qb.andWhere('product.brand_id = :brandId', { brandId });
    }
    if (query.availability === 'made-to-order') {
      qb.andWhere('product.made_to_order = true');
    } else if (query.availability === 'in-stock') {
      qb.andWhere('product.made_to_order = false');
    }
    if (query.condition) {
      qb.andWhere('product.condition = :condition', { condition: query.condition });
    }
    if (!query.includeSold) {
      qb.andWhere('product.sold_at IS NULL');
    }
    if (query.search) {
      qb.andWhere('(product.name ->> :locale ILIKE :term OR product.summary ->> :locale ILIKE :term)', {
        locale,
        term: `%${query.search}%`,
      });
    }

    if (query.sort === 'price-asc' || query.sort === 'price-desc') {
      qb.addSelect(PRICE_IN_USD, 'price_sort').orderBy(
        'price_sort',
        query.sort === 'price-asc' ? 'ASC' : 'DESC',
        'NULLS LAST',
      );
    } else {
      qb.addSelect(`product.name ->> '${locale}'`, 'name_sort').orderBy('name_sort', 'ASC');
    }

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    const items = rows.map((product) => toProductSummary(product, product.brand!));

    return { items, page, pageSize, total };
  }

  async findProductBySlug(slug: string): Promise<ProductDetail> {
    const product = await this.products.findOne({
      where: { slug, active: true },
      relations: { brand: true, images: true, variants: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${slug} not found`);
    }

    return toProductDetail(product, product.brand!);
  }
}
