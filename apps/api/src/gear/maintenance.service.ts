import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  SAFETY_KINDS,
  type CreateMaintenanceEntryRequestBody,
  type GearKind,
  type MaintenanceEntryView,
  type MaintenanceKind,
} from '@bendike/shared';
import type { EntityManager } from 'typeorm';
import { Role } from '@bendike/shared';
import type { User } from '../users/user.entity';
import { AadDetail } from './entities/details.entities';
import { GearItem } from './entities/gear-item.entity';
import { MaintenanceEntry } from './entities/maintenance-entry.entity';
import { GearAccessService } from './gear-access.service';
import { GearClock } from './gear-clock';
import { toEntryView } from './gear-views';

const KIND_FITS: Partial<Record<MaintenanceKind, GearKind>> = {
  repack: 'reserve',
  reline: 'main',
  kill_line: 'main',
  aad_service: 'aad',
  battery: 'aad',
};

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly access: GearAccessService,
    private readonly clock: GearClock,
  ) {}

  async addEntry(
    actor: User,
    gearItemId: string,
    body: CreateMaintenanceEntryRequestBody,
  ): Promise<MaintenanceEntryView> {
    const item = await this.manager.findOne(GearItem, { where: { id: gearItemId } });
    if (!item) {
      throw new NotFoundException('Gear item not found');
    }
    const signedOff = await this.access.canSignOff(actor, item.ownerId);
    if (!signedOff) {
      await this.access.assertEdit(actor, item.ownerId);
    }
    this.validate(item, body, !signedOff);

    const entry = await this.manager.save(
      this.manager.create(MaintenanceEntry, {
        gearItemId: item.id,
        kind: body.kind,
        result: body.result ?? null,
        performedOn: body.performedOn,
        description: body.description.trim(),
        performedById: actor.id,
        performedByName: this.performerName(actor, body, !signedOff),
        performedByLicence: blankToNull(body.performedByLicence),
        performedByContact: signedOff ? null : blankToNull(body.performedByContact),
        ownerReported: !signedOff,
        verifiedById: null,
        verifiedAt: null,
        voidedById: null,
        voidedAt: null,
        voidReason: null,
      }),
    );
    if (body.kind === 'aad_service') {
      await this.storeNextService(item.id, body.nextServiceDueOn ?? null);
    }
    return toEntryView(entry);
  }

  async voidEntry(actor: User, entryId: string, reason: string): Promise<MaintenanceEntryView> {
    const { entry, item } = await this.load(entryId);
    await this.access.assertRead(actor, item.ownerId);
    if (actor.role !== Role.Admin && entry.performedById !== actor.id) {
      throw new ForbiddenException('Only the author or an admin can void an entry');
    }
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException('Say why the entry is void');
    }
    if (entry.voidedAt !== null) {
      throw new ConflictException('The entry is already void');
    }
    entry.voidedAt = new Date();
    entry.voidedById = actor.id;
    entry.voidReason = trimmed;
    return toEntryView(await this.manager.save(entry));
  }

  async verifyEntry(actor: User, entryId: string): Promise<MaintenanceEntryView> {
    const { entry, item } = await this.load(entryId);
    await this.access.assertSignOff(actor, item.ownerId);
    if (!entry.ownerReported || entry.voidedAt !== null || entry.verifiedAt !== null) {
      throw new ConflictException('Only an open owner-reported entry can be verified');
    }
    entry.verifiedAt = new Date();
    entry.verifiedById = actor.id;
    return toEntryView(await this.manager.save(entry));
  }

  private async load(entryId: string): Promise<{ entry: MaintenanceEntry; item: GearItem }> {
    const entry = await this.manager.findOne(MaintenanceEntry, { where: { id: entryId } });
    const item = entry ? await this.manager.findOne(GearItem, { where: { id: entry.gearItemId } }) : null;
    if (!entry || !item) {
      throw new NotFoundException('Entry not found');
    }
    return { entry, item };
  }

  private validate(item: GearItem, body: CreateMaintenanceEntryRequestBody, ownerReported: boolean): void {
    if (body.kind === 'assembly') {
      throw new BadRequestException('Assembly entries are written by Bendike when gear moves');
    }
    if (body.performedOn > this.clock.today()) {
      throw new BadRequestException('The work cannot be dated in the future');
    }
    const fits = KIND_FITS[body.kind];
    if (fits && fits !== item.kind) {
      throw new BadRequestException(`A ${body.kind.replace('_', ' ')} entry belongs on a ${fits}, not a ${item.kind}`);
    }
    if (body.kind === 'inspection') {
      if (ownerReported) {
        throw new ForbiddenException('Only a rigger records an inspection');
      }
      if (!body.result) {
        throw new BadRequestException('An inspection needs a result');
      }
    } else if (body.result) {
      throw new BadRequestException('Only an inspection carries a result');
    }
    if (ownerReported && SAFETY_KINDS.includes(body.kind) && !body.performedByName?.trim()) {
      throw new BadRequestException('Say who did the work');
    }
  }

  private performerName(actor: User, body: CreateMaintenanceEntryRequestBody, ownerReported: boolean): string {
    if (ownerReported) {
      return body.performedByName?.trim() || actor.displayName;
    }
    return actor.displayName;
  }

  private async storeNextService(gearItemId: string, nextServiceDueOn: string | null): Promise<void> {
    const existing = await this.manager.findOne(AadDetail, { where: { gearItemId } });
    const detail =
      existing ??
      this.manager.create(AadDetail, {
        gearItemId,
        mode: null,
        batteryInstalledOn: null,
        batteryCycleMonths: null,
        expiresOn: null,
      });
    detail.serviceDueOn = nextServiceDueOn;
    await this.manager.save(detail);
  }
}
