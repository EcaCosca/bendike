import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Role } from '@bendike/shared';
import type { EntityManager } from 'typeorm';
import { AppConfigService } from '../config/app.config.service';
import { EmailSender } from '../email/email-sender';
import { GearClock } from '../gear/gear-clock';
import { User } from '../users/user.entity';
import type { Digest } from './digest';
import { DigestBuilder } from './digest-builder';
import { DigestDelivery } from './digest-delivery.entity';
import { renderDigest } from './digest-renderer';
import { RiggerSettings } from './rigger-settings.entity';

export interface DigestJobReport {
  dryRun: boolean;
  today: string;
  sent: { riggerEmail: string; itemCount: number; subject: string; text?: string }[];
  skipped: number;
  failed: { riggerEmail: string; error: string }[];
}

@Injectable()
export class DigestJobService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly builder: DigestBuilder,
    private readonly sender: EmailSender,
    private readonly clock: GearClock,
    private readonly config: AppConfigService,
  ) {}

  async run(options: { dryRun: boolean; riggerId?: string }): Promise<DigestJobReport> {
    const today = this.clock.today();
    const report: DigestJobReport = { dryRun: options.dryRun, today, sent: [], skipped: 0, failed: [] };
    const riggers = await this.manager.find(User, {
      where: { role: Role.Rigger, ...(options.riggerId ? { id: options.riggerId } : {}) },
    });

    for (const rigger of riggers) {
      const settings = await this.manager.findOne(RiggerSettings, { where: { riggerId: rigger.id } });
      if (settings && !settings.digestEnabled) {
        report.skipped += 1;
        continue;
      }
      const deliveries = await this.manager.find(DigestDelivery, { where: { riggerId: rigger.id } });
      const digest = await this.builder.build(rigger, deliveries, today);
      if (!digest) {
        report.skipped += 1;
        continue;
      }
      const message = renderDigest(digest, this.config.webBaseUrl);
      if (options.dryRun) {
        report.sent.push({
          riggerEmail: rigger.email,
          itemCount: digest.items.length,
          subject: message.subject,
          text: message.text,
        });
        continue;
      }
      try {
        await this.sender.send({ to: rigger.email, ...message });
        await this.record(digest, today);
        report.sent.push({ riggerEmail: rigger.email, itemCount: digest.items.length, subject: message.subject });
      } catch (error) {
        report.failed.push({
          riggerEmail: rigger.email,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return report;
  }

  private async record(digest: Digest, today: string): Promise<void> {
    for (const item of digest.items) {
      const existing = await this.manager.findOne(DigestDelivery, {
        where: {
          riggerId: digest.rigger.id,
          subjectId: item.key.subjectId,
          kind: item.key.kind,
          dueKey: item.key.dueKey,
        },
      });
      const row =
        existing ??
        this.manager.create(DigestDelivery, {
          riggerId: digest.rigger.id,
          subjectId: item.key.subjectId,
          kind: item.key.kind,
          dueKey: item.key.dueKey,
          timesSent: 0,
        });
      row.lastStatus = item.status;
      row.sentOn = today;
      row.timesSent += 1;
      await this.manager.save(row);
    }
  }
}
