import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Length } from 'class-validator';

export class UpdateProductDto {
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
  listPriceUsd?: number;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
