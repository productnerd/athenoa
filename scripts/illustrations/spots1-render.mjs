// Render the spots-1 illustrations in a real browser, blue ink on crème and crème ink on blue.
// node scripts/illustrations/spots1-render.mjs            -> shots/spots-1.png (contact sheet)
// node scripts/illustrations/spots1-render.mjs athena 900 -> shots/spots-1-athena.png, each tile 900px wide
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const svg = (name) => readFileSync(resolve(root, `src/assets/illustrations/${name}.svg`), 'utf8');
const [, , only, size] = process.argv;

const css = `
  * { box-sizing: border-box; margin: 0; }
  body { background: #f2e9d3; font: 14px/1 Georgia, serif; }
  .sheet { display: grid; gap: 0; width: max-content; }
  .ground { display: flex; align-items: center; gap: 40px; padding: 40px; }
  .creme { background: #f2e9d3; color: #0b1c8c; --paper: #f2e9d3; }
  .blue { background: #0b1c8c; color: #f2e9d3; --paper: #0b1c8c; }
  .tile svg { display: block; width: 100%; height: auto; overflow: visible; }
  .col { display: grid; gap: 40px; }
`;

const tile = (name, width) => `<div class="tile" style="width:${width}px">${svg(name)}</div>`;

let html;
let out;
if (only) {
  const w = Number(size || 600);
  html = `<div class="sheet" style="grid-auto-flow:column">
    <div class="ground creme">${tile(only, w)}</div>
    <div class="ground blue">${tile(only, w)}</div></div>`;
  out = `shots/spots-1-${only}.png`;
} else {
  const ground = (cls) => `<div class="ground ${cls}" style="align-items:flex-start">
      ${tile('athena', 520)}
      <div class="col">${tile('sun-rays', 420)}<div style="display:flex;gap:40px;align-items:flex-end">${tile('owl', 190)}${tile('owl', 96)}${tile('athena', 96)}</div></div>
    </div>
    <div class="ground ${cls}" style="padding-top:0">${tile('waves', 1020)}</div>`;
  html = `<div class="sheet">${ground('creme')}${ground('blue')}</div>`;
  out = 'shots/spots-1.png';
}

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><style>${css}</style>${html}`);
await page.locator('.sheet').screenshot({ path: resolve(root, out) });
await browser.close();
console.log(out);
