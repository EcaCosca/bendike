import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { RiggerSettings } from './rigger-settings.entity';

export interface RiggerSettingsView {
  digestEnabled: boolean;
}

@Injectable()
export class RiggerSettingsService {
  constructor(@InjectEntityManager() private readonly manager: EntityManager) {}

  async get(riggerId: string): Promise<RiggerSettingsView> {
    const row = await this.manager.findOne(RiggerSettings, { where: { riggerId } });
    return { digestEnabled: row?.digestEnabled ?? true };
  }

  async update(riggerId: string, body: RiggerSettingsView): Promise<RiggerSettingsView> {
    const row =
      (await this.manager.findOne(RiggerSettings, { where: { riggerId } })) ??
      this.manager.create(RiggerSettings, { riggerId });
    row.digestEnabled = body.digestEnabled;
    await this.manager.save(row);
    return { digestEnabled: row.digestEnabled };
  }
}
