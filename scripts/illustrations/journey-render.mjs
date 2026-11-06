// Render the nine journey drawings (journey-gen.mjs) in a real browser, in the page inks.
// node scripts/illustrations/journey-render.mjs contact [creme|blue] [opacity]  -> all nine in a 3 x 3 grid (default full ink)
// node scripts/illustrations/journey-render.mjs one 3                       -> drawing 3 as on the page: desktop 1440 x 900 on crème
//                                                                             with a row of stones down the middle, and phone (390)
//                                                                             crops on crème and on night blue, all at page opacity
// node scripts/illustrations/journey-render.mjs phones [creme|blue]          -> the nine at phone width (390) and page opacity, 3x density
// node scripts/illustrations/journey-render.mjs check                       -> says whether anything is drawn in the stones' column
// node scripts/illustrations/journey-render.mjs sheet [creme|blue]           -> the nine in order, small (320 wide): full ink beside
//                                                                             page opacity; written as journey-sheet-<ground>.png
// OUT=dir sets where the PNGs go (default: shots/). OP=0.3 sets the page opacity.
import { chromium } from 'playwright-core';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dir = resolve(root, 'src/assets/illustrations');
const files = readdirSync(dir)
  .filter((n) => /^journey-\d-.*\.svg$/.test(n))
  .sort();
const svg = (i) => readFileSync(resolve(dir, files[i]), 'utf8');
const [, , mode = 'contact', a = 'creme', b] = process.argv;
const OUT = process.env.OUT ?? resolve(root, 'shots');
const OP = Number(process.env.OP ?? 0.3);

const css = `
  * { box-sizing: border-box; margin: 0; }
  body { background: #777; font: 12px system-ui; }
  .creme { background: #f2e9d3; color: #0b1c8c; --paper: #f2e9d3; --blue-light: #b3c0f3; }
  .blue { background: #080d42; color: #f2e9d3; --paper: #080d42; --blue-light: #1c2b96; }
  .cell { position: relative; overflow: hidden; }
  .cell svg { position: absolute; left: 0; bottom: 0; width: 100%; height: auto; display: block; }
  .grid { display: grid; gap: 6px; padding: 6px; }
  .stone { position: absolute; width: 78px; height: 70px; border-radius: 50%; background: currentColor; opacity: 0.85; }
`;

const browser = await chromium.launch({ channel: 'chrome' });
async function shot(html, out, width, height, dpr = 1) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
  await page.setContent(`<!doctype html><style>${css}</style>${html}`);
  await page.locator('#shot').screenshot({ path: out });
  await page.close();
  console.log(out);
}

if (mode === 'contact') {
  const op = Number(b ?? 1);
  const w = 520;
  const cells = files.map((_, i) => `<div class="cell ${a}" style="width:${w}px;height:${w * 0.625}px">${svg(i).replace('<svg ', `<svg style="opacity:${op}" `)}</div>`);
  await shot(`<div id="shot" class="grid" style="grid-template-columns:repeat(3,${w}px)">${cells.join('')}</div>`, resolve(OUT, `journey-contact-${a}.png`), w * 3 + 24, 1100);
} else if (mode === 'one') {
  const i = Number(a) - 1;
  const s = svg(i).replace('<svg ', `<svg style="opacity:${OP}" `);
  // stones winding down the middle, as the path will place them
  const stones = [0, 1, 2, 3, 4, 5, 6]
    .map((k) => `<div class="stone" style="left:${720 + Math.sin(k * 1.1) * 110 - 39}px;top:${60 + k * 120}px"></div>`)
    .join('');
  const desk = `<div class="cell creme" style="width:1440px;height:900px">${s}${stones}</div>`;
  const phone = (g) => `<div class="cell ${g}" style="width:390px;height:300px">${s}<div class="stone" style="left:156px;top:12px;width:60px;height:54px"></div></div>`;
  await shot(`<div id="shot" style="display:grid;gap:6px;padding:6px;grid-template-columns:1440px">${desk}<div style="display:flex;gap:6px">${phone('creme')}${phone('blue')}</div></div>`, resolve(OUT, `journey-one-${a}.png`), 1452, 1300);
} else if (mode === 'phones') {
  // the nine as a 390-wide phone shows them, at page opacity, at an iPhone's pixel density; SWP=5 tries a
  // heavier stroke for small screens
  const swp = process.env.SWP;
  const cells = files.map((_, i) => {
    let t = svg(i).replace('<svg ', `<svg style="opacity:${OP}${swp ? `;stroke-width:${swp}` : ''}" `);
    return `<div class="cell ${a}" style="width:390px;height:244px">${t}</div>`;
  });
  await shot(`<div id="shot" class="grid" style="grid-template-columns:repeat(3,390px)">${cells.join('')}</div>`, resolve(OUT, `journey-phones-${a}${swp ? '-' + swp : ''}.png`), 1200, 800, 3);
} else if (mode === 'check') {
  // count ink pixels inside the column the stones run down (x 560 to 1040, above y 620): all should be 0
  const page = await browser.newPage();
  for (let i = 0; i < files.length; i++) {
    const n = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src.replace('<svg ', '<svg width="1600" height="1000" '));
      await img.decode();
      const c = document.createElement('canvas');
      c.width = 1600;
      c.height = 1000;
      c.getContext('2d').drawImage(img, 0, 0);
      const d = c.getContext('2d').getImageData(560, 0, 480, 620).data;
      let ink = 0;
      for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 40 && d[k] < 200) ink++;
      return ink;
    }, svg(i));
    console.log(files[i].padEnd(26), n ? `${n} ink pixels in the open column` : 'open column clear');
  }
} else if (mode === 'sheet') {
  const w = 320;
  const rows = files.map((_, i) => {
    const full = `<div class="cell ${a}" style="width:${w}px;height:${w * 0.625}px">${svg(i)}</div>`;
    const faint = `<div class="cell ${a}" style="width:${w}px;height:${w * 0.625}px">${svg(i).replace('<svg ', `<svg style="opacity:${OP}" `)}</div>`;
    return full + faint;
  });
  await shot(`<div id="shot" class="grid" style="grid-template-columns:repeat(2,${w}px)">${rows.join('')}</div>`, resolve(OUT, `journey-sheet-${a}.png`), w * 2 + 18, 2000, 2);
}
await browser.close();
