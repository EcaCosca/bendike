import { ForbiddenException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { AadDetail } from '../gear/entities/details.entities';
import { GearItem } from '../gear/entities/gear-item.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { GearReadService } from '../gear/gear-read.service';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { linkedTo, noRiggers } from '../gear/testing/no-links';
import { Grounding } from '../bulletins/entities';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { WorkQueueService } from './work-queue.service';

const TODAY = '2026-09-19';

describe('WorkQueueService', () => {
  let manager: InMemoryManager;
  const rigger = buildUser({ role: Role.Rigger, displayName: 'Eca' });
  const otherRigger = buildUser({ role: Role.Rigger, displayName: 'Lucia' });
  const dropzone = buildUser({
    role: Role.Dropzone,
    displayName: 'Salta en Rosario',
    phone: '+5493415550002',
    locale: 'es',
  });
  const skydiver = buildUser({
    role: Role.User,
    displayName: 'Ana',
    phone: null,
    email: 'ana@bendike.example',
    locale: 'en',
  });
  const stranger = buildUser({ role: Role.User, displayName: 'Not linked' });
  const admin = buildUser({ role: Role.Admin });

  function service(
    links: [string, string][] = [
      [rigger.id, dropzone.id],
      [rigger.id, skydiver.id],
    ],
  ) {
    const lookup = linkedTo(...links);
    const access = new GearAccessService(lookup);
    const read = new GearReadService(manager as never, access, { today: () => TODAY }, noRiggers);
    return new WorkQueueService(manager as never, read, {
      activeOwnerIds: (riggerId: string) => Promise.resolve(links.filter(([r]) => r === riggerId).map(([, o]) => o)),
    });
  }

  function addRig(ownerId: string, name: string, active = true) {
    return manager.seed(Rig, { ownerId, name, notes: '', active });
  }

  function addItem(
    ownerId: string,
    kind: GearItem['kind'],
    rigId: string | null,
    model = 'X',
    serial: string | null = null,
  ) {
    return manager.seed(GearItem, {
      ownerId,
      rigId,
      modelId: null,
      kind,
      manufacturer: 'PD',
      model,
      serial,
      manufacturedOn: null,
      notes: '',
      retiredAt: null,
    });
  }

  function addEntry(gearItemId: string, values: Partial<MaintenanceEntry>) {
    return manager.seed(MaintenanceEntry, {
      gearItemId,
      kind: 'repack',
      result: null,
      performedOn: '2026-09-01',
      description: 'x',
      performedById: null,
      performedByName: 'Someone',
      performedByLicence: null,
      performedByContact: null,
      ownerReported: false,
      verifiedById: null,
      verifiedAt: null,
      voidedById: null,
      voidedAt: null,
      voidReason: null,
      ...values,
    });
  }

  beforeEach(() => {
    manager = new InMemoryManager();
    for (const user of [rigger, otherRigger, dropzone, skydiver, stranger, admin]) {
      manager.seed(User, user);
    }
    const micro = addRig(dropzone.id, 'Micro 3');
    const reserve = addItem(dropzone.id, 'reserve', micro.id, 'VR360', '10586');
    addEntry(reserve.id, { performedOn: '2026-03-01' });
    const aad = addItem(dropzone.id, 'aad', micro.id, 'Vigil 4', '20601');
    manager.seed(AadDetail, {
      gearItemId: aad.id,
      mode: null,
      batteryInstalledOn: null,
      batteryCycleMonths: null,
      serviceDueOn: null,
      expiresOn: '2026-11-20',
    });
    const ok = addRig(skydiver.id, 'Ana rig');
    const okReserve = addItem(skydiver.id, 'reserve', ok.id, 'PD Reserve', '77');
    addEntry(okReserve.id, { performedOn: '2026-09-10' });
    const strangerRig = addRig(stranger.id, 'Hidden rig');
    addItem(stranger.id, 'reserve', strangerRig.id, 'Hidden', '1');
  });

  test('lists what needs attention across the linked owners only, most urgent first', async () => {
    const result = await service().queue(rigger, {});

    expect(result.items.map((i) => [i.rig?.name, i.dueKind, i.status])).toEqual([
      ['Micro 3', 'repack', 'overdue'],
      ['Micro 3', 'expiry', 'due_soon'],
    ]);
    expect(result.total).toBe(2);
    expect(result.items.every((i) => i.owner.id === dropzone.id)).toBe(true);
  });

  test('each item carries the owner contact so the rigger can write to them', async () => {
    const [first] = (await service().queue(rigger, {})).items;

    expect(first?.owner).toMatchObject({
      displayName: 'Salta en Rosario',
      phone: '+5493415550002',
      locale: 'es',
      email: dropzone.email,
    });
    expect(first?.item).toMatchObject({ kind: 'reserve', model: 'VR360', serial: '10586' });
    expect(first?.daysLeft).toBeLessThan(0);
  });

  test('items of an owner the rigger is not linked to never appear, whatever the filter', async () => {
    const all = await service().queue(rigger, { status: 'all' });

    expect(all.items.some((i) => i.owner.id === stranger.id)).toBe(false);
    expect(all.owners.map((o) => o.id).sort()).toEqual([dropzone.id, skydiver.id].sort());
    expect((await service([]).queue(rigger, { status: 'all' })).items).toEqual([]);
    expect((await service().queue(otherRigger, { status: 'all' })).items).toEqual([]);
  });

  test('status all also lists the items that are fine', async () => {
    const all = await service().queue(rigger, { status: 'all' });

    expect(all.items.find((i) => i.owner.id === skydiver.id)?.status).toBe('ok');
  });

  test('filters by owner and component kind, and counts ignore the filters', async () => {
    const filtered = await service().queue(rigger, { status: 'all', ownerId: skydiver.id });

    expect(filtered.items.map((i) => i.owner.id)).toEqual([skydiver.id]);
    expect(filtered.counts).toMatchObject({ overdue: 1, due_soon: 1 });
    expect((await service().queue(rigger, { status: 'all', kind: 'aad' })).items.map((i) => i.item.kind)).toEqual([
      'aad',
    ]);
  });

  test('pages of the requested size with the total', async () => {
    const page1 = await service().queue(rigger, { status: 'all', pageSize: 2, page: 1 });
    const page2 = await service().queue(rigger, { status: 'all', pageSize: 2, page: 2 });

    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(page2.total);
    expect(page2.items.length).toBeGreaterThan(0);
    expect(page1.pageSize).toBe(2);
  });

  test('leaves out inactive rigs and lists spare components with no rig', async () => {
    addRig(dropzone.id, 'Old', false);
    const oldRig = (await manager.find(Rig, { where: { name: 'Old' } }))[0] as Rig;
    addItem(dropzone.id, 'reserve', oldRig.id, 'Old reserve', '5');
    addItem(dropzone.id, 'aad', null, 'Vigil 2', '45545');

    const result = await service().queue(rigger, { status: 'all' });

    expect(result.items.some((i) => i.item.serial === '5')).toBe(false);
    const spare = result.items.find((i) => i.item.serial === '45545');
    expect(spare?.rig).toBeNull();
    expect(spare?.status).toBe('no_data');
  });

  test('lists work an outside rigger did that still awaits verification, and grounds the rig', async () => {
    const rig = (await manager.find(Rig, { where: { name: 'Ana rig' } }))[0] as Rig;
    const reserve = (await manager.find(GearItem, { where: { rigId: rig.id } }))[0] as GearItem;
    addEntry(reserve.id, {
      performedOn: '2026-09-12',
      ownerReported: true,
      performedByName: 'Carlos Packer',
      performedByContact: '+54 9 341 555 0000',
    });

    const result = await service().queue(rigger, { status: 'all' });

    expect(result.verifications).toEqual([
      expect.objectContaining({
        owner: expect.objectContaining({ id: skydiver.id }),
        rig: { id: rig.id, name: 'Ana rig' },
        item: expect.objectContaining({ kind: 'reserve' }),
        performedByName: 'Carlos Packer',
        performedByContact: '+54 9 341 555 0000',
      }),
    ]);
    expect(result.counts).toMatchObject({ awaitingVerification: 1, grounded: 1 });
    expect(result.items.find((i) => i.owner.id === skydiver.id)?.rig?.grounded).toBe(true);
  });

  test('lists the grounded rigs awaiting clearance with each reason', async () => {
    const rig = (await manager.find(Rig, { where: { name: 'Ana rig' } }))[0] as Rig;
    manager.seed(Grounding, {
      rigId: rig.id,
      gearItemId: null,
      reason: 'Frayed cutaway handle',
      source: 'manual',
      bulletinMatchId: null,
      openedBy: rigger.id,
      openedAt: new Date(),
      closedBy: null,
      closedAt: null,
      closeNote: null,
    });

    const result = await service().queue(rigger, {});

    expect(result.groundedRigs).toEqual([
      {
        rig: { id: rig.id, name: 'Ana rig' },
        owner: { id: skydiver.id, displayName: 'Ana' },
        reasons: ['Grounded by Eca: Frayed cutaway handle'],
      },
    ]);
    expect(result.counts.grounded).toBe(1);
  });

  test('the same reason appears once when two components of a rig are grounded by the same bulletin', async () => {
    const rig = (await manager.find(Rig, { where: { name: 'Ana rig' } }))[0] as Rig;
    for (const bulletinMatchId of ['00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2']) {
      manager.seed(Grounding, {
        rigId: rig.id,
        gearItemId: null,
        reason: 'Bulletin SB-1 (PD): Slider check',
        source: 'bulletin',
        bulletinMatchId,
        openedBy: rigger.id,
        openedAt: new Date(),
        closedBy: null,
        closedAt: null,
        closeNote: null,
      });
    }

    const [row] = (await service().queue(rigger, {})).groundedRigs;

    expect(row?.reasons).toEqual(['Bulletin SB-1 (PD): Slider check']);
  });

  test('a cleared grounding no longer lists the rig, and inactive rigs are never listed', async () => {
    const rig = (await manager.find(Rig, { where: { name: 'Ana rig' } }))[0] as Rig;
    manager.seed(Grounding, {
      rigId: rig.id,
      gearItemId: null,
      reason: 'Old',
      source: 'manual',
      bulletinMatchId: null,
      openedBy: rigger.id,
      openedAt: new Date(),
      closedBy: rigger.id,
      closedAt: new Date(),
      closeNote: 'fixed',
    });

    expect((await service().queue(rigger, {})).groundedRigs).toEqual([]);
  });

  test('a user, a dropzone and an owner cannot open the queue, an admin sees every owner', async () => {
    await expect(service().queue(skydiver, {})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service().queue(dropzone, {})).rejects.toBeInstanceOf(ForbiddenException);
    const asAdmin = await service().queue(admin, { status: 'all' });

    expect(asAdmin.owners.map((o) => o.id).sort()).toEqual([dropzone.id, skydiver.id, stranger.id].sort());
  });

  describe('customers', () => {
    test('summarises each owner: rigs and how many need attention', async () => {
      const customers = await service().customers(rigger);

      expect(customers.map((c) => [c.owner.displayName, c.rigs, c.overdue, c.dueSoon, c.grounded])).toEqual([
        ['Ana', 1, 0, 0, 0],
        ['Salta en Rosario', 1, 1, 0, 0],
      ]);
    });

    test('only for riggers and admins', async () => {
      await expect(service().customers(skydiver)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
