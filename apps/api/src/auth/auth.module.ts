import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { OAuth2Client } from 'google-auth-library';
import { AppConfigModule } from '../config/app.config.module';
import { AppConfigService } from '../config/app.config.service';
import { UsersModule } from '../users/users.module';
import { AdminSeedService } from './admin-seed.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GOOGLE_OAUTH_CLIENT, GoogleTokenVerifier } from './google/google-token-verifier';
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
  providers: [
    AuthService,
    PasswordHasher,
    JwtStrategy,
    RolesGuard,
    AdminSeedService,
    GoogleTokenVerifier,
    { provide: GOOGLE_OAUTH_CLIENT, useFactory: () => new OAuth2Client() },
  ],
  exports: [RolesGuard],
})
export class AuthModule {}
