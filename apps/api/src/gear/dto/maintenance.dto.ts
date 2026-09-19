import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  INSPECTION_RESULTS,
  MAINTENANCE_KINDS,
  type CreateMaintenanceEntryRequestBody,
  type InspectionResult,
  type MaintenanceKind,
  type VoidMaintenanceEntryRequestBody,
} from '@bendike/shared';
import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { IsDateOnly } from '../../common/is-date-only';

export class CreateMaintenanceEntryDto implements CreateMaintenanceEntryRequestBody {
  @ApiProperty({ enum: MAINTENANCE_KINDS })
  @IsIn(MAINTENANCE_KINDS)
  kind!: MaintenanceKind;

  @ApiProperty({ example: '2026-09-19' })
  @IsDateOnly()
  performedOn!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 4000)
  description!: string;

  @ApiPropertyOptional({ enum: INSPECTION_RESULTS })
  @IsOptional()
  @IsIn(INSPECTION_RESULTS)
  result?: InspectionResult;

  @ApiPropertyOptional({
    description: 'Owners: who did the work when it was not the owner, for example a rigger outside Bendike',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  performedByName?: string;

  @ApiPropertyOptional({ description: 'Phone or email of a rigger outside Bendike' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  performedByContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  performedByLicence?: string;

  @ApiPropertyOptional({ description: 'AAD service entries: the next service date' })
  @IsOptional()
  @IsDateOnly()
  nextServiceDueOn?: string;
}

export class VoidMaintenanceEntryDto implements VoidMaintenanceEntryRequestBody {
  @ApiProperty()
  @IsString()
  @Length(1, 1000)
  reason!: string;
}
