// Contact sheet for the spots2 illustrations: every drawing on crème with blue ink and on blue
// with crème ink, rendered with the installed Chrome (no dev server needed).
//   node scripts/illustrations/spots2-sheet.mjs [svgDir] [out.png] [--only name] [--scale 2]
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
const zoom = Number(opt('zoom', 1));
const dir = resolve(args[0] ?? resolve(here, '../../src/assets/illustrations'));
const out = resolve(args[1] ?? resolve(here, '../../shots/spots-2.png'));

const all = [
  ['lyre', 300],
  ['temple', 400],
  ['laurel', 300],
  ['olive-branch', 400],
  ['icon-spirit', 160],
  ['icon-community', 160],
  ['icon-contribution', 160],
];
const names = only ? all.filter(([n]) => only.split(',').includes(n)) : all;
const cells = names
  .map(([n, w]) => `<figure style="width:${w * zoom}px">${readFileSync(resolve(dir, `${n}.svg`), 'utf8')}</figure>`)
  .join('');

const html = `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0}
  body{width:max-content;font:0/0 a}
  .row{display:flex;align-items:center;gap:44px;padding:44px 52px;--paper:#f2e9d3;background:#f2e9d3;color:#0b1c8c}
  .row.blue{--paper:#0b1c8c;background:#0b1c8c;color:#f9f3e3}
  figure{margin:0;flex:none}
  svg{display:block;width:100%;height:auto;overflow:visible}
</style><div class="row">${cells}</div><div class="row blue">${cells}</div>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: scale });
await page.setContent(html);
await page.locator('body').screenshot({ path: out });
await browser.close();
console.log(out);
