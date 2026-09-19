import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DUE_KINDS,
  DUE_STATUSES,
  GEAR_KINDS,
  type DueKind,
  type GearKind,
  type WorkQueueQuery,
  type WorkSort,
  type WorkStatusFilter,
} from '@bendike/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

const STATUS_FILTERS = [...DUE_STATUSES, 'all', 'grounded'] as const;
const SORTS = ['urgency', 'due', 'owner', 'rig'] as const;

export class WorkQueueQueryDto implements WorkQueueQuery {
  @ApiPropertyOptional({ enum: STATUS_FILTERS, description: 'Default: everything that needs attention' })
  @IsOptional()
  @IsIn(STATUS_FILTERS)
  status?: WorkStatusFilter;

  @ApiPropertyOptional({ enum: GEAR_KINDS })
  @IsOptional()
  @IsIn(GEAR_KINDS)
  kind?: GearKind;

  @ApiPropertyOptional({ enum: DUE_KINDS })
  @IsOptional()
  @IsIn(DUE_KINDS)
  dueKind?: DueKind;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Overdue items and items due inside this many days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3650)
  withinDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ enum: SORTS })
  @IsOptional()
  @IsIn(SORTS)
  sort?: WorkSort;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
