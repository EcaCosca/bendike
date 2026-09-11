export const ROLES = ['user', 'rigger', 'dropzone', 'admin'] as const;

export type Role = (typeof ROLES)[number];

export const Role = {
  User: 'user',
  Rigger: 'rigger',
  Dropzone: 'dropzone',
  Admin: 'admin',
} as const satisfies Record<string, Role>;

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
