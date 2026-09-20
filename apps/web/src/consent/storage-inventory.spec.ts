import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { STORAGE_INVENTORY } from './storage-inventory';

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry) && !/\.spec\.(ts|tsx)$/.test(entry) && !entry.endsWith('.d.ts') ? [path] : [];
  });
}

const SRC = join(__dirname, '..');
const sources = sourceFiles(SRC).map((path) => ({ path, text: readFileSync(path, 'utf8') }));
const listed = new Set(STORAGE_INVENTORY.map((item) => item.name));

describe('the cookie policy inventory', () => {
  test('lists every storage key the code names', () => {
    const named = new Set<string>();
    for (const { text } of sources) {
      for (const match of text.matchAll(/['"`](bendike[._][A-Za-z.]*[A-Za-z])['"`]/g)) {
        named.add(match[1] as string);
      }
    }

    expect(named.size).toBeGreaterThan(0);
    expect([...named].filter((name) => !listed.has(name))).toEqual([]);
  });

  test('lists nothing the code no longer uses', () => {
    const text = sources.map((source) => source.text).join('\n');
    const keys = STORAGE_INVENTORY.filter((item) => item.type !== 'Third-party script').map((item) => item.name);

    expect(keys.filter((key) => !text.includes(`'${key}'`))).toEqual([]);
  });

  test('the code only touches the browser storage through the places the policy covers', () => {
    const offenders = sources
      .filter(({ path }) => !/(consent-storage|auth-context|detect-locale|gear-view|packing-draft)\.tsx?$/.test(path))
      .filter(({ text }) => /sessionStorage|localStorage|document\.cookie|indexedDB/.test(text))
      .map(({ path }) => path.replace(SRC, ''));

    expect(offenders).toEqual([]);
  });

  test('the third-party script it names is the one the code loads', () => {
    const google = sources.find(({ path }) => path.endsWith('google-identity.ts'));
    expect(google?.text).toContain('https://accounts.google.com/gsi/client');
    expect(
      STORAGE_INVENTORY.some((item) => item.type === 'Third-party script' && item.name.includes('accounts.google.com')),
    ).toBe(true);
  });
});
