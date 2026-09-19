import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { LocalizedText, UsedItemAdminDetail } from '@bendike/shared';
import { slugify } from '@bendike/shared';
import { Repository } from 'typeorm';
import { TranslationService } from '../translation/translation.service';
import { CreateUsedItemDto } from './dto/create-used-item.dto';
import { UpdateUsedItemDto } from './dto/update-used-item.dto';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { toProductDetail } from './product-mapper';

const RELATIONS = { brand: true, images: true, variants: true } as const;
const MAX_SLUG_ATTEMPTS = 100;

function toAdminDetail(product: Product): UsedItemAdminDetail {
  return {
    ...toProductDetail(product, product.brand!),
    translationOverrides: product.translationOverrides,
    soldAt: product.soldAt ? product.soldAt.toISOString() : null,
  };
}

@Injectable()
export class UsedItemsAdminService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    private readonly translation: TranslationService,
  ) {}

  async findAll(): Promise<UsedItemAdminDetail[]> {
    const rows = await this.products.find({
      where: { condition: 'used' },
      relations: RELATIONS,
      order: { createdAt: 'DESC' },
    });
    return rows.map(toAdminDetail);
  }

  async create(dto: CreateUsedItemDto): Promise<UsedItemAdminDetail> {
    const brand = await this.requireBrand(dto.brandId);
    await this.requireCategory(dto.categoryId);

    const copy = await this.translation.translateProductCopy(
      { name: dto.name, summary: dto.summary, descriptionMd: dto.descriptionMd },
      {},
    );
    const localized = (english: string, field: keyof typeof copy): LocalizedText => ({
      en: english,
      es: copy[field].es ?? english,
      pt: copy[field].pt ?? english,
    });

    const product = await this.products.save(
      this.products.create({
        slug: await this.uniqueSlug(dto.name),
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        name: localized(dto.name, 'name'),
        summary: localized(dto.summary, 'summary'),
        descriptionMd: localized(dto.descriptionMd, 'descriptionMd'),
        translationOverrides: {},
        listPriceUsd: null,
        markupPercent: '0',
        condition: 'used',
        priceAmount: String(dto.priceAmount),
        priceCurrency: dto.priceCurrency,
        soldAt: null,
        madeToOrder: false,
        source: 'manual',
        active: true,
        images: [],
        variants: [],
      }),
    );
    product.brand = brand;

    return toAdminDetail(product);
  }

  async update(id: string, dto: UpdateUsedItemDto): Promise<UsedItemAdminDetail> {
    const product = await this.products.findOne({ where: { id, condition: 'used' }, relations: RELATIONS });
    if (!product) {
      throw new NotFoundException(`Used item ${id} not found`);
    }

    if (dto.brandId !== undefined) {
      product.brand = await this.requireBrand(dto.brandId);
      product.brandId = dto.brandId;
    }
    if (dto.categoryId !== undefined) {
      await this.requireCategory(dto.categoryId);
      product.categoryId = dto.categoryId;
    }
    if (dto.priceAmount !== undefined || dto.priceCurrency !== undefined) {
      if (dto.priceAmount === undefined || dto.priceCurrency === undefined) {
        throw new BadRequestException('A price needs both an amount and a currency');
      }
      product.priceAmount = String(dto.priceAmount);
      product.priceCurrency = dto.priceCurrency;
    }
    if (dto.active !== undefined) {
      product.active = dto.active;
    }
    if (dto.sold === true) {
      product.soldAt ??= new Date();
    } else if (dto.sold === false) {
      product.soldAt = null;
    }

    return toAdminDetail(await this.products.save(product));
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name) || 'used-item';
    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
      const candidate = attempt === 1 ? base : `${base}-${attempt}`;
      if (!(await this.products.findOne({ where: { slug: candidate } }))) {
        return candidate;
      }
    }
    throw new BadRequestException('Could not derive a unique slug from that name');
  }

  private async requireBrand(id: string): Promise<Brand> {
    const brand = await this.brands.findOne({ where: { id } });
    if (!brand) {
      throw new BadRequestException(`Brand ${id} does not exist`);
    }
    return brand;
  }

  private async requireCategory(id: string): Promise<Category> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) {
      throw new BadRequestException(`Category ${id} does not exist`);
    }
    return category;
  }
}
