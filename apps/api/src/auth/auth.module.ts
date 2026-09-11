import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfigModule } from '../config/app.config.module';
import { AppConfigService } from '../config/app.config.service';
import { UsersModule } from '../users/users.module';
import { AdminSeedService } from './admin-seed.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PasswordHasher } from './password-hasher';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    UsersModule,
    AppConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresInSeconds },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordHasher, JwtStrategy, RolesGuard, AdminSeedService],
  exports: [RolesGuard],
})
export class AuthModule {}
