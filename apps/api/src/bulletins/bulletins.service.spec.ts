import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, type CreateBulletinRequestBody } from '@bendike/shared';
import { GearItem } from '../gear/entities/gear-item.entity';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { BulletinMatcher } from './bulletin-matcher';
import { BulletinsService } from './bulletins.service';
import { BulletinMatch, BulletinTarget, Grounding } from './entities';

describe('BulletinsService', () => {
  let manager: InMemoryManager;
  let service: BulletinsService;
  const admin = buildUser({ role: Role.Admin, displayName: 'Eca Admin' });
  const rigger = buildUser({ role: Role.Rigger });
  const dropzone = buildUser({ role: Role.Dropzone });
  const other = buildUser({ role: Role.User });

  beforeEach(() => {
    manager = new InMemoryManager();
    for (const user of [admin, rigger, dropzone, other]) manager.seed(User, user);
    service = new BulletinsService(manager as never, new BulletinMatcher(manager as never), {
      activeOwnerIds: (riggerId: string) => Promise.resolve(riggerId === rigger.id ? [dropzone.id] : []),
    });
  });

  const body = (overrides: Partial<CreateBulletinRequestBody> = {}): CreateBulletinRequestBody => ({
    manufacturer: 'PD',
    reference: 'SB-2026-01',
    title: 'Slider grommet check',
    summary: 'Some sliders have a loose grommet',
    requiredAction: 'Inspect and replace the grommet',
    issuedOn: '2026-09-01',
    severity: 'mandatory',
    targets: [{ model: 'VR360', serialFrom: '10000', serialTo: '11000' }],
    ...overrides,
  });

  function item(ownerId: string, serial: string, model = 'VR360') {
    return manager.seed(GearItem, {
      ownerId,
      rigId: null,
      modelId: null,
      kind: 'reserve',
      manufacturer: 'PD',
      model,
      serial,
      manufacturedOn: null,
      notes: '',
      retiredAt: null,
    });
  }

  describe('create', () => {
    test('saves a draft with its targets and no matches', async () => {
      item(dropzone.id, '10586');

      const view = await service.create(admin, body());

      expect(view).toMatchObject({
        manufacturer: 'PD',
        reference: 'SB-2026-01',
        severity: 'mandatory',
        status: 'draft',
        publishedAt: null,
        matchCounts: { open: 0, total: 0 },
      });
      expect(view.targets).toEqual([
        expect.objectContaining({ model: 'VR360', serialFrom: '10000', serialTo: '11000' }),
      ]);
      expect(await manager.count(BulletinMatch)).toBe(0);
    });

    test('only an admin creates bulletins', async () => {
      await expect(service.create(rigger, body())).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.create(dropzone, body())).rejects.toBeInstanceOf(ForbiddenException);
    });

    test('blank optional fields are stored as none', async () => {
      const view = await service.create(admin, body({ sourceUrl: '  ', targets: [{ model: ' ', serialFrom: '' }] }));

      expect(view.sourceUrl).toBeNull();
      expect(view.targets[0]).toMatchObject({ model: null, serialFrom: null });
    });
  });

  describe('publish', () => {
    test('publishing finds every affected component and reports the counts', async () => {
      item(dropzone.id, '10586');
      item(dropzone.id, '99999');
      const draft = await service.create(admin, body());

      const published = await service.publish(admin, draft.id);

      expect(published.status).toBe('published');
      expect(published.publishedAt).not.toBeNull();
      expect(published.matchCounts).toEqual({ open: 1, total: 1 });
    });

    test('a grounding bulletin grounds on publication', async () => {
      item(dropzone.id, '10586');
      const draft = await service.create(admin, body({ severity: 'grounding' }));

      await service.publish(admin, draft.id);

      expect(await manager.count(Grounding)).toBe(1);
    });

    test('cannot be published twice, or after being withdrawn, or by a non-admin', async () => {
      const draft = await service.create(admin, body());
      await service.publish(admin, draft.id);

      await expect(service.publish(admin, draft.id)).rejects.toBeInstanceOf(ConflictException);
      await service.withdraw(admin, draft.id);
      await expect(service.publish(admin, draft.id)).rejects.toBeInstanceOf(ConflictException);
      await expect(service.publish(rigger, draft.id)).rejects.toBeInstanceOf(ForbiddenException);
    });

    test('an unknown bulletin is 404', async () => {
      await expect(service.publish(admin, '00000000-0000-4000-8000-00000000ffff')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('withdraw', () => {
    test('keeps the bulletin and its matches, and closes the groundings it opened', async () => {
      item(dropzone.id, '10586');
      const draft = await service.create(admin, body({ severity: 'grounding' }));
      await service.publish(admin, draft.id);

      const withdrawn = await service.withdraw(admin, draft.id);

      expect(withdrawn.status).toBe('withdrawn');
      expect(await manager.count(BulletinMatch)).toBe(1);
      const [grounding] = await manager.find(Grounding, {});
      expect(grounding).toMatchObject({ closedBy: admin.id, closeNote: 'The bulletin was withdrawn' });
      expect(grounding?.closedAt).not.toBeNull();
    });

    test('a draft or an already withdrawn bulletin cannot be withdrawn', async () => {
      const draft = await service.create(admin, body());

      await expect(service.withdraw(admin, draft.id)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    test('a draft can change any field and replace its targets', async () => {
      const draft = await service.create(admin, body());

      const updated = await service.update(admin, draft.id, {
        title: 'New title',
        targets: [{ model: 'Techno' }, { serialFrom: '1' }],
      });

      expect(updated.title).toBe('New title');
      expect(updated.targets.map((t) => t.model ?? t.serialFrom)).toEqual(['Techno', '1']);
      expect(await manager.count(BulletinTarget)).toBe(2);
    });

    test('changing the targets of a published bulletin adds the matches it now covers, and never removes any', async () => {
      item(dropzone.id, '10586');
      item(dropzone.id, '500');
      const draft = await service.create(admin, body());
      await service.publish(admin, draft.id);

      const widened = await service.update(admin, draft.id, { targets: [{ model: 'VR360' }] });

      expect(widened.matchCounts.total).toBe(2);
      const narrowed = await service.update(admin, draft.id, { targets: [{ model: 'VR360', serialFrom: '99999' }] });
      expect(narrowed.matchCounts.total).toBe(2);
    });

    test('a withdrawn bulletin cannot be edited', async () => {
      const draft = await service.create(admin, body());
      await service.publish(admin, draft.id);
      await service.withdraw(admin, draft.id);

      await expect(service.update(admin, draft.id, { title: 'x' })).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('list', () => {
    test('an admin sees every bulletin with the counts over all gear', async () => {
      item(dropzone.id, '10586');
      item(other.id, '10600');
      const draft = await service.create(admin, body());
      await service.publish(admin, draft.id);
      await service.create(admin, body({ reference: 'SB-DRAFT' }));

      const all = await service.list(admin);

      expect(all.map((b) => [b.reference, b.status])).toEqual([
        ['SB-DRAFT', 'draft'],
        ['SB-2026-01', 'published'],
      ]);
      expect(all[1]?.matchCounts).toEqual({ open: 2, total: 2 });
    });

    test('a rigger sees only published bulletins, counted over the owners they are linked to', async () => {
      item(dropzone.id, '10586');
      item(other.id, '10600');
      const draft = await service.create(admin, body());
      await service.publish(admin, draft.id);
      await service.create(admin, body({ reference: 'SB-DRAFT' }));

      const mine = await service.list(rigger);

      expect(mine.map((b) => b.reference)).toEqual(['SB-2026-01']);
      expect(mine[0]?.matchCounts).toEqual({ open: 1, total: 1 });
    });

    test('a user or a dropzone gets 403', async () => {
      await expect(service.list(dropzone)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
