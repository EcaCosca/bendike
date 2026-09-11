import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { AppConfigService } from '../config/app.config.service';
import { UsersService } from '../users/users.service';
import { PasswordHasher } from './password-hasher';

export type SeedOutcome = 'created' | 'exists' | 'skipped';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly config: AppConfigService,
    private readonly users: UsersService,
    private readonly hasher: PasswordHasher,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<SeedOutcome> {
    const email = this.config.seedAdminEmail;
    const password = this.config.seedAdminPassword;
    if (!email || !password) {
      return 'skipped';
    }
    const existing = await this.users.findByEmail(email);
    if (existing) {
      this.logger.log(`Seed admin ${email} already exists with role ${existing.role}; leaving it untouched`);
      return 'exists';
    }
    await this.users.create({
      email,
      displayName: 'Administrator',
      passwordHash: await this.hasher.hash(password),
      role: Role.Admin,
    });
    this.logger.log(`Seed admin ${email} created`);
    return 'created';
  }
}
