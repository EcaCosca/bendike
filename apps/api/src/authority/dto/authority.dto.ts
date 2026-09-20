import { ApiPropertyOptional } from '@nestjs/swagger';
import { RIG_RESIDENCES, RIGGER_REGISTRY_SORTS, type RigResidence, type RiggerRegistrySort } from '@bendike/shared';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class PageQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;
}

export class RegistryQueryDto extends PageQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) search?: string;
  @ApiPropertyOptional({ enum: RIGGER_REGISTRY_SORTS })
  @IsOptional()
  @IsIn(RIGGER_REGISTRY_SORTS)
  sort?: RiggerRegistrySort;
}

export class RigsQueryDto extends PageQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) search?: string;
  @ApiPropertyOptional({
    enum: RIG_RESIDENCES,
    description: 'Where the owner lives, against the authority own country',
  })
  @IsOptional()
  @IsIn(RIG_RESIDENCES)
  residence?: RigResidence;
}
