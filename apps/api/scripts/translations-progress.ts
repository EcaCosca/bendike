import fs from 'node:fs';
import path from 'node:path';
import { countSections, parseWorksheet } from './translations-export';

/**
 * How much of the translation is written, without touching the database.
 *
 *   npm run translations:progress -w @bendike/api
 */

const DIR = path.join(__dirname, 'translations');

function bar(done: number, total: number): string {
  const width = 28;
  const filled = total === 0 ? 0 : Math.round((done / total) * width);
  return `${'█'.repeat(filled)}${'·'.repeat(width - filled)}`;
}

function main(): void {
  if (!fs.existsSync(DIR)) {
    console.log('No worksheets yet. Run: npm run translations:export -w @bendike/api');
    return;
  }

  let doneAll = 0;
  let totalAll = 0;

  for (const file of fs
    .readdirSync(DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()) {
    const text = fs.readFileSync(path.join(DIR, file), 'utf-8');
    const total = countSections(text);
    const done = parseWorksheet(text).size;
    doneAll += done;
    totalAll += total;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    console.log(`  ${file.padEnd(20)} ${bar(done, total)} ${String(done).padStart(3)}/${total}  ${pct}%`);
  }

  const pct = totalAll === 0 ? 0 : Math.round((doneAll / totalAll) * 100);
  console.log(`\n  ${'total'.padEnd(20)} ${bar(doneAll, totalAll)} ${doneAll}/${totalAll}  ${pct}%`);
  if (doneAll > 0) {
    console.log('\n  Load what is written:  npm run translations:import -w @bendike/api -- --dry-run');
  }
}

main();
