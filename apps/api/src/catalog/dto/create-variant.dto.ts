import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsPositive, IsString, Length } from 'class-validator';

export class CreateVariantDto {
  @ApiProperty()
  @IsString()
  @Length(1, 120)
  sku!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  optionNames!: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  optionValues!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  listPriceUsd?: number;
}
