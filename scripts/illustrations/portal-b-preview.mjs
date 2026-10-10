// Renders illustration layers with the installed Chrome so the drawing can be checked by eye
// (ImageMagick does not resolve currentColor or CSS variables).
//
// node scripts/illustrations/portal-b-preview.mjs <out.png> [--w 1100] [--h 1000] [--scale 1] [--crop x,y,w,h] name[@x,y,height] ...
//   Each name is a file in src/assets/illustrations (without .svg). Layers are stacked in the
//   order given, each placed at x,y (px, default 0,0) with the given height (default: stage height).
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const out = args.shift();
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const [, value] = args.splice(i, 2);
  return value;
};
const w = Number(opt('w', 1100));
const h = Number(opt('h', 1000));
const scale = Number(opt('scale', 1));
const crop = opt('crop', '');
const bg = opt('bg', '#071260');
const dir = new URL('../../src/assets/illustrations/', import.meta.url);

const layers = args
  .map((arg) => {
    const [name, place = ''] = arg.split('@');
    const [x = 0, y = 0, height = h] = place.split(',').filter(Boolean).map(Number);
    const svg = readFileSync(new URL(`${name}.svg`, dir), 'utf8');
    return `<div style="position:absolute;left:${x}px;top:${y}px;height:${height}px">${svg}</div>`;
  })
  .join('');

const css = `
  html,body{margin:0}
  body{background:${bg};color:#f2e9d3;font-family:'EB Garamond',Garamond,serif;
    --paper:#071260;--pb-night:#071260;--pb-stone:#0b1c8c;--pb-light:#b3c0f3;--pb-line:#f2e9d3;--font-title:'EB Garamond',Garamond,serif}
  .stage{position:relative;width:${w}px;height:${h}px;overflow:hidden}
  .stage svg{display:block;height:100%;width:auto;overflow:visible}
`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
await page.setContent(`<style>${css}</style><div class="stage">${layers}</div>`);
const clip = crop
  ? (([x, y, width, height]) => ({ x, y, width, height }))(crop.split(',').map(Number))
  : undefined;
await page.screenshot({ path: out, clip });
await browser.close();
console.log(out);
