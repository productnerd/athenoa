// Responsive smoke test: for each page and width, report horizontal overflow, header collisions
// and the elements that stick out of the viewport.
// node scripts/check-responsive.mjs [--shots]
import { chromium } from 'playwright-core';

const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const pages = ['/', '/about-athena/', '/courses/', '/el/', '/el/about-athena/', '/el/courses/'];
const widths = [360, 390, 600, 768, 820, 1024, 1100, 1280, 1440, 1920];
const shots = process.argv.includes('--shots');

const browser = await chromium.launch({ channel: 'chrome' });
let problems = 0;
for (const path of pages) {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`${base}${path}?nomotion=1&theme=light&cookies=off`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const overflow = document.documentElement.scrollWidth - vw;
      const brand = document.querySelector('.header__brand')?.getBoundingClientRect();
      const visible = (el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0 && r.width > 2;
      };
      const items = [...document.querySelectorAll('.header__links > li, .header__toggle')].filter(visible);
      const rects = items.map((el) => el.getBoundingClientRect());
      const inBar = rects.filter((r) => r.top < 120);
      const collide = brand && inBar.some((r) => r.left < brand.right - 1 && r.right > brand.left);
      const outside = inBar.some((r) => r.right > vw + 1);
      const sticking = [...document.querySelectorAll('main *, footer *')]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.right > vw + 2 || r.left < -2) && getComputedStyle(el).position !== 'fixed';
        })
        .slice(0, 400)
        .map((el) => el.className?.toString().split(' ')[0] || el.tagName.toLowerCase());
      const counts = {};
      for (const name of sticking) counts[name] = (counts[name] ?? 0) + 1;
      return { overflow, collide: Boolean(collide), outside, sticking: Object.entries(counts).slice(0, 6) };
    });
    const bad = result.overflow > 1 || result.collide || result.outside;
    if (bad) problems++;
    console.log(
      `${bad ? 'FAIL' : 'ok  '} ${path.padEnd(20)} ${String(width).padStart(4)}  overflow ${String(result.overflow).padStart(4)}px` +
        `${result.collide ? '  HEADER COLLISION' : ''}${result.outside ? '  HEADER OFF-SCREEN' : ''}` +
        `${result.overflow > 1 ? '  ' + JSON.stringify(result.sticking) : ''}`,
    );
    if (shots) await page.screenshot({ path: `shots/header-${path.replace(/\W+/g, '_')}-${width}.png`, clip: { x: 0, y: 0, width, height: 110 } });
    await page.close();
  }
}
await browser.close();
console.log(problems ? `\n${problems} problem(s)` : '\nNo overflow or header collisions.');
