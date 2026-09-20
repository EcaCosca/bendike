import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateContactDto } from './update-contact.dto';

async function errorsFor(body: unknown) {
  return validate(plainToInstance(UpdateContactDto, body), { whitelist: true, forbidNonWhitelisted: true });
}

describe('UpdateContactDto', () => {
  test.each([
    {},
    { displayName: 'Ana' },
    { phone: null },
    { phone: '+54 9 341 555 0000' },
    { locale: 'pt' },
    { country: 'AR' },
    { country: null },
  ])('accepts %j', async (body) => {
    expect(await errorsFor(body)).toHaveLength(0);
  });

  test.each([
    { locale: 'fr' },
    { displayName: '' },
    { displayName: 'x'.repeat(121) },
    { phone: 5 },
    { nickname: 'x' },
    { country: 'ar' },
    { country: 'ARG' },
    { country: 'XX' },
    { country: 54 },
  ])('rejects %j', async (body) => {
    expect(await errorsFor(body)).not.toHaveLength(0);
  });
});
