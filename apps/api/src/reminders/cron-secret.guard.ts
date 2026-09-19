import { timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '../config/app.config.service';

@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.cronSecret;
    const provided = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>()
      .headers['x-cron-secret'];
    if (!expected || typeof provided !== 'string' || !this.matches(provided, expected)) {
      throw new UnauthorizedException('Invalid cron secret');
    }
    return true;
  }

  private matches(provided: string, expected: string): boolean {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
