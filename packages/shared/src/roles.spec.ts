import { isRole, Role, ROLES } from './roles';

describe('roles', () => {
  test('exposes exactly the five Bendike roles in order', () => {
    expect(ROLES).toEqual(['user', 'rigger', 'dropzone', 'authority', 'admin']);
  });

  test('Role constants match the ROLES tuple', () => {
    expect(Object.values(Role).sort()).toEqual([...ROLES].sort());
  });

  describe('isRole', () => {
    test.each(ROLES)('accepts "%s"', (role) => {
      expect(isRole(role)).toBe(true);
    });

    test.each(['ADMIN', 'owner', '', 42, null, undefined])('rejects %p', (value) => {
      expect(isRole(value)).toBe(false);
    });
  });
});
