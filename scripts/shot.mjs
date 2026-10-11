// Screenshot a local page with the installed Chrome.
// node scripts/shot.mjs <path> <out.png> [--width 1440] [--height 900] [--mobile] [--viewport] [--motion] [--scroll 1200]
import { chromium } from 'playwright-core';

const [, , path = '/', out = 'shots/page.png', ...rest] = process.argv;
const flag = (name) => rest.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};

const mobile = flag('mobile');
const width = Number(opt('width', mobile ? 390 : 1440));
const height = Number(opt('height', mobile ? 844 : 900));
const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const url = new URL(path, base);
// Motion is off by default so reveal-on-scroll content is visible in full-page shots.
if (!flag('motion')) url.searchParams.set('nomotion', '1');
// The site follows the sun: pin the day view unless the address asks for a theme.
if (!url.searchParams.has('theme')) url.searchParams.set('theme', 'light');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
});
await page.goto(url.href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
// Lazy images only load once scrolled past.
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 60));
  }
  window.scrollTo(0, 0);
});
// Photographs are lazy and the dev server makes them on demand: wait until each one has arrived.
await page.evaluate(async () => {
  const pending = [...document.images].filter((img) => !img.complete);
  await Promise.race([
    Promise.all(pending.map((img) => new Promise((done) => img.addEventListener('load', done, { once: true })))),
    new Promise((done) => setTimeout(done, 8000)),
  ]);
});
const scroll = Number(opt('scroll', 0));
if (scroll) await page.evaluate((y) => window.scrollTo(0, y), scroll);
// With motion on, wait for the whole load sequence (the title highlight arrives last, after about 2.5s).
await page.waitForTimeout(flag('motion') ? 3600 : 300);
await page.screenshot({ path: out, fullPage: !flag('viewport') && !scroll });
await browser.close();
console.log(out);
