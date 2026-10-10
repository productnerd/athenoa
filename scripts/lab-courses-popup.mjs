// Walks the course popup and the enrol flow in the installed Chrome, screenshots each state and checks
// the behaviour that a picture cannot show (hash, focus return, Escape, backdrop, validation, Tab order).
// node scripts/lab-courses-popup.mjs [--mobile] [--width 360] [--lang el] [--fonts b] [--motion] [--no-shots] [--dir shots] [--jpeg]
import { chromium } from 'playwright-core';

const rest = process.argv.slice(2);
const flag = (name) => rest.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};

const mobile = flag('mobile');
const motion = flag('motion');
const fonts = opt('fonts');
const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const lang = opt('lang', 'en');
const width = Number(opt('width', mobile ? 390 : 1440));
const home = lang === 'en' ? '/courses/' : `/${lang}/courses/`;
const tag = [mobile ? `m${width === 390 ? '' : width}` : 'd', lang !== 'en' && lang, fonts && `fonts-${fonts}`]
  .filter(Boolean)
  .join('-');
const OPEN = 'the-hidden-non-duality-of-ancient-greek-philosophy';
const PLACEHOLDER = 'platos-republic';

const address = (path, hash = '') => {
  const url = new URL(path, base);
  if (!motion) url.searchParams.set('nomotion', '1');
  if (fonts) url.searchParams.set('fonts', fonts);
  url.hash = hash;
  return url.href;
};

const results = [];
const check = (name, pass, detail = '') => {
  results.push(pass);
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? `  (${detail})` : ''}`);
};

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({
  viewport: mobile ? { width, height: width < 380 ? 740 : 844 } : { width, height: 900 },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
});
// Other people edit files while this runs. Keep the dev server's reload channel silent so the page
// is not reloaded halfway through the walk.
await page.routeWebSocket(/./, () => {});
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));

const settle = () => page.waitForTimeout(motion ? 900 : 200);
const shot = async (name) => {
  if (flag('no-shots')) return;
  await settle();
  const jpeg = flag('jpeg');
  await page.screenshot({
    path: `${opt('dir', 'shots')}/courses-popup-${tag}-${name}.${jpeg ? 'jpg' : 'png'}`,
    ...(jpeg ? { type: 'jpeg', quality: 70 } : {}),
  });
};
const dialog = (slug) => page.locator(`dialog[data-course-dialog="${slug}"]`);
const action = (slug) => page.locator(`a[data-course-open="${slug}"]:not([tabindex="-1"])`);
// Read from the page itself: page.url() lags behind history.replaceState.
const hash = () => page.evaluate(() => location.hash);
// The close event (where the hash is cleared and focus handed back) fires a task after the dialog hides.
const closed = async (slug) => {
  await dialog(slug).waitFor({ state: 'hidden' });
  await page.waitForFunction(() => !location.hash, null, { timeout: 2000 }).catch(() => {});
};
const focused = () =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return 'body';
    return (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || el.tagName)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40);
  });

// ---------- Open from the card ----------
await page.goto(address(home), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await action(OPEN).scrollIntoViewIfNeeded();
await action(OPEN).focus();
await page.keyboard.press('Enter');
await dialog(OPEN).waitFor({ state: 'visible' });
check('Enter on the card action opens the popup', await dialog(OPEN).evaluate((d) => d.open && d.matches(':modal')));
check('opening sets the hash', (await hash()) === `#${OPEN}`, await hash());
const focusIs = (attribute) => page.evaluate((name) => document.activeElement?.hasAttribute(name), attribute);
check('focus starts on Close', await focusIs('data-course-close'), await focused());
check(
  'popup is labelled by its title',
  await dialog(OPEN).evaluate((d) => document.getElementById(d.getAttribute('aria-labelledby'))?.textContent.trim()),
);
await shot('1-info');

// Tab order through the information view
const order = [];
for (let i = 0; i < 9; i++) {
  await page.keyboard.press('Tab');
  order.push(await focused());
}
console.log('     tab order:', order.join(' > '));
check('Tab stays inside the popup', await page.evaluate(() => !!document.activeElement.closest('dialog[open]')));

// Registration notes are the last accordion item
await dialog(OPEN).locator('details').last().locator('summary').click();
await dialog(OPEN).locator('details').last().scrollIntoViewIfNeeded();
await shot('2-registration');

// ---------- Step one ----------
await dialog(OPEN).locator('[data-enroll-start]').click();
check('Get started shows step one', (await dialog(OPEN).locator('[data-enroll]').getAttribute('data-step')) === 'details');
check('focus moves to the first field', await page.evaluate(() => document.activeElement?.name === 'name'));
await shot('3-details');

await dialog(OPEN).locator('form button[type="submit"]').click();
check(
  'empty form is held back by the browser',
  (await dialog(OPEN).locator('[data-enroll]').getAttribute('data-step')) === 'details',
);
await dialog(OPEN).locator('input[name="name"]').fill('Ada Lovelace');
await dialog(OPEN).locator('input[name="email"]').fill('not-an-email');
await dialog(OPEN).locator('form button[type="submit"]').click();
check(
  'a malformed email is held back by the browser',
  (await dialog(OPEN).locator('[data-enroll]').getAttribute('data-step')) === 'details',
);
await dialog(OPEN).locator('input[name="email"]').fill('ada@example.com');
const requests = [];
page.on('request', (request) => requests.push(request.url()));
await page.keyboard.press('Enter');

// ---------- Step two ----------
check('valid details lead to step two', (await dialog(OPEN).locator('[data-enroll]').getAttribute('data-step')) === 'payment');
check(
  'step two is marked as the current step',
  (await dialog(OPEN).locator('[aria-current="step"]').getAttribute('data-enroll-marker')) === 'payment',
);
await shot('4-payment');
await dialog(OPEN).locator('[data-enroll-pay]').click();
check('Pay explains that Stripe is not connected', await dialog(OPEN).locator('[data-enroll-notice]').isVisible());
await shot('5-not-connected');
check('nothing was sent anywhere', requests.length === 0, `${requests.length} requests`);
check('address carries no personal data', !(await page.evaluate(() => location.href)).includes('ada'));

// ---------- Back, back, Escape ----------
await dialog(OPEN).locator('[data-enroll-panel="payment"] [data-enroll-back]').click();
check('Back returns to step one', (await dialog(OPEN).locator('[data-enroll]').getAttribute('data-step')) === 'details');
check('details are kept', (await dialog(OPEN).locator('input[name="name"]').inputValue()) === 'Ada Lovelace');
await dialog(OPEN).locator('form [data-enroll-back]').click();
check('Back again returns to the course', (await dialog(OPEN).locator('[data-enroll]').getAttribute('data-step')) === 'idle');
check('focus returns to Get started', await focusIs('data-enroll-start'), await focused());

await page.keyboard.press('Escape');
await closed(OPEN);
check('Escape closes the popup', !(await dialog(OPEN).evaluate((d) => d.open)));
check('closing clears the hash', (await hash()) === '', await hash());
check(
  'focus returns to the card',
  await page.evaluate((slug) => document.activeElement?.getAttribute('data-course-open') === slug, OPEN),
  await focused(),
);

// ---------- Placeholder course, pointer, backdrop ----------
await page.locator(`#${PLACEHOLDER} .card__cover`).scrollIntoViewIfNeeded();
await page.locator(`#${PLACEHOLDER} .card__cover`).click();
await dialog(PLACEHOLDER).waitFor({ state: 'visible' });
check('a click on the picture opens the popup', (await hash()) === `#${PLACEHOLDER}`);
check('placeholder popup has no enrol flow', (await dialog(PLACEHOLDER).locator('[data-enroll]').count()) === 0);
await shot('6-placeholder');
await page.mouse.click(6, 6);
await closed(PLACEHOLDER);
check('a click on the backdrop closes the popup', !(await dialog(PLACEHOLDER).evaluate((d) => d.open)));
check(
  'focus returns to that card',
  await page.evaluate((slug) => document.activeElement?.getAttribute('data-course-open') === slug, PLACEHOLDER),
);

// ---------- Arriving with the hash ----------
await page.goto(address(home, OPEN), { waitUntil: 'networkidle' });
await dialog(OPEN).waitFor({ state: 'visible' });
check('/courses/#<slug> loads with the popup open', await dialog(OPEN).evaluate((d) => d.open));
// The page behind scrolls smoothly to the card; let it arrive before the picture is taken.
await page.waitForTimeout(1200);
await shot('7-hash');
await dialog(OPEN).locator('[data-course-close]').click();
await closed(OPEN);
check('Close button closes it and clears the hash', (await hash()) === '', await hash());

check('no script errors', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(results.every(Boolean) ? '\nall checks passed' : '\nSOME CHECKS FAILED');
process.exit(results.every(Boolean) ? 0 : 1);
