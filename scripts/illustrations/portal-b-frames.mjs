// Stills of the Portal B load sequence, to judge its order and pace.
// node scripts/illustrations/portal-b-frames.mjs <path> <out-dir> <ms> [<ms> ...]
//   Each time is counted from the moment the hero's reveal starts (its title gets .is-in).
import { chromium } from 'playwright-core';

const [, , path = '/lab/portal-b/', outDir = 'shots', ...times] = process.argv;
const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
// load once to warm the cache, so the second load runs like a real visit
await page.goto(base + path, { waitUntil: 'networkidle' });
await page.goto(base + path, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('.pb__title.is-in'));
const t0 = Date.now();
for (const t of times.map(Number)) {
  await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
  await page.screenshot({ path: `${outDir}/portal-b-f${t}.png` });
  console.log(t, 'taken at', Date.now() - t0);
}
await browser.close();
