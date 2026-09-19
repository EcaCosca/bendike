import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsBooleanString, IsOptional, IsUUID } from 'class-validator';

export class RunDigestQuery {
  @ApiPropertyOptional({ description: 'Defaults to true: preview without sending or recording anything' })
  @IsOptional()
  @IsBooleanString()
  dryRun?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  riggerId?: string;
}

export class UpdateRiggerSettingsDto {
  @ApiPropertyOptional()
  @IsBoolean()
  digestEnabled!: boolean;
}
