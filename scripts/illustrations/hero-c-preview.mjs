// Renders the hero-c layers with the installed Chrome so the drawing can be checked by eye.
// node scripts/illustrations/hero-c-preview.mjs <out-dir> [name ...]
//   no names: every layer on its own, plus the band layers stacked ("stack.png")
import { chromium } from 'playwright-core';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';

const [, , outDir = 'shots', ...only] = process.argv;
mkdirSync(outDir, { recursive: true });
const dir = new URL('../../src/assets/illustrations/', import.meta.url);
const names = readdirSync(dir)
  .filter((f) => f.startsWith('hero-c-') && f.endsWith('.svg'))
  .map((f) => f.slice(7, -4));
const read = (name) => readFileSync(new URL(`hero-c-${name}.svg`, dir), 'utf8');

const css = `
  html,body{margin:0}
  body{background:#0b1c8c;color:#f9f3e3;
    --hc-far:#1a38b0;--hc-mid:#12299c;--hc-hill:#0a197f;--hc-near:#071260;--hc-sea:#2a56d6;--hc-light:#f6eedb;--hc-ink:#0b1c8c}
  .one{padding:40px;display:inline-block}
  .one svg{display:block;overflow:visible}
  .stage{position:relative;width:1400px;height:800px;overflow:hidden}
  .stage svg{position:absolute;left:50%;bottom:0;height:576px;width:auto;transform:translateX(-50%);overflow:visible}
`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 1 });

const band = ['range-far', 'range-mid', 'sea', 'hill-right', 'hill-left', 'shore-pines', 'undergrowth'];
const list = only.length ? only : [...names, 'stack'];
for (const name of list) {
  if (name === 'stack') {
    await page.setContent(`<style>${css}</style><div class="stage">${band.map(read).join('')}</div>`);
    await page.screenshot({ path: `${outDir}/hc-stack.png` });
    continue;
  }
  const isBand = band.includes(name);
  const html = isBand
    ? `<div class="stage">${read(name)}</div>`
    : `<div class="one">${read(name).replace('<svg ', '<svg width="760" ')}</div>`;
  await page.setContent(`<style>${css}</style>${html}`);
  const target = isBand ? page : page.locator('.one');
  await target.screenshot({ path: `${outDir}/hc-${name}.png` });
}
await browser.close();
console.log('rendered', list.join(' '));
