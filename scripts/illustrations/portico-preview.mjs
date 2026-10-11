// Puts the portico pieces together the way NewsletterDialog.astro does, around blocks of stand-in
// content, and renders the result with the installed Chrome (no dev server needed).
//   node scripts/illustrations/portico-preview.mjs out.png [--w 652] [--head 190] [--form 220] [--narrow] [--scale 2] [--zoom 1] [--line 1.7]
// --narrow is the arrangement for small screens (the form in the podium); --zoom enlarges the whole
// frame, to inspect the capitals and mouldings.
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
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i >= 0) args.splice(i, 1);
  return i >= 0;
};
const narrow = flag('narrow');
const w = Number(opt('w', narrow ? 366 : 652));
const headH = Number(opt('head', narrow ? 200 : 190));
const formH = Number(opt('form', narrow ? 170 : 220));
const scale = Number(opt('scale', 2));
const zoom = Number(opt('zoom', 1));
const lineW = opt('line', narrow ? 1.35 : 1.7);
const out = resolve(args[0] ?? 'portico.png');
const dir = resolve(here, '../../src/assets/illustrations');
const piece = (name) => readFileSync(resolve(dir, `portico-${name}.svg`), 'utf8');
const column = `<div class="cap">${piece('capital')}</div><div class="shaft">${piece('shaft')}</div><div class="base">${piece('base')}</div>`;

const html = `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0}
  body{width:max-content;padding:${30 * zoom}px;background:#8a8fb5;--paper:#f2e9d3;--blue-light:#b3c0f3;--blue:#0b1c8c;--blue-deep:#071260;color:#0b1c8c}
  .frame{width:${w * zoom}px;container-type:inline-size;position:relative}
  .grid{--u:calc(100cqw / 620);position:relative;display:grid;
    grid-template-columns:calc(18 * var(--u)) calc(76 * var(--u)) minmax(0,1fr) calc(76 * var(--u)) calc(18 * var(--u));
    padding:calc(8 * var(--u)) 0 calc(10 * var(--u))}
  .paper{position:absolute;inset:0;background:#f2e9d3;
    clip-path:polygon(50% 0,100% calc(80.8 * var(--u)),100% 100%,0 100%,0 calc(80.8 * var(--u)))}
  .ped,.steps,.ledge{grid-column:1 / -1;position:relative}
  .ped{grid-row:1}.ledge{grid-row:3}.steps{grid-row:5}
  .col{position:relative;display:flex;flex-direction:column;grid-row:${narrow ? '2' : '2 / 5'}}
  .col--l{grid-column:2}.col--r{grid-column:4;scale:-1 1}
  .head{grid-area:2 / 3;position:relative;min-height:${headH * zoom}px}
  .form{position:relative;min-height:${formH * zoom}px;grid-area:${narrow ? '4 / 1 / 5 / -1' : '4 / 3'}}
  .wall{grid-area:4 / 1 / 5 / -1;position:relative}
  ${narrow ? '' : '.ledge,.wall{display:none}'}
  .shaft{position:relative;flex:1 1 0;min-height:calc(${narrow ? 350 : 340} * var(--u))}
  .shaft svg,.wall svg{position:absolute;inset:0;height:100%}
  svg{display:block;width:100%;height:auto;overflow:visible;stroke-width:${lineW * zoom}px}
</style>
<div class="frame"><div class="grid"><div class="paper"></div>
  <div class="ped">${piece('pediment')}</div>
  <div class="col col--l">${column}</div><div class="head"></div><div class="col col--r">${column}</div>
  <div class="ledge">${piece('ledge')}</div><div class="wall">${piece('wall')}</div><div class="form"></div>
  <div class="steps">${piece('steps')}</div>
</div></div>`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: scale });
await page.setContent(html);
await page.locator('body').screenshot({ path: out });
await browser.close();
console.log(out);
