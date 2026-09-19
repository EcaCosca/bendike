import { ApiProperty } from '@nestjs/swagger';
import type { GoogleSignInRequest } from '@bendike/shared';
import { IsString, Length } from 'class-validator';

export class GoogleSignInDto implements GoogleSignInRequest {
  @ApiProperty({ description: 'The ID token (JWT) Google Identity Services returned to the browser' })
  @IsString()
  @Length(1, 4096)
  idToken!: string;
}
