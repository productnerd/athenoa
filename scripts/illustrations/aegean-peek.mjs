// Contact sheet of any illustrations, to compare other drawings with the Aegean footer.
// node scripts/illustrations/aegean-peek.mjs sea-cape,sea-island,sea-sun [width]  -> shots/footer-aegean-peek.png
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [, , names = '', width = '700', out = 'shots/footer-aegean-peek.png'] = process.argv;
const tiles = names
  .split(',')
  .map((n) => `<div style="width:${width}px">${readFileSync(resolve(root, `src/assets/illustrations/${n}.svg`), 'utf8')}</div>`)
  .join('');
const css = `body{margin:0;background:#f2e9d3}#shot{display:flex;flex-wrap:wrap;gap:30px;padding:30px;width:1500px;color:#0b1c8c;
  --paper:#f2e9d3;--blue-light:#b3c0f3;--blue:#0b1c8c;--blue-deep:#071260;--creme-light:#f9f3e3}svg{display:block;width:100%;height:auto}`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1500, height: 800 }, deviceScaleFactor: 1 });
await page.setContent(`<!doctype html><style>${css}</style><div id="shot">${tiles}</div>`);
await page.locator('#shot').screenshot({ path: resolve(root, out) });
await browser.close();
console.log(out);
