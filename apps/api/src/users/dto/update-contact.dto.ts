import { ApiPropertyOptional } from '@nestjs/swagger';
import { LOCALES, type Locale, type UpdateContactRequestBody } from '@bendike/shared';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

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
}
