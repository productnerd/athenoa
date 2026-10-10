// Lab helper: lists what makes /lab/home-b/ wider than the viewport.
// node scripts/lab-home-b-overflow.mjs [width] [--mobile]
import { chromium } from 'playwright-core';
const width = Number(process.argv[2] ?? 390);
const browser = await chromium.launch({ channel: 'chrome' });
const mobile = process.argv.includes('--mobile');
const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: mobile, deviceScaleFactor: mobile ? 2 : 1 });
await context.routeWebSocket(/.*/, () => {});
const page = await context.newPage();
await page.goto('http://localhost:4321/lab/home-b/?nomotion=1', { waitUntil: 'load' });
await page.waitForTimeout(800);
const out = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const rows = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('.panel__clip') || el.closest('svg')) return;
    const r = el.getBoundingClientRect();
    if (r.width && (r.right > vw + 0.5 || r.left < -0.5)) {
      rows.push(`${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).replace(/\s+/g, '.')} ${r.left.toFixed(0)}..${r.right.toFixed(0)}`);
    }
  });
  return { vw, innerWidth, scrollWidth: document.documentElement.scrollWidth, rows };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
