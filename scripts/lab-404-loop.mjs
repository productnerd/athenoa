// Checks the not-found scene's loops: takes viewport screenshots some seconds apart (no scrolling,
// so reveals behave as they do for a visitor) and prints where the moving layers are each time.
// node scripts/lab-404-loop.mjs [--mobile] [--gap 6000] [--count 4] [--path /lab/404/] [--out shots/404-loop] [--clean] [--fonts c]
import { chromium } from 'playwright-core';

const rest = process.argv.slice(2);
const flag = (name) => rest.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
const mobile = flag('mobile');
const width = Number(opt('width', mobile ? 390 : 1440));
const height = Number(opt('height', mobile ? 844 : 900));
const gap = Number(opt('gap', 6000));
const count = Number(opt('count', 4));
const out = opt('out', 'shots/404-loop');
const url = new URL(opt('path', '/lab/404/'), process.env.SHOT_BASE ?? 'http://localhost:4321');
if (opt('fonts')) url.searchParams.set('fonts', opt('fonts'));
if (opt('locale')) url.searchParams.set('locale', opt('locale'));

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile });
await page.goto(url.href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// --clean hides the two preview aids (type switch, lab bar) that sit over the bottom of the screen.
if (flag('clean')) await page.addStyleTag({ content: '.font-toggle,.lab-bar{display:none!important}' });
await page.waitForTimeout(3200);

const probe = () =>
  page.evaluate(() => {
    const x = (sel) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().left * 10) / 10 : null;
    };
    const pending = [...document.querySelectorAll('.nf [data-reveal]')].filter((el) => !el.classList.contains('is-in')).length;
    return {
      boat: x('.nf__bob'),
      far: x('.nf__band--far .nf__run'),
      mid: x('.nf__band--mid .nf__run'),
      near: x('.nf__swell .nf__run'),
      cloud1: x('.nf__cloud--1 .nf__run'),
      cloud2: x('.nf__cloud--2 .nf__run'),
      cloud3: x('.nf__cloud--3 .nf__run'),
      revealsPending: pending,
      sceneHeight: Math.round(document.querySelector('.nf').getBoundingClientRect().height),
      greekFont: getComputedStyle(document.querySelector('.nf__greek')).fontFamily,
    };
  });

// --seam: freeze every loop at its first and at its last instant and save both frames. The sliding
// layers must look the same in the two, and the boat must be off screen in both.
if (flag('seam')) {
  const freeze = (end) =>
    page.evaluate((end) => {
      for (const a of document.getAnimations()) {
        if (!String(a.animationName).startsWith('nf-')) continue;
        const { delay, duration } = a.effect.getComputedTiming();
        if (a.animationName === 'nf-arrive') { a.finish(); continue; }
        a.pause();
        // the second pass of each loop (the first one starts part-way in, because of the negative delay)
        if (a.animationName === 'nf-drift' || a.animationName === 'nf-voyage') a.currentTime = delay + duration + (end ? duration - 0.01 : 0.01);
        else a.currentTime = 0;
      }
    }, end);
  for (const [name, end] of [['start', false], ['end', true]]) {
    await freeze(end);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `${out}-seam-${name}.png` });
    console.log(`${out}-seam-${name}.png`, JSON.stringify(await probe()));
  }
  await browser.close();
  process.exit(0);
}

for (let i = 0; i < count; i++) {
  if (i) await page.waitForTimeout(gap);
  const file = `${out}-${i + 1}.png`;
  await page.screenshot({ path: file });
  console.log(file, JSON.stringify(await probe()));
}
await browser.close();
