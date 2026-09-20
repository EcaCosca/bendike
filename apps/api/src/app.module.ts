import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { AppConfigModule } from './config/app.config.module';
import { AppConfigService } from './config/app.config.service';
import { validateEnv } from './config/env.validate';
import { buildTypeOrmOptions } from './database/typeorm.options';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { BulletinsModule } from './bulletins/bulletins.module';
import { GearModule } from './gear/gear.module';
import { HealthModule } from './health/health.module';
import { LibraryModule } from './library/library.module';
import { PackingSheetsModule } from './packing-sheets/packing-sheets.module';
import { RigPhotosModule } from './rig-photos/rig-photos.module';
import { RiggerLinksModule } from './rigger-links/rigger-links.module';
import { WorkQueueModule } from './work-queue/work-queue.module';
import { RemindersModule } from './reminders/reminders.module';
import { ServicesModule } from './services/services.module';
import { TranslationModule } from './translation/translation.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => buildTypeOrmOptions(config),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    CatalogModule,
    GearModule,
    LibraryModule,
    PackingSheetsModule,
    RigPhotosModule,
    BulletinsModule,
    RiggerLinksModule,
    WorkQueueModule,
    RemindersModule,
    TranslationModule,
    ExchangeRatesModule,
    ServicesModule,
  ],
})
export class AppModule {}
