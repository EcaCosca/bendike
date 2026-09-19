import type { Category } from '@bendike/shared';
import { childrenOf, pathTo, topLevel } from './category-tree';

const name = (en: string) => ({ en, es: en, pt: en });

const categories: Category[] = [
  { id: 'c2', slug: 'parachutes', name: name('Parachutes'), parentId: null, position: 1 },
  { id: 'c1', slug: 'wingsuits', name: name('Wingsuits'), parentId: null, position: 0 },
  { id: 'c4', slug: 'skydiving-canopies', name: name('Skydiving'), parentId: 'c2', position: 1 },
  { id: 'c3', slug: 'base-canopies', name: name('BASE'), parentId: 'c2', position: 0 },
];

describe('category tree helpers', () => {
  test('topLevel returns the roots ordered by position', () => {
    expect(topLevel(categories).map((c) => c.slug)).toEqual(['wingsuits', 'parachutes']);
  });

  test('childrenOf returns the children of a parent ordered by position', () => {
    expect(childrenOf(categories, 'c2').map((c) => c.slug)).toEqual(['base-canopies', 'skydiving-canopies']);
  });

  test('pathTo returns the parent chain ending at the category', () => {
    expect(pathTo(categories, 'base-canopies').map((c) => c.slug)).toEqual(['parachutes', 'base-canopies']);
  });

  test('pathTo a root category is just that category', () => {
    expect(pathTo(categories, 'wingsuits').map((c) => c.slug)).toEqual(['wingsuits']);
  });

  test('pathTo an unknown slug is empty', () => {
    expect(pathTo(categories, 'nope')).toEqual([]);
  });
});
