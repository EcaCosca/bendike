import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvConfig } from './app.config.service';

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const instance = plainToInstance(EnvConfig, config, { enableImplicitConversion: true });
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
