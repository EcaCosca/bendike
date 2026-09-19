import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type AuthResponse, Role } from '@bendike/shared';
import { toUserSummary } from '../users/user-summary';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { GoogleSignInDto } from './dto/google-sign-in.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleTokenVerifier } from './google/google-token-verifier';
import type { JwtPayload } from './jwt-payload';
import { PasswordHasher } from './password-hasher';

const MAX_DISPLAY_NAME_LENGTH = 120;

function displayNameFor(name: string | null, email: string): string {
  const chosen = name?.trim() || email.slice(0, email.indexOf('@'));
  return chosen.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
    private readonly google: GoogleTokenVerifier,
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
    if (user && user.passwordHash === null) {
      throw new UnauthorizedException('This account uses Google sign-in; continue with Google');
    }
    const matches = user?.passwordHash ? await this.hasher.compare(dto.password, user.passwordHash) : false;
    if (!user || !matches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issue(user);
  }

  async signInWithGoogle(dto: GoogleSignInDto): Promise<AuthResponse> {
    const identity = await this.google.verify(dto.idToken);
    const linked = await this.users.findByGoogleSub(identity.sub);
    if (linked) {
      return this.issue(linked);
    }
    const sameEmail = await this.users.findByEmail(identity.email);
    if (sameEmail) {
      return this.issue(await this.users.linkGoogle(sameEmail, identity.sub));
    }
    const user = await this.users.create({
      email: identity.email,
      displayName: displayNameFor(identity.name, identity.email),
      passwordHash: null,
      googleSub: identity.sub,
      role: Role.User,
    });
    return this.issue(user);
  }

  private async issue(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload);
    return { accessToken, user: toUserSummary(user) };
  }
}
