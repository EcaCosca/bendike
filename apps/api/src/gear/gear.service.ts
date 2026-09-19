import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import type {
  ComponentPartView,
  CreateGearItemRequestBody,
  CreatePartRequestBody,
  CreateRigRequestBody,
  GearItemView,
  GearKind,
  RigView,
  UpdateGearItemRequestBody,
  UpdatePartRequestBody,
  UpdateRigRequestBody,
} from '@bendike/shared';
import { IsNull, type DeepPartial, type EntityManager } from 'typeorm';
import { BulletinMatcher } from '../bulletins/bulletin-matcher';
import { User } from '../users/user.entity';
import { ComponentPart } from './entities/component-part.entity';
import { AadDetail, ContainerDetail, MainDetail, ReserveDetail } from './entities/details.entities';
import { GearItem } from './entities/gear-item.entity';
import { GearModel } from './entities/gear-model.entity';
import { MaintenanceEntry } from './entities/maintenance-entry.entity';
import { Rig } from './entities/rig.entity';
import { GearAccessService } from './gear-access.service';
import { GearClock } from './gear-clock';
import { GearReadService } from './gear-read.service';
import { toPartView, type DetailRow } from './gear-views';

const DETAIL_ENTITIES: Record<GearKind, new () => DetailRow> = {
  container: ContainerDetail,
  main: MainDetail,
  reserve: ReserveDetail,
  aad: AadDetail,
};

const DETAIL_FIELDS: Record<GearKind, readonly string[]> = {
  container: ['harnessSize', 'tso'],
  main: ['sizeSqft', 'lineType'],
  reserve: ['sizeSqft', 'repackCycleDays', 'deployments'],
  aad: ['mode', 'batteryInstalledOn', 'batteryCycleMonths', 'serviceDueOn', 'expiresOn'],
};

const DETAIL_DEFAULTS: Record<GearKind, Record<string, unknown>> = {
  container: { harnessSize: null, tso: null },
  main: { sizeSqft: null, lineType: null },
  reserve: { sizeSqft: null, repackCycleDays: null, deployments: 0 },
  aad: { mode: null, batteryInstalledOn: null, batteryCycleMonths: null, serviceDueOn: null, expiresOn: null },
};

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export interface ItemMatcher {
  rematchItem(itemId: string): Promise<unknown>;
}

@Injectable()
export class GearService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly access: GearAccessService,
    private readonly read: GearReadService,
    private readonly clock: GearClock,
    @Inject(BulletinMatcher) private readonly matcher: ItemMatcher,
  ) {}

  async createRig(actor: User, body: CreateRigRequestBody): Promise<RigView> {
    const ownerId = await this.ownerFor(actor, body.ownerId);
    const rig = this.manager.create(Rig, { ownerId, name: body.name.trim(), notes: body.notes ?? '', active: true });
    return this.read.rigView(await this.manager.save(rig));
  }

  async updateRig(actor: User, id: string, body: UpdateRigRequestBody): Promise<RigView> {
    const rig = await this.manager.findOne(Rig, { where: { id } });
    if (!rig) {
      throw new NotFoundException('Rig not found');
    }
    await this.access.assertEdit(actor, rig.ownerId);
    if (body.name !== undefined) {
      rig.name = body.name.trim();
    }
    if (body.notes !== undefined) {
      rig.notes = body.notes;
    }
    if (body.active !== undefined) {
      rig.active = body.active;
    }
    return this.read.rigView(await this.manager.save(rig));
  }

  async createItem(actor: User, body: CreateGearItemRequestBody): Promise<GearItemView> {
    const ownerId = await this.ownerFor(actor, body.ownerId);
    const rig = body.rigId ? await this.rigFor(actor, body.rigId, ownerId) : null;
    if (rig) {
      await this.assertSlotFree(rig.id, body.kind);
    }
    if (body.modelId) {
      await this.assertModel(body.modelId, body.kind);
    }
    const item = await this.manager.save(
      this.manager.create(GearItem, {
        ownerId,
        rigId: rig?.id ?? null,
        modelId: body.modelId ?? null,
        kind: body.kind,
        manufacturer: body.manufacturer.trim(),
        model: body.model.trim(),
        serial: blankToNull(body.serial),
        manufacturedOn: body.manufacturedOn ?? null,
        notes: body.notes ?? '',
        retiredAt: null,
      }),
    );
    await this.saveDetails(item.kind, item.id, body.details);
    if (rig) {
      await this.logAssembly(actor, item.id, `Assigned to rig ${rig.name}`);
    }
    await this.matcher.rematchItem(item.id);
    return this.read.itemView(item.id);
  }

  async updateItem(actor: User, id: string, body: UpdateGearItemRequestBody): Promise<GearItemView> {
    const item = await this.itemFor(actor, id);
    if (body.manufacturer !== undefined) {
      item.manufacturer = body.manufacturer.trim();
    }
    if (body.model !== undefined) {
      item.model = body.model.trim();
    }
    if (body.serial !== undefined) {
      item.serial = blankToNull(body.serial);
    }
    if (body.manufacturedOn !== undefined) {
      item.manufacturedOn = body.manufacturedOn;
    }
    if (body.notes !== undefined) {
      item.notes = body.notes;
    }
    if (body.modelId !== undefined) {
      if (body.modelId !== null) {
        await this.assertModel(body.modelId, item.kind);
      }
      item.modelId = body.modelId;
    }
    if (body.retired === false) {
      item.retiredAt = null;
    }
    if (body.retired === true && item.retiredAt === null) {
      const previous = item.rigId ? await this.manager.findOne(Rig, { where: { id: item.rigId } }) : null;
      item.retiredAt = new Date();
      item.rigId = null;
      await this.logAssembly(actor, item.id, previous ? `Retired (it was in rig ${previous.name})` : 'Retired');
    } else if (body.rigId !== undefined && body.rigId !== item.rigId) {
      await this.moveToRig(actor, item, body.rigId);
    }
    await this.manager.save(item);
    if (body.details) {
      await this.saveDetails(item.kind, item.id, body.details);
    }
    if (
      body.manufacturer !== undefined ||
      body.model !== undefined ||
      body.serial !== undefined ||
      body.manufacturedOn !== undefined
    ) {
      await this.matcher.rematchItem(item.id);
    }
    return this.read.itemView(item.id);
  }

  async addPart(actor: User, itemId: string, body: CreatePartRequestBody): Promise<ComponentPartView> {
    const item = await this.itemFor(actor, itemId);
    const part = this.manager.create(ComponentPart, {
      gearItemId: item.id,
      kind: body.kind,
      description: body.description.trim(),
      serial: blankToNull(body.serial),
      manufacturedOn: body.manufacturedOn ?? null,
      notes: body.notes ?? '',
    });
    return toPartView(await this.manager.save(part));
  }

  async updatePart(actor: User, partId: string, body: UpdatePartRequestBody): Promise<ComponentPartView> {
    const part = await this.partFor(actor, partId);
    if (body.kind !== undefined) {
      part.kind = body.kind;
    }
    if (body.description !== undefined) {
      part.description = body.description.trim();
    }
    if (body.serial !== undefined) {
      part.serial = blankToNull(body.serial);
    }
    if (body.manufacturedOn !== undefined) {
      part.manufacturedOn = body.manufacturedOn;
    }
    if (body.notes !== undefined) {
      part.notes = body.notes;
    }
    return toPartView(await this.manager.save(part));
  }

  async deletePart(actor: User, partId: string): Promise<void> {
    await this.manager.remove(await this.partFor(actor, partId));
  }

  private async ownerFor(actor: User, requested: string | undefined): Promise<string> {
    const ownerId = requested ?? actor.id;
    await this.access.assertEdit(actor, ownerId);
    if (ownerId !== actor.id && !(await this.manager.findOne(User, { where: { id: ownerId } }))) {
      throw new NotFoundException('Owner not found');
    }
    return ownerId;
  }

  private async itemFor(actor: User, id: string): Promise<GearItem> {
    const item = await this.manager.findOne(GearItem, { where: { id } });
    if (!item) {
      throw new NotFoundException('Gear item not found');
    }
    await this.access.assertEdit(actor, item.ownerId);
    return item;
  }

  private async partFor(actor: User, partId: string): Promise<ComponentPart> {
    const part = await this.manager.findOne(ComponentPart, { where: { id: partId } });
    if (!part) {
      throw new NotFoundException('Part not found');
    }
    await this.itemFor(actor, part.gearItemId);
    return part;
  }

  private async rigFor(actor: User, rigId: string, ownerId: string): Promise<Rig> {
    const rig = await this.manager.findOne(Rig, { where: { id: rigId } });
    if (!rig) {
      throw new NotFoundException('Rig not found');
    }
    if (rig.ownerId !== ownerId) {
      if (!(await this.access.canRead(actor, rig.ownerId))) {
        throw new NotFoundException('Rig not found');
      }
      throw new ConflictException('The rig belongs to another account');
    }
    return rig;
  }

  private async assertSlotFree(rigId: string, kind: GearKind, exceptItemId?: string): Promise<void> {
    const occupant = await this.manager.findOne(GearItem, { where: { rigId, kind, retiredAt: IsNull() } });
    if (occupant && occupant.id !== exceptItemId) {
      throw new ConflictException(`The rig already has a ${kind}`);
    }
  }

  private async assertModel(modelId: string, kind: GearKind): Promise<void> {
    const model = await this.manager.findOne(GearModel, { where: { id: modelId } });
    if (!model) {
      throw new NotFoundException('Gear model not found');
    }
    if (model.kind !== kind) {
      throw new BadRequestException(`That model is a ${model.kind}, not a ${kind}`);
    }
  }

  private async moveToRig(actor: User, item: GearItem, rigId: string | null): Promise<void> {
    if (item.retiredAt !== null && rigId !== null) {
      throw new ConflictException('A retired component cannot be assigned to a rig');
    }
    const previous = item.rigId ? await this.manager.findOne(Rig, { where: { id: item.rigId } }) : null;
    const target = rigId ? await this.rigFor(actor, rigId, item.ownerId) : null;
    if (target) {
      await this.assertSlotFree(target.id, item.kind, item.id);
    }
    item.rigId = target?.id ?? null;
    if (previous && target) {
      await this.logAssembly(actor, item.id, `Moved from rig ${previous.name} to rig ${target.name}`);
    } else if (target) {
      await this.logAssembly(actor, item.id, `Assigned to rig ${target.name}`);
    } else if (previous) {
      await this.logAssembly(actor, item.id, `Removed from rig ${previous.name}`);
    }
  }

  private async saveDetails(kind: GearKind, gearItemId: string, details: object | undefined): Promise<void> {
    const entityClass = DETAIL_ENTITIES[kind];
    const existing = await this.manager.findOne(entityClass, { where: { gearItemId } });
    const row =
      existing ?? this.manager.create(entityClass, { gearItemId, ...DETAIL_DEFAULTS[kind] } as DeepPartial<DetailRow>);
    const values = (details ?? {}) as Record<string, unknown>;
    for (const field of DETAIL_FIELDS[kind]) {
      if (values[field] !== undefined) {
        (row as unknown as Record<string, unknown>)[field] = values[field] === '' ? null : values[field];
      }
    }
    await this.manager.save(row);
  }

  private async logAssembly(actor: User, gearItemId: string, description: string): Promise<void> {
    await this.manager.save(
      this.manager.create(MaintenanceEntry, {
        gearItemId,
        kind: 'assembly',
        result: null,
        performedOn: this.clock.today(),
        description,
        performedById: actor.id,
        performedByName: actor.displayName,
        performedByLicence: null,
        performedByContact: null,
        ownerReported: false,
        verifiedById: null,
        verifiedAt: null,
        voidedById: null,
        voidedAt: null,
        voidReason: null,
      }),
    );
  }
}
