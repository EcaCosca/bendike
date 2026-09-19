import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GEAR_KINDS, type GearKind } from '@bendike/shared';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateGearModelDto {
  @ApiProperty({ enum: GEAR_KINDS })
  @IsIn(GEAR_KINDS)
  kind!: GearKind;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  manufacturer!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  model!: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(3650) repackCycleDays?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(600) serviceIntervalMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(240) batteryCycleMonths?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) lifeYears?: number;
}

export class UpdateGearModelDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) model?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(3650) repackCycleDays?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(600) serviceIntervalMonths?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(240) batteryCycleMonths?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(100) lifeYears?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}
