import { Test } from '@nestjs/testing';
import { buildUser } from './user.factory';
import { ProfileController } from './profile.controller';
import { UsersService } from './users.service';

describe('ProfileController', () => {
  test('PATCH /users/me updates the caller and returns their summary without secrets', async () => {
    const caller = buildUser();
    const updated = buildUser({ id: caller.id, phone: '+5493415550000', locale: 'en' });
    const users = { updateContact: jest.fn().mockResolvedValue(updated) };
    const ref = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: UsersService, useValue: users }],
    }).compile();

    const summary = await ref.get(ProfileController).update(caller, { phone: '+54 9 341 555 0000', locale: 'en' });

    expect(users.updateContact).toHaveBeenCalledWith(caller, { phone: '+54 9 341 555 0000', locale: 'en' });
    expect(summary).toMatchObject({ id: caller.id, phone: '+5493415550000', locale: 'en' });
    expect(JSON.stringify(summary)).not.toContain('passwordHash');
  });
});
