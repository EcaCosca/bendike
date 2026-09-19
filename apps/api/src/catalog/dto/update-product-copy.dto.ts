import { ApiProperty } from '@nestjs/swagger';
import type { Locale } from '@bendike/shared';
import { LOCALES } from '@bendike/shared';
import { IsIn, IsString } from 'class-validator';

const COPY_FIELDS = ['name', 'summary', 'descriptionMd'] as const;
export type ProductCopyFieldName = (typeof COPY_FIELDS)[number];

export class UpdateProductCopyDto {
  @ApiProperty({ enum: COPY_FIELDS })
  @IsIn(COPY_FIELDS)
  field!: ProductCopyFieldName;

  @ApiProperty({ enum: LOCALES })
  @IsIn(LOCALES)
  locale!: Locale;

  @ApiProperty()
  @IsString()
  value!: string;
}
