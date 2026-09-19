import { ApiPropertyOptional } from '@nestjs/swagger';
import type { CreateRiggerLinkRequestBody } from '@bendike/shared';
import { IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRiggerLinkDto implements CreateRiggerLinkRequestBody {
  @ApiPropertyOptional({ description: 'Owners: the rigger they choose' })
  @IsOptional()
  @IsUUID()
  riggerId?: string;

  @ApiPropertyOptional({ description: 'Riggers: the email of the dropzone or customer to add' })
  @IsOptional()
  @IsEmail()
  ownerEmail?: string;

  @ApiPropertyOptional({ description: 'Riggers: the WhatsApp phone of the dropzone or customer to add' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  ownerPhone?: string;

  @ApiPropertyOptional({ description: 'Admins only: the owner of an active link created directly' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
