import { ApiPropertyOptional } from '@nestjs/swagger';
import type { Availability, CatalogQuery, Locale, ProductCondition, SortOrder } from '@bendike/shared';
import { LOCALES, PRODUCT_CONDITIONS } from '@bendike/shared';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const AVAILABILITIES: Availability[] = ['in-stock', 'made-to-order'];
const SORT_ORDERS: SortOrder[] = ['name', 'price-asc', 'price-desc'];

export class CatalogQueryDto implements CatalogQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandSlug?: string;

  @ApiPropertyOptional({ enum: AVAILABILITIES })
  @IsOptional()
  @IsIn(AVAILABILITIES)
  availability?: Availability;

  @ApiPropertyOptional({ enum: PRODUCT_CONDITIONS })
  @IsOptional()
  @IsIn(PRODUCT_CONDITIONS)
  condition?: ProductCondition;

  @ApiPropertyOptional({ description: 'List sold items too (default false)' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  includeSold?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SORT_ORDERS })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sort?: SortOrder;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 48 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  pageSize?: number;

  @ApiPropertyOptional({ enum: LOCALES })
  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;
}
