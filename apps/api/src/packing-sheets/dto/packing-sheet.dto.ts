import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsDateOnly } from '../../common/is-date-only';

export class StartPackingSheetDto {
  @ApiProperty()
  @IsUUID()
  rigId!: string;
}

export class SavePackingDraftDto {
  @ApiPropertyOptional() @IsOptional() @IsDateOnly() performedOn?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) checkedIds?: string[];
  @ApiPropertyOptional()
  @ValidateIf((o: SavePackingDraftDto) => o.bulletinsChecked !== null)
  @IsOptional()
  @IsBoolean()
  bulletinsChecked?: boolean | null;
  @ApiPropertyOptional()
  @ValidateIf((o: SavePackingDraftDto) => o.mardConnected !== null)
  @IsOptional()
  @IsBoolean()
  mardConnected?: boolean | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) ownerName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) ownerAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) ownerPhone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o: SavePackingDraftDto) => o.ownerEmail !== '')
  @IsEmail()
  @MaxLength(200)
  ownerEmail?: string;
  @ApiPropertyOptional()
  @ValidateIf((o: SavePackingDraftDto) => o.manualDocumentId !== null)
  @IsOptional()
  @IsUUID()
  manualDocumentId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(4000) notes?: string;
}

export class SignPackingSheetDto {
  @ApiProperty()
  @IsString()
  @Length(1, 120)
  riggerLicence!: string;
}

export class VoidPackingSheetDto {
  @ApiProperty()
  @IsString()
  @Length(1, 1000)
  reason!: string;
}

export class ListPackingSheetsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() rigId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() reserveItemId?: string;
}
