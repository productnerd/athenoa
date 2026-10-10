// Walks the enrol flow on a course page (the same component as in the popup) and screenshots each step.
// node scripts/lab-courses-page.mjs [--mobile] [--lang el] [--fonts b] [--dir shots] [--jpeg]
import { chromium } from 'playwright-core';

const rest = process.argv.slice(2);
const flag = (name) => rest.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
const mobile = flag('mobile');
const fonts = opt('fonts');
const lang = opt('lang', 'en');
const tag = [mobile ? 'm' : 'd', lang !== 'en' && lang, fonts && `fonts-${fonts}`].filter(Boolean).join('-');
const url = new URL(
  `${lang === 'en' ? '' : `/${lang}`}/courses/the-hidden-non-duality-of-ancient-greek-philosophy/`,
  process.env.SHOT_BASE ?? 'http://localhost:4321',
);
url.searchParams.set('nomotion', '1');
if (fonts) url.searchParams.set('fonts', fonts);

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
});
// Keep the dev server's reload channel silent while other files are being edited.
await page.routeWebSocket(/./, () => {});
const shot = async (name) => {
  await page.waitForTimeout(250);
  const jpeg = flag('jpeg');
  await page.screenshot({
    path: `${opt('dir', 'shots')}/courses-page-enrol-${tag}-${name}.${jpeg ? 'jpg' : 'png'}`,
    ...(jpeg ? { type: 'jpeg', quality: 70 } : {}),
  });
};

await page.goto(url.href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const flow = page.locator('[data-enroll]');
await flow.locator('[data-enroll-start]').scrollIntoViewIfNeeded();
await flow.locator('[data-enroll-start]').click();
await flow.locator('input[name="name"]').fill('Ada Lovelace');
await flow.locator('input[name="email"]').fill('ada@example.com');
await page.locator('#registration').evaluate((el) => window.scrollTo(0, el.offsetTop + el.offsetHeight - innerHeight + 40));
await shot('1-details');
await page.keyboard.press('Enter');
await flow.locator('[data-enroll-pay]').click();
await page.locator('#registration').evaluate((el) => window.scrollTo(0, el.offsetTop + el.offsetHeight - innerHeight + 40));
await shot('2-payment');
console.log('step', await flow.getAttribute('data-step'), '| notice visible', await flow.locator('[data-enroll-notice]').isVisible());
await browser.close();
