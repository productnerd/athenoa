// Lab helper for /lab/home-b/: contrast of the words over the fresco in "Let's Get Started".
// For the title and each line in the voice face it hides the words, photographs exactly the box they
// occupy, and compares the text colour with the LIGHTEST pixel behind it (the worst case).
//
// node scripts/lab-home-b-contrast.mjs [--langs en,el] [--widths 1440,1024,768,390,360]
import { chromium } from 'playwright-core';

const rest = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
const langs = opt('langs', 'en,el').split(',');
const widths = opt('widths', '1440,1024,768,390,360').split(',').map(Number);
const base = process.env.SHOT_BASE ?? 'http://localhost:4321';

const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

const browser = await chromium.launch({ channel: 'chrome' });
let worstOverall = Infinity;
for (const lang of langs) {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.routeWebSocket(/.*/, () => {});
    const page = await context.newPage();
    await page.goto(`${base}${lang === 'el' ? '/el' : ''}/lab/home-b/?nomotion=1`, { waitUntil: 'load', timeout: 120000 });
    await page.addStyleTag({ content: '[data-header], [data-music] { display: none !important; } html { scroll-behavior: auto !important; }' });
    const info = await page.evaluate(async () => {
      await document.fonts.ready;
      const img = document.querySelector('.start__fresco img');
      img.loading = 'eager';
      if (!img.complete) await new Promise((r) => ((img.onload = r), (img.onerror = r)));
      await img.decode().catch(() => {});
      document.querySelector('.start').scrollIntoView({ block: 'center' });
      const items = [document.querySelector('.start__text h2'), ...document.querySelectorAll('.start__lines .hand')];
      const rows = items.map((el) => {
        const cs = getComputedStyle(el);
        // The range gives the box of the words themselves, not of the whole paragraph.
        const range = document.createRange();
        range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        return {
          name: el.tagName === 'H2' ? 'title' : 'line',
          colour: cs.color,
          size: cs.fontSize,
          weight: cs.fontWeight,
          clip: { x: r.left, y: r.top, width: r.width, height: r.height },
        };
      });
      document.querySelector('.start__text').style.visibility = 'hidden';
      return { loaded: img.naturalWidth, rows };
    });
    await page.waitForTimeout(300);
    for (const row of info.rows) {
      const png = await page.screenshot({ clip: row.clip });
      const px = await page.evaluate(async (b64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return Array.from(ctx.getImageData(0, 0, img.width, img.height).data);
      }, png.toString('base64'));
      let max = 0;
      let at = '';
      for (let i = 0; i < px.length; i += 4) {
        const l = lum(px[i], px[i + 1], px[i + 2]);
        if (l > max) {
          max = l;
          at = `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`;
        }
      }
      const [r, g, b] = row.colour.match(/[\d.]+/g).map(Number);
      const ratio = (lum(r, g, b) + 0.05) / (max + 0.05);
      worstOverall = Math.min(worstOverall, ratio);
      console.log(
        `${lang} ${String(width).padStart(4)} ${row.name.padEnd(5)} ${row.size} w${row.weight}  worst ${ratio.toFixed(2)}:1  (lightest ${at}, fresco ${info.loaded}px)`,
      );
    }
    await context.close();
  }
}
await browser.close();
console.log(`\nLowest contrast found: ${worstOverall.toFixed(2)}:1 (needs 4.5:1)`);
