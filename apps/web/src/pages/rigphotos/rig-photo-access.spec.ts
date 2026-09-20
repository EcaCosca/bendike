import { Role } from '@bendike/shared';
import { canRemovePhoto } from './rig-photo-access';

const photo = { addedById: 'rigger-1' };

describe('canRemovePhoto', () => {
  test.each([
    ['the person who added it', { id: 'rigger-1', role: Role.Rigger }, 'owner-1', true],
    ['the owner of the rig', { id: 'owner-1', role: Role.User }, 'owner-1', true],
    ['an admin', { id: 'admin-1', role: Role.Admin }, 'owner-1', true],
    ['another rigger', { id: 'rigger-2', role: Role.Rigger }, 'owner-1', false],
  ])('%s: %s', (_who, user, ownerId, expected) => {
    expect(canRemovePhoto(photo, user, ownerId)).toBe(expected);
  });
});
