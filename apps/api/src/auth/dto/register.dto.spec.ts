import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PASSWORD_MIN_LENGTH, RegisterDto } from './register.dto';

async function violations(input: Record<string, unknown>): Promise<string[]> {
  const errors = await validate(plainToInstance(RegisterDto, input));
  return errors.map((error) => error.property);
}

describe('RegisterDto', () => {
  const valid = { email: 'simon@saltaenrosario.com', password: 'simon1234', displayName: 'Salta en Rosario' };

  test('accepts an 8+ character password so dropzones can use the passwords Eca issues', async () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    await expect(violations(valid)).resolves.toEqual([]);
  });

  test('rejects a password shorter than the minimum', async () => {
    await expect(violations({ ...valid, password: 'short' })).resolves.toEqual(['password']);
  });

  test('rejects a malformed email and a blank display name', async () => {
    await expect(violations({ ...valid, email: 'nope', displayName: '' })).resolves.toEqual(['email', 'displayName']);
  });
});
