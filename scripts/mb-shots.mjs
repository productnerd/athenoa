// Screenshots of the Home membership section at several sizes: node scripts/mb-shots.mjs
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
for (const [name, path, w, h, theme] of [['a', '/', 1290, 860, 'dark'], ['b', '/', 1033, 700, 'light'], ['c', '/el/', 900, 1000, 'light'], ['d', '/', 390, 844, 'light'], ['e', '/grc/', 1440, 900, 'light'], ['f', '/', 768, 1000, 'light']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(`http://localhost:4321${path}?nomotion=1&theme=${theme}`, { waitUntil: 'load' });
  await p.evaluate(async () => { for (let y = 0; y < 2600; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); } });
  await p.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15000 }).catch(() => {});
  await p.addStyleTag({ content: '.header,.music{visibility:hidden!important}' });
  await p.locator('.membership').screenshot({ path: `shots/mb-${name}.png` });
  console.log(name, 'overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await p.close();
}
await b.close();
