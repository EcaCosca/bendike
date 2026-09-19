import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@bendike/shared';
import { RiggerLinksService } from '../rigger-links/rigger-links.service';
import type { User } from '../users/user.entity';

export interface ActiveLinkLookup {
  hasActiveLink(riggerId: string, ownerId: string): Promise<boolean>;
}

@Injectable()
export class GearAccessService {
  constructor(@Inject(RiggerLinksService) private readonly links: ActiveLinkLookup) {}

  async canRead(actor: User, ownerId: string): Promise<boolean> {
    return actor.role === Role.Admin || actor.id === ownerId || (await this.isLinkedRigger(actor, ownerId));
  }

  canEdit(actor: User, ownerId: string): Promise<boolean> {
    return Promise.resolve(actor.role === Role.Admin || actor.id === ownerId);
  }

  async canSignOff(actor: User, ownerId: string): Promise<boolean> {
    if (actor.role === Role.Admin) {
      return true;
    }
    return actor.role === Role.Rigger && (actor.id === ownerId || (await this.isLinkedRigger(actor, ownerId)));
  }

  async assertRead(actor: User, ownerId: string): Promise<void> {
    if (!(await this.canRead(actor, ownerId))) {
      throw new NotFoundException('Gear not found');
    }
  }

  async assertEdit(actor: User, ownerId: string): Promise<void> {
    if (!(await this.canEdit(actor, ownerId))) {
      throw new NotFoundException('Gear not found');
    }
  }

  async assertSignOff(actor: User, ownerId: string): Promise<void> {
    if (!(await this.canSignOff(actor, ownerId))) {
      throw new NotFoundException('Gear not found');
    }
  }

  private async isLinkedRigger(actor: User, ownerId: string): Promise<boolean> {
    return actor.role === Role.Rigger && (await this.links.hasActiveLink(actor.id, ownerId));
  }
}
