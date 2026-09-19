import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { linkedTo } from '../gear/testing/no-links';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { Grounding } from './entities';
import { GroundingService } from './grounding.service';

describe('GroundingService', () => {
  let manager: InMemoryManager;
  let service: GroundingService;
  const dropzone = buildUser({ role: Role.Dropzone });
  const rigger = buildUser({ role: Role.Rigger, displayName: 'Eca Rigger' });
  const otherRigger = buildUser({ role: Role.Rigger });
  const admin = buildUser({ role: Role.Admin });
  const stranger = buildUser({ role: Role.User });
  let rig: Rig;
  let reserve: GearItem;

  beforeEach(() => {
    manager = new InMemoryManager();
    for (const user of [dropzone, rigger, otherRigger, admin, stranger]) manager.seed(User, user);
    rig = manager.seed(Rig, { ownerId: dropzone.id, name: 'Micro 3', notes: '', active: true });
    reserve = manager.seed(GearItem, {
      ownerId: dropzone.id,
      rigId: rig.id,
      modelId: null,
      kind: 'reserve',
      manufacturer: 'PD',
      model: 'VR360',
      serial: '1',
      manufacturedOn: null,
      notes: '',
      retiredAt: null,
    });
    service = new GroundingService(manager as never, new GearAccessService(linkedTo([rigger.id, dropzone.id])));
  });

  describe('open', () => {
    test('a linked rigger grounds a rig with a reason, recording who and when', async () => {
      const view = await service.open(rigger, { rigId: rig.id, reason: '  Frayed cutaway handle ' });

      expect(view).toMatchObject({
        rigId: rig.id,
        gearItemId: null,
        reason: 'Frayed cutaway handle',
        source: 'manual',
        openedByName: 'Eca Rigger',
        closedAt: null,
      });
      expect(new Date(view.openedAt).getTime()).toBeGreaterThan(0);
    });

    test('grounds a single component too', async () => {
      const view = await service.open(rigger, { gearItemId: reserve.id, reason: 'Slider grommet loose' });

      expect(view).toMatchObject({ gearItemId: reserve.id, rigId: null });
    });

    test('an admin can ground any rig', async () => {
      await expect(service.open(admin, { rigId: rig.id, reason: 'x' })).resolves.toMatchObject({ source: 'manual' });
    });

    test('a user or a dropzone gets 403, an unlinked rigger gets 404', async () => {
      await expect(service.open(dropzone, { rigId: rig.id, reason: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.open(stranger, { rigId: rig.id, reason: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.open(otherRigger, { rigId: rig.id, reason: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    });

    test('needs exactly one target and a reason', async () => {
      await expect(service.open(rigger, { reason: 'x' })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.open(rigger, { rigId: rig.id, gearItemId: reserve.id, reason: 'x' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(service.open(rigger, { rigId: rig.id, reason: '   ' })).rejects.toBeInstanceOf(BadRequestException);
    });

    test('an unknown rig or component is 404', async () => {
      await expect(
        service.open(rigger, { rigId: '00000000-0000-4000-8000-00000000ffff', reason: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.open(rigger, { gearItemId: '00000000-0000-4000-8000-00000000ffff', reason: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('close', () => {
    async function opened() {
      return service.open(rigger, { rigId: rig.id, reason: 'Frayed handle' });
    }

    test('the rigger clears it with a note, and nothing is deleted', async () => {
      const grounding = await opened();

      const closed = await service.close(rigger, grounding.id, ' Handle replaced, re-inspected ');

      expect(closed).toMatchObject({ closedByName: 'Eca Rigger', closeNote: 'Handle replaced, re-inspected' });
      expect(closed.closedAt).not.toBeNull();
      expect(await manager.count(Grounding)).toBe(1);
    });

    test('needs a note, cannot be closed twice, and only by the people who may ground', async () => {
      const grounding = await opened();

      await expect(service.close(rigger, grounding.id, '  ')).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.close(dropzone, grounding.id, 'ok now')).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.close(otherRigger, grounding.id, 'ok now')).rejects.toBeInstanceOf(NotFoundException);
      await service.close(admin, grounding.id, 'ok');
      await expect(service.close(rigger, grounding.id, 'again')).rejects.toBeInstanceOf(ConflictException);
    });

    test('a grounding a bulletin opened cannot be cleared directly: its match has to be resolved', async () => {
      const bulletinGrounding = manager.seed(Grounding, {
        rigId: rig.id,
        gearItemId: null,
        reason: 'Bulletin SB-1',
        source: 'bulletin',
        bulletinMatchId: '00000000-0000-4000-8000-0000000000aa',
        openedBy: admin.id,
        openedAt: new Date(),
        closedBy: null,
        closedAt: null,
        closeNote: null,
      });

      await expect(service.close(rigger, bulletinGrounding.id, 'done')).rejects.toBeInstanceOf(ConflictException);
    });

    test('an unknown grounding is 404', async () => {
      await expect(service.close(rigger, '00000000-0000-4000-8000-00000000ffff', 'x')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
