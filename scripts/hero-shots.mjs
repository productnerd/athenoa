// Screenshots of the home hero at several sizes and in both themes: node scripts/hero-shots.mjs [tag]
import { chromium } from 'playwright-core';
const tag = process.argv[2] ?? 'hero';
const cases = [
  ['d1440', '/', 1440, 900, 'light'],
  ['n1440', '/', 1440, 900, 'dark'],
  ['d1033', '/', 1033, 619, 'light'],
  ['el1280', '/el/', 1280, 720, 'light'],
  ['m390', '/', 390, 844, 'light'],
  ['mn390', '/el/', 390, 844, 'dark'],
];
const b = await chromium.launch({ channel: 'chrome' });
for (const [name, path, w, h, theme] of cases) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(`http://localhost:4321${path}?nomotion=1&theme=${theme}`, { waitUntil: 'load' });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `shots/${tag}-${name}.png`, clip: { x: 0, y: 0, width: w, height: Math.round(h * 1.45) }, fullPage: true });
  const info = await p.evaluate(() => {
    const t = document.querySelector('.hero__title');
    const r = t.getBoundingClientRect();
    return { fs: getComputedStyle(t).fontSize, title: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], overflowX: document.documentElement.scrollWidth - innerWidth };
  });
  console.log(name, JSON.stringify(info));
  await p.close();
}
await b.close();
