export const ROLES = ['user', 'rigger', 'dropzone', 'authority', 'admin'] as const;

export type Role = (typeof ROLES)[number];

export const Role = {
  User: 'user',
  Rigger: 'rigger',
  Dropzone: 'dropzone',
  Authority: 'authority',
  Admin: 'admin',
} as const satisfies Record<string, Role>;

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
