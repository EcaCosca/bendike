import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { AREA_FILES, AREAS, COMMON_FILES } from './locales';

type Tree = Record<string, unknown>;

function leaves(tree: Tree, prefix = ''): { key: string; value: unknown }[] {
  return Object.entries(tree).flatMap(([name, value]) => {
    const key = prefix ? `${prefix}.${name}` : name;
    return value !== null && typeof value === 'object' ? leaves(value as Tree, key) : [{ key, value }];
  });
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) && !/\.spec\.(ts|tsx)$/.test(entry) && !entry.endsWith('.d.ts') ? [path] : [];
  });
}

const SRC = join(__dirname, '..');
const sourceText = sourceFiles(SRC)
  .filter((path) => !path.includes(`${join('i18n', 'locales')}`))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

describe('translation files', () => {
  test('every area file carries exactly one top-level namespace, named after its area', () => {
    for (const language of ['en', 'es', 'pt'] as const) {
      const namespaces = AREA_FILES[language].map((file) => Object.keys(file));
      expect(namespaces.map((keys) => keys.length)).toEqual(AREAS.map(() => 1));
      expect(namespaces.map((keys) => keys[0])).toEqual([...AREAS]);
    }
  });

  test('the common file and the area files share no namespace', () => {
    const common = Object.keys(COMMON_FILES.en);
    expect(common.filter((key) => (AREAS as readonly string[]).includes(key))).toEqual([]);
  });

  test('Spanish and Portuguese have exactly the keys English has, with no empty value', () => {
    const files = (language: 'en' | 'es' | 'pt') => [COMMON_FILES[language], ...AREA_FILES[language]];
    const english = files('en');
    for (const language of ['es', 'pt'] as const) {
      const translated = files(language);
      english.forEach((file, index) => {
        const expected = leaves(file).map((leaf) => leaf.key);
        const actual = leaves(translated[index] ?? {}).map((leaf) => leaf.key);
        expect(actual.sort()).toEqual([...expected].sort());
      });
    }
    for (const language of ['en', 'es', 'pt'] as const) {
      const empty = files(language)
        .flatMap((file) => leaves(file))
        .filter((leaf) => typeof leaf.value !== 'string' || leaf.value.trim() === '')
        .map((leaf) => leaf.key);
      expect(empty).toEqual([]);
    }
  });

  test('every area key is referenced by some source file', () => {
    const unreferenced = AREA_FILES.en
      .flatMap((file) => leaves(file))
      .map((leaf) => leaf.key.replace(/_(one|other|zero|few|many)$/, ''))
      .filter((key, index, all) => all.indexOf(key) === index)
      .filter((key) => {
        if (sourceText.includes(`'${key}'`) || sourceText.includes(`"${key}"`) || sourceText.includes(`\`${key}\``)) {
          return false;
        }
        const segments = key.split('.');
        for (let depth = segments.length - 1; depth >= 1; depth--) {
          const prefix = segments.slice(0, depth).join('.');
          if (sourceText.includes(`\`${prefix}.\${`)) {
            return false;
          }
        }
        return true;
      });
    expect(unreferenced).toEqual([]);
  });
});
