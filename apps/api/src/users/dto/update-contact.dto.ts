import { ApiPropertyOptional } from '@nestjs/swagger';
import { COUNTRY_CODES, LOCALES, type CountryCode, type Locale, type UpdateContactRequestBody } from '@bendike/shared';
import { IsIn, IsOptional, IsString, Length, ValidateIf } from 'class-validator';

export class UpdateContactDto implements UpdateContactRequestBody {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 120)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'International form with the country code, for example +54 9 341 555 0000; null clears it',
  })
  @IsOptional()
  @IsString()
  @Length(0, 40)
  phone?: string | null;

  @ApiPropertyOptional({ enum: LOCALES })
  @IsOptional()
  @IsIn(LOCALES)
  locale?: Locale;

  @ApiPropertyOptional({
    enum: COUNTRY_CODES,
    nullable: true,
    description: 'The country the account lives in, as an ISO 3166-1 alpha-2 code; null clears it',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsIn(COUNTRY_CODES)
  country?: CountryCode | null;
}
