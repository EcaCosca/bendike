import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddRigPhotoDto {
  @ApiProperty()
  @IsUUID()
  rigId!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(300) caption?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() entryId?: string;
}

export class RigPhotosQueryDto {
  @ApiProperty()
  @IsUUID()
  rigId!: string;
}

export class RigCoversQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() ownerId?: string;
}
