// Renders SVG files with the installed Chrome so a drawing can be checked by eye.
// One browser launch for any number of pictures:
//   node scripts/illustrations/portal-a-preview.mjs <jobs.json | the same JSON inline>
// jobs: [{ "out": "x.png", "w": 1200, "bg": "#071260", "ink": "#f2e9d3", "crop": [x, y, w, h], "files": ["a.svg", ...] }]
// Files in one job are stacked in order and must share a viewBox; crop is in viewBox units.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const arg = process.argv[2];
const jobs = JSON.parse(arg.trim().startsWith('[') ? arg : readFileSync(arg, 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });

for (const job of jobs) {
  const { out, w = 1200, bg = '#071260', ink = '#f2e9d3', crop, files } = job;
  const svgs = files.map((f) => readFileSync(f, 'utf8'));
  const box = (/viewBox="([^"]+)"/.exec(svgs[0])?.[1] ?? '0 0 100 100').split(/\s+/).map(Number);
  const view = crop ?? box;
  const h = Math.round((w * view[3]) / view[2]);
  const css = `
    html,body{margin:0}
    body{background:${bg};color:${ink};--paper:${bg};
      --blue-light:#b3c0f3;--blue:#0b1c8c;--blue-deep:#071260;--creme:#f2e9d3;--creme-light:#f9f3e3;
      --font-title:'EB Garamond',Garamond,serif}
    .stage{position:relative;width:${w}px;height:${h}px;overflow:hidden}
    .stage svg{position:absolute;inset:0;width:100%;height:100%}
  `;
  const html = svgs.map((s) => s.replace(/viewBox="[^"]+"/, `viewBox="${view.join(' ')}"`)).join('');
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<style>${css}</style><div class="stage">${html}</div>`);
  await page.screenshot({ path: out });
  console.log(out, `${w}x${h}`);
}
await browser.close();
