// Lab helper for /lab/home-b/: one browser, every section, either language, any widths.
// Writes shots/home-b-<lang>-<width>-<section>.jpg and prints horizontal overflow per page.
//
// node scripts/lab-home-b-all.mjs [--langs en,el] [--widths 1440,390] [--sections series,ctabs,trans,start,benefits]
//   [--tab 5] [--out shots] [--nojs]
import { chromium } from 'playwright-core';

const rest = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
const langs = opt('langs', 'en,el').split(',');
const widths = opt('widths', '1440,390').split(',').map(Number);
const sections = opt('sections', 'series,ctabs,trans,start,benefits').split(',');
const out = opt('out', 'shots');
const nojs = rest.includes('--nojs');
const base = process.env.SHOT_BASE ?? 'http://localhost:4321';

const browser = await chromium.launch({ channel: 'chrome' });
for (const lang of langs) {
  for (const width of widths) {
    const mobile = width < 600;
    const context = await browser.newContext({
      viewport: { width, height: mobile ? 844 : 900 },
      deviceScaleFactor: mobile ? 2 : 1,
      isMobile: mobile,
      javaScriptEnabled: !nojs,
    });
    // Other people are editing the project while this runs: keep the dev server's live reload out of the page.
    await context.routeWebSocket(/.*/, () => {});
    const page = await context.newPage();
    page.on('pageerror', (error) => console.log('PAGE ERROR', error.message));
    await page.goto(`${base}${lang === 'el' ? '/el' : ''}/lab/home-b/?nomotion=1`, { waitUntil: 'load', timeout: 120000 });
    if (nojs) {
      for (let y = 0; y < 30000; y += 700) {
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(60);
      }
      await page.waitForTimeout(1500);
    } else {
      await page.addStyleTag({ content: '[data-header] { display: none !important; }' });
      await page.evaluate(async () => {
        await document.fonts.ready;
        document.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
        await Promise.all(
          Array.from(document.images).map((img) =>
            img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r))),
          ),
        );
      });
      if (opt('tab')) await page.locator('[role="tab"]').nth(Number(opt('tab'))).click();
      const report = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const wide = [];
        document.querySelectorAll('main *').forEach((el) => {
          if (el.closest('.panel__clip') || el.closest('svg') || el.closest('[role="tablist"]')) return;
          const r = el.getBoundingClientRect();
          if (r.width && (r.right > vw + 1 || r.left < -1)) {
            wide.push(`${String(el.className.baseVal ?? el.className).split(' ')[0]} ${Math.round(r.left)}..${Math.round(r.right)}`);
          }
        });
        return { overflow: document.documentElement.scrollWidth - vw, wide: wide.slice(0, 12) };
      });
      console.log(lang, width, JSON.stringify(report));
    }
    for (const name of sections) {
      const target = page.locator(`.${name}`).first();
      await target.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const file = `${out}/home-b-${lang}-${width}${nojs ? '-nojs' : ''}-${name}.jpg`;
      await target.screenshot({ path: file, type: 'jpeg', quality: 68 });
      console.log(file);
    }
    await context.close();
  }
}
await browser.close();
