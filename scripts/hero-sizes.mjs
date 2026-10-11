// Screenshots of the home hero at awkward window sizes: node scripts/hero-sizes.mjs
import { chromium } from 'playwright-core';
const cases = [
  ['a', '/', 548, 591, 'light'],
  ['b', '/', 610, 594, 'light'],
  ['c', '/el/', 680, 600, 'light'],
  ['d', '/', 760, 620, 'dark'],
  ['e', '/', 804, 611, 'light'],
  ['f', '/', 360, 640, 'light'],
  ['g', '/', 390, 844, 'light'],
  ['h', '/', 480, 800, 'light'],
  ['i', '/el/', 768, 1024, 'light'],
  ['j', '/grc/', 900, 760, 'dark'],
  ['k', '/', 600, 900, 'light'],
  ['l', '/', 1024, 768, 'light'],
];
const b = await chromium.launch({ channel: 'chrome' });
for (const [name, path, w, h, theme] of cases) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(`http://localhost:4321${path}?nomotion=1&theme=${theme}`, { waitUntil: 'load' });
  await p.waitForTimeout(500);
  await p.screenshot({ path: `shots/z-${name}.png` });
  const info = await p.evaluate(() => {
    const t = document.querySelector('.hero__title');
    const fs = parseFloat(getComputedStyle(t).fontSize);
    const sub = t.querySelector('.t-sub').getBoundingClientRect();
    const temple = document.querySelector('.illo--portal-b-temple svg').getBoundingClientRect();
    const widest = Math.max(...[...t.querySelectorAll('.hero__line:not(.t-sub) .w, .hero__line:not(.t-sub)')].map((e) => e.getBoundingClientRect().right));
    return {
      fs: Math.round(fs),
      lines: Math.round((sub.top - t.getBoundingClientRect().top) / (fs * 0.95)),
      subBottom: Math.round(sub.bottom),
      roofTop: Math.round(temple.top + temple.height * 0.33),
      templeMid: Math.round(temple.left + temple.width / 2),
      heroH: Math.round(document.querySelector('.hero__panel').getBoundingClientRect().height),
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  console.log(name, `${w}x${h}`.padEnd(9), (w / h).toFixed(2), JSON.stringify(info));
  await p.close();
}
await b.close();
