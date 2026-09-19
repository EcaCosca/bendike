import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Page, ProductDetail, ProductSummary } from '@bendike/shared';
import { CatalogService } from './catalog.service';
import { CatalogQueryDto } from './dto/catalog-query.dto';
import { Brand } from './entities/brand.entity';
import { Category } from './entities/category.entity';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('brands')
  @ApiOperation({ summary: 'List active brands' })
  findBrands(): Promise<Brand[]> {
    return this.catalog.findBrands();
  }

  @Get('categories')
  @ApiOperation({ summary: 'List the category tree, flat, ordered by position' })
  findCategories(): Promise<Category[]> {
    return this.catalog.findCategories();
  }

  @Get('products')
  @ApiOperation({ summary: 'List active products, filtered, sorted and paginated' })
  findProducts(@Query() query: CatalogQueryDto): Promise<Page<ProductSummary>> {
    return this.catalog.findProducts(query);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Get an active product by slug' })
  findProductBySlug(@Param('slug') slug: string): Promise<ProductDetail> {
    return this.catalog.findProductBySlug(slug);
  }
}
