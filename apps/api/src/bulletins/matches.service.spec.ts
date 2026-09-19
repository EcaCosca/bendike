import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { linkedTo } from '../gear/testing/no-links';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { BulletinMatch, Grounding, ServiceBulletin } from './entities';
import { MatchesService } from './matches.service';

describe('MatchesService', () => {
  let manager: InMemoryManager;
  let service: MatchesService;
  const admin = buildUser({ role: Role.Admin });
  const dropzone = buildUser({ role: Role.Dropzone, displayName: 'Salta en Rosario' });
  const stranger = buildUser({ role: Role.User, displayName: 'Ana' });
  const rigger = buildUser({ role: Role.Rigger, displayName: 'Eca Rigger' });
  const otherRigger = buildUser({ role: Role.Rigger });

  function bulletin(values: Partial<ServiceBulletin> = {}) {
    return manager.seed(ServiceBulletin, {
      manufacturer: 'PD',
      reference: 'SB-1',
      title: 'Slider check',
      summary: 's',
      requiredAction: 'Inspect the slider',
      sourceUrl: null,
      issuedOn: '2026-09-01',
      severity: 'mandatory',
      status: 'published',
      createdBy: admin.id,
      publishedAt: new Date(),
      ...values,
    });
  }

  function gear(ownerId: string, rigId: string | null, serial: string) {
    return manager.seed(GearItem, {
      ownerId,
      rigId,
      modelId: null,
      kind: 'reserve',
      manufacturer: 'PD',
      model: 'VR360',
      serial,
      manufacturedOn: null,
      notes: '',
      retiredAt: null,
    });
  }

  function match(bulletinId: string, gearItemId: string, values: Partial<BulletinMatch> = {}) {
    return manager.seed(BulletinMatch, {
      bulletinId,
      gearItemId,
      confidence: 'exact',
      status: 'open',
      resolutionNote: null,
      resolvedBy: null,
      resolvedAt: null,
      ...values,
    });
  }

  let rigId: string;
  let mine: GearItem;
  let theirs: GearItem;
  let sb: ServiceBulletin;

  beforeEach(() => {
    manager = new InMemoryManager();
    for (const user of [admin, dropzone, stranger, rigger, otherRigger]) manager.seed(User, user);
    rigId = manager.seed(Rig, { ownerId: dropzone.id, name: 'Micro 3', notes: '', active: true }).id;
    mine = gear(dropzone.id, rigId, '10586');
    theirs = gear(stranger.id, null, '10600');
    sb = bulletin();
    const links = [[rigger.id, dropzone.id]] as [string, string][];
    service = new MatchesService(manager as never, new GearAccessService(linkedTo(...links)), {
      activeOwnerIds: (id: string) => Promise.resolve(links.filter(([r]) => r === id).map(([, o]) => o)),
    });
  });

  describe('list', () => {
    test('a rigger sees the matches on gear of the owners they are linked to, with what they need to act', async () => {
      match(sb.id, mine.id, { confidence: 'needs_review' });
      match(sb.id, theirs.id);

      const rows = await service.list(rigger, {});

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        confidence: 'needs_review',
        status: 'open',
        owner: { id: dropzone.id, displayName: 'Salta en Rosario' },
        rig: { id: rigId, name: 'Micro 3' },
        item: { id: mine.id, kind: 'reserve', manufacturer: 'PD', model: 'VR360', serial: '10586' },
        bulletin: { id: sb.id, reference: 'SB-1', severity: 'mandatory', requiredAction: 'Inspect the slider' },
      });
    });

    test('shows only published bulletins, and filters by bulletin and status', async () => {
      const draft = bulletin({ status: 'draft', reference: 'SB-D' });
      const done = bulletin({ reference: 'SB-2' });
      match(sb.id, mine.id);
      match(draft.id, mine.id);
      match(done.id, mine.id, { status: 'complied' });

      expect((await service.list(rigger, {})).map((r) => r.bulletin.reference).sort()).toEqual(['SB-1', 'SB-2']);
      expect((await service.list(rigger, { status: 'open' })).map((r) => r.bulletin.reference)).toEqual(['SB-1']);
      expect((await service.list(rigger, { bulletinId: done.id })).map((r) => r.bulletin.reference)).toEqual(['SB-2']);
    });

    test('a rigger with no links sees nothing; an admin sees every owner; a user gets 403', async () => {
      match(sb.id, mine.id);
      match(sb.id, theirs.id);

      expect(await service.list(otherRigger, {})).toEqual([]);
      expect(await service.list(admin, {})).toHaveLength(2);
      await expect(service.list(dropzone, {})).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('resolve', () => {
    test('complied records who, when and the note', async () => {
      const m = match(sb.id, mine.id);

      const resolved = await service.resolve(rigger, m.id, { status: 'complied', note: '  Grommet replaced ' });

      expect(resolved).toMatchObject({ status: 'complied', resolutionNote: 'Grommet replaced' });
      expect(resolved.resolvedAt).not.toBeNull();
      expect((await manager.find(BulletinMatch, {}))[0]?.resolvedBy).toBe(rigger.id);
    });

    test('not applicable needs a reason, and so does complied', async () => {
      const m = match(sb.id, mine.id);

      await expect(service.resolve(rigger, m.id, { status: 'not_applicable', note: '   ' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.resolve(rigger, m.id, { status: 'complied', note: '' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(
        service.resolve(rigger, m.id, { status: 'not_applicable', note: 'Different serial range on the card' }),
      ).resolves.toMatchObject({
        status: 'not_applicable',
      });
    });

    test('resolving clears the grounding the bulletin opened for that match', async () => {
      const m = match(sb.id, mine.id);
      manager.seed(Grounding, {
        rigId,
        gearItemId: null,
        reason: 'Bulletin SB-1',
        source: 'bulletin',
        bulletinMatchId: m.id,
        openedBy: admin.id,
        openedAt: new Date(),
        closedBy: null,
        closedAt: null,
        closeNote: null,
      });

      await service.resolve(rigger, m.id, { status: 'complied', note: 'Done' });

      const [grounding] = await manager.find(Grounding, {});
      expect(grounding).toMatchObject({ closedBy: rigger.id, closeNote: 'Done' });
      expect(grounding?.closedAt).not.toBeNull();
    });

    test('a match on gear the rigger is not linked to is 404, an already resolved one is 409, a user is 403', async () => {
      const open = match(sb.id, mine.id);
      const hidden = match(sb.id, theirs.id);

      await expect(service.resolve(rigger, hidden.id, { status: 'complied', note: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.resolve(otherRigger, open.id, { status: 'complied', note: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.resolve(dropzone, open.id, { status: 'complied', note: 'x' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await service.resolve(rigger, open.id, { status: 'complied', note: 'x' });
      await expect(service.resolve(rigger, open.id, { status: 'complied', note: 'again' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    test('an admin resolves anywhere', async () => {
      const hidden = match(sb.id, theirs.id);

      await expect(
        service.resolve(admin, hidden.id, { status: 'not_applicable', note: 'Checked by the manufacturer' }),
      ).resolves.toMatchObject({
        status: 'not_applicable',
      });
    });
  });
});
