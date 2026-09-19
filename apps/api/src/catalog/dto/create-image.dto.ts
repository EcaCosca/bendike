import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateImageDto {
  @ApiProperty()
  @IsString()
  @Length(1, 500)
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 255)
  alt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  position?: number;
}
