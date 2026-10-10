// Render the Aegean footer layers in a real browser (ImageMagick here draws neither currentColor,
// CSS variables nor the strokes inherited from the root of these files).
// node scripts/illustrations/aegean-render.mjs                   -> shots/footer-aegean-scene.png (three layers stacked as in Footer.astro)
// node scripts/illustrations/aegean-render.mjs layer far         -> shots/footer-aegean-layer-far.png (one layer alone)
// node scripts/illustrations/aegean-render.mjs scene attica      -> the Attica scene, for comparison (also: olympus)
// node scripts/illustrations/aegean-render.mjs scene aegean blue -> crème ink on blue
// node scripts/illustrations/aegean-render.mjs file any.svg out.png -> any SVG file, e.g. the dolphin study from aegean-gen.mjs --study
// W=3200 in front of any of these renders at that width (default 1600), to look closely.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const svg = (name) => readFileSync(resolve(root, `src/assets/illustrations/${name}.svg`), 'utf8');
const [, , mode = 'scene', which = 'aegean', ground = 'creme'] = process.argv;

const sets = {
  aegean: ['footer-aegean-far', 'footer-aegean-mid', 'footer-aegean-near'],
  attica: ['footer-mountains', 'footer-hills', 'footer-pines'],
  olympus: ['footer-olympus-far', 'footer-olympus-mid', 'footer-olympus-near'],
};
const W = Number(process.env.W ?? 1600);

const css = `
  * { box-sizing: border-box; margin: 0; }
  body { background: #f2e9d3; }
  .ground { --blue-light: #b3c0f3; --blue: #0b1c8c; --blue-deep: #071260; padding-top: 60px; width: ${W}px; }
  .creme { background: #f2e9d3; color: #0b1c8c; --paper: #f2e9d3; }
  .blue { background: #0b1c8c; color: #f2e9d3; --paper: #0b1c8c; }
  .scene { position: relative; width: ${W}px; aspect-ratio: 1600 / 525; }
  .layer { position: absolute; left: 0; bottom: 0; width: 100%; }
  .far { bottom: 16%; } .mid { bottom: 2.7%; } .near { bottom: -1px; }
  svg { display: block; width: 100%; height: auto; }
  .alone { width: ${W}px; outline: 1px dashed #b3c0f3; }
`;

let html;
let out;
if (mode === 'file') {
  // node scripts/illustrations/aegean-render.mjs file path/to/any.svg out.png   (a study sheet, at W wide)
  html = `<div class="ground creme" id="shot" style="padding:20px 0"><div class="alone">${readFileSync(which, 'utf8')}</div></div>`;
  out = ground;
} else if (mode === 'layer') {
  html = `<div class="ground ${ground}" id="shot" style="padding:40px 0"><div class="alone">${svg(`footer-aegean-${which}`)}</div></div>`;
  out = `shots/footer-aegean-layer-${which}.png`;
} else {
  const [far, mid, near] = sets[which];
  html = `<div class="ground ${ground}" id="shot"><div class="scene">
    <div class="layer far">${svg(far)}</div><div class="layer mid">${svg(mid)}</div><div class="layer near">${svg(near)}</div>
  </div></div>`;
  out = which === 'aegean' ? `shots/footer-aegean-scene${ground === 'blue' ? '-blue' : ''}.png` : `shots/footer-aegean-ref-${which}.png`;
}

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: W, height: 800 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><style>${css}</style>${html}`);
await page.locator('#shot').screenshot({ path: resolve(root, out) });
await browser.close();
console.log(out);
