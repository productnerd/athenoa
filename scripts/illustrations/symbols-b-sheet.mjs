// Contact sheet for the symbols-b illustrations: every drawing on crème with blue ink and on Greek
// blue with crème ink, rendered with the installed Chrome (no dev server needed).
//   node scripts/illustrations/symbols-b-sheet.mjs                     -> shots/symbols-b.png
//   node scripts/illustrations/symbols-b-sheet.mjs --only wheat --zoom 2.4
//                                                                      -> shots/symbols-b-wheat.png
//   node scripts/illustrations/symbols-b-sheet.mjs --dir some/dir      reads the SVGs from elsewhere
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
const zoom = Number(opt('zoom', only ? 2.4 : 1));
const dir = resolve(opt('dir', resolve(here, '../../src/assets/illustrations')));
const out = resolve(opt('out', resolve(here, `../../shots/symbols-b${only ? `-${only.replace(/,/g, '-')}` : ''}.png`)));

// name, viewBox width: every drawing is shown at the same scale, so the stroke weights can be compared.
const all = [
  ['spring-cypress', 300],
  ['tripod', 300],
  ['butterfly', 320],
  ['orphic-egg', 280],
  ['cicada', 300],
  ['wheat', 200],
];
const names = only ? all.filter(([n]) => only.split(',').includes(n)) : all;
const k = only ? zoom : zoom * 0.82;
const cells = names
  .map(([n, w]) => `<figure style="width:${w * k}px">${readFileSync(resolve(dir, `${n}.svg`), 'utf8')}</figure>`)
  .join('');

const html = `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0}
  body{width:max-content;font:0/0 a}
  .row{display:flex;align-items:center;gap:40px;padding:44px 48px;--paper:#f2e9d3;background:#f2e9d3;color:#0b1c8c}
  .row.blue{--paper:#0b1c8c;background:#0b1c8c;color:#f2e9d3}
  figure{margin:0;flex:none}
  svg{display:block;width:100%;height:auto;overflow:visible}
</style><div class="row">${cells}</div><div class="row blue">${cells}</div>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: scale });
await page.setContent(html);
await page.locator('body').screenshot({ path: out });
await browser.close();
console.log(out);
