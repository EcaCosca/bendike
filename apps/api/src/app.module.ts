import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppConfigModule } from './config/app.config.module';
import { AppConfigService } from './config/app.config.service';
import { validateEnv } from './config/env.validate';
import { buildTypeOrmOptions } from './database/typeorm.options';
import { HealthModule } from './health/health.module';
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
  ],
})
export class AppModule {}
