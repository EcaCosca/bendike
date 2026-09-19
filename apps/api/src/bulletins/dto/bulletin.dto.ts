import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BULLETIN_SEVERITIES, MATCH_STATUSES, type BulletinSeverity, type MatchStatus } from '@bendike/shared';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IsDateOnly } from '../../common/is-date-only';

export class BulletinTargetDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) model?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) serialFrom?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) serialTo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() manufacturedFrom?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() manufacturedTo?: string | null;
}

export class CreateBulletinDto {
  @ApiProperty() @IsString() @Length(1, 120) manufacturer!: string;
  @ApiProperty() @IsString() @Length(1, 120) reference!: string;
  @ApiProperty() @IsString() @Length(1, 200) title!: string;
  @ApiProperty() @IsString() @Length(1, 8000) summary!: string;
  @ApiProperty() @IsString() @Length(1, 8000) requiredAction!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) sourceUrl?: string;
  @ApiProperty({ example: '2026-09-01' }) @IsDateOnly() issuedOn!: string;
  @ApiProperty({ enum: BULLETIN_SEVERITIES }) @IsIn(BULLETIN_SEVERITIES) severity!: BulletinSeverity;

  @ApiProperty({ type: [BulletinTargetDto], description: 'What it applies to; empty means the whole manufacturer' })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BulletinTargetDto)
  targets!: BulletinTargetDto[];
}

export class UpdateBulletinDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 200) title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 8000) summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 8000) requiredAction?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) sourceUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() issuedOn?: string;
  @ApiPropertyOptional({ enum: BULLETIN_SEVERITIES })
  @IsOptional()
  @IsIn(BULLETIN_SEVERITIES)
  severity?: BulletinSeverity;

  @ApiPropertyOptional({ type: [BulletinTargetDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => BulletinTargetDto)
  targets?: BulletinTargetDto[];
}

export class MatchesQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() bulletinId?: string;
  @ApiPropertyOptional({ enum: MATCH_STATUSES }) @IsOptional() @IsIn(MATCH_STATUSES) status?: MatchStatus;
}

export class ResolveMatchDto {
  @ApiProperty({ enum: ['complied', 'not_applicable'] })
  @IsIn(['complied', 'not_applicable'])
  status!: 'complied' | 'not_applicable';

  @ApiProperty({ description: 'What was done, or why the bulletin does not apply' })
  @IsString()
  @Length(1, 2000)
  note!: string;
}

export class OpenGroundingDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() rigId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() gearItemId?: string;
  @ApiProperty() @IsString() @Length(1, 2000) reason!: string;
}

export class CloseGroundingDto {
  @ApiProperty({ description: 'What was done before releasing it' })
  @IsString()
  @Length(1, 2000)
  note!: string;
}
