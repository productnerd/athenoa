// A closer look at the open popup: just the dialog, optionally enlarged.
//   node scripts/lab-newsletter-peek.mjs out.png [--mobile] [--el] [--scale 2] [--fonts a|b|c] [--paper rough-sm] [--sent] [--h 900]
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const mobile = flag('mobile');
const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'chrome' });
// The dev server reloads the page whenever a file changes; if that happens mid-run, start over.
for (let attempt = 1; ; attempt++) {
  try {
    await shoot();
    break;
  } catch (error) {
    if (attempt === 4) throw error;
  }
}
await browser.close();
console.log(args[0]);

async function shoot() {
const page = await browser.newPage({
  viewport: mobile ? { width: Number(opt('w', 390)), height: Number(opt('h', 844)) } : { width: Number(opt('w', 1440)), height: Number(opt('h', 900)) },
  deviceScaleFactor: Number(opt('scale', 2)),
  isMobile: mobile,
});
await page.goto(`${base}${flag('el') ? '/el' : ''}/lab/newsletter/?nomotion=1`, { waitUntil: 'networkidle' });
if (opt('fonts')) await page.evaluate((set) => (document.documentElement.dataset.fonts = set), opt('fonts'));
await page.evaluate(() => document.fonts.ready);
await page.click('a[data-lab-link]');
await page.waitForSelector('#newsletter[open]');
if (opt('paper')) await page.evaluate((id) => (document.querySelector('.nl__paper').style.filter = `url(#${id})`), opt('paper'));
if (flag('sent')) {
  await page.fill('#newsletter-email', 'reader@example.com');
  await page.click('#newsletter button[type=submit]');
}
await page.waitForTimeout(300);
const box = await page.evaluate(() => {
  const r = document.querySelector('#newsletter').getBoundingClientRect();
  return { x: Math.max(0, r.x - 12), y: Math.max(0, r.y - 12), width: Math.min(innerWidth, r.width + 24), height: Math.min(innerHeight, r.height + 24) };
});
await page.screenshot({ path: args[0], clip: box });
await page.close();
}
