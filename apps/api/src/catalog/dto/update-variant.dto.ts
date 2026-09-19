import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateVariantDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  listPriceUsd?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
