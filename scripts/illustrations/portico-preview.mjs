// Puts the five portico pieces together the way NewsletterDialog.astro does, around a block of
// stand-in content, and renders the result with the installed Chrome (no dev server needed).
//   node scripts/illustrations/portico-preview.mjs out.png [--w 608] [--body 360] [--scale 2] [--zoom 1]
// --zoom enlarges the whole frame, to inspect the capitals and mouldings.
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
const w = Number(opt('w', 608));
const bodyH = Number(opt('body', 360));
const scale = Number(opt('scale', 2));
const zoom = Number(opt('zoom', 1));
const lineW = opt('line', w < 480 ? 1.3 : 1.6);
const out = resolve(args[0] ?? 'portico.png');
const dir = resolve(here, '../../src/assets/illustrations');
const piece = (name) => readFileSync(resolve(dir, `portico-${name}.svg`), 'utf8');
const column = `<div class="cap">${piece('capital')}</div><div class="shaft">${piece('shaft')}</div><div class="base">${piece('base')}</div>`;

const html = `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0}
  body{width:max-content;padding:${40 * zoom}px;background:#8a8fb5;--paper:#f2e9d3;--blue-light:#b3c0f3;--blue:#0b1c8c;--blue-deep:#071260;color:#0b1c8c}
  .frame{width:${w * zoom}px;container-type:inline-size;position:relative}
  .grid{--u:calc(100cqw / 640);position:relative;display:grid;
    grid-template-columns:calc(21 * var(--u)) calc(64 * var(--u)) minmax(0,1fr) calc(64 * var(--u)) calc(21 * var(--u));
    padding:calc(8 * var(--u)) 0 calc(12 * var(--u))}
  .paper{position:absolute;inset:0;background:#f2e9d3;
    clip-path:polygon(50% 0,100% calc(75.2 * var(--u)),100% 100%,0 100%,0 calc(75.2 * var(--u)))}
  .ped,.steps{grid-column:1 / -1;position:relative}
  .col{position:relative;display:flex;flex-direction:column}
  .col--l{grid-column:2}.col--r{grid-column:4;scale:-1 1}
  .body{grid-column:3;position:relative;min-height:${bodyH * zoom}px}
  .shaft{position:relative;flex:1 1 0;min-height:calc(190 * var(--u))}
  .shaft svg{position:absolute;inset:0;height:100%}
  svg{display:block;width:100%;height:auto;overflow:visible;stroke-width:${lineW * zoom}px}
</style>
<div class="frame"><div class="grid"><div class="paper"></div>
  <div class="ped">${piece('pediment')}</div>
  <div class="col col--l">${column}</div><div class="body"></div><div class="col col--r">${column}</div>
  <div class="steps">${piece('steps')}</div>
</div></div>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: scale });
await page.setContent(html);
await page.locator('body').screenshot({ path: out });
await browser.close();
console.log(out);
