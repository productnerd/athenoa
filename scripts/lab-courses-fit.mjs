// Does everything on the courses pages fit, in both languages, from a small phone to a wide desktop?
// For each page and width it reports, inside <main> only (header and footer belong to someone else):
//   - elements that stick out past the right or left edge of the viewport
//   - headings, buttons and notes whose words are wider than their box
//   - the two cards of the "others" row not sharing a top and a bottom line (wide layouts)
// node scripts/lab-courses-fit.mjs [--quick]
import { chromium } from 'playwright-core';

const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const OPEN = 'the-hidden-non-duality-of-ancient-greek-philosophy';
const paths = ['/courses/', `/courses/${OPEN}/`, '/courses/platos-republic/'].flatMap((path) => [path, `/el${path}`]);
const widths = process.argv.includes('--quick') ? [360, 1024, 1440] : [320, 360, 390, 600, 640, 700, 768, 820, 992, 1024, 1100, 1280, 1440, 1920];

const browser = await chromium.launch({ channel: 'chrome' });
let problems = 0;
for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.routeWebSocket(/./, () => {});
  for (const path of paths) {
    await page.goto(`${base}${path}?nomotion=1`, { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    const found = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const main = document.querySelector('main');
      const name = (el) =>
        `${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(/\s+/).slice(0, 2).join('.')}`;
      const out = [];
      for (const el of main.querySelectorAll('*')) {
        if (el.closest('dialog, svg, .panel__clip, .body__rays, .media__clip')) continue;
        const r = el.getBoundingClientRect();
        if (!r.width) continue;
        // Ornaments are allowed to reach into the page gutter, but not past the edge of the screen.
        if (r.right > vw + 1 || r.left < -1) out.push(`${name(el)} sticks out (${Math.round(r.left)} to ${Math.round(r.right)} of ${vw})`);
      }
      for (const el of main.querySelectorAll('h1, h2, h3, .btn, .note, .price, .hand')) {
        if (el.closest('dialog')) continue;
        if (el.scrollWidth > el.clientWidth + 1) out.push(`${name(el)} words wider than box (${el.scrollWidth} > ${el.clientWidth})`);
      }
      const [a, b] = [main.querySelector('.card--arch'), main.querySelector('.card--paper')].map((el) => el?.getBoundingClientRect());
      if (a && b && b.left > a.right) {
        // The paper card ends on its label, which hangs below the picture.
        const label = main.querySelector('.card--paper .card__text').getBoundingClientRect();
        if (Math.abs(a.top - b.top) > 2 || Math.abs(a.bottom - label.bottom) > 2)
          out.push(`others row uneven: tops ${Math.round(a.top)}/${Math.round(b.top)}, bottoms ${Math.round(a.bottom)}/${Math.round(label.bottom)}`);
      }
      return out;
    });
    if (found.length) {
      problems += found.length;
      console.log(`${width}  ${path}`);
      for (const line of [...new Set(found)].slice(0, 8)) console.log(`      ${line}`);
    }
  }
  await page.close();
}
await browser.close();
console.log(problems ? `\n${problems} problem(s)` : '\neverything fits');
process.exit(problems ? 1 : 0);
