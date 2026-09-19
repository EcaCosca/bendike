import { ApiPropertyOptional } from '@nestjs/swagger';
import type { PriceCurrency, ServiceCategory, UpdateServiceRequestBody } from '@bendike/shared';
import { PRICE_CURRENCIES, SERVICE_CATEGORIES } from '@bendike/shared';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateServiceDto implements UpdateServiceRequestBody {
  @ApiPropertyOptional({ enum: SERVICE_CATEGORIES })
  @IsOptional()
  @IsIn(SERVICE_CATEGORIES)
  category?: ServiceCategory;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number | null;

  @ApiPropertyOptional({ enum: PRICE_CURRENCIES, nullable: true })
  @IsOptional()
  @IsIn(PRICE_CURRENCIES)
  priceCurrency?: PriceCurrency | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  position?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
