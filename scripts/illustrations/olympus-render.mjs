// Render one or more SVG files side by side in Chrome, with the page inks and palette set,
// so currentColor and the CSS variables resolve as they do on the site.
// node scripts/illustrations/olympus-render.mjs out.png a.svg [b.svg ...] [--width 1600] [--blue] [--crop x,y,w,h]
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const flags = new Set(['--width', '--crop']);
const files = [];
for (let i = 0; i < args.length; i++) {
  if (flags.has(args[i])) i++;
  else if (!args[i].startsWith('--')) files.push(args[i]);
}
const [out, ...svgs] = files;
const width = Number(opt('width', 1600));
const blue = args.includes('--blue');
const css = `
  * { box-sizing: border-box; margin: 0; }
  body { background: ${blue ? '#0b1c8c' : '#f2e9d3'}; --paper: ${blue ? '#0b1c8c' : '#f2e9d3'}; --blue-light: #b3c0f3; --blue: #0b1c8c; --blue-deep: #071260; color: ${blue ? '#f2e9d3' : '#0b1c8c'}; }
  .row { display: flex; gap: 24px; padding: 16px; width: ${width}px; }
  .row > div { flex: 1; }
  svg { display: block; width: 100%; height: auto; }
`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height: 600 }, deviceScaleFactor: 1 });
await page.setContent(
  `<!doctype html><style>${css}</style><div class="row">${svgs.map((f) => `<div>${readFileSync(resolve(f), 'utf8')}</div>`).join('')}</div>`,
);
const crop = opt('crop');
if (crop) {
  const [x, y, w, h] = crop.split(',').map(Number);
  await page.screenshot({ path: resolve(out), fullPage: true, clip: { x, y, width: w, height: h } });
} else await page.locator('.row').screenshot({ path: resolve(out) });
await browser.close();
console.log(out);
