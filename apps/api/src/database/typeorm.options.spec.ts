import { AppConfigService } from '../config/app.config.service';
import { buildTypeOrmOptions } from './typeorm.options';

describe('buildTypeOrmOptions', () => {
  test('never synchronizes the schema and always runs migrations', () => {
    const databaseUrl = 'postgres://bendike:bendike@localhost:5432/bendike';
    const config = { databaseUrl } as AppConfigService;

    const options = buildTypeOrmOptions(config);

    expect(options).toMatchObject({ type: 'postgres', url: databaseUrl, synchronize: false, migrationsRun: true });
  });
});
