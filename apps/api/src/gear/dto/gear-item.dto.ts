import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GEAR_KINDS, PART_KINDS, type GearKind, type PartKind } from '@bendike/shared';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsDateOnly } from '../../common/is-date-only';

export class GearDetailsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) harnessSize?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) tso?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(1000) sizeSqft?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) lineType?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(3650) repackCycleDays?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(100) deployments?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) mode?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() batteryInstalledOn?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(240) batteryCycleMonths?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() serviceDueOn?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() expiresOn?: string | null;
}

export class CreateGearItemDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  serial?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateOnly()
  manufacturedOn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  modelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  rigId?: string;

  @ApiPropertyOptional({ description: 'Admins only: create the component for another account' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ type: GearDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GearDetailsDto)
  details?: GearDetailsDto;
}

export class UpdateGearItemDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) model?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) serial?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() manufacturedOn?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() modelId?: string | null;
  @ApiPropertyOptional({ description: 'null unassigns the component and keeps it as spare gear' })
  @IsOptional()
  @IsUUID()
  rigId?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() retired?: boolean;

  @ApiPropertyOptional({ type: GearDetailsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GearDetailsDto)
  details?: GearDetailsDto;
}

export class CreatePartDto {
  @ApiProperty({ enum: PART_KINDS })
  @IsIn(PART_KINDS)
  kind!: PartKind;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  description!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) serial?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() manufacturedOn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class UpdatePartDto {
  @ApiPropertyOptional({ enum: PART_KINDS }) @IsOptional() @IsIn(PART_KINDS) kind?: PartKind;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) serial?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() manufacturedOn?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
