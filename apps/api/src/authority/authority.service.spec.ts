import { NotFoundException } from '@nestjs/common';
import { AUTHORITY_PAGE_SIZE, Role } from '@bendike/shared';
import { Grounding } from '../bulletins/entities';
import { GearItem } from '../gear/entities/gear-item.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { PackingSheet } from '../packing-sheets/packing-sheet.entity';
import { RiggerLink } from '../rigger-links/rigger-link.entity';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { AuthorityService } from './authority.service';

describe('AuthorityService', () => {
  let manager: InMemoryManager;
  let service: AuthorityService;
  const ana = buildUser({
    role: Role.Rigger,
    displayName: 'Ana Rigger',
    email: 'ana@bendike.example',
    phone: '+5491100000001',
  });
  const beto = buildUser({ role: Role.Rigger, displayName: 'Beto Rigger', email: 'beto@bendike.example', phone: null });
  const carla = buildUser({
    role: Role.Rigger,
    displayName: 'Carla Rigger',
    email: 'carla@bendike.example',
    phone: null,
  });
  const camila = buildUser({ role: Role.User, displayName: 'Camila Rossi' });
  const dropzone = buildUser({ role: Role.Dropzone, displayName: 'Aeroclub Demo' });
  let rig: Rig;
  let reserve: GearItem;
  let spare: GearItem;

  function sheetFields(riggerId: string, performedOn: string): Partial<PackingSheet> {
    return {
      rigId: rig.id,
      reserveItemId: reserve.id,
      ownerId: camila.id,
      riggerId,
      performedOn,
      checklistVersion: 'ciac-anac-1',
      checkedIds: [],
      bulletinsChecked: true,
      mardConnected: true,
      ownerName: 'Camila Rossi',
      ownerAddress: '',
      ownerPhone: '',
      ownerEmail: '',
      manualDocumentId: null,
      manualLabel: null,
      notes: '',
      elements: null,
      missing: [],
      riggerName: 'x',
      riggerLicence: 'AR-1',
      ownerNotifiedAt: null,
      ownerNotifiedTo: null,
    };
  }

  function draft(riggerId: string): PackingSheet {
    return manager.seed(PackingSheet, {
      ...sheetFields(riggerId, '2026-09-19'),
      status: 'draft',
      sheetNo: null,
      signedAt: null,
      entryId: null,
    });
  }

  function sheet(
    riggerId: string,
    no: number,
    performedOn: string,
    overrides: Partial<PackingSheet> = {},
  ): PackingSheet {
    const signedAt = new Date(`${performedOn}T15:00:00Z`);
    const entry = manager.seed(MaintenanceEntry, {
      createdAt: signedAt,
      gearItemId: reserve.id,
      kind: 'repack',
      performedOn,
      description: `Repack (packing sheet #${no})`,
      performedById: riggerId,
      performedByName: 'x',
      performedByLicence: null,
      ownerReported: false,
      voidedAt: overrides.notes === 'void' ? new Date('2026-09-01T00:00:00Z') : null,
      voidReason: overrides.notes === 'void' ? 'Wrong reserve' : null,
      verifiedAt: null,
      verifiedById: null,
      voidedById: null,
    });
    return manager.seed(PackingSheet, {
      ...sheetFields(riggerId, performedOn),
      status: 'signed',
      sheetNo: no,
      signedAt,
      entryId: entry.id,
      ...overrides,
    });
  }

  beforeEach(() => {
    manager = new InMemoryManager();
    service = new AuthorityService(manager as never);
    for (const user of [ana, beto, carla, camila, dropzone]) manager.seed(User, user);
    rig = manager.seed(Rig, { ownerId: camila.id, name: "Camila's rig", notes: '', active: true });
    reserve = manager.seed(GearItem, {
      ownerId: camila.id,
      rigId: rig.id,
      modelId: null,
      kind: 'reserve',
      manufacturer: 'PD',
      model: 'Optimum 143',
      serial: 'R-1',
      manufacturedOn: null,
      notes: '',
      retiredAt: null,
    });
    spare = manager.seed(GearItem, {
      ownerId: dropzone.id,
      rigId: null,
      modelId: null,
      kind: 'aad',
      manufacturer: 'Vigil',
      model: 'Vigil 4',
      serial: 'A-1',
      manufacturedOn: null,
      notes: '',
      retiredAt: null,
    });
  });

  describe('registry', () => {
    beforeEach(() => {
      sheet(ana.id, 1, '2026-03-10', { riggerLicence: 'AR-OLD' });
      sheet(ana.id, 2, '2026-09-01', { riggerLicence: 'AR-4521' });
      sheet(ana.id, 3, '2026-09-05', { notes: 'void', riggerLicence: 'AR-4521' });
      draft(ana.id);
      manager.seed(MaintenanceEntry, {
        gearItemId: spare.id,
        kind: 'battery',
        performedOn: '2026-09-10',
        createdAt: new Date('2026-09-10T12:00:00Z'),
        description: 'Battery',
        performedById: ana.id,
        performedByName: 'Ana',
        performedByLicence: 'AR-4521',
        ownerReported: false,
        verifiedAt: null,
        verifiedById: null,
        voidedAt: null,
        voidedById: null,
        voidReason: null,
      });
      manager.seed(MaintenanceEntry, {
        gearItemId: spare.id,
        kind: 'repack',
        performedOn: '2026-09-11',
        createdAt: new Date('2026-09-11T12:00:00Z'),
        description: 'Owner reported',
        performedById: dropzone.id,
        performedByName: 'Outside',
        performedByLicence: null,
        ownerReported: true,
        verifiedAt: new Date('2026-09-12T09:00:00Z'),
        verifiedById: ana.id,
        voidedAt: null,
        voidedById: null,
        voidReason: null,
      });
      manager.seed(RiggerLink, {
        ownerId: camila.id,
        riggerId: ana.id,
        status: 'active',
        initiatedBy: camila.id,
        confirmedAt: new Date(),
        endedAt: null,
      });
      manager.seed(RiggerLink, {
        ownerId: dropzone.id,
        riggerId: ana.id,
        status: 'active',
        initiatedBy: ana.id,
        confirmedAt: new Date(),
        endedAt: null,
      });
      manager.seed(RiggerLink, {
        ownerId: dropzone.id,
        riggerId: beto.id,
        status: 'pending',
        initiatedBy: beto.id,
        confirmedAt: null,
        endedAt: null,
      });
    });

    test('lists every rigger and only riggers, with contact, counts and customers', async () => {
      const { rows, total } = await service.registry({});

      expect(total).toBe(3);
      expect(rows.map((r) => r.displayName)).toEqual(['Ana Rigger', 'Beto Rigger', 'Carla Rigger']);
      expect(rows[0]).toMatchObject({
        email: 'ana@bendike.example',
        phone: '+5491100000001',
        signedSheets: 2,
        customers: 2,
      });
      expect(rows[1]).toMatchObject({ signedSheets: 0, workRecorded: 0, customers: 0, lastActivityAt: null });
    });

    test('counts sheets that are not void, and the work a rigger recorded or verified that is not void', async () => {
      const [row] = (await service.registry({})).rows;

      expect(row?.signedSheets).toBe(2);
      // two live sheet entries, one battery they performed and one outside repack they verified
      expect(row?.workRecorded).toBe(4);
    });

    test('takes the licence from the latest signed sheet, else from the latest entry, else none', async () => {
      const { rows } = await service.registry({});
      expect(rows.find((r) => r.id === ana.id)?.licence).toBe('AR-4521');
      expect(rows.find((r) => r.id === beto.id)?.licence).toBeNull();

      manager.seed(MaintenanceEntry, {
        gearItemId: spare.id,
        kind: 'battery',
        performedOn: '2026-08-01',
        createdAt: new Date('2026-08-01T12:00:00Z'),
        description: 'b',
        performedById: beto.id,
        performedByName: 'Beto',
        performedByLicence: 'AR-777',
        ownerReported: false,
        verifiedAt: null,
        verifiedById: null,
        voidedAt: null,
        voidedById: null,
        voidReason: null,
      });
      expect((await service.registry({})).rows.find((r) => r.id === beto.id)?.licence).toBe('AR-777');
    });

    test('the last activity is the newest thing the rigger did', async () => {
      manager.seed(Grounding, {
        rigId: rig.id,
        gearItemId: null,
        reason: 'Frayed handle',
        source: 'manual',
        bulletinMatchId: null,
        openedBy: ana.id,
        openedAt: new Date('2026-09-18T10:00:00Z'),
        closedBy: null,
        closedAt: null,
        closeNote: null,
      });

      const [row] = (await service.registry({})).rows;

      expect(row?.lastActivityAt).toBe('2026-09-18T10:00:00.000Z');
    });

    test('searches by name, email or licence, ignoring case', async () => {
      expect((await service.registry({ search: 'beto' })).rows.map((r) => r.displayName)).toEqual(['Beto Rigger']);
      expect((await service.registry({ search: 'CARLA@' })).rows.map((r) => r.displayName)).toEqual(['Carla Rigger']);
      expect((await service.registry({ search: 'ar-4521' })).rows.map((r) => r.displayName)).toEqual(['Ana Rigger']);
      expect((await service.registry({ search: 'nobody' })).total).toBe(0);
    });

    test('sorts by last activity, newest first and those with none last', async () => {
      const { rows } = await service.registry({ sort: 'activity' });

      expect(rows.map((r) => r.displayName)).toEqual(['Ana Rigger', 'Beto Rigger', 'Carla Rigger']);
    });

    test('pages 25 a page', async () => {
      for (let i = 0; i < 27; i++)
        manager.seed(User, buildUser({ role: Role.Rigger, displayName: `Rigger ${String(i).padStart(2, '0')}` }));

      const first = await service.registry({ page: 1 });
      const second = await service.registry({ page: 2 });

      expect(first.total).toBe(30);
      expect(first.rows).toHaveLength(AUTHORITY_PAGE_SIZE);
      expect(second.rows).toHaveLength(5);
    });
  });

  describe('one rigger', () => {
    test('returns the registry row of a rigger, and 404 for anyone else', async () => {
      sheet(ana.id, 1, '2026-09-01');

      await expect(service.rigger(ana.id)).resolves.toMatchObject({ displayName: 'Ana Rigger', signedSheets: 1 });
      await expect(service.rigger(camila.id)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.rigger('00000000-0000-4000-8000-00000000ffff')).rejects.toBeInstanceOf(NotFoundException);
    });

    test('the signed sheets are the rigger own, newest first, with the rig, the owner and what was missing', async () => {
      sheet(ana.id, 1, '2026-03-10');
      sheet(ana.id, 2, '2026-09-01', { missing: [{ code: 'no_aad' }, { code: 'no_container' }] });
      sheet(ana.id, 3, '2026-09-05', { notes: 'void' });
      sheet(beto.id, 1, '2026-09-08');
      draft(ana.id);

      const { rows, total } = await service.sheets(ana.id, 1);

      expect(total).toBe(3);
      expect(rows.map((r) => r.sheetNo)).toEqual([3, 2, 1]);
      expect(rows[0]).toMatchObject({ rigName: "Camila's rig", ownerName: 'Camila Rossi', voided: true });
      expect(rows[1]).toMatchObject({ missingCount: 2, voided: false, performedOn: '2026-09-01' });
    });

    test('the work is what the rigger performed and what they verified, with its component, rig and owner', async () => {
      manager.seed(MaintenanceEntry, {
        gearItemId: reserve.id,
        kind: 'inspection',
        result: 'passed',
        performedOn: '2026-06-01',
        createdAt: new Date('2026-06-01T12:00:00Z'),
        description: 'Annual inspection',
        performedById: ana.id,
        performedByName: 'Ana',
        performedByLicence: null,
        ownerReported: false,
        verifiedAt: null,
        verifiedById: null,
        voidedAt: null,
        voidedById: null,
        voidReason: null,
      });
      manager.seed(MaintenanceEntry, {
        gearItemId: spare.id,
        kind: 'repack',
        performedOn: '2026-09-11',
        createdAt: new Date('2026-09-11T12:00:00Z'),
        description: 'Outside repack',
        performedById: dropzone.id,
        performedByName: 'Outside',
        performedByLicence: null,
        ownerReported: true,
        verifiedAt: new Date('2026-09-12T09:00:00Z'),
        verifiedById: ana.id,
        voidedAt: null,
        voidedById: null,
        voidReason: null,
      });
      manager.seed(MaintenanceEntry, {
        gearItemId: reserve.id,
        kind: 'repair',
        performedOn: '2026-05-01',
        createdAt: new Date('2026-05-01T12:00:00Z'),
        description: 'Wrong',
        performedById: ana.id,
        performedByName: 'Ana',
        performedByLicence: null,
        ownerReported: false,
        verifiedAt: null,
        verifiedById: null,
        voidedAt: new Date('2026-05-02T00:00:00Z'),
        voidedById: ana.id,
        voidReason: 'Entered twice',
      });
      manager.seed(MaintenanceEntry, {
        gearItemId: reserve.id,
        kind: 'repair',
        performedOn: '2026-05-05',
        createdAt: new Date('2026-05-05T12:00:00Z'),
        description: 'Someone else',
        performedById: beto.id,
        performedByName: 'Beto',
        performedByLicence: null,
        ownerReported: false,
        verifiedAt: null,
        verifiedById: null,
        voidedAt: null,
        voidedById: null,
        voidReason: null,
      });

      const { rows, total } = await service.work(ana.id, 1);

      expect(total).toBe(3);
      expect(rows.map((r) => `${r.performedOn} ${r.kind} ${r.relation}`)).toEqual([
        '2026-09-11 repack verified',
        '2026-06-01 inspection performed',
        '2026-05-01 repair performed',
      ]);
      expect(rows[0]).toMatchObject({
        componentLabel: 'AAD Vigil Vigil 4',
        rigName: null,
        ownerName: 'Aeroclub Demo',
        voided: false,
      });
      expect(rows[1]).toMatchObject({
        componentLabel: 'Reserve PD Optimum 143',
        rigName: "Camila's rig",
        ownerName: 'Camila Rossi',
        result: 'passed',
      });
      expect(rows[2]).toMatchObject({ voided: true, voidReason: 'Entered twice' });
    });

    test('the groundings are the ones the rigger opened, with the rig name', async () => {
      manager.seed(Grounding, {
        rigId: rig.id,
        gearItemId: null,
        reason: 'Frayed handle',
        source: 'manual',
        bulletinMatchId: null,
        openedBy: ana.id,
        openedAt: new Date('2026-09-18T10:00:00Z'),
        closedBy: ana.id,
        closedAt: new Date('2026-09-19T10:00:00Z'),
        closeNote: 'Replaced',
      });
      manager.seed(Grounding, {
        rigId: rig.id,
        gearItemId: null,
        reason: 'Other rigger',
        source: 'manual',
        bulletinMatchId: null,
        openedBy: beto.id,
        openedAt: new Date('2026-09-17T10:00:00Z'),
        closedBy: null,
        closedAt: null,
        closeNote: null,
      });

      const { rows, total } = await service.groundings(ana.id, 1);

      expect(total).toBe(1);
      expect(rows[0]).toMatchObject({
        rigName: "Camila's rig",
        reason: 'Frayed handle',
        openedByName: 'Ana Rigger',
        closedByName: 'Ana Rigger',
        closeNote: 'Replaced',
      });
    });

    test('every list refuses an id that is not a rigger', async () => {
      await expect(service.sheets(camila.id, 1)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.work(camila.id, 1)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.groundings(camila.id, 1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
