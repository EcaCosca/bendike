import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { AadDetail } from './entities/details.entities';
import { GearItem } from './entities/gear-item.entity';
import { MaintenanceEntry } from './entities/maintenance-entry.entity';
import { GearAccessService } from './gear-access.service';
import { MaintenanceService } from './maintenance.service';
import { linkedTo, noLinks } from './testing/no-links';
import { InMemoryManager } from './testing/in-memory-manager';

const TODAY = '2026-09-19';

describe('MaintenanceService', () => {
  let manager: InMemoryManager;
  let service: MaintenanceService;
  const dropzone = buildUser({ role: Role.Dropzone, displayName: 'Salta en Rosario' });
  const skydiver = buildUser({ role: Role.User, displayName: 'Ana' });
  const rigger = buildUser({ role: Role.Rigger, displayName: 'Eca Rigger' });
  const admin = buildUser({ role: Role.Admin, displayName: 'Admin' });

  beforeEach(() => {
    manager = new InMemoryManager();
    service = new MaintenanceService(manager as never, new GearAccessService(noLinks), { today: () => TODAY });
  });

  function addItem(kind: GearItem['kind'], ownerId: string): GearItem {
    return manager.seed(GearItem, {
      ownerId,
      rigId: null,
      modelId: null,
      kind,
      manufacturer: 'PD',
      model: 'VR360',
      serial: null,
      manufacturedOn: null,
      notes: '',
      retiredAt: null,
    });
  }

  describe('addEntry by an owner', () => {
    test('records an owner-reported repack with the outside rigger, unverified', async () => {
      const reserve = addItem('reserve', dropzone.id);

      const entry = await service.addEntry(dropzone, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'Repack, new pilot chute',
        performedByName: 'Carlos Packer',
        performedByContact: '+54 9 341 555 0000',
        performedByLicence: 'AR-123',
      });

      expect(entry).toMatchObject({
        kind: 'repack',
        ownerReported: true,
        performedByName: 'Carlos Packer',
        performedByContact: '+54 9 341 555 0000',
        performedByLicence: 'AR-123',
        performedById: dropzone.id,
        verifiedAt: null,
      });
    });

    test('a repack, AAD service or repair must say who did the work', async () => {
      const reserve = addItem('reserve', skydiver.id);
      const aad = addItem('aad', skydiver.id);

      await expect(
        service.addEntry(skydiver, reserve.id, { kind: 'repack', performedOn: '2026-09-10', description: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.addEntry(skydiver, aad.id, {
          kind: 'aad_service',
          performedOn: '2026-09-10',
          description: 'x',
          performedByName: '  ',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    test('other work defaults to the owner as the person who did it', async () => {
      const main = addItem('main', skydiver.id);

      const entry = await service.addEntry(skydiver, main.id, {
        kind: 'reline',
        performedOn: '2026-09-10',
        description: 'Relined',
      });

      expect(entry).toMatchObject({ performedByName: 'Ana', ownerReported: true });
    });

    test('an owner cannot record an inspection', async () => {
      const reserve = addItem('reserve', dropzone.id);

      await expect(
        service.addEntry(dropzone, reserve.id, {
          kind: 'inspection',
          performedOn: '2026-09-10',
          description: 'x',
          result: 'passed',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    test('gear of another account is 404', async () => {
      const reserve = addItem('reserve', dropzone.id);

      await expect(
        service.addEntry(skydiver, reserve.id, {
          kind: 'repack',
          performedOn: '2026-09-10',
          description: 'x',
          performedByName: 'Z',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('addEntry by a rigger or an admin', () => {
    test('a rigger logging on their own gear signs off: named, not owner-reported', async () => {
      const reserve = addItem('reserve', rigger.id);

      const entry = await service.addEntry(rigger, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'Repack',
        performedByLicence: 'AR-1',
      });

      expect(entry).toMatchObject({
        ownerReported: false,
        performedByName: 'Eca Rigger',
        performedById: rigger.id,
        performedByLicence: 'AR-1',
      });
    });

    test('an admin signs off gear of any owner and may record an inspection', async () => {
      const reserve = addItem('reserve', dropzone.id);

      const entry = await service.addEntry(admin, reserve.id, {
        kind: 'inspection',
        performedOn: '2026-09-10',
        description: 'Looks good',
        result: 'passed',
      });

      expect(entry).toMatchObject({ kind: 'inspection', result: 'passed', ownerReported: false });
    });

    test('an inspection needs a result and only an inspection may carry one', async () => {
      const reserve = addItem('reserve', rigger.id);

      await expect(
        service.addEntry(rigger, reserve.id, { kind: 'inspection', performedOn: '2026-09-10', description: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.addEntry(rigger, reserve.id, {
          kind: 'repack',
          performedOn: '2026-09-10',
          description: 'x',
          result: 'passed',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('validation', () => {
    test('a work kind must fit the component: repack on a reserve, service on an AAD, reline on a main', async () => {
      const main = addItem('main', rigger.id);
      const reserve = addItem('reserve', rigger.id);

      await expect(
        service.addEntry(rigger, main.id, { kind: 'repack', performedOn: '2026-09-10', description: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.addEntry(rigger, reserve.id, { kind: 'aad_service', performedOn: '2026-09-10', description: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.addEntry(rigger, reserve.id, { kind: 'reline', performedOn: '2026-09-10', description: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    test('the API never lets assembly entries be typed and refuses dates in the future', async () => {
      const reserve = addItem('reserve', rigger.id);

      await expect(
        service.addEntry(rigger, reserve.id, { kind: 'assembly', performedOn: '2026-09-10', description: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.addEntry(rigger, reserve.id, { kind: 'repack', performedOn: '2026-09-20', description: 'x' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.addEntry(rigger, reserve.id, { kind: 'repack', performedOn: TODAY, description: 'today is fine' }),
      ).resolves.toBeDefined();
    });

    test('an unknown component is 404', async () => {
      await expect(
        service.addEntry(rigger, '00000000-0000-4000-8000-00000000ffff', {
          kind: 'other',
          performedOn: TODAY,
          description: 'x',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('AAD service entries', () => {
    test('store the next service date on the AAD, or clear the typed one', async () => {
      const aad = addItem('aad', rigger.id);
      manager.seed(AadDetail, {
        gearItemId: aad.id,
        mode: null,
        batteryInstalledOn: null,
        batteryCycleMonths: null,
        serviceDueOn: '2025-04-01',
        expiresOn: '2034-10-01',
      });

      await service.addEntry(rigger, aad.id, {
        kind: 'aad_service',
        performedOn: '2026-09-10',
        description: 'Manufacturer service',
        nextServiceDueOn: '2030-09-10',
      });
      expect((await manager.findOne(AadDetail, { where: { gearItemId: aad.id } }))?.serviceDueOn).toBe('2030-09-10');

      await service.addEntry(rigger, aad.id, { kind: 'aad_service', performedOn: '2026-09-11', description: 'again' });
      expect((await manager.findOne(AadDetail, { where: { gearItemId: aad.id } }))?.serviceDueOn).toBeNull();
    });

    test('create the details row when the AAD has none yet', async () => {
      const aad = addItem('aad', rigger.id);

      await service.addEntry(rigger, aad.id, {
        kind: 'aad_service',
        performedOn: '2026-09-10',
        description: 'Service',
        nextServiceDueOn: '2031-09-10',
      });

      expect((await manager.findOne(AadDetail, { where: { gearItemId: aad.id } }))?.serviceDueOn).toBe('2031-09-10');
    });
  });

  describe('voidEntry', () => {
    async function ownerEntry() {
      const reserve = addItem('reserve', skydiver.id);
      const created = await service.addEntry(skydiver, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'x',
        performedByName: 'Z',
      });
      return { reserve, created };
    }

    test('the author voids with a reason, the entry is kept', async () => {
      const { created } = await ownerEntry();

      const voided = await service.voidEntry(skydiver, created.id, ' typed the wrong date ');

      expect(voided).toMatchObject({ voidReason: 'typed the wrong date' });
      expect(voided.voidedAt).not.toBeNull();
      expect(await manager.count(MaintenanceEntry)).toBe(1);
    });

    test('an admin can void any entry; a different owner cannot even see it', async () => {
      const { created } = await ownerEntry();

      await expect(service.voidEntry(dropzone, created.id, 'x')).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.voidEntry(admin, created.id, 'duplicate')).resolves.toMatchObject({
        voidReason: 'duplicate',
      });
    });

    test('a reason is required and an entry can be voided only once', async () => {
      const { created } = await ownerEntry();

      await expect(service.voidEntry(skydiver, created.id, '   ')).rejects.toBeInstanceOf(BadRequestException);
      await service.voidEntry(skydiver, created.id, 'wrong');
      await expect(service.voidEntry(skydiver, created.id, 'again')).rejects.toBeInstanceOf(ConflictException);
    });

    test('someone who can read the gear but did not write the entry may not void it', async () => {
      const reserve = addItem('reserve', rigger.id);
      const written = await service.addEntry(rigger, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'x',
      });
      const otherRigger = buildUser({ role: Role.Rigger });

      await expect(service.voidEntry(otherRigger, written.id, 'x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('verifyEntry', () => {
    async function unverified() {
      const reserve = addItem('reserve', dropzone.id);
      return service.addEntry(dropzone, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'x',
        performedByName: 'Outside Rigger',
      });
    }

    test('an admin verifies an owner-reported entry, recording who and when', async () => {
      const entry = await unverified();

      const verified = await service.verifyEntry(admin, entry.id);

      expect(verified.verifiedById).toBe(admin.id);
      expect(verified.verifiedAt).not.toBeNull();
    });

    test('the owner cannot verify their own entry', async () => {
      const entry = await unverified();

      await expect(service.verifyEntry(dropzone, entry.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    test('a signed-off, voided or already verified entry cannot be verified', async () => {
      const reserve = addItem('reserve', rigger.id);
      const signed = await service.addEntry(rigger, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'x',
      });
      await expect(service.verifyEntry(admin, signed.id)).rejects.toBeInstanceOf(ConflictException);

      const entry = await unverified();
      await service.verifyEntry(admin, entry.id);
      await expect(service.verifyEntry(admin, entry.id)).rejects.toBeInstanceOf(ConflictException);

      const other = await unverified();
      await service.voidEntry(dropzone, other.id, 'oops');
      await expect(service.verifyEntry(admin, other.id)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('a rigger linked to the owner', () => {
    const unlinkedRigger = buildUser({ role: Role.Rigger, displayName: 'Unlinked' });
    let linked: MaintenanceService;

    beforeEach(() => {
      linked = new MaintenanceService(manager as never, new GearAccessService(linkedTo([rigger.id, dropzone.id])), {
        today: () => TODAY,
      });
    });

    test('signs off work on the owner gear under their own name, with the licence they give', async () => {
      const reserve = addItem('reserve', dropzone.id);

      const entry = await linked.addEntry(rigger, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'Repack',
        performedByLicence: 'AR-1',
      });

      expect(entry).toMatchObject({
        ownerReported: false,
        performedByName: 'Eca Rigger',
        performedById: rigger.id,
        performedByLicence: 'AR-1',
        performedByContact: null,
      });
    });

    test('records an inspection with a result, which an owner cannot', async () => {
      const reserve = addItem('reserve', dropzone.id);

      const entry = await linked.addEntry(rigger, reserve.id, {
        kind: 'inspection',
        performedOn: '2026-09-10',
        description: 'Pins, closing loop and hardware checked',
        result: 'passed',
      });

      expect(entry).toMatchObject({ kind: 'inspection', result: 'passed', ownerReported: false });
    });

    test('a rigger with no link to the owner gets 404', async () => {
      const reserve = addItem('reserve', dropzone.id);

      await expect(
        linked.addEntry(unlinkedRigger, reserve.id, { kind: 'repack', performedOn: '2026-09-10', description: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    test('verifies the work an outside rigger did, recording who and when', async () => {
      const reserve = addItem('reserve', dropzone.id);
      const outside = await service.addEntry(dropzone, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'x',
        performedByName: 'Outside Rigger',
      });

      const verified = await linked.verifyEntry(rigger, outside.id);

      expect(verified).toMatchObject({ verifiedById: rigger.id });
      await expect(linked.verifyEntry(unlinkedRigger, outside.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    test('voids their own entries but not the owner, and not another author', async () => {
      const reserve = addItem('reserve', dropzone.id);
      const own = await linked.addEntry(rigger, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-10',
        description: 'x',
      });
      const owners = await service.addEntry(dropzone, reserve.id, {
        kind: 'repack',
        performedOn: '2026-09-09',
        description: 'y',
        performedByName: 'Z',
      });

      await expect(linked.voidEntry(rigger, own.id, 'wrong date')).resolves.toMatchObject({ voidReason: 'wrong date' });
      await expect(linked.voidEntry(rigger, owners.id, 'not mine')).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
