import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type AuthResponse, Role } from '@bendike/shared';
import { toUserSummary } from '../users/user-summary';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './jwt-payload';
import { PasswordHasher } from './password-hasher';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }
    const user = await this.users.create({
      email: dto.email,
      displayName: dto.displayName.trim(),
      passwordHash: await this.hasher.hash(dto.password),
      role: Role.User,
    });
    return this.issue(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    const matches = user ? await this.hasher.compare(dto.password, user.passwordHash) : false;
    if (!user || !matches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issue(user);
  }

  private async issue(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, user: toUserSummary(user) };
  }
}
