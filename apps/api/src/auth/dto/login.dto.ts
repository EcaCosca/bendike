import { ApiProperty } from '@nestjs/swagger';
import type { LoginRequest } from '@bendike/shared';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'ana@bendike.example' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}
