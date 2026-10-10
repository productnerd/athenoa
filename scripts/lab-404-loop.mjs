// Checks the not-found scene: takes viewport screenshots some seconds apart (no scrolling, so
// reveals behave as they do for a visitor) and prints where the moving layers are each time.
//
// node scripts/lab-404-loop.mjs [--mobile] [--width 1440 --height 900] [--gap 6000] [--count 4]
//      [--path /lab/404/] [--locale el] [--out shots/404-loop] [--nomotion] [--nojs] [--reduce]
//      [--garamond]   stand in for a visitor without the local title and reading faces
//      [--seam]       freeze every loop at its first and at its last instant and save both frames
//      [--at 0.5]     one frame with the boat at that fraction of its voyage (repeat the flag for more)
//      [--report]     print the text colours and their contrast, and which language shows
import { chromium } from 'playwright-core';

const rest = process.argv.slice(2);
const flag = (name) => rest.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : fallback;
};
const all = (name) => rest.flatMap((v, i) => (v === `--${name}` ? [rest[i + 1]] : []));
const mobile = flag('mobile');
const width = Number(opt('width', mobile ? 390 : 1440));
const height = Number(opt('height', mobile ? 844 : 900));
const gap = Number(opt('gap', 6000));
const count = Number(opt('count', 4));
const out = opt('out', 'shots/404-loop');
const url = new URL(opt('path', '/lab/404/'), process.env.SHOT_BASE ?? 'http://localhost:4321');
if (opt('locale')) url.searchParams.set('locale', opt('locale'));
if (flag('nomotion')) url.searchParams.set('nomotion', '1');

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  javaScriptEnabled: !flag('nojs'),
  reducedMotion: flag('reduce') ? 'reduce' : 'no-preference',
});
const page = await context.newPage();
// The dev server keeps a socket open, so "networkidle" can wait for ever on a busy machine.
await page.goto(url.href, { waitUntil: 'load', timeout: 90000 });
if (flag('garamond'))
  await page.addStyleTag({
    content: `:root{--font-title:'EB Garamond Variable',serif;--font-body:'EB Garamond Variable',serif}`,
  });
await page.waitForTimeout(flag('nojs') ? 1500 : 4200);

// With JavaScript off the page cannot be asked anything, so only the picture is taken.
if (flag('nojs')) {
  await page.screenshot({ path: `${out}.png` });
  console.log(`${out}.png`);
  await browser.close();
  process.exit(0);
}

// Other work on the site makes the dev server reload the page now and then: ask again when it does.
const ask = async (fn, arg) => {
  for (let i = 0; ; i++) {
    try {
      return await page.evaluate(fn, arg);
    } catch (error) {
      if (i > 4 || !/context was destroyed|navigation/i.test(String(error))) throw error;
      await page.waitForLoadState('load');
      await page.waitForTimeout(4200);
    }
  }
};

const probe = () =>
  ask(() => {
    const x = (sel) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().left * 10) / 10 : null;
    };
    const pending = [...document.querySelectorAll('.nf [data-reveal]')].filter(
      (el) => el.getClientRects().length && !el.classList.contains('is-in'),
    ).length;
    return {
      boat: x('.nf__bob'),
      far: x('.nf__band--far .nf__run'),
      mid: x('.nf__band--mid .nf__run'),
      near: x('.nf__swell .nf__run'),
      cloud1: x('.nf__cloud--1 .nf__run'),
      cloud2: x('.nf__cloud--2 .nf__run'),
      cloud3: x('.nf__cloud--3 .nf__run'),
      revealsPending: pending,
      sceneHeight: Math.round(document.querySelector('.nf').getBoundingClientRect().height),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

const report = () =>
  ask(() => {
    const rgb = (c) => {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.fillStyle = c;
      ctx.fillRect(0, 0, 1, 1);
      return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
    };
    const lum = ([r, g, b]) => {
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((p, q) => q - p);
      return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
    };
    const root = getComputedStyle(document.documentElement);
    const paper = rgb(root.getPropertyValue('--creme').trim());
    const deep = rgb(root.getPropertyValue('--blue-deep').trim());
    const shown = (sel) => [...document.querySelectorAll(sel)].find((el) => el.getClientRects().length);
    const row = (sel, ground) => {
      const el = shown(sel);
      if (!el) return { sel, missing: true };
      const cs = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      return {
        sel,
        lang: el.closest('[lang]')?.lang,
        text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 60),
        font: cs.fontFamily.split(',')[0],
        size: Math.round(parseFloat(cs.fontSize) * 10) / 10,
        contrast: ratio(rgb(cs.color), ground),
        box: [box.left, box.top, box.right, box.bottom].map(Math.round),
      };
    };
    const boat = document.querySelector('.nf__boat').getBoundingClientRect();
    return {
      htmlLang: document.documentElement.lang,
      title: document.title,
      motion: document.documentElement.classList.contains('motion'),
      running: document.getAnimations().filter((a) => String(a.animationName).startsWith('nf-') && a.playState === 'running').length,
      boatTop: Math.round(boat.top),
      rows: [
        row('.nf__greek', paper),
        row('.nf__translation', paper),
        row('.nf__source', paper),
        row('.nf__title', deep),
        row('.nf__line', deep),
        row('.nf__ways .btn', rgb(root.getPropertyValue('--creme-light').trim())),
        row('.nf__ways .btn--ghost', deep),
      ],
    };
  });

// Hold every loop still at a chosen instant. `t` is a fraction of the second pass of each loop
// (the first pass starts part-way in, because of the negative delays).
const freeze = (t) =>
  ask((t) => {
    for (const a of document.getAnimations()) {
      const name = String(a.animationName);
      if (!name.startsWith('nf-')) continue;
      if (name === 'nf-arrive') {
        a.finish();
        continue;
      }
      const { delay, duration } = a.effect.getComputedTiming();
      a.pause();
      a.currentTime = name === 'nf-drift' || name === 'nf-voyage' ? delay + duration + t * duration : 0;
    }
  }, t);

if (flag('report')) console.log(JSON.stringify(await report(), null, 1));

if (flag('seam')) {
  for (const [name, t] of [
    ['start', 0.00001],
    ['end', 0.99999],
  ]) {
    await freeze(t);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}-seam-${name}.png` });
    console.log(`${out}-seam-${name}.png`, JSON.stringify(await probe()));
  }
} else if (all('at').length) {
  for (const t of all('at')) {
    await freeze(Number(t));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}-at-${t}.png` });
    console.log(`${out}-at-${t}.png`, JSON.stringify(await probe()));
  }
} else {
  for (let i = 0; i < count; i++) {
    if (i) await page.waitForTimeout(gap);
    const file = count === 1 ? `${out}.png` : `${out}-${i + 1}.png`;
    await page.screenshot({ path: file });
    console.log(file, JSON.stringify(await probe()));
  }
}
await browser.close();
