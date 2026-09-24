import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ContentLanguage,
  CreateLearnCollectionRequestBody,
  CreateLearnItemRequestBody,
  LearnCopyField,
  LearnFormat,
  LearnLevel,
  LearnLink,
  LearnLinkKind,
  LearnQuery,
  LearnSort,
  LearnTopic,
  Locale,
  ReplaceLearnLinksRequestBody,
  UpdateLearnCollectionRequestBody,
  UpdateLearnCopyRequestBody,
  UpdateLearnItemRequestBody,
} from '@bendike/shared';
import {
  CONTENT_LANGUAGES,
  LEARN_COPY_FIELDS,
  LEARN_FORMATS,
  LEARN_LEVELS,
  LEARN_LINK_KINDS,
  LEARN_MAX_PAGE_SIZE,
  LEARN_SORTS,
  LEARN_TOPICS,
  LOCALES,
} from '@bendike/shared';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { IsDateOnly } from '../../common/is-date-only';

const HTTPS_ONLY = { protocols: ['https'], require_protocol: true, require_tld: true };

export class LearnQueryDto implements LearnQuery {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) q?: string;
  @ApiPropertyOptional({ enum: LEARN_TOPICS }) @IsOptional() @IsIn(LEARN_TOPICS) topic?: LearnTopic;
  @ApiPropertyOptional({ enum: LEARN_FORMATS }) @IsOptional() @IsIn(LEARN_FORMATS) type?: LearnFormat;
  @ApiPropertyOptional({ enum: LEARN_LEVELS }) @IsOptional() @IsIn(LEARN_LEVELS) level?: LearnLevel;
  @ApiPropertyOptional({ enum: CONTENT_LANGUAGES }) @IsOptional() @IsIn(CONTENT_LANGUAGES) lang?: ContentLanguage;
  @ApiPropertyOptional({ enum: LEARN_SORTS }) @IsOptional() @IsIn(LEARN_SORTS) sort?: LearnSort;
  @ApiPropertyOptional({ enum: LOCALES }) @IsOptional() @IsIn(LOCALES) locale?: Locale;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: LEARN_MAX_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LEARN_MAX_PAGE_SIZE)
  pageSize?: number;
}

export class CreateLearnItemDto implements CreateLearnItemRequestBody {
  @ApiProperty() @IsString() @Length(1, 160) slug!: string;
  @ApiProperty() @IsUrl(HTTPS_ONLY) @MaxLength(2000) url!: string;
  @ApiProperty({ enum: LEARN_FORMATS }) @IsIn(LEARN_FORMATS) format!: LearnFormat;
  @ApiProperty({ description: 'English; Spanish and Portuguese are machine-translated' })
  @IsString()
  @Length(1, 200)
  title!: string;
  @ApiProperty() @IsString() @Length(1, 1000) summary!: string;
  @ApiProperty() @IsString() @Length(1, 160) sourceName!: string;
  @ApiProperty({ enum: CONTENT_LANGUAGES }) @IsIn(CONTENT_LANGUAGES) contentLanguage!: ContentLanguage;

  @ApiProperty({ enum: LEARN_TOPICS, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(LEARN_TOPICS.length)
  @ArrayUnique()
  @IsIn(LEARN_TOPICS, { each: true })
  topics!: LearnTopic[];

  @ApiProperty({ enum: LEARN_LEVELS }) @IsIn(LEARN_LEVELS) level!: LearnLevel;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160) author?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUrl(HTTPS_ONLY)
  @MaxLength(2000)
  thumbnailUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(6000) durationMinutes?: number | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsDateOnly() publishedAt?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUrl(HTTPS_ONLY) @MaxLength(2000) buyUrl?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() affiliate?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() position?: number;
}

export class UpdateLearnItemDto implements UpdateLearnItemRequestBody {
  @ApiPropertyOptional() @IsOptional() @IsUrl(HTTPS_ONLY) @MaxLength(2000) url?: string;
  @ApiPropertyOptional({ enum: LEARN_FORMATS }) @IsOptional() @IsIn(LEARN_FORMATS) format?: LearnFormat;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 160) sourceName?: string;
  @ApiPropertyOptional({ enum: CONTENT_LANGUAGES })
  @IsOptional()
  @IsIn(CONTENT_LANGUAGES)
  contentLanguage?: ContentLanguage;

  @ApiPropertyOptional({ enum: LEARN_TOPICS, isArray: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(LEARN_TOPICS, { each: true })
  topics?: LearnTopic[];

  @ApiPropertyOptional({ enum: LEARN_LEVELS }) @IsOptional() @IsIn(LEARN_LEVELS) level?: LearnLevel;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsString() @MaxLength(160) author?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUrl(HTTPS_ONLY)
  @MaxLength(2000)
  thumbnailUrl?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsInt() @Min(1) @Max(6000) durationMinutes?: number | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsDateOnly() publishedAt?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUrl(HTTPS_ONLY) @MaxLength(2000) buyUrl?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() affiliate?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() position?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateLearnCopyDto implements UpdateLearnCopyRequestBody {
  @ApiProperty({ enum: LEARN_COPY_FIELDS }) @IsIn(LEARN_COPY_FIELDS) field!: LearnCopyField;
  @ApiProperty({ enum: LOCALES }) @IsIn(LOCALES) locale!: Locale;
  @ApiProperty() @IsString() @Length(1, 1000) value!: string;
}

export class LearnLinkDto implements LearnLink {
  @ApiProperty({ enum: LEARN_LINK_KINDS }) @IsIn(LEARN_LINK_KINDS) kind!: LearnLinkKind;
  @ApiProperty() @IsUUID() targetId!: string;
}

export class ReplaceLearnLinksDto implements ReplaceLearnLinksRequestBody {
  @ApiProperty({ type: [LearnLinkDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => LearnLinkDto)
  links!: LearnLinkDto[];
}

export class CreateLearnCollectionDto implements CreateLearnCollectionRequestBody {
  @ApiProperty() @IsString() @Length(1, 160) slug!: string;
  @ApiProperty() @IsString() @Length(1, 200) title!: string;
  @ApiProperty() @IsString() @Length(1, 2000) intro!: string;
  @ApiProperty({ enum: LEARN_TOPICS }) @IsIn(LEARN_TOPICS) topic!: LearnTopic;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() startHere?: boolean;
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  itemIds!: string[];
}

export class UpdateLearnCollectionDto implements UpdateLearnCollectionRequestBody {
  @ApiPropertyOptional({ enum: LEARN_TOPICS }) @IsOptional() @IsIn(LEARN_TOPICS) topic?: LearnTopic;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() startHere?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  itemIds?: string[];
}
