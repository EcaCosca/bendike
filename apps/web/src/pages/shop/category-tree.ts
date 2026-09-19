import type { Category } from '@bendike/shared';

function byPosition(a: Category, b: Category): number {
  return a.position - b.position;
}

export function topLevel(categories: Category[]): Category[] {
  return categories.filter((category) => category.parentId === null).sort(byPosition);
}

export function childrenOf(categories: Category[], parentId: string): Category[] {
  return categories.filter((category) => category.parentId === parentId).sort(byPosition);
}

export function pathTo(categories: Category[], slug: string): Category[] {
  const target = categories.find((category) => category.slug === slug);
  if (!target) {
    return [];
  }
  const parent = target.parentId ? categories.find((category) => category.id === target.parentId) : undefined;
  return parent ? [parent, target] : [target];
}
