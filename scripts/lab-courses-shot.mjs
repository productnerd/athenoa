// Screenshots several courses pages in one browser session, as JPEG (small files).
// Unlike scripts/shot.mjs it does not wait for the network to go idle, so it still works while the
// dev server is busy rebuilding for other people.
// node scripts/lab-courses-shot.mjs <path>=<name> [<path>=<name> ...] [--mobile] [--width 1440] [--fonts b]
//      [--motion] [--scroll 1200] [--viewport] [--clip "<css selector>"] [--dir shots]
// Each picture is written to <dir>/courses-<name>.jpg
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const takesValue = new Set(['width', 'height', 'fonts', 'scroll', 'clip', 'dir']);
const jobs = [];
const options = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const name = args[i].slice(2);
    options[name] = takesValue.has(name) ? args[++i] : true;
  } else jobs.push(args[i].split('='));
}

const mobile = !!options.mobile;
const width = Number(options.width ?? (mobile ? 390 : 1440));
const height = Number(options.height ?? (mobile ? 844 : 900));
const base = process.env.SHOT_BASE ?? 'http://localhost:4321';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
});
// Keep the dev server's reload channel silent so the page is not reloaded halfway through.
await page.routeWebSocket(/./, () => {});

for (const [path, name] of jobs) {
  const url = new URL(path, base);
  if (!options.motion) url.searchParams.set('nomotion', '1');
  if (options.fonts) url.searchParams.set('fonts', options.fonts);
  for (let attempt = 1; ; attempt++) {
    try {
      await page.goto(url.href, { waitUntil: 'load', timeout: 60000 });
      break;
    } catch (error) {
      if (attempt === 3) throw error;
    }
  }
  await page.evaluate(() => document.fonts.ready);
  // Lazy images only load once scrolled past.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
    // Pictures inside a closed popup never load, so do not wait for those (or for longer than 4s).
    const pending = [...document.images].filter((img) => !img.complete && img.getClientRects().length);
    await Promise.race([
      Promise.all(pending.map((img) => new Promise((r) => (img.onload = img.onerror = r)))),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
  });
  const scroll = Number(options.scroll ?? 0);
  if (scroll) await page.evaluate((y) => window.scrollTo(0, y), scroll);
  await page.waitForTimeout(options.motion ? 3600 : 400);
  const out = `${options.dir ?? 'shots'}/courses-${name}.jpg`;
  const shot = { path: out, type: 'jpeg', quality: 74 };
  if (options.clip) await page.locator(options.clip).first().screenshot(shot);
  else await page.screenshot({ ...shot, fullPage: !options.viewport && !scroll });
  console.log(out);
}
await browser.close();
