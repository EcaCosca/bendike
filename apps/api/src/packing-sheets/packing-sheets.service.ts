import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  PACKING_CHECKLIST_VERSION,
  PACKING_ELEMENT_KINDS,
  Role,
  sanitizeCheckedIds,
  sheetProblems,
  signingBlockers,
  type PackingComponentInfo,
  type PackingComponents,
  type PackingElements,
  type PackingJobView,
  type PackingSheetSummary,
  type PackingSheetView,
  type SavePackingDraftRequestBody,
} from '@bendike/shared';
import type { EntityManager } from 'typeorm';
import { findCatalogueModel, resolveBulletinsLink } from '../gear/bulletins-link';
import { GearModel } from '../gear/entities/gear-model.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { GearClock } from '../gear/gear-clock';
import { GearReadService } from '../gear/gear-read.service';
import { LibraryService } from '../library/library.service';
import { User } from '../users/user.entity';
import { GearItem } from '../gear/entities/gear-item.entity';
import { PackingSheet } from './packing-sheet.entity';
import { toSheetView, toSummary } from './packing-sheet-views';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class PackingSheetsService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly access: GearAccessService,
    private readonly read: GearReadService,
    private readonly library: LibraryService,
    private readonly clock: GearClock,
  ) {}

  async start(actor: User, rigId: string): Promise<PackingJobView> {
    const rig = await this.manager.findOne(Rig, { where: { id: rigId } });
    if (!rig) {
      throw new NotFoundException('Rig not found');
    }
    await this.access.assertSignOff(actor, rig.ownerId);
    const reserve = (await this.read.detailOf(rig)).slots.reserve;
    if (!reserve) {
      throw new BadRequestException('This rig has no reserve to pack');
    }
    const existing = await this.manager.findOne(PackingSheet, {
      where: { riggerId: actor.id, rigId: rig.id, status: 'draft' },
    });
    if (existing) {
      return this.jobOf(existing);
    }
    const owner = await this.manager.findOne(User, { where: { id: rig.ownerId } });
    const sheet = await this.manager.save(
      this.manager.create(PackingSheet, {
        rigId: rig.id,
        reserveItemId: reserve.id,
        ownerId: rig.ownerId,
        riggerId: actor.id,
        status: 'draft',
        sheetNo: null,
        performedOn: this.clock.today(),
        checklistVersion: PACKING_CHECKLIST_VERSION,
        checkedIds: [],
        bulletinsChecked: null,
        mardConnected: null,
        ownerName: owner?.displayName ?? '',
        ownerAddress: '',
        ownerPhone: owner?.phone ?? '',
        ownerEmail: owner?.email ?? '',
        manualDocumentId: null,
        manualLabel: null,
        notes: '',
        elements: null,
        missing: null,
        riggerName: actor.displayName,
        riggerLicence: null,
        signedAt: null,
        entryId: null,
      }),
    );
    return this.jobOf(sheet);
  }

  async job(actor: User, sheetId: string): Promise<PackingJobView> {
    const sheet = await this.load(sheetId);
    if (sheet.status === 'draft') {
      await this.assertAuthor(actor, sheet);
    } else {
      await this.access.assertRead(actor, sheet.ownerId);
    }
    return this.jobOf(sheet);
  }

  async saveDraft(actor: User, sheetId: string, body: SavePackingDraftRequestBody): Promise<PackingJobView> {
    const sheet = await this.load(sheetId);
    await this.assertAuthor(actor, sheet);
    if (sheet.status !== 'draft') {
      throw new ConflictException('A signed sheet cannot be changed');
    }
    if (body.performedOn !== undefined) {
      if (!DATE_ONLY.test(body.performedOn)) {
        throw new BadRequestException('performedOn must be a date in YYYY-MM-DD form');
      }
      sheet.performedOn = body.performedOn;
    }
    if (body.checkedIds !== undefined) sheet.checkedIds = sanitizeCheckedIds(body.checkedIds);
    if (body.bulletinsChecked !== undefined) sheet.bulletinsChecked = body.bulletinsChecked;
    if (body.mardConnected !== undefined) sheet.mardConnected = body.mardConnected;
    if (body.ownerName !== undefined) sheet.ownerName = body.ownerName.trim();
    if (body.ownerAddress !== undefined) sheet.ownerAddress = body.ownerAddress.trim();
    if (body.ownerPhone !== undefined) sheet.ownerPhone = body.ownerPhone.trim();
    if (body.ownerEmail !== undefined) sheet.ownerEmail = body.ownerEmail.trim();
    if (body.notes !== undefined) sheet.notes = body.notes;
    if (body.manualDocumentId !== undefined) {
      await this.chooseManual(sheet, body.manualDocumentId);
    }
    return this.jobOf(await this.manager.save(sheet));
  }

  async sign(actor: User, sheetId: string, riggerLicence: string): Promise<PackingSheetView> {
    const sheet = await this.load(sheetId);
    await this.assertAuthor(actor, sheet);
    if (sheet.status !== 'draft') {
      throw new ConflictException('The sheet is already signed');
    }
    const rig = await this.manager.findOne(Rig, { where: { id: sheet.rigId } });
    if (!rig) {
      throw new NotFoundException('Rig not found');
    }
    const slots = (await this.read.detailOf(rig)).slots;
    if (!slots.reserve) {
      throw new BadRequestException('This rig has no reserve to pack');
    }
    const elements: PackingElements = { reserve: null, container: null, aad: null };
    for (const kind of PACKING_ELEMENT_KINDS) {
      const item = slots[kind];
      elements[kind] = item
        ? {
            kind,
            manufacturer: item.manufacturer,
            model: item.model,
            serial: item.serial,
            manufacturedOn: item.manufacturedOn,
          }
        : null;
    }
    const state = {
      checkedIds: sheet.checkedIds,
      bulletinsChecked: sheet.bulletinsChecked,
      mardConnected: sheet.mardConnected,
      elements,
    };
    const blockers = signingBlockers({
      ...state,
      notes: sheet.notes,
      riggerLicence,
      performedOn: sheet.performedOn,
      today: this.clock.today(),
    });
    if (blockers.length > 0) {
      throw new BadRequestException(blockers.join('. '));
    }

    const reserveId = slots.reserve.id;
    const signed = await this.manager.transaction(async (tx) => {
      const mine = await tx.find(PackingSheet, { where: { riggerId: actor.id, status: 'signed' } });
      const sheetNo = mine.reduce((highest, other) => Math.max(highest, other.sheetNo ?? 0), 0) + 1;
      const entry = await tx.save(
        tx.create(MaintenanceEntry, {
          gearItemId: reserveId,
          kind: 'repack',
          result: null,
          performedOn: sheet.performedOn,
          description: `Repack (packing sheet #${sheetNo})`,
          performedById: actor.id,
          performedByName: actor.displayName,
          performedByLicence: riggerLicence.trim(),
          performedByContact: null,
          ownerReported: false,
          verifiedById: null,
          verifiedAt: null,
          voidedById: null,
          voidedAt: null,
          voidReason: null,
        }),
      );
      sheet.reserveItemId = reserveId;
      sheet.status = 'signed';
      sheet.sheetNo = sheetNo;
      sheet.elements = elements;
      sheet.missing = sheetProblems(state);
      sheet.riggerName = actor.displayName;
      sheet.riggerLicence = riggerLicence.trim();
      sheet.signedAt = new Date();
      sheet.entryId = entry.id;
      return tx.save(sheet);
    });
    return (await this.jobOf(signed)).sheet;
  }

  async list(actor: User, scope: { rigId?: string; reserveItemId?: string }): Promise<PackingSheetSummary[]> {
    if (scope.rigId) {
      const rig = await this.manager.findOne(Rig, { where: { id: scope.rigId } });
      if (!rig) throw new NotFoundException('Rig not found');
      await this.access.assertRead(actor, rig.ownerId);
    } else if (scope.reserveItemId) {
      const item = await this.manager.findOne(GearItem, { where: { id: scope.reserveItemId } });
      if (!item) throw new NotFoundException('Gear item not found');
      await this.access.assertRead(actor, item.ownerId);
    } else {
      throw new BadRequestException('Say which rig or reserve to list the sheets of');
    }
    const sheets = await this.manager.find(PackingSheet, {
      where: scope.rigId
        ? { rigId: scope.rigId, status: 'signed' }
        : { reserveItemId: scope.reserveItemId, status: 'signed' },
    });
    sheets.sort(
      (a, b) =>
        b.performedOn.localeCompare(a.performedOn) || (b.signedAt?.getTime() ?? 0) - (a.signedAt?.getTime() ?? 0),
    );
    const rigs = await this.manager.find(Rig);
    const summaries: PackingSheetSummary[] = [];
    for (const sheet of sheets) {
      const rig = rigs.find((r) => r.id === sheet.rigId);
      summaries.push(toSummary(sheet, await this.contextOf(sheet, rig as Rig)));
    }
    return summaries;
  }

  async voidSheet(actor: User, sheetId: string, reason: string): Promise<PackingSheetView> {
    const sheet = await this.load(sheetId);
    await this.access.assertRead(actor, sheet.ownerId);
    if (sheet.status !== 'signed' || !sheet.entryId) {
      throw new ConflictException('Only a signed sheet can be voided');
    }
    if (actor.role !== Role.Admin && actor.id !== sheet.riggerId) {
      throw new ForbiddenException('Only the rigger who signed the sheet, or an admin, can void it');
    }
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException('Say why the sheet is void');
    }
    const entryId = sheet.entryId;
    await this.manager.transaction(async (tx) => {
      const entry = await tx.findOne(MaintenanceEntry, { where: { id: entryId } });
      if (!entry || entry.voidedAt !== null) {
        throw new ConflictException('The sheet is already void');
      }
      entry.voidedAt = new Date();
      entry.voidedById = actor.id;
      entry.voidReason = trimmed;
      await tx.save(entry);
    });
    return (await this.jobOf(sheet)).sheet;
  }

  private async chooseManual(sheet: PackingSheet, documentId: string | null): Promise<void> {
    if (documentId === null) {
      sheet.manualDocumentId = null;
      sheet.manualLabel = null;
      return;
    }
    const doc = await this.library.view(documentId).catch(() => {
      throw new BadRequestException('That document is not in the Library');
    });
    sheet.manualDocumentId = doc.id;
    sheet.manualLabel = `${doc.title}${doc.revision ? ` (${doc.revision})` : ''}`.slice(0, 300);
  }

  private async load(sheetId: string): Promise<PackingSheet> {
    const sheet = await this.manager.findOne(PackingSheet, { where: { id: sheetId } });
    if (!sheet) {
      throw new NotFoundException('Packing sheet not found');
    }
    return sheet;
  }

  private async assertAuthor(actor: User, sheet: PackingSheet): Promise<void> {
    if (actor.role !== Role.Admin && actor.id !== sheet.riggerId) {
      throw new NotFoundException('Packing sheet not found');
    }
    await this.access.assertSignOff(actor, sheet.ownerId);
  }

  private async jobOf(sheet: PackingSheet): Promise<PackingJobView> {
    const rig = await this.manager.findOne(Rig, { where: { id: sheet.rigId } });
    if (!rig) {
      throw new NotFoundException('Rig not found');
    }
    const context = await this.contextOf(sheet, rig);
    if (sheet.status === 'signed') {
      return { sheet: toSheetView(sheet, context), components: { reserve: null, container: null, aad: null } };
    }
    const detail = await this.read.detailOf(rig);
    const reserve = detail.slots.reserve;
    if (!reserve) {
      throw new BadRequestException('This rig has no reserve to pack');
    }
    if (reserve.id !== sheet.reserveItemId) {
      sheet.reserveItemId = reserve.id;
      await this.manager.save(sheet);
    }
    return { sheet: toSheetView(sheet, context), components: await this.componentsOf(detail.slots) };
  }

  private async contextOf(sheet: PackingSheet, rig: Rig) {
    const entry = sheet.entryId ? await this.manager.findOne(MaintenanceEntry, { where: { id: sheet.entryId } }) : null;
    return { rigName: rig.name, voided: entry?.voidedAt != null, voidReason: entry?.voidReason ?? null };
  }

  private async componentsOf(
    slots: Awaited<ReturnType<GearReadService['detailOf']>>['slots'],
  ): Promise<PackingComponents> {
    const catalogue = await this.manager.find(GearModel);
    const components: PackingComponents = { reserve: null, container: null, aad: null };
    for (const kind of PACKING_ELEMENT_KINDS) {
      const item = slots[kind];
      if (!item) continue;
      const model = findCatalogueModel(item, catalogue);
      const info: PackingComponentInfo = {
        kind,
        itemId: item.id,
        manufacturer: item.manufacturer,
        model: item.model,
        serial: item.serial,
        manufacturedOn: item.manufacturedOn,
        modelId: model?.id ?? null,
        bulletinsLink: resolveBulletinsLink(model, catalogue),
        openBulletins: item.bulletins,
        manuals: model ? await this.library.forModel(model.id) : [],
      };
      components[kind] = info;
    }
    return components;
  }
}
