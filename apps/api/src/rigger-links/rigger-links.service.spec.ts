import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { RiggerLink } from './rigger-link.entity';
import { RiggerLinksService } from './rigger-links.service';

describe('RiggerLinksService', () => {
  let manager: InMemoryManager;
  let service: RiggerLinksService;
  const skydiver = buildUser({
    role: Role.User,
    displayName: 'Ana',
    email: 'ana@bendike.example',
    phone: '+5493415550001',
  });
  const dropzone = buildUser({
    role: Role.Dropzone,
    displayName: 'Salta en Rosario',
    email: 'dz@bendike.example',
    phone: '+5493415550002',
  });
  const rigger = buildUser({
    role: Role.Rigger,
    displayName: 'Eca',
    email: 'eca@bendike.example',
    phone: '+5493415550003',
  });
  const otherRigger = buildUser({ role: Role.Rigger, displayName: 'Lucia Rigger', email: 'lucia@bendike.example' });
  const admin = buildUser({ role: Role.Admin, displayName: 'Admin' });

  beforeEach(() => {
    manager = new InMemoryManager();
    for (const user of [skydiver, dropzone, rigger, otherRigger, admin]) {
      manager.seed(User, user);
    }
    service = new RiggerLinksService(manager as never);
  });

  const links = () => manager.find(RiggerLink, {});

  describe('an owner picks a rigger', () => {
    test('creates a pending link the rigger must confirm, without contact details yet', async () => {
      const view = await service.create(skydiver, { riggerId: rigger.id });

      expect(view).toMatchObject({ status: 'pending', direction: 'outgoing', viewerIsOwner: true });
      expect(view.counterpart).toEqual({
        id: rigger.id,
        displayName: 'Eca',
        role: Role.Rigger,
        email: null,
        phone: null,
      });
      expect(await service.hasActiveLink(rigger.id, skydiver.id)).toBe(false);
    });

    test('a dropzone can pick several riggers', async () => {
      await service.create(dropzone, { riggerId: rigger.id });
      await service.create(dropzone, { riggerId: otherRigger.id });

      expect(await links()).toHaveLength(2);
    });

    test('the account must be a rigger; an unknown one is 404', async () => {
      await expect(service.create(skydiver, { riggerId: dropzone.id })).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.create(skydiver, { riggerId: '00000000-0000-4000-8000-00000000ffff' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    test('a second open link for the same pair is 409', async () => {
      await service.create(skydiver, { riggerId: rigger.id });

      await expect(service.create(skydiver, { riggerId: rigger.id })).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('a rigger adds an owner', () => {
    test('finds the account by email, ignoring case and spaces', async () => {
      const view = await service.create(rigger, { ownerEmail: '  DZ@Bendike.Example ' });

      expect(view).toMatchObject({ status: 'pending', direction: 'outgoing', viewerIsOwner: false });
      expect(view.counterpart.id).toBe(dropzone.id);
    });

    test('finds the account by phone in any format', async () => {
      const view = await service.create(rigger, { ownerPhone: '+54 9 341 555 0001' });

      expect(view.counterpart.id).toBe(skydiver.id);
    });

    test('says so when nobody has that email or phone, and never links a rigger to themselves or another rigger', async () => {
      await expect(service.create(rigger, { ownerEmail: 'nobody@x.example' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.create(rigger, { ownerPhone: '+5400000000000' })).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.create(rigger, { ownerEmail: rigger.email })).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.create(rigger, { ownerEmail: otherRigger.email })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('who may create which link', () => {
    test('an owner cannot add an owner, a rigger cannot pick a rigger, and neither can link two other accounts', async () => {
      await expect(service.create(skydiver, { ownerEmail: dropzone.email })).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.create(rigger, { riggerId: otherRigger.id })).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.create(skydiver, { riggerId: rigger.id, ownerId: dropzone.id })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    test('an admin creates an active link between any owner and rigger', async () => {
      const view = await service.create(admin, { ownerId: dropzone.id, riggerId: rigger.id });

      expect(view.status).toBe('active');
      expect(await service.hasActiveLink(rigger.id, dropzone.id)).toBe(true);
    });

    test('an admin link needs an owner and a rigger', async () => {
      await expect(service.create(admin, { riggerId: rigger.id })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('confirming, declining and ending', () => {
    async function pending() {
      const created = await service.create(skydiver, { riggerId: rigger.id });
      return created.id;
    }

    test('the rigger confirms and both see the counterpart contact details', async () => {
      const id = await pending();

      const confirmed = await service.confirm(rigger, id);

      expect(confirmed.status).toBe('active');
      expect(confirmed.counterpart).toMatchObject({ id: skydiver.id, email: skydiver.email, phone: skydiver.phone });
      expect(await service.hasActiveLink(rigger.id, skydiver.id)).toBe(true);
      const ownerView = (await service.listFor(skydiver))[0];
      expect(ownerView?.counterpart).toMatchObject({ id: rigger.id, email: rigger.email, phone: rigger.phone });
    });

    test('the one who asked cannot confirm their own request', async () => {
      const id = await pending();

      await expect(service.confirm(skydiver, id)).rejects.toBeInstanceOf(ForbiddenException);
    });

    test('someone outside the link gets 404, and an admin may confirm', async () => {
      const id = await pending();

      await expect(service.confirm(otherRigger, id)).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.confirm(admin, id)).resolves.toMatchObject({ status: 'active' });
    });

    test('declining closes the link without access and lets a new request be made', async () => {
      const id = await pending();

      await service.decline(rigger, id);

      expect(await service.hasActiveLink(rigger.id, skydiver.id)).toBe(false);
      await expect(service.create(skydiver, { riggerId: rigger.id })).resolves.toMatchObject({ status: 'pending' });
    });

    test('either side ends an active link and access goes at once', async () => {
      const id = await pending();
      await service.confirm(rigger, id);

      await service.end(skydiver, id);

      expect(await service.hasActiveLink(rigger.id, skydiver.id)).toBe(false);
      await expect(service.end(skydiver, id)).rejects.toBeInstanceOf(ConflictException);
    });

    test('the rigger can end it too, and the initiator can cancel a pending request', async () => {
      const first = await pending();
      await service.confirm(rigger, first);
      await service.end(rigger, first);
      const again = await service.create(skydiver, { riggerId: rigger.id });

      await service.end(skydiver, again.id);

      expect((await links()).every((l) => l.status === 'ended')).toBe(true);
    });

    test('only a pending request can be confirmed or declined', async () => {
      const id = await pending();
      await service.confirm(rigger, id);

      await expect(service.confirm(rigger, id)).rejects.toBeInstanceOf(ConflictException);
      await expect(service.decline(rigger, id)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('scope queries', () => {
    test('lists the active owners of a rigger and the active riggers of an owner', async () => {
      await service.confirm(rigger, (await service.create(skydiver, { riggerId: rigger.id })).id);
      await service.confirm(rigger, (await service.create(dropzone, { riggerId: rigger.id })).id);
      await service.create(dropzone, { riggerId: otherRigger.id });

      expect((await service.activeOwnerIds(rigger.id)).sort()).toEqual([dropzone.id, skydiver.id].sort());
      expect(await service.activeOwnerIds(otherRigger.id)).toEqual([]);
      expect(await service.activeRiggers(dropzone.id)).toEqual([{ id: rigger.id, displayName: 'Eca' }]);
    });

    test('listFor shows open links from either side, with the direction relative to the viewer', async () => {
      const asked = await service.create(skydiver, { riggerId: rigger.id });
      await service.create(rigger, { ownerEmail: dropzone.email });

      const forRigger = await service.listFor(rigger);

      expect(forRigger.map((l) => [l.counterpart.displayName, l.direction]).sort()).toEqual([
        ['Ana', 'incoming'],
        ['Salta en Rosario', 'outgoing'],
      ]);
      expect(asked.status).toBe('pending');
    });

    test('listFor leaves out declined and ended links', async () => {
      const id = (await service.create(skydiver, { riggerId: rigger.id })).id;
      await service.decline(rigger, id);

      expect(await service.listFor(skydiver)).toEqual([]);
    });
  });

  describe('searchRiggers', () => {
    test('finds riggers by name without exposing contact details, never the caller', async () => {
      const found = await service.searchRiggers(skydiver, 'luc');

      expect(found).toEqual([{ id: otherRigger.id, displayName: 'Lucia Rigger' }]);
      expect((await service.searchRiggers(rigger, '')).map((r) => r.id)).toEqual([otherRigger.id]);
    });

    test('returns every rigger for an empty search, alphabetically', async () => {
      expect((await service.searchRiggers(skydiver, '')).map((r) => r.displayName)).toEqual(['Eca', 'Lucia Rigger']);
    });
  });
});
