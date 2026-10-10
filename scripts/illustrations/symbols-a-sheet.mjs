// Contact sheet for the symbols-a set (tetractys, monad, bow-lyre, cave-sun, ladder, torch):
// every drawing on crème with blue ink and on Greek blue with crème ink, large and then at
// ornament size. Rendered with sharp (librsvg), which knows neither currentColor nor CSS
// variables, so the page ink and the palette are written into a copy of each drawing first.
//   node scripts/illustrations/symbols-a-sheet.mjs [out.png] [--only a,b] [--dir svgDir] [--h 300] [--small 96] [--one creme|blue]
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const only = opt('only');
const h = Number(opt('h', 300));
const small = Number(opt('small', 96));
const one = opt('one');
const dir = resolve(opt('dir', resolve(here, '../../src/assets/illustrations')));
const out = resolve(args[0] ?? resolve(here, '../../shots/symbols-a.png'));

const all = ['tetractys', 'monad', 'bow-lyre', 'cave-sun', 'ladder', 'torch'];
const names = only ? only.split(',') : all;
const grounds = {
  creme: { paper: '#f2e9d3', ink: '#0b1c8c' },
  blue: { paper: '#0b1c8c', ink: '#f9f3e3' },
};

// One row: every drawing at the same scale (a 320-unit drawing is `size` px high), so one unit
// of the viewBox, and with it the stroke, is the same in all of them.
async function row({ paper, ink }, size, gap, padX, padY) {
  const cells = [];
  for (const n of names) {
    const src = readFileSync(resolve(dir, `${n}.svg`), 'utf8');
    const [, , , vw, vh] = src.match(/viewBox="(\S+) (\S+) (\S+) (\S+)"/).map(Number);
    const w = Math.round((size * vw) / 320);
    const ht = Math.round((size * vh) / 320);
    const svg = src
      .replace('<svg ', `<svg width="${w}" height="${ht}" `)
      .replaceAll('currentColor', ink)
      .replaceAll('var(--paper, #f2e9d3)', paper)
      .replaceAll('var(--blue-light, #b3c0f3)', '#b3c0f3')
      .replaceAll('var(--blue-deep, #071260)', '#071260')
      .replaceAll('var(--blue, #0b1c8c)', '#0b1c8c');
    cells.push({ input: await sharp(Buffer.from(svg)).png().toBuffer(), w, ht });
  }
  const height = Math.max(...cells.map((c) => c.ht)) + padY * 2;
  let x = padX;
  const placed = cells.map((c) => {
    const o = { input: c.input, left: x, top: Math.round((height - c.ht) / 2) };
    x += c.w + gap;
    return o;
  });
  const width = x - gap + padX;
  return { width, height, placed, paper };
}

const rows = [];
for (const key of Object.keys(grounds)) {
  if (one && one !== key) continue;
  rows.push(await row(grounds[key], h, 44, 48, 40));
  if (small) rows.push(await row(grounds[key], small, 44, 48, 22));
}
const width = Math.max(...rows.map((r) => r.width));
let y = 0;
const layers = [];
for (const r of rows) {
  layers.push({
    input: await sharp({ create: { width, height: r.height, channels: 3, background: r.paper } }).png().toBuffer(),
    left: 0,
    top: y,
  });
  r.placed.forEach((p) => layers.push({ ...p, top: p.top + y }));
  y += r.height;
}
await sharp({ create: { width, height: y, channels: 3, background: '#f2e9d3' } }).composite(layers).png().toFile(out);
console.log(out);
