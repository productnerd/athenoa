// Reads the Greek courses pages the way a visitor and a screen reader meet them and lists
//   1. internal links that leave /el/
//   2. every piece of text or label that still contains Latin letters (for a person to judge:
//      the brand, proper names and words the Greek copy itself keeps in Latin script are expected)
// It looks inside <main> and the course popups only; the header and footer belong to someone else.
// node scripts/lab-courses-lang.mjs
import { chromium } from 'playwright-core';

const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const paths = [
  '/el/courses/',
  '/el/courses/the-hidden-non-duality-of-ancient-greek-philosophy/',
  '/el/courses/platos-republic/',
  '/el/courses/marcus-aurelius-the-self/',
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.routeWebSocket(/./, () => {});
let failed = false;

for (const path of paths) {
  await page.goto(`${base}${path}?nomotion=1`, { waitUntil: 'load', timeout: 60000 });
  const found = await page.evaluate(() => {
    const roots = [document.querySelector('main'), ...document.querySelectorAll('dialog')];
    const latin = /[A-Za-z]{2,}/;
    const strings = new Set();
    const links = new Set();
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement.closest('script, style')) continue;
        const text = node.textContent.replace(/\s+/g, ' ').trim();
        if (latin.test(text)) strings.add(text.match(/(?:\S+\s+){0,3}\S*[A-Za-z]{2,}\S*(?:\s+\S+){0,3}/g).join(' … '));
      }
      for (const el of root.querySelectorAll('*')) {
        for (const name of ['alt', 'aria-label', 'title', 'placeholder', 'data-missing', 'data-mismatch']) {
          const value = el.getAttribute(name);
          if (value && latin.test(value)) strings.add(`[${name}] ${value}`);
        }
      }
      for (const a of root.querySelectorAll('a[href]')) {
        const href = a.getAttribute('href');
        if (href.startsWith('/') && !href.startsWith('/el/')) links.add(href);
      }
    }
    return {
      lang: document.documentElement.lang,
      title: document.title,
      strings: [...strings],
      links: [...links],
      crumbs: document.querySelector('.course__crumbs')?.getAttribute('aria-label'),
    };
  });
  console.log(`\n${path}  (lang=${found.lang}, title="${found.title}"${found.crumbs ? `, trail="${found.crumbs}"` : ''})`);
  console.log(found.links.length ? `  LINKS LEAVING /el/: ${found.links.join(', ')}` : '  links: all under /el/');
  if (found.links.length || found.lang !== 'el') failed = true;
  console.log('  Latin script found in:');
  for (const text of found.strings) console.log(`    - ${text}`);
}
await browser.close();
process.exit(failed ? 1 : 0);
