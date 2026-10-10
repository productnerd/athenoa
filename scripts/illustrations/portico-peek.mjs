// Renders one or more illustration SVGs on crème with the installed Chrome, to look at them.
//   node scripts/illustrations/portico-peek.mjs out.png name[,name...] [--h 500] [--scale 2] [--dir svgDir]
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
const h = Number(opt('h', 500));
const scale = Number(opt('scale', 2));
const dir = resolve(opt('dir', resolve(here, '../../src/assets/illustrations')));
const [out, names] = args;

const cells = names
  .split(',')
  .map((n) => {
    const svg = readFileSync(resolve(dir, `${n}.svg`), 'utf8');
    const [, , , vw, vh] = svg.match(/viewBox="(\S+) (\S+) (\S+) (\S+)"/).map(Number);
    return `<figure style="height:${h}px;width:${(h * vw) / vh}px">${svg}</figure>`;
  })
  .join('');
const html = `<!doctype html><meta charset="utf-8"><style>
  html,body{margin:0}
  body{width:max-content;display:flex;gap:40px;padding:40px;--paper:#f2e9d3;--blue-light:#b3c0f3;--blue:#0b1c8c;--blue-deep:#071260;background:#f2e9d3;color:#0b1c8c}
  figure{margin:0;flex:none}
  svg{display:block;width:100%;height:100%;overflow:visible}
</style>${cells}`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: scale });
await page.setContent(html);
await page.locator('body').screenshot({ path: resolve(out) });
await browser.close();
console.log(out);
