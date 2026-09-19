import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { CronSecretGuard } from './cron-secret.guard';

function context(headers: Record<string, string | string[] | undefined>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => ({ headers }) }) } as unknown as ExecutionContext;
}

describe('CronSecretGuard', () => {
  const secret = 'a-long-cron-secret-value';
  const guard = new CronSecretGuard({ cronSecret: secret } as never);

  test('lets the request through with the right secret', () => {
    expect(guard.canActivate(context({ 'x-cron-secret': secret }))).toBe(true);
  });

  test.each([
    [{}],
    [{ 'x-cron-secret': 'wrong-secret-of-another-length' }],
    [{ 'x-cron-secret': 'a-long-cron-secret-valuE' }],
    [{ 'x-cron-secret': ['a', 'b'] }],
    [{ 'x-cron-secret': '' }],
  ])('answers 401 for %j', (headers) => {
    expect(() => guard.canActivate(context(headers))).toThrow(UnauthorizedException);
  });

  test('is closed for everyone while no secret is configured, even an empty one', () => {
    const closed = new CronSecretGuard({ cronSecret: undefined } as never);

    expect(() => closed.canActivate(context({ 'x-cron-secret': '' }))).toThrow(UnauthorizedException);
    expect(() => closed.canActivate(context({ 'x-cron-secret': 'undefined' }))).toThrow(UnauthorizedException);
  });
});
