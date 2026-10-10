// Renders SVG files with the installed Chrome so a drawing can be checked by eye.
// node scripts/illustrations/portal-a-preview.mjs <out.png> [--w 1200] [--bg '#071260'] [--ink '#f2e9d3'] [--crop x,y,w,h] <file.svg ...>
// Several files are stacked in order (they must share a viewBox). --crop is in viewBox units of the first file.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const [, , out, ...rest] = process.argv;
const opts = { w: '1200', bg: '#071260', ink: '#f2e9d3', crop: '' };
const files = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) opts[rest[i].slice(2)] = rest[++i];
  else files.push(rest[i]);
}
const svgs = files.map((f) => readFileSync(f, 'utf8'));
const box = (/viewBox="([^"]+)"/.exec(svgs[0])?.[1] ?? '0 0 100 100').split(/\s+/).map(Number);
const view = opts.crop ? opts.crop.split(',').map(Number) : box;
const width = Number(opts.w);
const height = Math.round((width * view[3]) / view[2]);

const css = `
  html,body{margin:0}
  body{background:${opts.bg};color:${opts.ink};--paper:${opts.bg};
    --blue-light:#b3c0f3;--blue:#0b1c8c;--blue-deep:#071260;--creme:#f2e9d3;--creme-light:#f9f3e3;
    --font-title:'EB Garamond',Garamond,serif}
  .stage{position:relative;width:${width}px;height:${height}px;overflow:hidden}
  .stage svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
`;
const html = svgs.map((s) => s.replace(/viewBox="[^"]+"/, `viewBox="${view.join(' ')}"`)).join('');
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
await page.setContent(`<style>${css}</style><div class="stage">${html}</div>`);
await page.screenshot({ path: out });
await browser.close();
console.log(out, `${width}x${height}`);
