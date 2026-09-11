import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class EnvConfig {
  @IsOptional()
  @IsString()
  PORT?: string;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN_SECONDS?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsEmail()
  SEED_ADMIN_EMAIL?: string;

  @IsOptional()
  @IsString()
  SEED_ADMIN_PASSWORD?: string;
}

const DEFAULT_PORT = 3000;
const DEFAULT_JWT_EXPIRES_IN_SECONDS = 3600;
const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

@Injectable()
export class AppConfigService {
  readonly port: number;
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpiresInSeconds: number;
  readonly corsOrigin: string;
  readonly seedAdminEmail: string | undefined;
  readonly seedAdminPassword: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.port = positiveIntegerOr(this.configService.get<string>('PORT'), DEFAULT_PORT);
    this.databaseUrl = this.configService.getOrThrow<string>('DATABASE_URL');
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.jwtExpiresInSeconds = positiveIntegerOr(
      this.configService.get<string>('JWT_EXPIRES_IN_SECONDS'),
      DEFAULT_JWT_EXPIRES_IN_SECONDS,
    );
    this.corsOrigin = this.configService.get<string>('CORS_ORIGIN') ?? DEFAULT_CORS_ORIGIN;
    this.seedAdminEmail = emptyToUndefined(this.configService.get<string>('SEED_ADMIN_EMAIL'));
    this.seedAdminPassword = emptyToUndefined(this.configService.get<string>('SEED_ADMIN_PASSWORD'));
  }
}

function positiveIntegerOr(raw: string | undefined, fallback: number): number {
  if (raw === undefined || !/^\d+$/.test(raw.trim())) {
    return fallback;
  }
  const parsed = Number(raw);
  return parsed > 0 ? parsed : fallback;
}

function emptyToUndefined(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === '' ? undefined : value;
}
