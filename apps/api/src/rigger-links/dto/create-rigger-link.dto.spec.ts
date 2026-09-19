import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRiggerLinkDto } from './create-rigger-link.dto';

async function errorsFor(body: unknown) {
  return validate(plainToInstance(CreateRiggerLinkDto, body), { whitelist: true, forbidNonWhitelisted: true });
}

describe('CreateRiggerLinkDto', () => {
  test.each([
    { riggerId: '00000000-0000-4000-8000-000000000001' },
    { ownerEmail: 'dz@bendike.example' },
    { ownerPhone: '+54 9 341 555 0000' },
    { ownerId: '00000000-0000-4000-8000-000000000002', riggerId: '00000000-0000-4000-8000-000000000001' },
  ])('accepts %j', async (body) => {
    expect(await errorsFor(body)).toHaveLength(0);
  });

  test.each([{ riggerId: 'not-a-uuid' }, { ownerEmail: 'nope' }, { ownerPhone: 5 }, { status: 'active' }])(
    'rejects %j',
    async (body) => {
      expect(await errorsFor(body)).not.toHaveLength(0);
    },
  );
});
