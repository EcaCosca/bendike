import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { TranslationOverrides } from '@bendike/shared';
import { Repository } from 'typeorm';
import { ImageStorageService } from '../uploads/image-storage.service';
import { detectImageType, MAX_IMAGE_BYTES } from '../uploads/image-type';
import type { UploadedImage } from '../uploads/uploaded-image';
import { CreateBrandDto } from './dto/create-brand.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateImageDto } from './dto/create-image.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateProductCopyDto } from './dto/update-product-copy.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';

@Injectable()
export class CatalogAdminService {
  constructor(
    @InjectRepository(Brand) private readonly brands: Repository<Brand>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variants: Repository<ProductVariant>,
    @InjectRepository(ProductImage) private readonly images: Repository<ProductImage>,
    private readonly storage: ImageStorageService,
  ) {}

  createBrand(dto: CreateBrandDto): Promise<Brand> {
    return this.brands.save(this.brands.create({ ...dto, websiteUrl: dto.websiteUrl ?? '', active: true }));
  }

  async updateBrand(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findBrandOrThrow(id);
    Object.assign(brand, dto);
    return this.brands.save(brand);
  }

  createCategory(dto: CreateCategoryDto): Promise<Category> {
    return this.categories.save(
      this.categories.create({
        slug: dto.slug,
        name: dto.name,
        parentId: dto.parentId ?? null,
        position: dto.position ?? 0,
      }),
    );
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findCategoryOrThrow(id);
    if (dto.name !== undefined) {
      category.name = dto.name;
    }
    if (dto.parentId !== undefined) {
      category.parentId = dto.parentId;
    }
    if (dto.position !== undefined) {
      category.position = dto.position;
    }
    return this.categories.save(category);
  }

  createProduct(dto: CreateProductDto): Promise<Product> {
    return this.products.save(
      this.products.create({
        slug: dto.slug,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        name: dto.name,
        summary: dto.summary,
        descriptionMd: dto.descriptionMd,
        listPriceUsd: dto.listPriceUsd != null ? String(dto.listPriceUsd) : null,
        markupPercent: dto.markupPercent != null ? String(dto.markupPercent) : '20',
        madeToOrder: dto.madeToOrder ?? false,
        sourceUrl: dto.sourceUrl ?? null,
        manualUrl: dto.manualUrl ?? null,
        source: 'manual',
        active: false,
      }),
    );
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findProductOrThrow(id);

    if (dto.brandId !== undefined) {
      product.brandId = dto.brandId;
    }
    if (dto.categoryId !== undefined) {
      product.categoryId = dto.categoryId;
    }
    if (dto.listPriceUsd !== undefined) {
      product.listPriceUsd = String(dto.listPriceUsd);
    }
    if (dto.markupPercent !== undefined) {
      product.markupPercent = String(dto.markupPercent);
    }
    if (dto.madeToOrder !== undefined) {
      product.madeToOrder = dto.madeToOrder;
    }
    if (dto.sourceUrl !== undefined) {
      product.sourceUrl = dto.sourceUrl;
    }
    if (dto.manualUrl !== undefined) {
      product.manualUrl = dto.manualUrl;
    }
    if (dto.active !== undefined) {
      if (dto.active && product.listPriceUsd === null) {
        throw new BadRequestException('Cannot activate a product without a USD list price');
      }
      product.active = dto.active;
    }

    return this.products.save(product);
  }

  async updateProductCopy(id: string, dto: UpdateProductCopyDto): Promise<Product> {
    const product = await this.findProductOrThrow(id);

    product[dto.field] = { ...product[dto.field], [dto.locale]: dto.value };

    const overrides: TranslationOverrides = { ...product.translationOverrides };
    const localeFields = new Set(overrides[dto.locale] ?? []);
    localeFields.add(dto.field);
    overrides[dto.locale] = [...localeFields];
    product.translationOverrides = overrides;

    return this.products.save(product);
  }

  async createVariant(productId: string, dto: CreateVariantDto): Promise<ProductVariant> {
    await this.findProductOrThrow(productId);
    return this.variants.save(
      this.variants.create({
        productId,
        sku: dto.sku,
        optionNames: dto.optionNames,
        optionValues: dto.optionValues,
        listPriceUsd: dto.listPriceUsd != null ? String(dto.listPriceUsd) : null,
        active: true,
      }),
    );
  }

  async updateVariant(id: string, dto: UpdateVariantDto): Promise<ProductVariant> {
    const variant = await this.variants.findOne({ where: { id } });
    if (!variant) {
      throw new NotFoundException(`Variant ${id} not found`);
    }
    if (dto.listPriceUsd !== undefined) {
      variant.listPriceUsd = String(dto.listPriceUsd);
    }
    if (dto.active !== undefined) {
      variant.active = dto.active;
    }
    return this.variants.save(variant);
  }

  async createImage(productId: string, dto: CreateImageDto): Promise<ProductImage> {
    await this.findProductOrThrow(productId);
    return this.images.save(
      this.images.create({ productId, url: dto.url, alt: dto.alt ?? '', position: dto.position ?? 0 }),
    );
  }

  async uploadImages(productId: string, files: UploadedImage[]): Promise<ProductImage[]> {
    const product = await this.findProductOrThrow(productId);
    if (files.length === 0) {
      throw new BadRequestException('Choose at least one photo');
    }

    const types = files.map((file) => {
      const type = file.size <= MAX_IMAGE_BYTES ? detectImageType(file.buffer) : null;
      if (!type) {
        throw new BadRequestException(`${file.originalname} is not a JPEG, PNG or WebP image under 5 MB`);
      }
      return type;
    });

    const existing = await this.images.find({ where: { productId } });
    const firstPosition = existing.reduce((highest, image) => Math.max(highest, image.position + 1), 0);

    const created: ProductImage[] = [];
    for (const [index, file] of files.entries()) {
      const url = await this.storage.save('products', file.buffer, types[index]!);
      created.push(
        await this.images.save(
          this.images.create({ productId, url, alt: product.name.en, position: firstPosition + index }),
        ),
      );
    }
    return created;
  }

  async deleteImage(id: string): Promise<void> {
    const image = await this.images.findOne({ where: { id } });
    if (!image) {
      return;
    }
    await this.storage.remove(image.url);
    await this.images.delete(id);
  }

  private async findBrandOrThrow(id: string): Promise<Brand> {
    const brand = await this.brands.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException(`Brand ${id} not found`);
    }
    return brand;
  }

  private async findCategoryOrThrow(id: string): Promise<Category> {
    const category = await this.categories.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  private async findProductOrThrow(id: string): Promise<Product> {
    const product = await this.products.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }
}
