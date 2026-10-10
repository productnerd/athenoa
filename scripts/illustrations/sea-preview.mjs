// Renders illustration layers with the installed Chrome so the drawings can be checked by eye
// (Chrome resolves currentColor and the palette custom properties; ImageMagick here does not).
// node scripts/illustrations/sea-preview.mjs [out.png] [name ...]
//   no names: every sea-*.svg. A name may be given with or without the "sea-" prefix; any other
//   illustration (athena, footer-hills, ...) can be named in full to compare hands.
// SCALE=2 enlarges, BG=blue|deep|light puts the sheet on a blue ground.
import { chromium } from 'playwright-core';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const [, , out = 'shots/404-svg-sheet.png', ...only] = process.argv;
const dir = new URL('../../src/assets/illustrations/', import.meta.url);
const has = (n) => existsSync(new URL(`${n}.svg`, dir));
const names = only.length
  ? only.map((n) => (has(`sea-${n}`) ? `sea-${n}` : n)).filter(has)
  : readdirSync(dir)
      .filter((f) => f.startsWith('sea-') && f.endsWith('.svg'))
      .map((f) => f.slice(0, -4));
const scale = Number(process.env.SCALE ?? 1);
const bg = { blue: ['#0b1c8c', '#f2e9d3'], deep: ['#071260', '#f2e9d3'], light: ['#b3c0f3', '#071260'] }[process.env.BG] ?? [
  '#f2e9d3',
  '#0b1c8c',
];

const css = `
  html,body{margin:0}
  body{background:${bg[0]};color:${bg[1]};font:14px/1.2 Georgia,serif;padding:24px;
    --paper:${bg[0]};--creme:#f2e9d3;--creme-light:#f9f3e3;--blue-light:#b3c0f3;--blue:#0b1c8c;--blue-deep:#071260}
  figure{margin:0 0 28px}
  figcaption{margin-bottom:8px}
  svg{display:block;overflow:visible}
`;
const html = names
  .map((name) => {
    const src = readFileSync(new URL(`${name}.svg`, dir), 'utf8');
    const w = Number(src.match(/viewBox="0 0 (\d+)/)[1]);
    return `<figure><figcaption>${name} (${(src.length / 1024).toFixed(1)} KB)</figcaption><div>${src.replace('<svg ', `<svg width="${Math.min(w, 1600) * scale}" `)}</div></figure>`;
  })
  .join('');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1700, height: 900 }, deviceScaleFactor: 1 });
await page.setContent(`<style>${css}</style>${html}`);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out, names.join(' '));
