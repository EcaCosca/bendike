import { ApiProperty } from '@nestjs/swagger';
import type { LocalizedText } from '@bendike/shared';
import { IsString } from 'class-validator';

export class LocalizedTextDto implements LocalizedText {
  @ApiProperty()
  @IsString()
  en!: string;

  @ApiProperty()
  @IsString()
  es!: string;

  @ApiProperty()
  @IsString()
  pt!: string;
}
