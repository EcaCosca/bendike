import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  AUTHORITY_PAGE_SIZE,
  Role,
  paginate,
  type AuthorityGroundingRow,
  type AuthorityPage,
  type AuthoritySheetRow,
  type AuthorityWorkRow,
  type GearKind,
  type RiggerRegistryRow,
  type RiggerRegistrySort,
} from '@bendike/shared';
import type { EntityManager } from 'typeorm';
import { Grounding } from '../bulletins/entities';
import { toGroundingView } from '../bulletins/views';
import { GearItem } from '../gear/entities/gear-item.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { PackingSheet } from '../packing-sheets/packing-sheet.entity';
import { RiggerLink } from '../rigger-links/rigger-link.entity';
import { User } from '../users/user.entity';

const KIND_LABELS: Record<GearKind, string> = { container: 'Container', main: 'Main', reserve: 'Reserve', aad: 'AAD' };

export interface RegistryQuery {
  search?: string | undefined;
  sort?: RiggerRegistrySort | undefined;
  page?: number | undefined;
}

interface Records {
  sheets: PackingSheet[];
  entries: MaintenanceEntry[];
  groundings: Grounding[];
  links: RiggerLink[];
  voidedEntryIds: Set<string>;
}

const later = (a: Date | null, b: Date | null): Date | null => (a === null ? b : b === null ? a : a > b ? a : b);

@Injectable()
export class AuthorityService {
  constructor(@InjectEntityManager() private readonly manager: EntityManager) {}

  async registry(query: RegistryQuery): Promise<AuthorityPage<RiggerRegistryRow>> {
    const riggers = await this.manager.find(User, { where: { role: Role.Rigger } });
    const records = await this.records();
    const needle = query.search?.trim().toLowerCase();
    let rows = riggers.map((rigger) => this.row(rigger, records));
    if (needle) {
      rows = rows.filter((row) =>
        [row.displayName, row.email, row.licence ?? ''].some((part) => part.toLowerCase().includes(needle)),
      );
    }
    const byName = (a: RiggerRegistryRow, b: RiggerRegistryRow) =>
      a.displayName.localeCompare(b.displayName, 'en', { sensitivity: 'base', numeric: true });
    rows.sort(
      query.sort === 'activity'
        ? (a, b) => (b.lastActivityAt ?? '').localeCompare(a.lastActivityAt ?? '') || byName(a, b)
        : byName,
    );
    const { page, total } = paginate(rows, query.page ?? 1, AUTHORITY_PAGE_SIZE);
    return { rows: page, total };
  }

  async rigger(id: string): Promise<RiggerRegistryRow> {
    return this.row(await this.loadRigger(id), await this.records());
  }

  async sheets(riggerId: string, page: number): Promise<AuthorityPage<AuthoritySheetRow>> {
    await this.loadRigger(riggerId);
    const records = await this.records();
    const rigs = new Map((await this.manager.find(Rig)).map((rig) => [rig.id, rig.name]));
    const mine = records.sheets
      .filter((sheet) => sheet.riggerId === riggerId)
      .sort(
        (a, b) =>
          b.performedOn.localeCompare(a.performedOn) || (b.signedAt?.getTime() ?? 0) - (a.signedAt?.getTime() ?? 0),
      );
    const rows: AuthoritySheetRow[] = mine.map((sheet) => ({
      id: sheet.id,
      rigId: sheet.rigId,
      rigName: rigs.get(sheet.rigId) ?? '',
      sheetNo: sheet.sheetNo ?? 0,
      performedOn: sheet.performedOn,
      ownerName: sheet.ownerName,
      missingCount: sheet.missing?.length ?? 0,
      voided: sheet.entryId !== null && records.voidedEntryIds.has(sheet.entryId),
      signedAt: sheet.signedAt?.toISOString() ?? '',
    }));
    const { page: slice, total } = paginate(rows, page, AUTHORITY_PAGE_SIZE);
    return { rows: slice, total };
  }

  async work(riggerId: string, page: number): Promise<AuthorityPage<AuthorityWorkRow>> {
    await this.loadRigger(riggerId);
    const [entries, items, rigs, users] = await Promise.all([
      this.manager.find(MaintenanceEntry),
      this.manager.find(GearItem),
      this.manager.find(Rig),
      this.manager.find(User),
    ]);
    const itemById = new Map(items.map((item) => [item.id, item]));
    const rigName = new Map(rigs.map((rig) => [rig.id, rig.name]));
    const userName = new Map(users.map((user) => [user.id, user.displayName]));
    const rows: { row: AuthorityWorkRow; createdAt: number }[] = [];
    for (const entry of entries) {
      const performed = entry.performedById === riggerId && !entry.ownerReported;
      if (!performed && entry.verifiedById !== riggerId) continue;
      const item = itemById.get(entry.gearItemId);
      rows.push({
        createdAt: entry.createdAt.getTime(),
        row: {
          id: entry.id,
          relation: performed ? 'performed' : 'verified',
          performedOn: entry.performedOn,
          kind: entry.kind,
          result: entry.result,
          componentLabel: item ? `${KIND_LABELS[item.kind]} ${item.manufacturer} ${item.model}` : '',
          rigName: item?.rigId ? (rigName.get(item.rigId) ?? null) : null,
          ownerName: item ? (userName.get(item.ownerId) ?? '') : '',
          description: entry.description,
          voided: entry.voidedAt !== null,
          voidReason: entry.voidReason,
        },
      });
    }
    rows.sort((a, b) => b.row.performedOn.localeCompare(a.row.performedOn) || b.createdAt - a.createdAt);
    const { page: slice, total } = paginate(
      rows.map((r) => r.row),
      page,
      AUTHORITY_PAGE_SIZE,
    );
    return { rows: slice, total };
  }

  async groundings(riggerId: string, page: number): Promise<AuthorityPage<AuthorityGroundingRow>> {
    await this.loadRigger(riggerId);
    const [groundings, rigs, items, users] = await Promise.all([
      this.manager.find(Grounding),
      this.manager.find(Rig),
      this.manager.find(GearItem),
      this.manager.find(User),
    ]);
    const names = new Map(users.map((user) => [user.id, user.displayName]));
    const rigName = new Map(rigs.map((rig) => [rig.id, rig.name]));
    const itemRig = new Map(items.map((item) => [item.id, item.rigId]));
    const rows: AuthorityGroundingRow[] = groundings
      .filter((grounding) => grounding.openedBy === riggerId)
      .sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime())
      .map((grounding) => {
        const rigId = grounding.rigId ?? (grounding.gearItemId ? (itemRig.get(grounding.gearItemId) ?? null) : null);
        return { ...toGroundingView(grounding, names), rigName: rigId ? (rigName.get(rigId) ?? null) : null };
      });
    const { page: slice, total } = paginate(rows, page, AUTHORITY_PAGE_SIZE);
    return { rows: slice, total };
  }

  private async loadRigger(id: string): Promise<User> {
    const user = await this.manager.findOne(User, { where: { id } });
    if (!user || user.role !== Role.Rigger) {
      throw new NotFoundException('Rigger not found');
    }
    return user;
  }

  private async records(): Promise<Records> {
    const [sheets, entries, groundings, links] = await Promise.all([
      this.manager.find(PackingSheet, { where: { status: 'signed' } }),
      this.manager.find(MaintenanceEntry),
      this.manager.find(Grounding),
      this.manager.find(RiggerLink, { where: { status: 'active' } }),
    ]);
    const voidedEntryIds = new Set(entries.filter((entry) => entry.voidedAt !== null).map((entry) => entry.id));
    return { sheets, entries, groundings, links, voidedEntryIds };
  }

  private row(rigger: User, records: Records): RiggerRegistryRow {
    const sheets = records.sheets.filter((sheet) => sheet.riggerId === rigger.id);
    const performed = records.entries.filter((entry) => entry.performedById === rigger.id && !entry.ownerReported);
    const verified = records.entries.filter(
      (entry) => entry.verifiedById === rigger.id && entry.performedById !== rigger.id,
    );
    const recorded = [
      ...performed,
      ...records.entries.filter((entry) => entry.verifiedById === rigger.id && entry.ownerReported),
    ];
    const work = new Set(recorded.filter((entry) => entry.voidedAt === null).map((entry) => entry.id));
    const mine = records.groundings.filter((g) => g.openedBy === rigger.id || g.closedBy === rigger.id);

    let last: Date | null = null;
    for (const sheet of sheets) last = later(last, sheet.signedAt);
    for (const entry of performed) last = later(last, entry.createdAt);
    for (const entry of verified) last = later(last, entry.verifiedAt);
    for (const g of mine)
      last = later(
        later(last, g.openedBy === rigger.id ? g.openedAt : null),
        g.closedBy === rigger.id ? g.closedAt : null,
      );

    const newestSheet = [...sheets]
      .filter((sheet) => (sheet.riggerLicence ?? '').trim() !== '')
      .sort((a, b) => (b.signedAt?.getTime() ?? 0) - (a.signedAt?.getTime() ?? 0))[0];
    const newestEntry = [...performed]
      .filter((entry) => (entry.performedByLicence ?? '').trim() !== '')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    return {
      id: rigger.id,
      displayName: rigger.displayName,
      email: rigger.email,
      phone: rigger.phone,
      licence: newestSheet?.riggerLicence ?? newestEntry?.performedByLicence ?? null,
      signedSheets: sheets.filter((sheet) => sheet.entryId === null || !records.voidedEntryIds.has(sheet.entryId))
        .length,
      workRecorded: work.size,
      lastActivityAt: last?.toISOString() ?? null,
      customers: records.links.filter((link) => link.riggerId === rigger.id).length,
    };
  }
}
