// Lab helper for /lab/home-b/: section screenshots that wait for every image, a no-JavaScript mode,
// keyboard checks for the course tabs, an overflow report and a contrast probe for the fresco.
//
// node scripts/lab-home-b-shot.mjs <out.png> [--sel .series] [--width 1440] [--height 900] [--mobile]
//   [--fonts b] [--nojs] [--motion] [--tab 5] [--keys "End,ArrowUp"] [--report] [--contrast] [--full] [--el]
import { chromium } from 'playwright-core';

const [, , out = 'shots/home-b.png', ...rest] = process.argv;
const flag = (name) => rest.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};

const mobile = flag('mobile');
const width = Number(opt('width', mobile ? 390 : 1440));
const height = Number(opt('height', mobile ? 844 : 900));
const url = new URL(flag('el') ? '/el/lab/home-b/' : '/lab/home-b/', process.env.SHOT_BASE ?? 'http://localhost:4321');
if (!flag('motion')) url.searchParams.set('nomotion', '1');
if (opt('fonts')) url.searchParams.set('fonts', opt('fonts'));

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  javaScriptEnabled: !flag('nojs'),
});
// Other people are editing the project while this runs: keep the dev server's live reload out of the page.
await context.routeWebSocket(/.*/, () => {});
const page = await context.newPage();
page.on('pageerror', (error) => console.log('PAGE ERROR', error.message));
page.on('console', (msg) => msg.type() === 'error' && console.log('CONSOLE', msg.text()));
await page.goto(url.href, { waitUntil: 'load', timeout: 120000 });
// Section shots are taken without the fixed header and lab controls, which would sit on top of them.
if (opt('sel') && !flag('viewport') && !flag('nojs')) {
  await page.addStyleTag({ content: '[data-header], [data-music] { display: none !important; }' });
}

if (flag('nojs')) {
  // Without scripts lazy images never get scrolled to by evaluate(); use the wheel instead.
  for (let y = 0; y < 16000; y += 700) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(2500);
} else {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    document.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r))),
      ),
    );
    window.scrollTo(0, 0);
  });
}

if (opt('tab')) {
  await page.locator('[role="tab"]').nth(Number(opt('tab'))).click();
  await page.waitForTimeout(900);
}
if (opt('keys')) {
  await page.locator('[role="tab"][aria-selected="true"]').focus();
  for (const key of opt('keys').split(',')) {
    await page.keyboard.press(key);
    const state = await page.evaluate(() => ({
      focused: document.activeElement?.id,
      selected: Array.from(document.querySelectorAll('[role="tab"]'))
        .filter((t) => t.getAttribute('aria-selected') === 'true')
        .map((t) => t.id),
      tabbable: Array.from(document.querySelectorAll('[role="tab"]'))
        .filter((t) => t.tabIndex === 0)
        .map((t) => t.id),
      visiblePanels: Array.from(document.querySelectorAll('.ctabs__panel'))
        .filter((p) => p.offsetParent !== null)
        .map((p) => `${p.id} (labelled by ${p.getAttribute('aria-labelledby')})`),
      orientation: document.querySelector('[role="tablist"]')?.getAttribute('aria-orientation'),
    }));
    console.log(key, JSON.stringify(state));
  }
  await page.waitForTimeout(600);
}

if (flag('report')) {
  const report = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const wide = [];
    document.querySelectorAll('main *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 1 || r.left < -1)) {
        wide.push(`${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]} ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
    });
    return {
      vw,
      scrollWidth: document.documentElement.scrollWidth,
      wide: wide.slice(0, 40),
      headings: Array.from(document.querySelectorAll('main :is(h1,h2,h3,h4)'))
        .filter((h) => h.offsetParent !== null)
        .map((h) => `${h.tagName} ${(h.getAttribute('aria-label') ?? h.textContent).trim().slice(0, 50)}`),
      tablistHidden: document.querySelector('[role="tablist"]')?.offsetParent === null,
      visiblePanels: Array.from(document.querySelectorAll('.ctabs__panel')).filter((p) => p.offsetParent !== null).length,
    };
  });
  console.log(JSON.stringify(report, null, 1));
}

if (flag('contrast')) {
  // Hide the words, photograph what is behind them, and compare the lightest pixel with the text colour.
  const box = await page.evaluate(() => {
    const text = document.querySelector('.start__text');
    document.documentElement.style.scrollBehavior = 'auto';
    // Fixed chrome (header, lab bars) would otherwise be photographed along with the fresco.
    document.querySelectorAll('body > *:not(main), [data-header]').forEach((el) => (el.style.display = 'none'));
    const colours = {
      title: getComputedStyle(text.querySelector('h2')).color,
      hand: getComputedStyle(text.querySelector('.hand')).color,
    };
    Array.from(text.children).forEach((child) => (child.style.visibility = 'hidden'));
    return { colours };
  });
  const png = await page.locator('.start__text').screenshot();
  const data = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const px = ctx.getImageData(0, 0, img.width, img.height).data;
    const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    let max = 0;
    let sum = 0;
    let at = '';
    for (let i = 0; i < px.length; i += 4) {
      const l = lum(px[i], px[i + 1], px[i + 2]);
      sum += l;
      if (l > max) {
        max = l;
        at = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`;
      }
    }
    return { max, mean: sum / (px.length / 4), at, lumOf: null };
  }, png.toString('base64'));
  const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  for (const [name, colour] of Object.entries(box.colours)) {
    const [r, g, b] = colour.match(/[\d.]+/g).map(Number);
    const l = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    console.log(
      `${name} ${colour}: worst ${((l + 0.05) / (data.max + 0.05)).toFixed(2)}:1 (lightest pixel ${data.at}), typical ${((l + 0.05) / (data.mean + 0.05)).toFixed(2)}:1`,
    );
  }
  await page.evaluate(() =>
    Array.from(document.querySelector('.start__text').children).forEach((child) => (child.style.visibility = '')),
  );
}

// .jpg output keeps iteration shots small.
const img = out.endsWith('.jpg') ? { path: out, type: 'jpeg', quality: 70 } : { path: out };
const sel = opt('sel');
if (sel) {
  const target = page.locator(sel).first();
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(flag('motion') ? 2200 : 500);
  if (flag('viewport')) await page.screenshot(img);
  else await target.screenshot(img);
} else {
  await page.waitForTimeout(400);
  await page.screenshot({ ...img, fullPage: flag('full') });
}
await browser.close();
console.log(out);
