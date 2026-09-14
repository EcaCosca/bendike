import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');
const RAW = path.join(REPO, 'design/about/raw');
const OUT = path.join(REPO, 'apps/web/public/about');
const MARK = path.join(REPO, 'apps/web/public/brand/mark-gold-640.png');
const FALLBACK_KIDS = path.join(homedir(), 'Downloads/bendike/chicos.jpg');
const NAVY = { r: 0x0b, g: 0x25, b: 0x45 };
const PAPER = { r: 0xf4, g: 0xef, b: 0xe6 };
const GRADE = process.argv.includes('--grade');

const IMAGES = [
  ...Array.from({ length: 8 }, (_, i) => ({ id: `prep-0${i + 1}`, ground: PAPER, portrait: false })),
  { id: 'loft-01', ground: NAVY, portrait: false },
  { id: 'loft-02', ground: NAVY, portrait: false },
  { id: 'pilot-01', ground: PAPER, portrait: false },
  { id: 'teach-01', ground: PAPER, portrait: false },
  { id: 'kids', ground: PAPER, portrait: true, fallback: FALLBACK_KIDS },
  { id: 'eca', ground: NAVY, portrait: true },
];

const report = { real: [], placeholder: [] };

function findRaw(id, extensions) {
  for (const ext of extensions) {
    const candidate = path.join(RAW, `${id}.${ext}`);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function pickFfmpeg() {
  const candidates = [process.env.SCROLLCRAFT_FFMPEG, 'ffmpeg'];
  const winget = path.join(homedir(), 'AppData/Local/Microsoft/WinGet/Packages');
  if (existsSync(winget)) {
    for (const pkg of readdirSync(winget).filter((name) => name.startsWith('Gyan.FFmpeg'))) {
      const pkgDir = path.join(winget, pkg);
      for (const build of readdirSync(pkgDir).filter((name) => name.includes('full_build'))) {
        candidates.push(path.join(pkgDir, build, 'bin/ffmpeg.exe'));
      }
    }
  }
  for (const candidate of candidates.filter(Boolean)) {
    const probe = spawnSync(candidate, ['-hide_banner', '-filters'], { encoding: 'utf8' });
    if (probe.status === 0 && probe.stdout.split('\n').length > 200) {
      return candidate;
    }
  }
  throw new Error('No full ffmpeg build found. Install ffmpeg (full build) or set SCROLLCRAFT_FFMPEG.');
}

async function placeholder(width, height, ground, file) {
  const mark = await sharp(MARK)
    .resize({ width: Math.round(width * 0.42) })
    .toBuffer();
  await sharp({ create: { width, height, channels: 3, background: ground } })
    .composite([{ input: mark, gravity: 'centre' }])
    .webp({ quality: 80 })
    .toFile(file);
}

async function prepareImage(spec) {
  const raw =
    findRaw(spec.id, ['jpg', 'jpeg', 'png', 'webp', 'heic', 'JPG', 'JPEG', 'PNG']) ??
    (spec.fallback && existsSync(spec.fallback) ? spec.fallback : null);
  if (raw) {
    for (const width of [1600, 800]) {
      await sharp(raw)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(path.join(OUT, `${spec.id}-${width}.webp`));
    }
    report.real.push(`${spec.id}  ←  ${path.relative(REPO, raw)}`);
    return;
  }
  const [w, h] = spec.portrait ? [1200, 1600] : [1600, 1067];
  await placeholder(w, h, spec.ground, path.join(OUT, `${spec.id}-1600.webp`));
  await placeholder(Math.round(w / 2), Math.round(h / 2), spec.ground, path.join(OUT, `${spec.id}-800.webp`));
  report.placeholder.push(spec.id);
}

function encode(ffmpeg, input, output, { filter, gop, crf }) {
  execFileSync(
    ffmpeg,
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      input,
      '-an',
      '-vf',
      `${filter},format=yuv420p`,
      '-c:v',
      'libx264',
      '-profile:v',
      'high',
      '-preset',
      'slow',
      '-crf',
      String(crf),
      '-g',
      String(gop),
      '-keyint_min',
      String(gop),
      '-sc_threshold',
      '0',
      '-movflags',
      '+faststart',
      output,
    ],
    { stdio: 'inherit' },
  );
}

function placeholderClip(ffmpeg, poster, output, size, gop) {
  execFileSync(
    ffmpeg,
    [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-loop',
      '1',
      '-i',
      poster,
      '-t',
      '5',
      '-an',
      '-vf',
      `zoompan=z='1+0.18*on/150':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${size}:fps=30,format=yuv420p`,
      '-c:v',
      'libx264',
      '-profile:v',
      'high',
      '-preset',
      'slow',
      '-crf',
      '20',
      '-g',
      String(gop),
      '-keyint_min',
      String(gop),
      '-sc_threshold',
      '0',
      '-movflags',
      '+faststart',
      output,
    ],
    { stdio: 'inherit' },
  );
}

async function prepareFlight() {
  const raw = findRaw('flight', ['mp4', 'mov', 'MOV', 'MP4', 'm4v']);
  const posterDesktop = path.join(OUT, 'flight-poster.webp');
  const posterMobile = path.join(OUT, 'flight-poster-m.webp');
  const ffmpeg = pickFfmpeg();
  if (!raw) {
    await placeholder(1920, 1080, NAVY, posterDesktop);
    await placeholder(720, 1280, NAVY, posterMobile);
    placeholderClip(ffmpeg, posterDesktop, path.join(OUT, 'flight.mp4'), '1920x1080', 8);
    placeholderClip(ffmpeg, posterMobile, path.join(OUT, 'flight-m.mp4'), '720x1280', 4);
    report.placeholder.push('flight (placeholder push-in clip rendered from the placeholder poster)');
    return;
  }
  const grade = GRADE
    ? 'colorlevels=rimin=0.06:gimin=0.06:bimin=0.06:rimax=0.9:gimax=0.9:bimax=0.9,eq=saturation=1.06,'
    : '';
  const desktop = path.join(OUT, 'flight.mp4');
  const mobile = path.join(OUT, 'flight-m.mp4');
  encode(ffmpeg, raw, desktop, { filter: `${grade}fps=30,scale=-2:1080:flags=lanczos`, gop: 8, crf: 20 });
  const portraitRaw = findRaw('flight-portrait', ['mp4', 'mov', 'MOV', 'MP4', 'm4v']);
  if (portraitRaw) {
    encode(ffmpeg, portraitRaw, mobile, { filter: `${grade}fps=30,scale=720:-2:flags=lanczos`, gop: 4, crf: 24 });
  } else {
    encode(ffmpeg, raw, mobile, {
      filter: `${grade}fps=30,crop=ih*9/16:ih,scale=720:-2:flags=lanczos`,
      gop: 4,
      crf: 24,
    });
  }
  const framePng = path.join(OUT, 'flight-first-frame.png');
  execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', desktop, '-frames:v', '1', framePng]);
  await sharp(framePng).webp({ quality: 82 }).toFile(posterDesktop);
  const framePngM = path.join(OUT, 'flight-first-frame-m.png');
  execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-i', mobile, '-frames:v', '1', framePngM]);
  await sharp(framePngM).webp({ quality: 82 }).toFile(posterMobile);
  for (const tmp of [framePng, framePngM]) {
    if (existsSync(tmp)) {
      execFileSync(
        process.platform === 'win32' ? 'cmd' : 'rm',
        process.platform === 'win32' ? ['/c', 'del', tmp] : [tmp],
      );
    }
  }
  const size = (file) => `${(statSync(file).size / 1_048_576).toFixed(1)} MB`;
  report.real.push(`flight  ←  ${path.relative(REPO, raw)}  (desktop ${size(desktop)}, mobile ${size(mobile)})`);
}

mkdirSync(OUT, { recursive: true });
mkdirSync(RAW, { recursive: true });
await prepareFlight();
for (const spec of IMAGES) {
  await prepareImage(spec);
}

console.log('\nAbout page assets → apps/web/public/about\n');
console.log('Real:');
for (const line of report.real) console.log(`  ✓ ${line}`);
console.log(report.real.length ? '' : '  (none yet)');
console.log('Placeholders (drop the raw file in design/about/raw and re-run):');
for (const line of report.placeholder) console.log(`  · ${line}`);
console.log(report.placeholder.length ? '' : '  (none, every slot is real)');
