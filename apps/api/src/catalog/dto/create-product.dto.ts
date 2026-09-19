import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Length, ValidateNested } from 'class-validator';
import { LocalizedTextDto } from './localized-text.dto';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @Length(1, 160)
  slug!: string;

  @ApiProperty()
  @IsUUID()
  brandId!: string;

  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  summary!: LocalizedTextDto;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  descriptionMd!: LocalizedTextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  listPriceUsd?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  markupPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  madeToOrder?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  manualUrl?: string;
}
