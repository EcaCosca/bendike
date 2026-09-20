import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { stdout } from 'node:process';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, 'index.html'), 'utf8');
const MIME = { jpg: 'image/jpeg', png: 'image/png' };

const standalone = html.replace(/src="(img\/[^"]+\.(jpg|png))"/g, (_match, path, extension) => {
  const bytes = readFileSync(join(here, path));
  return `src="data:${MIME[extension]};base64,${bytes.toString('base64')}"`;
});

const out = join(here, 'bendike-deck.standalone.html');
writeFileSync(out, standalone);
stdout.write(`Wrote ${out} (${(standalone.length / 1024 / 1024).toFixed(1)} MB), one file you can email or open anywhere.\n`);
