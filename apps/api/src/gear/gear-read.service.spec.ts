import { NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { ComponentPart } from './entities/component-part.entity';
import { AadDetail, ReserveDetail } from './entities/details.entities';
import { GearItem } from './entities/gear-item.entity';
import { GearModel } from './entities/gear-model.entity';
import { MaintenanceEntry } from './entities/maintenance-entry.entity';
import { Rig } from './entities/rig.entity';
import { BulletinMatch, Grounding, ServiceBulletin } from '../bulletins/entities';
import { GearAccessService } from './gear-access.service';
import { GearReadService } from './gear-read.service';
import { noLinks, noRiggers } from './testing/no-links';
import { InMemoryManager } from './testing/in-memory-manager';

const TODAY = '2026-09-19';

describe('GearReadService', () => {
  let manager: InMemoryManager;
  let service: GearReadService;
  const owner = buildUser({ role: Role.Dropzone });
  const stranger = buildUser({ role: Role.User });

  function addRig(name: string, ownerId = owner.id, active = true): Rig {
    return manager.seed(Rig, { ownerId, name, notes: '', active });
  }

  function addItem(values: Partial<GearItem>): GearItem {
    return manager.seed(GearItem, {
      ownerId: owner.id,
      rigId: null,
      modelId: null,
      manufacturer: 'PD',
      model: 'VR360',
      serial: null,
      manufacturedOn: null,
      notes: '',
      retiredAt: null,
      ...values,
    });
  }

  function addRepack(gearItemId: string, performedOn: string, extra: Partial<MaintenanceEntry> = {}) {
    return manager.seed(MaintenanceEntry, {
      gearItemId,
      kind: 'repack',
      result: null,
      performedOn,
      description: 'Repack',
      performedById: null,
      performedByName: 'Eca',
      performedByLicence: null,
      performedByContact: null,
      ownerReported: false,
      verifiedById: null,
      verifiedAt: null,
      voidedById: null,
      voidedAt: null,
      voidReason: null,
      ...extra,
    });
  }

  beforeEach(() => {
    manager = new InMemoryManager();
    service = new GearReadService(manager as never, new GearAccessService(noLinks), { today: () => TODAY }, noRiggers);
  });

  describe('overview', () => {
    test('lists the rigs with their components, and components without a rig as spares', async () => {
      const rig = addRig('Micro 3');
      const reserve = addItem({ kind: 'reserve', rigId: rig.id });
      manager.seed(ReserveDetail, { gearItemId: reserve.id, sizeSqft: 143, repackCycleDays: null, deployments: 0 });
      addRepack(reserve.id, '2026-08-27');
      const aad = addItem({ kind: 'aad', manufacturer: 'AAD', model: 'Vigil 4', rigId: rig.id });
      manager.seed(AadDetail, {
        gearItemId: aad.id,
        mode: null,
        batteryInstalledOn: null,
        batteryCycleMonths: null,
        serviceDueOn: null,
        expiresOn: '2041-10-01',
      });
      addItem({ kind: 'aad', manufacturer: 'AAD', model: 'Vigil 2' });

      const overview = await service.overview(owner);

      expect(overview.rigs).toHaveLength(1);
      expect(overview.rigs[0]?.slots.reserve?.dues[0]).toMatchObject({ dueOn: '2027-02-23', status: 'ok' });
      expect(overview.rigs[0]?.slots.aad?.model).toBe('Vigil 4');
      expect(overview.spares.map((s) => s.model)).toEqual(['Vigil 2']);
    });

    test('leaves out retired components and other accounts gear', async () => {
      addItem({ kind: 'main', retiredAt: new Date('2026-01-01T00:00:00Z') });
      addItem({ kind: 'main', ownerId: stranger.id });
      addRig('Not mine', stranger.id);

      const overview = await service.overview(owner);

      expect(overview.spares).toEqual([]);
      expect(overview.rigs).toEqual([]);
    });

    test('orders rigs by name ignoring case', async () => {
      addRig('escuela 2');
      addRig('Escuela 11');
      addRig('Micro');

      expect((await service.overview(owner)).rigs.map((r) => r.name)).toEqual(['escuela 2', 'Escuela 11', 'Micro']);
    });

    test('uses the model rules of a component that points at a model', async () => {
      const model = manager.seed(GearModel, {
        kind: 'reserve',
        manufacturer: 'PD',
        model: 'VR360',
        repackCycleDays: 120,
        serviceIntervalMonths: null,
        batteryCycleMonths: null,
        lifeYears: null,
        active: true,
      });
      const reserve = addItem({ kind: 'reserve', modelId: model.id });
      addRepack(reserve.id, '2026-09-01');

      expect((await service.overview(owner)).spares[0]?.dues[0]?.dueOn).toBe('2026-12-30');
    });

    test('an admin can read another owner overview, a stranger cannot', async () => {
      addRig('Fleet rig');
      const admin = buildUser({ role: Role.Admin });

      expect((await service.overview(admin, owner.id)).rigs).toHaveLength(1);
      await expect(service.overview(stranger, owner.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    test('counts the summary over active rigs and spares and marks grounded rigs', async () => {
      const rig = addRig('A');
      const reserve = addItem({ kind: 'reserve', rigId: rig.id });
      addRepack(reserve.id, '2026-09-10', { ownerReported: true, performedByName: 'Outside Rigger' });
      addRig('Old', owner.id, false);

      const { summary } = await service.overview(owner);

      expect(summary.grounded).toBe(1);
      expect(summary.no_data).toBe(1);
    });
  });

  describe('riggers and inspections on the views', () => {
    test('a rig lists the riggers linked to its owner', async () => {
      const withRiggers = new GearReadService(
        manager as never,
        new GearAccessService(noLinks),
        { today: () => TODAY },
        {
          activeRiggers: () => Promise.resolve([{ id: 'r-1', displayName: 'Eca' }]),
        },
      );
      addRig('Micro 3');

      expect((await withRiggers.overview(owner)).rigs[0]?.riggers).toEqual([{ id: 'r-1', displayName: 'Eca' }]);
    });

    test('the last inspection and a grounded inspection show on the overview and the detail', async () => {
      const rig = addRig('Micro 3');
      const reserve = addItem({ kind: 'reserve', rigId: rig.id });
      manager.seed(MaintenanceEntry, {
        gearItemId: reserve.id,
        kind: 'inspection',
        result: 'grounded',
        performedOn: '2026-09-15',
        description: 'Cracked pilot chute handle',
        performedById: null,
        performedByName: 'Eca Rigger',
        performedByLicence: null,
        performedByContact: null,
        ownerReported: false,
        verifiedById: null,
        verifiedAt: null,
        voidedById: null,
        voidedAt: null,
        voidReason: null,
      });

      const fromOverview = (await service.overview(owner)).rigs[0];
      const fromDetail = await service.rigDetail(owner, rig.id);

      expect(fromOverview?.lastInspection).toMatchObject({ result: 'grounded', performedByName: 'Eca Rigger' });
      expect(fromOverview?.readiness.state).toBe('grounded');
      expect(fromDetail.readiness.reasons.map((r) => r.type)).toEqual(['inspection_grounded']);
    });
  });

  describe('groundings and bulletin notices', () => {
    function addGrounding(values: Partial<Grounding>) {
      return manager.seed(Grounding, {
        rigId: null,
        gearItemId: null,
        reason: 'Cracked handle',
        source: 'manual',
        bulletinMatchId: null,
        openedBy: rigger.id,
        openedAt: new Date('2026-09-18T10:00:00Z'),
        closedBy: null,
        closedAt: null,
        closeNote: null,
        ...values,
      });
    }

    const rigger = buildUser({ role: Role.Rigger, displayName: 'Eca Rigger' });

    beforeEach(() => {
      manager.seed(User, rigger);
    });

    test('an open grounding on a rig grounds it and says who opened it', async () => {
      const rig = addRig('Micro 3');
      addGrounding({ rigId: rig.id });

      const view = (await service.overview(owner)).rigs[0];

      expect(view?.readiness.state).toBe('grounded');
      expect(view?.readiness.reasons).toEqual([
        {
          type: 'grounding',
          grounding: expect.objectContaining({ reason: 'Cracked handle', openedByName: 'Eca Rigger', closedAt: null }),
        },
      ]);
    });

    test('an open grounding on one component grounds the whole rig and shows on that component', async () => {
      const rig = addRig('Micro 3');
      const aad = addItem({ kind: 'aad', rigId: rig.id });
      addGrounding({ gearItemId: aad.id });

      const view = (await service.overview(owner)).rigs[0];

      expect(view?.readiness.state).toBe('grounded');
      expect(view?.slots.aad?.groundings).toHaveLength(1);
    });

    test('a closed grounding no longer grounds, and stays in the detail history with who closed it', async () => {
      const rig = addRig('Micro 3');
      addGrounding({
        rigId: rig.id,
        closedBy: rigger.id,
        closedAt: new Date('2026-09-19T09:00:00Z'),
        closeNote: 'Handle replaced',
      });

      const overview = (await service.overview(owner)).rigs[0];
      const detail = await service.rigDetail(owner, rig.id);

      expect(overview?.readiness.state).toBe('airworthy');
      expect(detail.groundingHistory).toEqual([
        expect.objectContaining({ closedByName: 'Eca Rigger', closeNote: 'Handle replaced' }),
      ]);
    });

    test('a published bulletin with an open match shows on the component; withdrawn, draft and resolved ones do not', async () => {
      const rig = addRig('Micro 3');
      const reserve = addItem({ kind: 'reserve', rigId: rig.id });
      const make = (status: ServiceBulletin['status'], reference: string) =>
        manager.seed(ServiceBulletin, {
          manufacturer: 'PD',
          reference,
          title: `Bulletin ${reference}`,
          summary: 's',
          requiredAction: 'a',
          sourceUrl: null,
          issuedOn: '2026-09-01',
          severity: 'mandatory',
          status,
          createdBy: rigger.id,
          publishedAt: null,
        });
      const match = (bulletinId: string, matchStatus: BulletinMatch['status']) =>
        manager.seed(BulletinMatch, {
          bulletinId,
          gearItemId: reserve.id,
          confidence: 'exact',
          status: matchStatus,
          resolutionNote: null,
          resolvedBy: null,
          resolvedAt: null,
        });
      match(make('published', 'SB-OPEN').id, 'open');
      match(make('withdrawn', 'SB-OLD').id, 'open');
      match(make('draft', 'SB-DRAFT').id, 'open');
      match(make('published', 'SB-DONE').id, 'complied');

      const notices = (await service.overview(owner)).rigs[0]?.slots.reserve?.bulletins;

      expect(notices).toEqual([
        expect.objectContaining({
          reference: 'SB-OPEN',
          title: 'Bulletin SB-OPEN',
          severity: 'mandatory',
          confidence: 'exact',
        }),
      ]);
    });
  });

  describe('rigDetail', () => {
    test('returns the rig with the history of its components newest first, voided entries included', async () => {
      const rig = addRig('Micro 3');
      const reserve = addItem({ kind: 'reserve', rigId: rig.id });
      addRepack(reserve.id, '2026-01-10');
      addRepack(reserve.id, '2026-08-27');
      addRepack(reserve.id, '2026-05-01', { voidedAt: new Date('2026-05-02T00:00:00Z'), voidReason: 'wrong date' });

      const detail = await service.rigDetail(owner, rig.id);

      expect(detail.entries.map((e) => e.performedOn)).toEqual(['2026-08-27', '2026-05-01', '2026-01-10']);
      expect(detail.entries[1]?.voidReason).toBe('wrong date');
    });

    test('lists parts on the component', async () => {
      const rig = addRig('Micro 3');
      const main = addItem({ kind: 'main', rigId: rig.id });
      manager.seed(ComponentPart, {
        gearItemId: main.id,
        kind: 'bridle',
        description: 'Kill-line bridle',
        serial: null,
        manufacturedOn: null,
        notes: '',
      });

      expect((await service.rigDetail(owner, rig.id)).slots.main?.parts).toHaveLength(1);
    });

    test('a rig of another account or an unknown rig is 404', async () => {
      const rig = addRig('Micro 3');

      await expect(service.rigDetail(stranger, rig.id)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.rigDetail(owner, '00000000-0000-4000-8000-00000000ffff')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('itemDetail', () => {
    test('returns a spare component with its history', async () => {
      const spare = addItem({ kind: 'reserve' });
      addRepack(spare.id, '2026-08-27');

      const detail = await service.itemDetail(owner, spare.id);

      expect(detail.id).toBe(spare.id);
      expect(detail.entries).toHaveLength(1);
    });

    test('another account gets 404', async () => {
      const spare = addItem({ kind: 'reserve' });

      await expect(service.itemDetail(stranger, spare.id)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
