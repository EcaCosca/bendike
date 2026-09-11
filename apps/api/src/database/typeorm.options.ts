import { join } from 'node:path';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfigService } from '../config/app.config.service';

export function buildTypeOrmOptions(config: AppConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: config.databaseUrl,
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: true,
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  };
}
