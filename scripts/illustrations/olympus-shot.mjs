// The Olympus footer in place, at the foot of the About page.
// node scripts/illustrations/olympus-shot.mjs shots/footer-olympus-desktop.png
// node scripts/illustrations/olympus-shot.mjs shots/footer-olympus-mobile.png --mobile
// node scripts/illustrations/olympus-shot.mjs out.png --motion      (parallax on, after the layers settle)
// node scripts/illustrations/olympus-shot.mjs out.png --path /el/about-athena/
//
// While Footer.astro still points the near layer of this scene at the stand-in (footer-pines),
// --swap puts footer-olympus-near.svg into the page before the picture is taken, so the three
// drawings can be judged together in their real setting. Without --swap the page is left as served.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const [, , out = 'shots/footer-olympus-desktop.png', ...rest] = process.argv;
const flag = (name) => rest.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
const mobile = flag('mobile');
const url = new URL(opt('path', '/about-athena/'), process.env.SHOT_BASE ?? 'http://localhost:4321');
if (!flag('motion')) url.searchParams.set('nomotion', '1');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
});
await page.goto(url.href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
if (flag('swap')) {
  const svg = readFileSync(resolve(root, 'src/assets/illustrations/footer-olympus-near.svg'), 'utf8');
  await page.evaluate((markup) => {
    const host = document.querySelector('.footer__layer--near .illo');
    if (host) host.innerHTML = markup;
  }, svg);
}
// walk down the page so lazy images load and reveals fire, then stop at the very end
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y);
    await new Promise((done) => setTimeout(done, 60));
  }
});
// the page grows as it loads: ask for the end until it stops moving
for (let i = 0; i < 4; i++) {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(250);
}
await page.waitForTimeout(flag('motion') ? 3600 : 300);
await page.screenshot({ path: resolve(root, out) });
await browser.close();
console.log(out);
