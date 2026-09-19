import { NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { buildUser } from '../users/user.factory';
import { GearAccessService } from './gear-access.service';
import { linkedTo, noLinks } from './testing/no-links';

describe('GearAccessService', () => {
  const owner = buildUser({ role: Role.User });
  const dropzone = buildUser({ role: Role.Dropzone });
  const rigger = buildUser({ role: Role.Rigger });
  const otherRigger = buildUser({ role: Role.Rigger });
  const admin = buildUser({ role: Role.Admin });
  const service = new GearAccessService(noLinks);
  const linked = new GearAccessService(linkedTo([rigger.id, dropzone.id]));

  describe('canRead and canEdit', () => {
    test.each([owner, dropzone, rigger, admin])('every account reaches its own gear (%#)', async (actor) => {
      expect(await service.canRead(actor, actor.id)).toBe(true);
      expect(await service.canEdit(actor, actor.id)).toBe(true);
    });

    test('an account never reaches another account gear', async () => {
      expect(await service.canRead(owner, dropzone.id)).toBe(false);
      expect(await service.canEdit(dropzone, owner.id)).toBe(false);
    });

    test('an admin reaches everything', async () => {
      expect(await service.canRead(admin, owner.id)).toBe(true);
      expect(await service.canEdit(admin, owner.id)).toBe(true);
    });

    test('a rigger has no access to an owner they are not linked to', async () => {
      expect(await service.canRead(rigger, owner.id)).toBe(false);
      expect(await linked.canRead(rigger, owner.id)).toBe(false);
    });

    test('a rigger with an active link reads the owner gear but cannot edit its structure', async () => {
      expect(await linked.canRead(rigger, dropzone.id)).toBe(true);
      expect(await linked.canEdit(rigger, dropzone.id)).toBe(false);
    });

    test('the link belongs to one rigger only', async () => {
      expect(await linked.canRead(otherRigger, dropzone.id)).toBe(false);
    });

    test('an owner account never gains access through the link table', async () => {
      const spoof = new GearAccessService(linkedTo([owner.id, dropzone.id]));

      expect(await spoof.canRead(owner, dropzone.id)).toBe(false);
    });
  });

  describe('canSignOff', () => {
    test('admins and riggers sign off their own gear, an owner never does', async () => {
      expect(await service.canSignOff(admin, owner.id)).toBe(true);
      expect(await service.canSignOff(rigger, rigger.id)).toBe(true);
      expect(await service.canSignOff(owner, owner.id)).toBe(false);
      expect(await service.canSignOff(dropzone, dropzone.id)).toBe(false);
    });

    test('a rigger cannot sign off another account gear without a link, and can with one', async () => {
      expect(await service.canSignOff(rigger, owner.id)).toBe(false);
      expect(await linked.canSignOff(rigger, dropzone.id)).toBe(true);
      expect(await linked.canSignOff(otherRigger, dropzone.id)).toBe(false);
    });
  });

  describe('assertions', () => {
    test('assertRead answers 404 instead of revealing that the gear exists', async () => {
      await expect(service.assertRead(owner, dropzone.id)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.assertRead(owner, owner.id)).resolves.toBeUndefined();
      await expect(linked.assertRead(rigger, dropzone.id)).resolves.toBeUndefined();
    });

    test('assertEdit and assertSignOff answer 404 too', async () => {
      await expect(service.assertEdit(owner, dropzone.id)).rejects.toBeInstanceOf(NotFoundException);
      await expect(linked.assertEdit(rigger, dropzone.id)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.assertSignOff(owner, owner.id)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
