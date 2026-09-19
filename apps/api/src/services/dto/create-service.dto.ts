import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CreateServiceRequestBody, PriceCurrency, ServiceCategory } from '@bendike/shared';
import { PRICE_CURRENCIES, SERVICE_CATEGORIES } from '@bendike/shared';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateServiceDto implements CreateServiceRequestBody {
  @ApiProperty()
  @IsString()
  @Length(1, 120)
  slug!: string;

  @ApiProperty({ enum: SERVICE_CATEGORIES })
  @IsIn(SERVICE_CATEGORIES)
  category!: ServiceCategory;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 300)
  turnaroundNote?: string;

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
}
