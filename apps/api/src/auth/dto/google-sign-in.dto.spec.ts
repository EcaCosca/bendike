import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GoogleSignInDto } from './google-sign-in.dto';

async function errorsFor(body: unknown) {
  return validate(plainToInstance(GoogleSignInDto, body));
}

describe('GoogleSignInDto', () => {
  test('accepts an id token string', async () => {
    expect(await errorsFor({ idToken: 'eyJhbGciOiJSUzI1NiJ9.payload.signature' })).toHaveLength(0);
  });

  test.each([{}, { idToken: '' }, { idToken: 42 }, { idToken: 'x'.repeat(5000) }])('rejects %j', async (body) => {
    expect(await errorsFor(body)).not.toHaveLength(0);
  });
});
