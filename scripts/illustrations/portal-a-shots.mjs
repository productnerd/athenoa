// Screenshots of the Portal A lab page, several in one browser launch (same procedure as scripts/shot.mjs).
// node scripts/illustrations/portal-a-shots.mjs <out-dir> <preset ...>
// Presets: desktop, static (motion off), scrolled, mobile, mobile-static, greek, greek-mobile, wide, laptop, tablet,
//          zoom (the picture at 2x), early (0.9 s into the load sequence)
import { chromium } from 'playwright-core';

const [, , outDir = 'shots', ...names] = process.argv;
const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const presets = {
  desktop: { path: '/lab/portal-a/', motion: true },
  static: { path: '/lab/portal-a/' },
  scrolled: { path: '/lab/portal-a/', motion: true, scroll: 420 },
  mobile: { path: '/lab/portal-a/', motion: true, mobile: true },
  'mobile-static': { path: '/lab/portal-a/', mobile: true },
  'mobile-scrolled': { path: '/lab/portal-a/', motion: true, mobile: true, scroll: 300 },
  greek: { path: '/el/lab/portal-a/', motion: true },
  'greek-mobile': { path: '/el/lab/portal-a/', motion: true, mobile: true },
  wide: { path: '/lab/portal-a/', motion: true, width: 1920, height: 1080 },
  laptop: { path: '/lab/portal-a/', motion: true, width: 1280, height: 720 },
  tablet: { path: '/lab/portal-a/', motion: true, width: 820, height: 1180 },
  zoom: { path: '/lab/portal-a/', dsf: 2, clip: { x: 380, y: 84, width: 680, height: 560 } },
  early: { path: '/lab/portal-a/', motion: true, wait: 900, raw: true },
  mid: { path: '/lab/portal-a/', motion: true, wait: 1900, raw: true },
};

const browser = await chromium.launch({ channel: 'chrome' });
for (const name of names) {
  const p = presets[name];
  if (!p) throw new Error(`unknown preset ${name}`);
  const width = p.width ?? (p.mobile ? 390 : 1440);
  const height = p.height ?? (p.mobile ? 844 : 900);
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: p.dsf ?? (p.mobile ? 2 : 1),
    isMobile: !!p.mobile,
  });
  const url = new URL(p.path, base);
  if (!p.motion) url.searchParams.set('nomotion', '1');
  await page.goto(url.href, { waitUntil: p.raw ? 'load' : 'networkidle' });
  if (!p.raw) {
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, 0);
    });
  }
  if (p.scroll) await page.evaluate((y) => window.scrollTo(0, y), p.scroll);
  await page.waitForTimeout(p.wait ?? (p.motion ? 3600 : 300));
  const out = `${outDir}/portal-a-${name}.png`;
  await page.screenshot({ path: out, clip: p.clip });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  console.log(out, `${width}x${height}`, overflow > 0 ? `HORIZONTAL OVERFLOW ${overflow}px` : '');
  await page.close();
}
await browser.close();
