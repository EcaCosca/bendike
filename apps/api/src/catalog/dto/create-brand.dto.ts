import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty()
  @IsString()
  @Length(1, 120)
  slug!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 255)
  websiteUrl?: string;
}
