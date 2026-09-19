import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BulletinsModule } from '../bulletins/bulletins.module';
import { AppConfigModule } from '../config/app.config.module';
import { EmailModule } from '../email/email.module';
import { GearModule } from '../gear/gear.module';
import { User } from '../users/user.entity';
import { WorkQueueModule } from '../work-queue/work-queue.module';
import { CronSecretGuard } from './cron-secret.guard';
import { DigestBuilder } from './digest-builder';
import { DigestDelivery } from './digest-delivery.entity';
import { DigestJobService } from './digest-job.service';
import { AdminDigestController, DigestJobController, RiggerSettingsController } from './digest.controller';
import { RiggerSettings } from './rigger-settings.entity';
import { RiggerSettingsService } from './rigger-settings.service';

@Module({
  imports: [
    AppConfigModule,
    EmailModule,
    GearModule,
    WorkQueueModule,
    BulletinsModule,
    TypeOrmModule.forFeature([User, DigestDelivery, RiggerSettings]),
  ],
  controllers: [DigestJobController, AdminDigestController, RiggerSettingsController],
  providers: [CronSecretGuard, DigestBuilder, DigestJobService, RiggerSettingsService],
})
export class RemindersModule {}
