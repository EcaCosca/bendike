import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CreateRigRequestBody, UpdateRigRequestBody } from '@bendike/shared';
import { IsBoolean, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateRigDto implements CreateRigRequestBody {
  @ApiProperty()
  @IsString()
  @Length(1, 120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Admins only: create the rig for another account' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}

export class UpdateRigDto implements UpdateRigRequestBody {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
