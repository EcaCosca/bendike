import { ApiProperty } from '@nestjs/swagger';
import type { Locale, ServiceCopyField, UpdateServiceCopyRequestBody } from '@bendike/shared';
import { LOCALES, SERVICE_COPY_FIELDS } from '@bendike/shared';
import { IsIn, IsString } from 'class-validator';

export class UpdateServiceCopyDto implements UpdateServiceCopyRequestBody {
  @ApiProperty({ enum: SERVICE_COPY_FIELDS })
  @IsIn(SERVICE_COPY_FIELDS)
  field!: ServiceCopyField;

  @ApiProperty({ enum: LOCALES })
  @IsIn(LOCALES)
  locale!: Locale;

  @ApiProperty()
  @IsString()
  value!: string;
}
