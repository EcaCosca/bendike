import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Role } from '@bendike/shared';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export interface CreateUserInput {
  email: string;
  displayName: string;
  passwordHash: string;
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

  create(input: CreateUserInput): Promise<User> {
    const user = this.users.create({ ...input, email: normalizeEmail(input.email) });
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
