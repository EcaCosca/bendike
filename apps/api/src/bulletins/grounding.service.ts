import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Role, type GroundingView, type OpenGroundingRequestBody } from '@bendike/shared';
import type { EntityManager } from 'typeorm';
import { GearItem } from '../gear/entities/gear-item.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { User } from '../users/user.entity';
import { Grounding } from './entities';
import { toGroundingView } from './views';

@Injectable()
export class GroundingService {
  constructor(
    @InjectEntityManager() private readonly manager: EntityManager,
    private readonly access: GearAccessService,
  ) {}

  async open(actor: User, body: OpenGroundingRequestBody): Promise<GroundingView> {
    this.assertMayGround(actor);
    const reason = body.reason.trim();
    if (!reason) {
      throw new BadRequestException('Say why it is grounded');
    }
    if ((body.rigId === undefined) === (body.gearItemId === undefined)) {
      throw new BadRequestException('Ground either a rig or a component');
    }
    const ownerId = await this.ownerOf(body);
    await this.access.assertSignOff(actor, ownerId);
    const grounding = await this.manager.save(
      this.manager.create(Grounding, {
        rigId: body.rigId ?? null,
        gearItemId: body.gearItemId ?? null,
        reason,
        source: 'manual',
        bulletinMatchId: null,
        openedBy: actor.id,
        openedAt: new Date(),
        closedBy: null,
        closedAt: null,
        closeNote: null,
      }),
    );
    return toGroundingView(grounding, new Map([[actor.id, actor.displayName]]));
  }

  async close(actor: User, groundingId: string, note: string): Promise<GroundingView> {
    this.assertMayGround(actor);
    const grounding = await this.manager.findOne(Grounding, { where: { id: groundingId } });
    if (!grounding) {
      throw new NotFoundException('Grounding not found');
    }
    await this.access.assertSignOff(actor, await this.ownerOf(grounding));
    const trimmed = note.trim();
    if (!trimmed) {
      throw new BadRequestException('Say what was done before clearing it');
    }
    if (grounding.closedAt !== null) {
      throw new ConflictException('It is already cleared');
    }
    if (grounding.source === 'bulletin') {
      throw new ConflictException('A bulletin grounding is cleared by resolving its match');
    }
    grounding.closedBy = actor.id;
    grounding.closedAt = new Date();
    grounding.closeNote = trimmed;
    await this.manager.save(grounding);
    const opener = await this.manager.findOne(User, { where: { id: grounding.openedBy } });
    return toGroundingView(
      grounding,
      new Map([
        [actor.id, actor.displayName],
        [grounding.openedBy, opener?.displayName ?? 'Unknown'],
      ]),
    );
  }

  private assertMayGround(actor: User): void {
    if (actor.role !== Role.Rigger && actor.role !== Role.Admin) {
      throw new ForbiddenException('Only a rigger can ground or clear a rig');
    }
  }

  private async ownerOf(target: { rigId?: string | null; gearItemId?: string | null }): Promise<string> {
    if (target.rigId) {
      const rig = await this.manager.findOne(Rig, { where: { id: target.rigId } });
      if (!rig) throw new NotFoundException('Rig not found');
      return rig.ownerId;
    }
    const item = target.gearItemId ? await this.manager.findOne(GearItem, { where: { id: target.gearItemId } }) : null;
    if (!item) throw new NotFoundException('Gear item not found');
    return item.ownerId;
  }
}
