import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, ValidateNested } from 'class-validator';
import { LocalizedTextDto } from './localized-text.dto';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @Length(1, 120)
  slug!: string;

  @ApiProperty({ type: LocalizedTextDto })
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name!: LocalizedTextDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  position?: number;
}
