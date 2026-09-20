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

  @IsOptional()
  @IsString()
  DEEPL_API_KEY?: string;

  @IsOptional()
  @IsString()
  DEEPL_API_URL?: string;

  @IsOptional()
  @IsString()
  EXCHANGE_RATE_PROVIDER_URL?: string;

  @IsOptional()
  @IsString()
  UPLOADS_DIR?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  EMAIL_PROVIDER?: string;

  @IsOptional()
  @IsString()
  RESEND_API_KEY?: string;

  @IsOptional()
  @IsString()
  EMAIL_FROM?: string;

  @IsOptional()
  @IsString()
  EMAIL_OVERRIDE_TO?: string;

  @IsOptional()
  @IsString()
  CRON_SECRET?: string;

  @IsOptional()
  @IsString()
  WEB_BASE_URL?: string;

  @IsOptional()
  @IsString()
  GOOGLE_DRIVE_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  GOOGLE_DRIVE_CLIENT_SECRET?: string;

  @IsOptional()
  @IsString()
  GOOGLE_DRIVE_REFRESH_TOKEN?: string;

  @IsOptional()
  @IsString()
  GOOGLE_DRIVE_FOLDER_ID?: string;

  @IsOptional()
  @IsString()
  LIBRARY_LOCAL_DIR?: string;
}

export interface GoogleDriveSettings {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId: string;
}

const DEFAULT_PORT = 3000;
const DEFAULT_JWT_EXPIRES_IN_SECONDS = 3600;
const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';
const DEFAULT_DEEPL_API_URL = 'https://api-free.deepl.com';
const DEFAULT_UPLOADS_DIR = './uploads';
const DEFAULT_LIBRARY_LOCAL_DIR = './library-files';
const DEFAULT_EMAIL_FROM = 'Bendike <onboarding@resend.dev>';
const DEFAULT_WEB_BASE_URL = 'http://localhost:5173';
const DEFAULT_EXCHANGE_RATE_PROVIDER_URL = 'https://open.er-api.com/v6/latest/USD';

@Injectable()
export class AppConfigService {
  readonly port: number;
  readonly databaseUrl: string;
  readonly jwtSecret: string;
  readonly jwtExpiresInSeconds: number;
  readonly corsOrigin: string;
  readonly seedAdminEmail: string | undefined;
  readonly seedAdminPassword: string | undefined;
  readonly deeplApiKey: string | undefined;
  readonly deeplApiUrl: string;
  readonly exchangeRateProviderUrl: string;
  readonly uploadsDir: string;
  readonly googleClientId: string | undefined;
  readonly emailProvider: 'console' | 'resend';
  readonly resendApiKey: string | undefined;
  readonly emailFrom: string;
  readonly emailOverrideTo: string | undefined;
  readonly cronSecret: string | undefined;
  readonly webBaseUrl: string;
  readonly googleDrive: GoogleDriveSettings | null;
  readonly libraryLocalDir: string;

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
    this.deeplApiKey = emptyToUndefined(this.configService.get<string>('DEEPL_API_KEY'));
    this.deeplApiUrl = this.configService.get<string>('DEEPL_API_URL') ?? DEFAULT_DEEPL_API_URL;
    this.exchangeRateProviderUrl =
      this.configService.get<string>('EXCHANGE_RATE_PROVIDER_URL') ?? DEFAULT_EXCHANGE_RATE_PROVIDER_URL;
    this.uploadsDir = emptyToUndefined(this.configService.get<string>('UPLOADS_DIR')) ?? DEFAULT_UPLOADS_DIR;
    this.googleClientId = emptyToUndefined(this.configService.get<string>('GOOGLE_CLIENT_ID'));
    const provider = emptyToUndefined(this.configService.get<string>('EMAIL_PROVIDER'));
    this.emailProvider = provider === 'resend' ? 'resend' : 'console';
    this.resendApiKey = emptyToUndefined(this.configService.get<string>('RESEND_API_KEY'));
    if (this.emailProvider === 'resend' && !this.resendApiKey) {
      throw new Error('EMAIL_PROVIDER=resend needs RESEND_API_KEY');
    }
    this.emailFrom = emptyToUndefined(this.configService.get<string>('EMAIL_FROM')) ?? DEFAULT_EMAIL_FROM;
    this.emailOverrideTo = emptyToUndefined(this.configService.get<string>('EMAIL_OVERRIDE_TO'));
    this.cronSecret = emptyToUndefined(this.configService.get<string>('CRON_SECRET'));
    this.webBaseUrl = emptyToUndefined(this.configService.get<string>('WEB_BASE_URL')) ?? DEFAULT_WEB_BASE_URL;
    this.googleDrive = this.readGoogleDrive();
    this.libraryLocalDir =
      emptyToUndefined(this.configService.get<string>('LIBRARY_LOCAL_DIR')) ?? DEFAULT_LIBRARY_LOCAL_DIR;
  }

  private readGoogleDrive(): GoogleDriveSettings | null {
    const names = [
      'GOOGLE_DRIVE_CLIENT_ID',
      'GOOGLE_DRIVE_CLIENT_SECRET',
      'GOOGLE_DRIVE_REFRESH_TOKEN',
      'GOOGLE_DRIVE_FOLDER_ID',
    ] as const;
    const values = names.map((name) => emptyToUndefined(this.configService.get<string>(name)));
    if (values.every((value) => value === undefined)) {
      return null;
    }
    const missing = names.filter((_, index) => values[index] === undefined);
    if (missing.length > 0) {
      throw new Error(`Google Drive needs all four settings; missing ${missing.join(', ')}`);
    }
    const [clientId, clientSecret, refreshToken, folderId] = values as [string, string, string, string];
    return { clientId, clientSecret, refreshToken, folderId };
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
