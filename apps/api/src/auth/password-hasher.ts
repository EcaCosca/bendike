import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

const BCRYPT_COST = 12;

@Injectable()
export class PasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain, BCRYPT_COST);
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
