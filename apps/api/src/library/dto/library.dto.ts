import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LIBRARY_DOCUMENT_KINDS, type LibraryDocumentKind } from '@bendike/shared';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, MaxLength, Min } from 'class-validator';

export class AddLibraryDocumentDto {
  @ApiProperty()
  @IsString()
  @Length(1, 200)
  title!: string;

  @ApiProperty({ enum: LIBRARY_DOCUMENT_KINDS })
  @IsIn(LIBRARY_DOCUMENT_KINDS)
  kind!: LibraryDocumentKind;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) manufacturer?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() modelId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) revision?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) language?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) sourceUrl?: string;
}

export class ListLibraryQueryDto {
  @ApiPropertyOptional({ enum: LIBRARY_DOCUMENT_KINDS })
  @IsOptional()
  @IsIn(LIBRARY_DOCUMENT_KINDS)
  kind?: LibraryDocumentKind;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) search?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() modelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => value === 'true' || value === true)
  @IsBoolean()
  includeArchived?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;
}

export class ArchiveLibraryDocumentDto {
  @ApiProperty()
  @IsString()
  @Length(1, 500)
  reason!: string;
}
