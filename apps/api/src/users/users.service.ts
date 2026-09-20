import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { normalizePhone, type Role, type UpdateContactRequestBody } from '@bendike/shared';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export interface CreateUserInput {
  email: string;
  displayName: string;
  passwordHash: string | null;
  googleSub?: string;
  role: Role;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findAll(): Promise<User[]> {
    return this.users.find({ order: { createdAt: 'ASC' } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: normalizeEmail(email) } });
  }

  findByGoogleSub(googleSub: string): Promise<User | null> {
    return this.users.findOne({ where: { googleSub } });
  }

  linkGoogle(user: User, googleSub: string): Promise<User> {
    user.googleSub = googleSub;
    return this.users.save(user);
  }

  create(input: CreateUserInput): Promise<User> {
    const user = this.users.create({ ...input, email: normalizeEmail(input.email) });
    return this.users.save(user);
  }

  async updateContact(user: User, body: UpdateContactRequestBody): Promise<User> {
    if (body.displayName !== undefined) {
      const name = body.displayName.trim();
      if (!name) {
        throw new BadRequestException('The display name cannot be empty');
      }
      user.displayName = name;
    }
    if (body.phone !== undefined) {
      const result = body.phone === null ? { valid: true as const, phone: null } : normalizePhone(body.phone);
      if (!result.valid) {
        throw new BadRequestException('Enter the phone with the country code, for example +54 9 341 555 0000');
      }
      user.phone = result.phone;
    }
    if (body.locale !== undefined) {
      user.locale = body.locale;
    }
    if (body.country !== undefined) {
      user.country = body.country;
    }
    return this.users.save(user);
  }

  async changeRole(actorId: string, targetId: string, role: Role): Promise<User> {
    if (actorId === targetId) {
      throw new ForbiddenException('Admins cannot change their own role');
    }
    const target = await this.findById(targetId);
    if (!target) {
      throw new NotFoundException(`User ${targetId} not found`);
    }
    target.role = role;
    return this.users.save(target);
  }
}
