// Checks one of the symbols on the real page, with motion on: finds the first <Illustration> of that
// name, scrolls to it and photographs it part-way through drawing itself and once it has finished.
//   node scripts/illustrations/symbols-b-inpage.mjs / orphic-egg out-prefix
import { chromium } from 'playwright-core';

const [, , path = '/', name = 'orphic-egg', prefix = 'shots/symbols-b-inpage'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(new URL(path, 'http://localhost:4321').href, { waitUntil: 'networkidle' });
const el = page.locator(`.illo--${name}`).first();
console.log('found', await el.count(), 'size', JSON.stringify(await el.boundingBox()));
await el.evaluate((n) => n.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(900);
await el.screenshot({ path: `${prefix}-mid.png` });
await page.waitForTimeout(3600);
await el.screenshot({ path: `${prefix}-done.png` });
console.log('classes', await el.getAttribute('class'), 'draw', await el.getAttribute('data-draw'));
await browser.close();
