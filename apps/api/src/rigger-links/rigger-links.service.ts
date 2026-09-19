import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  Role,
  normalizePhone,
  type CreateRiggerLinkRequestBody,
  type RiggerLinkView,
  type RiggerSummary,
} from '@bendike/shared';
import { In, type EntityManager } from 'typeorm';
import { User } from '../users/user.entity';
import { normalizeEmail } from '../users/users.service';
import { RiggerLink } from './rigger-link.entity';

const OWNER_ROLES: readonly Role[] = [Role.User, Role.Dropzone];
const OPEN_STATUSES = ['pending', 'active'] as const;
const SEARCH_LIMIT = 20;

@Injectable()
export class RiggerLinksService {
  constructor(@InjectEntityManager() private readonly manager: EntityManager) {}

  async hasActiveLink(riggerId: string, ownerId: string): Promise<boolean> {
    return (await this.manager.count(RiggerLink, { where: { riggerId, ownerId, status: 'active' } })) > 0;
  }

  async activeOwnerIds(riggerId: string): Promise<string[]> {
    const links = await this.manager.find(RiggerLink, { where: { riggerId, status: 'active' } });
    return links.map((link) => link.ownerId);
  }

  async activeRiggers(ownerId: string): Promise<RiggerSummary[]> {
    const links = await this.manager.find(RiggerLink, { where: { ownerId, status: 'active' } });
    if (links.length === 0) {
      return [];
    }
    const riggers = await this.manager.find(User, { where: { id: In(links.map((l) => l.riggerId)) } });
    return riggers.map(toSummary).sort(byName);
  }

  async searchRiggers(actor: User, search: string): Promise<RiggerSummary[]> {
    const needle = search.trim().toLowerCase();
    const riggers = await this.manager.find(User, { where: { role: Role.Rigger } });
    return riggers
      .filter((r) => r.id !== actor.id && r.displayName.toLowerCase().includes(needle))
      .map(toSummary)
      .sort(byName)
      .slice(0, SEARCH_LIMIT);
  }

  async listFor(actor: User): Promise<RiggerLinkView[]> {
    const links = await this.manager.find(RiggerLink, {
      where: OPEN_STATUSES.flatMap((status) => [
        { ownerId: actor.id, status },
        { riggerId: actor.id, status },
      ]),
    });
    const others = await this.usersById(links.map((l) => (l.ownerId === actor.id ? l.riggerId : l.ownerId)));
    return links
      .map((link) => this.toView(link, actor, others))
      .sort((a, b) =>
        a.counterpart.displayName.localeCompare(b.counterpart.displayName, 'en', { sensitivity: 'base' }),
      );
  }

  async create(actor: User, body: CreateRiggerLinkRequestBody): Promise<RiggerLinkView> {
    const { owner, rigger, active } = await this.resolveParties(actor, body);
    const open = await this.manager.count(RiggerLink, {
      where: OPEN_STATUSES.map((status) => ({ ownerId: owner.id, riggerId: rigger.id, status })),
    });
    if (open > 0) {
      throw new ConflictException('There is already an open link between these two accounts');
    }
    const link = await this.manager.save(
      this.manager.create(RiggerLink, {
        ownerId: owner.id,
        riggerId: rigger.id,
        status: active ? 'active' : 'pending',
        initiatedBy: actor.id,
        confirmedAt: active ? new Date() : null,
        endedAt: null,
      }),
    );
    return this.toView(link, actor, await this.usersById([owner.id, rigger.id]));
  }

  async confirm(actor: User, linkId: string): Promise<RiggerLinkView> {
    const link = await this.pendingLinkFor(actor, linkId);
    link.status = 'active';
    link.confirmedAt = new Date();
    return this.view(await this.manager.save(link), actor);
  }

  async decline(actor: User, linkId: string): Promise<RiggerLinkView> {
    const link = await this.pendingLinkFor(actor, linkId);
    link.status = 'declined';
    link.endedAt = new Date();
    return this.view(await this.manager.save(link), actor);
  }

  async end(actor: User, linkId: string): Promise<RiggerLinkView> {
    const link = await this.linkFor(actor, linkId);
    if (link.status !== 'active' && link.status !== 'pending') {
      throw new ConflictException('The link is already closed');
    }
    link.status = 'ended';
    link.endedAt = new Date();
    return this.view(await this.manager.save(link), actor);
  }

  private async resolveParties(
    actor: User,
    body: CreateRiggerLinkRequestBody,
  ): Promise<{ owner: User; rigger: User; active: boolean }> {
    if (actor.role === Role.Admin) {
      if (!body.ownerId || !body.riggerId) {
        throw new BadRequestException('An admin link needs an owner and a rigger');
      }
      return {
        owner: await this.accountWithRole(body.ownerId, OWNER_ROLES),
        rigger: await this.accountWithRole(body.riggerId, [Role.Rigger]),
        active: true,
      };
    }
    if (body.ownerId) {
      throw new ForbiddenException('You cannot link two other accounts');
    }
    if (OWNER_ROLES.includes(actor.role) && body.riggerId && !body.ownerEmail && !body.ownerPhone) {
      return { owner: actor, rigger: await this.accountWithRole(body.riggerId, [Role.Rigger]), active: false };
    }
    if (actor.role === Role.Rigger && !body.riggerId && (body.ownerEmail || body.ownerPhone)) {
      return { owner: await this.findOwnerByContact(actor, body), rigger: actor, active: false };
    }
    throw new ForbiddenException('That link cannot be created from this account');
  }

  private async accountWithRole(id: string, roles: readonly Role[]): Promise<User> {
    const account = await this.manager.findOne(User, { where: { id } });
    if (!account || !roles.includes(account.role)) {
      throw new NotFoundException('No Bendike account matches that');
    }
    return account;
  }

  private async findOwnerByContact(actor: User, body: CreateRiggerLinkRequestBody): Promise<User> {
    const byEmail = body.ownerEmail
      ? await this.manager.findOne(User, { where: { email: normalizeEmail(body.ownerEmail) } })
      : null;
    const phone = body.ownerPhone ? normalizePhone(body.ownerPhone) : null;
    const byPhone =
      !byEmail && phone?.valid && phone.phone
        ? await this.manager.findOne(User, { where: { phone: phone.phone } })
        : null;
    const owner = byEmail ?? byPhone;
    if (!owner || owner.id === actor.id || !OWNER_ROLES.includes(owner.role)) {
      throw new NotFoundException(
        'No Bendike account matches that email or phone. Ask them to create an account first.',
      );
    }
    return owner;
  }

  private async linkFor(actor: User, linkId: string): Promise<RiggerLink> {
    const link = await this.manager.findOne(RiggerLink, { where: { id: linkId } });
    if (!link || (actor.role !== Role.Admin && link.ownerId !== actor.id && link.riggerId !== actor.id)) {
      throw new NotFoundException('Link not found');
    }
    return link;
  }

  private async pendingLinkFor(actor: User, linkId: string): Promise<RiggerLink> {
    const link = await this.linkFor(actor, linkId);
    if (link.status !== 'pending') {
      throw new ConflictException('The request is no longer pending');
    }
    if (actor.role !== Role.Admin && link.initiatedBy === actor.id) {
      throw new ForbiddenException('The other side has to answer your request');
    }
    return link;
  }

  private async view(link: RiggerLink, actor: User): Promise<RiggerLinkView> {
    return this.toView(link, actor, await this.usersById([link.ownerId, link.riggerId]));
  }

  private async usersById(ids: string[]): Promise<Map<string, User>> {
    const unique = [...new Set(ids)];
    const users = unique.length === 0 ? [] : await this.manager.find(User, { where: { id: In(unique) } });
    return new Map(users.map((u) => [u.id, u]));
  }

  private toView(link: RiggerLink, actor: User, users: Map<string, User>): RiggerLinkView {
    const viewerIsOwner = link.ownerId === actor.id;
    const other = users.get(viewerIsOwner ? link.riggerId : link.ownerId);
    if (!other) {
      throw new NotFoundException('Link not found');
    }
    const shareContact = link.status === 'active';
    return {
      id: link.id,
      status: link.status,
      direction: link.initiatedBy === actor.id ? 'outgoing' : 'incoming',
      viewerIsOwner,
      counterpart: {
        id: other.id,
        displayName: other.displayName,
        role: other.role,
        email: shareContact ? other.email : null,
        phone: shareContact ? other.phone : null,
      },
      createdAt: link.createdAt.toISOString(),
      confirmedAt: link.confirmedAt === null ? null : link.confirmedAt.toISOString(),
    };
  }
}

function toSummary(user: User): RiggerSummary {
  return { id: user.id, displayName: user.displayName };
}

function byName(a: RiggerSummary, b: RiggerSummary): number {
  return a.displayName.localeCompare(b.displayName, 'en', { sensitivity: 'base' });
}
