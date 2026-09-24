import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvConfig } from './app.config.service';

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  // A key left blank in a .env file arrives as '', which @IsOptional() does not treat as absent, so an empty
  // SEED_ADMIN_EMAIL would fail @IsEmail(). Validate as if blank meant unset; callers still get `config` as it was.
  const present = Object.fromEntries(Object.entries(config).filter(([, value]) => value !== ''));
  const instance = plainToInstance(EnvConfig, present, { enableImplicitConversion: true });
  const errors = validateSync(instance, { skipMissingProperties: false });

  if (errors.length > 0) {
    const lines = errors.map((err) => {
      const constraints = Object.values(err.constraints ?? {}).join('; ');
      return `  ${err.property}: ${constraints}`;
    });
    throw new Error(`Configuration validation failed. Fix these env vars before starting:\n${lines.join('\n')}`);
  }

  return config;
}
