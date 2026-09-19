import { ConflictException } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { User } from '../../users/user.entity';
import { GearItem } from '../entities/gear-item.entity';
import { Rig } from '../entities/rig.entity';
import type { GearService } from '../gear.service';
import type { MaintenanceService } from '../maintenance.service';
import type { FleetPlan, PlannedItem } from './fleet-plan';

export interface ImportReport {
  rigsCreated: number;
  rigsSkipped: number;
  itemsCreated: number;
  itemsSkipped: number;
  entriesCreated: number;
  warnings: string[];
}

function normalize(value: string | null): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function identity(item: Pick<PlannedItem, 'kind' | 'manufacturer' | 'model' | 'serial' | 'notes'>): string {
  const distinguisher = normalize(item.serial) || `notes:${normalize(item.notes)}`;
  return [item.kind, normalize(item.manufacturer), normalize(item.model), distinguisher].join('|');
}

export class FleetImporter {
  constructor(
    private readonly manager: EntityManager,
    private readonly gear: GearService,
    private readonly maintenance: MaintenanceService,
  ) {}

  async apply(actor: User, ownerId: string, plan: FleetPlan): Promise<ImportReport> {
    const report: ImportReport = {
      rigsCreated: 0,
      rigsSkipped: 0,
      itemsCreated: 0,
      itemsSkipped: 0,
      entriesCreated: 0,
      warnings: [...plan.warnings],
    };
    const existingRigs = await this.manager.find(Rig, { where: { ownerId } });
    const existingItems = new Set((await this.manager.find(GearItem, { where: { ownerId } })).map((i) => identity(i)));

    for (const planned of plan.rigs) {
      let rig = existingRigs.find((r) => normalize(r.name) === normalize(planned.name));
      if (rig) {
        report.rigsSkipped += 1;
      } else {
        const created = await this.gear.createRig(actor, { name: planned.name, ownerId });
        if (!planned.active) {
          await this.gear.updateRig(actor, created.id, { active: false });
        }
        rig = { id: created.id } as Rig;
        report.rigsCreated += 1;
      }
      for (const item of planned.items) {
        await this.importItem(actor, ownerId, item, rig.id, planned.name, existingItems, report);
      }
    }
    for (const item of plan.spares) {
      await this.importItem(actor, ownerId, item, null, null, existingItems, report);
    }
    return report;
  }

  private async importItem(
    actor: User,
    ownerId: string,
    item: PlannedItem,
    rigId: string | null,
    rigName: string | null,
    existing: Set<string>,
    report: ImportReport,
  ): Promise<void> {
    if (existing.has(identity(item))) {
      report.itemsSkipped += 1;
      return;
    }
    try {
      const created = await this.gear.createItem(actor, {
        kind: item.kind,
        manufacturer: item.manufacturer,
        model: item.model,
        ownerId,
        ...(item.serial ? { serial: item.serial } : {}),
        ...(item.manufacturedOn ? { manufacturedOn: item.manufacturedOn } : {}),
        ...(item.notes ? { notes: item.notes } : {}),
        ...(rigId ? { rigId } : {}),
        details: item.details,
      });
      existing.add(identity(item));
      report.itemsCreated += 1;
      for (const entry of item.entries) {
        await this.maintenance.addEntry(actor, created.id, {
          kind: entry.kind,
          performedOn: entry.performedOn,
          description: entry.description,
        });
        report.entriesCreated += 1;
      }
    } catch (error) {
      if (error instanceof ConflictException) {
        report.warnings.push(
          `${rigName ?? 'Spare gear'}: ${item.kind} ${item.manufacturer} ${item.model} skipped (${error.message})`,
        );
        return;
      }
      throw error;
    }
  }
}
