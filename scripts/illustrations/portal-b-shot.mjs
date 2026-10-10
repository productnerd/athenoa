// Screenshots of the Portal B hero with the installed Chrome, plus a layout report.
// Like scripts/shot.mjs, but it can switch the alternate type sets (html[data-fonts]) that the
// site no longer exposes through the address, and it prints whether the title fits.
//
// node scripts/illustrations/portal-b-shot.mjs <path> <out.png> [--w 1440] [--h 900] [--mobile]
//      [--motion] [--fonts a|b|c] [--scroll 420] [--wait 3600] [--clip x,y,w,h] [--scale 1]
import { chromium } from 'playwright-core';

const [, , path = '/lab/portal-b/', out = 'shots/portal-b.png', ...rest] = process.argv;
const flag = (name) => rest.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
const mobile = flag('mobile');
const width = Number(opt('w', mobile ? 390 : 1440));
const height = Number(opt('h', mobile ? 844 : 900));
const url = new URL(path, process.env.SHOT_BASE ?? 'http://localhost:4321');
if (!flag('motion')) url.searchParams.set('nomotion', '1');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: Number(opt('scale', mobile ? 2 : 1)),
  isMobile: mobile,
});
const fonts = opt('fonts');
if (fonts) await page.addInitScript((set) => document.documentElement.setAttribute('data-fonts', set), fonts);
await page.goto(url.href, { waitUntil: 'networkidle' });
if (fonts) await page.evaluate((set) => document.documentElement.setAttribute('data-fonts', set), fonts);
await page.evaluate(() => document.fonts.ready);
const scroll = Number(opt('scroll', 0));
if (scroll) await page.evaluate((y) => window.scrollTo(0, y), scroll);
await page.waitForTimeout(Number(opt('wait', flag('motion') ? 3600 : 400)));

const report = await page.evaluate(() => {
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
  };
  const title = document.querySelector('.pb__title');
  const panel = document.querySelector('.pb__panel');
  const words = [...title.querySelectorAll('.pb__line')].map((line) => {
    const range = document.createRange();
    range.selectNodeContents(line);
    const rects = [...range.getClientRects()];
    return [
      Math.round(Math.min(...rects.map((r) => r.left))),
      Math.round(Math.max(...rects.map((r) => r.right))),
      new Set(rects.map((r) => Math.round(r.top / 8))).size,
    ];
  });
  const scene = document.querySelector('.pb__layer--temple .illo');
  return {
    viewport: [innerWidth, innerHeight],
    panel: box(panel),
    title: box(title),
    lines: words,
    titleFont: getComputedStyle(title).fontSize + ' ' + getComputedStyle(title).fontFamily.split(',')[0],
    scene: box(scene),
    pageOverflowX: document.documentElement.scrollWidth - innerWidth,
  };
});
console.log(JSON.stringify(report));
const clip = opt('clip');
await page.screenshot({
  path: out,
  clip: clip ? (([x, y, w, h]) => ({ x, y, width: w, height: h }))(clip.split(',').map(Number)) : undefined,
});
await browser.close();
console.log(out);
