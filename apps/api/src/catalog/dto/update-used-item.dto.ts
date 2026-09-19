import { ApiPropertyOptional } from '@nestjs/swagger';
import type { PriceCurrency, UpdateUsedItemRequestBody } from '@bendike/shared';
import { PRICE_CURRENCIES } from '@bendike/shared';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class UpdateUsedItemDto implements UpdateUsedItemRequestBody {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  priceAmount?: number;

  @ApiPropertyOptional({ enum: PRICE_CURRENCIES })
  @IsOptional()
  @IsIn(PRICE_CURRENCIES)
  priceCurrency?: PriceCurrency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'true records the sale now; false makes the item available again' })
  @IsOptional()
  @IsBoolean()
  sold?: boolean;
}
