// Render any SVG files on crème with blue ink, to look at them: node symbols-b-peek.mjs out.png width a.svg b.svg ...
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';
const [out, width, ...files] = process.argv.slice(2);
const cells = files.map((f) => `<figure style="width:${width}px">${readFileSync(f, 'utf8')}</figure>`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0}body{width:max-content;font:0/0 a}
.row{display:flex;align-items:center;gap:30px;padding:30px;--paper:#f2e9d3;background:#f2e9d3;color:#0b1c8c}
figure{margin:0;flex:none}svg{display:block;width:100%;height:auto;overflow:visible}</style><div class="row">${cells}</div>`;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
await page.setContent(html);
await page.locator('body').screenshot({ path: out });
await browser.close();
