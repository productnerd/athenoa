// Extra checks for hero C that scripts/shot.mjs does not cover: other viewports, a film strip of the
// load sequence, JavaScript off, reduced motion, pointer parallax.
// node scripts/illustrations/hero-c-shots.mjs <out-dir> <mode> [width height] [fonts]
//   modes: still | film | nojs | reduced | pointer | scroll:<y>
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const [, , outDir = 'shots', mode = 'still', w = '1440', h = '900', fonts = ''] = process.argv;
mkdirSync(outDir, { recursive: true });
const width = Number(w);
const height = Number(h);
const mobile = width < 600;
const url = new URL('/lab/hero-c/', 'http://localhost:4321');
if (fonts) url.searchParams.set('fonts', fonts);
if (mode === 'still') url.searchParams.set('nomotion', '1');

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  javaScriptEnabled: mode !== 'nojs',
  reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference',
});
const page = await context.newPage();
const tag = `${width}x${height}${fonts ? '-' + fonts : ''}`;

if (mode === 'film') {
  await page.goto(url.href, { waitUntil: 'commit' });
  const t0 = Date.now();
  for (const t of [250, 600, 1000, 1400, 1900, 2600, 3600]) {
    await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
    await page.screenshot({ path: `${outDir}/film-${String(t).padStart(4, '0')}.png` });
  }
} else {
  await page.goto(url.href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(mode === 'still' || mode === 'nojs' || mode === 'reduced' ? 500 : 3200);
  if (mode === 'pointer') {
    await page.mouse.move(width * 0.2, height * 0.3);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${outDir}/pointer-a-${tag}.png` });
    await page.mouse.move(width * 0.85, height * 0.8);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${outDir}/pointer-b-${tag}.png` });
  } else if (mode.startsWith('scroll:')) {
    const y = Number(mode.slice(7));
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${outDir}/scroll-${y}-${tag}.png` });
  } else {
    await page.screenshot({ path: `${outDir}/${mode}-${tag}.png` });
    const info = await page.evaluate(() => {
      const hero = document.querySelector('.hc');
      const title = document.querySelector('.hc__title');
      const r = hero.getBoundingClientRect();
      const t = title.getBoundingClientRect();
      return {
        hero: [Math.round(r.width), Math.round(r.height)],
        title: [Math.round(t.left), Math.round(t.top), Math.round(t.right), Math.round(t.bottom)],
        fontSize: getComputedStyle(title).fontSize,
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        titleOverflow: title.scrollWidth > title.clientWidth + 1,
        motion: document.documentElement.classList.contains('motion'),
      };
    });
    console.log(tag, JSON.stringify(info));
  }
}
await browser.close();
