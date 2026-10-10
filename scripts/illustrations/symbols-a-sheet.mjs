// Contact sheet for the symbols-a set (tetractys, monad, bow-lyre, cave-sun, ladder, torch):
// every drawing on crème with blue ink and on Greek blue with crème ink, rendered with the
// installed Chrome (no dev server needed).
//   node scripts/illustrations/symbols-a-sheet.mjs [out.png] [--only a,b] [--dir svgDir] [--h 300] [--scale 2] [--one crème|blue]
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

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
const scale = Number(opt('scale', 2));
const h = Number(opt('h', 300));
const one = opt('one');
const dir = resolve(opt('dir', resolve(here, '../../src/assets/illustrations')));
const out = resolve(args[0] ?? resolve(here, '../../shots/symbols-a.png'));

const all = ['tetractys', 'monad', 'bow-lyre', 'cave-sun', 'ladder', 'torch'];
const names = only ? only.split(',') : all;
// Same height for all, so one unit of the viewBox is nearly the same size in every drawing.
const cells = names
  .map((n) => {
    const svg = readFileSync(resolve(dir, `${n}.svg`), 'utf8');
    const [, , , vw, vh] = svg.match(/viewBox="(\S+) (\S+) (\S+) (\S+)"/).map(Number);
    return `<figure style="width:${(h * vw) / 320}px;height:${(h * vh) / 320}px">${svg}</figure>`;
  })
  .join('');

const row = (cls) => `<div class="row ${cls}">${cells}</div>`;
const html = `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0}
  body{width:max-content;font:0/0 a}
  .row{display:flex;align-items:center;gap:40px;padding:44px 48px;--paper:#f2e9d3;--blue-light:#b3c0f3;--blue:#0b1c8c;--blue-deep:#071260;background:#f2e9d3;color:#0b1c8c}
  .row.blue{--paper:#0b1c8c;background:#0b1c8c;color:#f9f3e3}
  figure{margin:0;flex:none}
  svg{display:block;width:100%;height:100%;overflow:visible}
</style>${one === 'blue' ? '' : row('')}${one === 'creme' ? '' : row('blue')}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: scale });
await page.setContent(html);
await page.locator('body').screenshot({ path: out });
await browser.close();
console.log(out);
