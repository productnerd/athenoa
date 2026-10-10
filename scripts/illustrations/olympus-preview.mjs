// Preview a three-layer footer scene in a real browser, stacked exactly as Footer.astro stacks it
// (scene box 1600:525, far layer 16% up, mid 2.7% up, near at the bottom).
// node scripts/illustrations/olympus-preview.mjs                       -> shots/footer-olympus-scene.png
// node scripts/illustrations/olympus-preview.mjs --layers              -> also one PNG per layer
// node scripts/illustrations/olympus-preview.mjs --set attica --out x.png
// node scripts/illustrations/olympus-preview.mjs --width 2400          -> wider render for close reading
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const sets = {
  olympus: ['footer-olympus-far', 'footer-olympus-mid', 'footer-olympus-near'],
  attica: ['footer-mountains', 'footer-hills', 'footer-pines'],
};
const set = opt('set', 'olympus');
const [far, mid, near] = sets[set];
const width = Number(opt('width', 1600));
const out = opt('out', `shots/footer-${set}-scene.png`);
const svg = (name) => readFileSync(resolve(root, `src/assets/illustrations/${name}.svg`), 'utf8');

const css = `
  * { box-sizing: border-box; margin: 0; }
  body { background: #f2e9d3; --paper: #f2e9d3; --blue-light: #b3c0f3; --blue: #0b1c8c; --blue-deep: #071260; }
  .scene { position: relative; width: ${width}px; aspect-ratio: 1600 / 525; margin-top: ${Math.round(width * 0.06)}px; color: #0b1c8c; }
  .layer { position: absolute; left: 0; bottom: 0; width: 100%; }
  .layer svg { display: block; width: 100%; height: auto; overflow: visible; }
  .far { bottom: 16%; } .mid { bottom: 2.7%; } .near { bottom: -1px; }
  .solo { width: ${width}px; color: #0b1c8c; padding-top: 20px; }
  .solo svg { display: block; width: 100%; height: auto; }
`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height: 800 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><style>${css}</style>
  <div class="scene"><div class="layer far">${svg(far)}</div><div class="layer mid">${svg(mid)}</div><div class="layer near">${svg(near)}</div></div>`);
await page.screenshot({ path: resolve(root, out), fullPage: true });
console.log(out);
if (args.includes('--layers')) {
  for (const [key, name] of [['far', far], ['mid', mid], ['near', near]]) {
    await page.setContent(`<!doctype html><style>${css}</style><div class="solo">${svg(name)}</div>`);
    const file = `shots/footer-${set}-${key}.png`;
    await page.locator('.solo').screenshot({ path: resolve(root, file) });
    console.log(file);
  }
}
await browser.close();
