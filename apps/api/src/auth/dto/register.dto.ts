import { ApiProperty } from '@nestjs/swagger';
import type { RegisterRequest } from '@bendike/shared';
import { IsEmail, IsString, Length, MaxLength, MinLength } from 'class-validator';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export class RegisterDto implements RegisterRequest {
  @ApiProperty({ example: 'ana@bendike.example' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  @Length(1, 120)
  displayName!: string;
}
