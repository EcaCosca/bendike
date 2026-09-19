import { ApiProperty } from '@nestjs/swagger';
import type { CreateUsedItemRequestBody, PriceCurrency } from '@bendike/shared';
import { PRICE_CURRENCIES } from '@bendike/shared';
import { IsIn, IsNumber, IsPositive, IsString, IsUUID, Length } from 'class-validator';

export class CreateUsedItemDto implements CreateUsedItemRequestBody {
  @ApiProperty({ description: 'English; Spanish and Portuguese are machine-translated' })
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  summary!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 20000)
  descriptionMd!: string;

  @ApiProperty()
  @IsUUID()
  brandId!: string;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  priceAmount!: number;

  @ApiProperty({ enum: PRICE_CURRENCIES })
  @IsIn(PRICE_CURRENCIES)
  priceCurrency!: PriceCurrency;
}
