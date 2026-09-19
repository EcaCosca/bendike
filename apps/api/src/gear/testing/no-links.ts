export const noLinks = { hasActiveLink: () => Promise.resolve(false) };

export function linkedTo(...pairs: [riggerId: string, ownerId: string][]) {
  return {
    hasActiveLink: (riggerId: string, ownerId: string) =>
      Promise.resolve(pairs.some(([r, o]) => r === riggerId && o === ownerId)),
  };
}

export const noRiggers = { activeRiggers: () => Promise.resolve([] as { id: string; displayName: string }[]) };
