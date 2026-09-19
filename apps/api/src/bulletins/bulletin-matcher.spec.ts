import { Role } from '@bendike/shared';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { BulletinMatcher } from './bulletin-matcher';
import { BulletinMatch, BulletinTarget, Grounding, ServiceBulletin } from './entities';

describe('BulletinMatcher', () => {
  let manager: InMemoryManager;
  let matcher: BulletinMatcher;
  const admin = buildUser({ role: Role.Admin });
  const owner = buildUser({ role: Role.Dropzone });

  beforeEach(() => {
    manager = new InMemoryManager();
    manager.seed(User, admin);
    manager.seed(User, owner);
    matcher = new BulletinMatcher(manager as never);
  });

  function bulletin(values: Partial<ServiceBulletin> = {}, targets: Partial<BulletinTarget>[] = []) {
    const row = manager.seed(ServiceBulletin, {
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
      publishedAt: new Date('2026-09-02T00:00:00Z'),
      ...values,
    });
    for (const target of targets) {
      manager.seed(BulletinTarget, {
        bulletinId: row.id,
        model: null,
        serialFrom: null,
        serialTo: null,
        manufacturedFrom: null,
        manufacturedTo: null,
        ...target,
      });
    }
    return row;
  }

  function item(values: Partial<GearItem> = {}) {
    return manager.seed(GearItem, {
      ownerId: owner.id,
      rigId: null,
      modelId: null,
      kind: 'reserve',
      manufacturer: 'PD',
      model: 'VR360',
      serial: '10586',
      manufacturedOn: '2020-09-01',
      notes: '',
      retiredAt: null,
      ...values,
    });
  }

  const matches = () => manager.find(BulletinMatch, {});
  const groundings = () => manager.find(Grounding, {});

  describe('matchBulletin', () => {
    test('creates one open match for every gear item that fits, with its confidence', async () => {
      const fit = item();
      item({ manufacturer: 'Aerodyne', model: 'Smart' });
      const review = item({ serial: 'VR-360 007284', model: 'VR360' });
      const sb = bulletin({}, [{ model: 'VR360', serialFrom: '10000', serialTo: '11000' }]);

      const result = await matcher.matchBulletin(sb);

      expect(result).toEqual({ matched: 2, groundings: 0 });
      const rows = await matches();
      expect(rows.find((m) => m.gearItemId === fit.id)).toMatchObject({
        bulletinId: sb.id,
        confidence: 'exact',
        status: 'open',
      });
      expect(rows.find((m) => m.gearItemId === review.id)).toMatchObject({ confidence: 'needs_review' });
    });

    test('a bulletin with no targets applies to the whole manufacturer', async () => {
      item({ model: 'A' });
      item({ model: 'B', serial: '2' });

      expect((await matcher.matchBulletin(bulletin())).matched).toBe(2);
    });

    test('retired components are not matched', async () => {
      item({ retiredAt: new Date('2026-01-01T00:00:00Z') });

      expect((await matcher.matchBulletin(bulletin())).matched).toBe(0);
    });

    test('running it again creates nothing new', async () => {
      item();
      const sb = bulletin();
      await matcher.matchBulletin(sb);

      expect((await matcher.matchBulletin(sb)).matched).toBe(0);
      expect(await matches()).toHaveLength(1);
    });

    test('a grounding bulletin grounds the rig of each matched component with the match as its source', async () => {
      const rig = manager.seed(Rig, { ownerId: owner.id, name: 'Micro 3', notes: '', active: true });
      const inRig = item({ rigId: rig.id });
      const spare = item({ serial: '2' });
      const sb = bulletin({ severity: 'grounding', reference: 'SB-9', title: 'Stop using' });

      const result = await matcher.matchBulletin(sb);

      expect(result).toEqual({ matched: 2, groundings: 2 });
      const rows = await groundings();
      const forRig = rows.find((g) => g.rigId === rig.id);
      const forSpare = rows.find((g) => g.gearItemId === spare.id);
      expect(forRig).toMatchObject({ source: 'bulletin', gearItemId: null, openedBy: admin.id, closedAt: null });
      expect(forRig?.reason).toContain('SB-9');
      expect(forRig?.reason).toContain('Stop using');
      expect((await matches()).find((m) => m.gearItemId === inRig.id)?.id).toBe(forRig?.bulletinMatchId);
      expect(forSpare?.rigId).toBeNull();
    });

    test('an advisory or mandatory bulletin grounds nothing', async () => {
      item();

      await matcher.matchBulletin(bulletin({ severity: 'mandatory' }));

      expect(await groundings()).toEqual([]);
    });
  });

  describe('rematchItem', () => {
    test('a component added after publication gets its match, and a grounding bulletin grounds it', async () => {
      const sb = bulletin({ severity: 'grounding' });
      const late = item();

      const result = await matcher.rematchItem(late.id);

      expect(result).toEqual({ matched: 1, groundings: 1 });
      expect((await matches())[0]).toMatchObject({ bulletinId: sb.id, gearItemId: late.id });
    });

    test('editing a serial into range creates the match; editing it out does not delete an existing one', async () => {
      bulletin({}, [{ serialFrom: '1', serialTo: '100' }]);
      const gear = item({ serial: '5000' });
      expect((await matcher.rematchItem(gear.id)).matched).toBe(0);

      gear.serial = '50';
      await manager.save(gear);
      expect((await matcher.rematchItem(gear.id)).matched).toBe(1);

      gear.serial = '9000';
      await manager.save(gear);
      await matcher.rematchItem(gear.id);
      expect(await matches()).toHaveLength(1);
    });

    test('drafts and withdrawn bulletins are ignored, and an unknown or retired item does nothing', async () => {
      bulletin({ status: 'draft' });
      bulletin({ status: 'withdrawn', reference: 'SB-2' });
      const gear = item();

      expect((await matcher.rematchItem(gear.id)).matched).toBe(0);
      expect(await matcher.rematchItem('00000000-0000-4000-8000-00000000ffff')).toEqual({ matched: 0, groundings: 0 });
    });
  });
});
