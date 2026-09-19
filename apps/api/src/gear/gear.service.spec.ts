import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { ComponentPart } from './entities/component-part.entity';
import { AadDetail, ReserveDetail } from './entities/details.entities';
import { GearItem } from './entities/gear-item.entity';
import { GearModel } from './entities/gear-model.entity';
import { MaintenanceEntry } from './entities/maintenance-entry.entity';
import { Rig } from './entities/rig.entity';
import { GearAccessService } from './gear-access.service';
import { GearReadService } from './gear-read.service';
import { GearService } from './gear.service';
import { noLinks, noRiggers } from './testing/no-links';
import { InMemoryManager } from './testing/in-memory-manager';

const TODAY = '2026-09-19';
const MISSING = '00000000-0000-4000-8000-00000000ffff';

describe('GearService', () => {
  let manager: InMemoryManager;
  let service: GearService;
  let rematch: jest.Mock;
  const dropzone = buildUser({ role: Role.Dropzone, displayName: 'Salta en Rosario' });
  const stranger = buildUser({ role: Role.User });
  const admin = buildUser({ role: Role.Admin });

  beforeEach(() => {
    manager = new InMemoryManager();
    for (const user of [dropzone, stranger, admin]) {
      manager.seed(User, user);
    }
    const access = new GearAccessService(noLinks);
    const clock = { today: () => TODAY };
    rematch = jest.fn().mockResolvedValue({ matched: 0, groundings: 0 });
    service = new GearService(
      manager as never,
      access,
      new GearReadService(manager as never, access, clock, noRiggers),
      clock,
      { rematchItem: rematch },
    );
  });

  const logOf = (gearItemId: string) => manager.find(MaintenanceEntry, { where: { gearItemId } });

  describe('createRig', () => {
    test('creates an active rig owned by the caller with four empty slots', async () => {
      const rig = await service.createRig(dropzone, { name: '  Micro 3 ', notes: 'Tandem' });

      expect(rig).toMatchObject({ name: 'Micro 3', notes: 'Tandem', active: true, ownerId: dropzone.id });
      expect(rig.slots).toEqual({ container: null, main: null, reserve: null, aad: null });
    });

    test('an admin can create a rig for another account, anyone else gets 404', async () => {
      const forDropzone = await service.createRig(admin, { name: 'Fleet 1', ownerId: dropzone.id });

      expect(forDropzone.ownerId).toBe(dropzone.id);
      await expect(service.createRig(stranger, { name: 'X', ownerId: dropzone.id })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    test('an unknown owner is 404', async () => {
      await expect(service.createRig(admin, { name: 'X', ownerId: MISSING })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateRig', () => {
    test('renames, changes notes and toggles active without losing anything', async () => {
      const rig = await service.createRig(dropzone, { name: 'Micro 3' });

      const updated = await service.updateRig(dropzone, rig.id, { name: 'Micro 4', notes: 'x', active: false });

      expect(updated).toMatchObject({ name: 'Micro 4', notes: 'x', active: false });
    });

    test("another account's rig is 404", async () => {
      const rig = await service.createRig(dropzone, { name: 'Micro 3' });

      await expect(service.updateRig(stranger, rig.id, { name: 'Mine now' })).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.updateRig(dropzone, MISSING, { name: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createItem', () => {
    test('creates a spare component with the details of its kind', async () => {
      const view = await service.createItem(dropzone, {
        kind: 'reserve',
        manufacturer: ' PD ',
        model: 'VR360',
        serial: '10586',
        manufacturedOn: '2020-09-01',
        details: { sizeSqft: 143, repackCycleDays: 90 },
      });

      expect(view).toMatchObject({
        kind: 'reserve',
        manufacturer: 'PD',
        serial: '10586',
        rigId: null,
        details: { sizeSqft: 143, repackCycleDays: 90, deployments: 0 },
      });
      expect(await manager.count(ReserveDetail)).toBe(1);
    });

    test('ignores detail fields that belong to another kind and turns a blank serial into none', async () => {
      const view = await service.createItem(dropzone, {
        kind: 'aad',
        manufacturer: 'AAD',
        model: 'Vigil 4',
        serial: '  ',
        details: { expiresOn: '2041-10-01', sizeSqft: 143 },
      });

      expect(view.serial).toBeNull();
      expect(view.details).toMatchObject({ expiresOn: '2041-10-01' });
      expect(view.details).not.toHaveProperty('sizeSqft');
    });

    test('assigns to a rig with a free slot and logs an assembly entry on the component', async () => {
      const rig = await service.createRig(dropzone, { name: 'Micro 3' });

      const view = await service.createItem(dropzone, {
        kind: 'container',
        manufacturer: 'UPT',
        model: 'Micro Sigma',
        rigId: rig.id,
      });

      expect(view.rigId).toBe(rig.id);
      const [entry] = await logOf(view.id);
      expect(entry).toMatchObject({ kind: 'assembly', ownerReported: false, performedById: dropzone.id });
      expect(entry?.description).toContain('Micro 3');
    });

    test('a second component of a kind on one rig is 409, a retired one does not block the slot', async () => {
      const rig = await service.createRig(dropzone, { name: 'Micro 3' });
      const first = await service.createItem(dropzone, {
        kind: 'reserve',
        manufacturer: 'PD',
        model: 'A',
        rigId: rig.id,
      });

      await expect(
        service.createItem(dropzone, { kind: 'reserve', manufacturer: 'PD', model: 'B', rigId: rig.id }),
      ).rejects.toBeInstanceOf(ConflictException);

      await service.updateItem(dropzone, first.id, { retired: true });
      await expect(
        service.createItem(dropzone, { kind: 'reserve', manufacturer: 'PD', model: 'B', rigId: rig.id }),
      ).resolves.toBeDefined();
    });

    test('a rig of another owner is 409 and an unknown rig is 404', async () => {
      const otherRig = await service.createRig(stranger, { name: 'Theirs' });

      await expect(
        service.createItem(dropzone, { kind: 'main', manufacturer: 'A', model: 'B', rigId: otherRig.id }),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.createItem(admin, {
          kind: 'main',
          manufacturer: 'A',
          model: 'B',
          rigId: otherRig.id,
          ownerId: dropzone.id,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      await expect(
        service.createItem(dropzone, { kind: 'main', manufacturer: 'A', model: 'B', rigId: MISSING }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    test('a catalogue model must exist and be of the same kind', async () => {
      const aadModel = manager.seed(GearModel, {
        kind: 'aad',
        manufacturer: 'Vigil',
        model: 'Cuatro',
        repackCycleDays: null,
        serviceIntervalMonths: 120,
        batteryCycleMonths: null,
        lifeYears: 20,
        active: true,
      });

      await expect(
        service.createItem(dropzone, { kind: 'aad', manufacturer: 'Vigil', model: 'Cuatro', modelId: aadModel.id }),
      ).resolves.toMatchObject({ modelId: aadModel.id });
      await expect(
        service.createItem(dropzone, { kind: 'reserve', manufacturer: 'Vigil', model: 'Cuatro', modelId: aadModel.id }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.createItem(dropzone, { kind: 'aad', manufacturer: 'X', model: 'Y', modelId: MISSING }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    test('an admin creates gear for another owner; a stranger cannot', async () => {
      await expect(
        service.createItem(admin, { kind: 'main', manufacturer: 'A', model: 'B', ownerId: dropzone.id }),
      ).resolves.toMatchObject({ ownerId: dropzone.id });
      await expect(
        service.createItem(stranger, { kind: 'main', manufacturer: 'A', model: 'B', ownerId: dropzone.id }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateItem', () => {
    async function spare() {
      return service.createItem(dropzone, { kind: 'reserve', manufacturer: 'PD', model: 'VR360', serial: '1' });
    }

    test('changes fields and details, and clears a serial', async () => {
      const item = await spare();

      const updated = await service.updateItem(dropzone, item.id, {
        model: 'VR 360',
        serial: '',
        notes: 'repaired slider',
        details: { repackCycleDays: 120 },
      });

      expect(updated).toMatchObject({ model: 'VR 360', serial: null, notes: 'repaired slider' });
      expect(updated.details).toMatchObject({ repackCycleDays: 120 });
    });

    test('creates a missing details row when a spare gets its first details', async () => {
      const aad = await service.createItem(dropzone, { kind: 'aad', manufacturer: 'AAD', model: 'Vigil 4' });

      await service.updateItem(dropzone, aad.id, { details: { expiresOn: '2041-10-01' } });

      expect(await manager.count(AadDetail)).toBe(1);
    });

    test('moves a component to a rig and logs where it went', async () => {
      const a = await service.createRig(dropzone, { name: 'A' });
      const b = await service.createRig(dropzone, { name: 'B' });
      const item = await service.createItem(dropzone, { kind: 'reserve', manufacturer: 'PD', model: 'X', rigId: a.id });

      const moved = await service.updateItem(dropzone, item.id, { rigId: b.id });

      expect(moved.rigId).toBe(b.id);
      const descriptions = (await logOf(item.id)).map((e) => e.description);
      expect(descriptions.some((d) => d.includes('A') && d.includes('B'))).toBe(true);
    });

    test('unassigns to spare gear and keeps the history', async () => {
      const rig = await service.createRig(dropzone, { name: 'A' });
      const item = await service.createItem(dropzone, {
        kind: 'reserve',
        manufacturer: 'PD',
        model: 'X',
        rigId: rig.id,
      });

      const spareView = await service.updateItem(dropzone, item.id, { rigId: null });

      expect(spareView.rigId).toBeNull();
      expect(await logOf(item.id)).toHaveLength(2);
    });

    test('assigning into an occupied slot or to another owner rig is 409', async () => {
      const rig = await service.createRig(dropzone, { name: 'A' });
      await service.createItem(dropzone, { kind: 'reserve', manufacturer: 'PD', model: 'X', rigId: rig.id });
      const other = await spare();
      const foreign = await service.createRig(stranger, { name: 'Theirs' });

      await expect(service.updateItem(dropzone, other.id, { rigId: rig.id })).rejects.toBeInstanceOf(ConflictException);
      await expect(service.updateItem(admin, other.id, { rigId: foreign.id })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    test('retiring removes it from its rig, logs it and can be undone', async () => {
      const rig = await service.createRig(dropzone, { name: 'A' });
      const item = await service.createItem(dropzone, {
        kind: 'reserve',
        manufacturer: 'PD',
        model: 'X',
        rigId: rig.id,
      });

      const retired = await service.updateItem(dropzone, item.id, { retired: true });

      expect(retired.rigId).toBeNull();
      expect(retired.retiredAt).not.toBeNull();
      expect((await logOf(item.id)).some((e) => e.description.toLowerCase().includes('retired'))).toBe(true);
      const back = await service.updateItem(dropzone, item.id, { retired: false });
      expect(back.retiredAt).toBeNull();
    });

    test("another account's component is 404", async () => {
      const item = await spare();

      await expect(service.updateItem(stranger, item.id, { notes: 'x' })).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.updateItem(dropzone, MISSING, { notes: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('bulletin matching', () => {
    test('a new component is matched against the published bulletins', async () => {
      const view = await service.createItem(dropzone, {
        kind: 'reserve',
        manufacturer: 'PD',
        model: 'VR360',
        serial: '1',
      });

      expect(rematch).toHaveBeenCalledWith(view.id);
    });

    test('changing what identifies a component matches it again, other edits do not', async () => {
      const item = await service.createItem(dropzone, {
        kind: 'reserve',
        manufacturer: 'PD',
        model: 'VR360',
        serial: '1',
      });
      rematch.mockClear();

      await service.updateItem(dropzone, item.id, { notes: 'repaired' });
      expect(rematch).not.toHaveBeenCalled();

      await service.updateItem(dropzone, item.id, { serial: '2' });
      await service.updateItem(dropzone, item.id, { manufacturedOn: '2020-01-01' });
      await service.updateItem(dropzone, item.id, { model: 'VR 360' });
      await service.updateItem(dropzone, item.id, { manufacturer: 'Performance Designs' });
      expect(rematch).toHaveBeenCalledTimes(4);
    });
  });

  describe('parts', () => {
    test('adds, updates and deletes a part on a component the caller owns', async () => {
      const item = await service.createItem(dropzone, { kind: 'main', manufacturer: 'A', model: 'B' });

      const part = await service.addPart(dropzone, item.id, { kind: 'bridle', description: 'Bridle', serial: 'B-1' });
      expect(part).toMatchObject({ kind: 'bridle', description: 'Bridle', serial: 'B-1', notes: '' });

      const updated = await service.updatePart(dropzone, part.id, { notes: 'frayed', serial: '' });
      expect(updated).toMatchObject({ notes: 'frayed', serial: null });

      await service.deletePart(dropzone, part.id);
      expect(await manager.count(ComponentPart)).toBe(0);
    });

    test("another account's component parts are 404", async () => {
      const item = await service.createItem(dropzone, { kind: 'main', manufacturer: 'A', model: 'B' });
      const part = await service.addPart(dropzone, item.id, { kind: 'toggles', description: 'Toggles' });

      await expect(service.addPart(stranger, item.id, { kind: 'other', description: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.updatePart(stranger, part.id, { notes: 'x' })).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.deletePart(stranger, part.id)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  test('stores rigs and items as entities', async () => {
    await service.createRig(dropzone, { name: 'A' });
    await service.createItem(dropzone, { kind: 'main', manufacturer: 'A', model: 'B' });

    expect(await manager.count(Rig)).toBe(1);
    expect(await manager.count(GearItem)).toBe(1);
  });
});
