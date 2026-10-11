// Opens the newsletter popup on its lab page with the installed Chrome, looks at it and tries it.
//   node scripts/lab-newsletter-check.mjs                    every check, and four screenshots
//   node scripts/lab-newsletter-check.mjs --shots            only the views and their size checks
//   node scripts/lab-newsletter-check.mjs --checks           only the behaviour checks, no screenshots
//   node scripts/lab-newsletter-check.mjs --only mobile-el   one view
//   ... --more         also keep the other views (Greek desktop, a low laptop, a 320px phone,
//                      the browser's own message for a bad address, the page without JavaScript)
//   ... --out <dir>    where the screenshots go (default shots/), as newsletter-<name>.jpg
//   ... --close        the screenshots show the popup alone, at twice the size
// The four kept by default: desktop, mobile, mobile-el, note. Exits with 1 if a check fails.
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const out = (name) => `${opt('out', 'shots')}/newsletter-${name}.jpg`;
const LINK = 'a[data-lab-link]';
const BUTTON = 'button[data-newsletter-open]';

const browser = await chromium.launch({ channel: 'chrome' });
const results = [];

// One page, one set of checks. The dev server reloads the page whenever a file changes; if that
// (or anything else) interrupts a block it starts over, and only a block that finished is counted.
async function block(options, run) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const checks = [];
    const check = (name, ok, detail = '') => checks.push([name, Boolean(ok), detail]);
    const context = await browser.newContext({
      viewport: options.viewport ?? (options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }),
      deviceScaleFactor: flag('close') ? 2 : 1,
      isMobile: Boolean(options.mobile),
      hasTouch: Boolean(options.mobile),
      javaScriptEnabled: options.js !== false,
      reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
    });
    try {
      const page = await context.newPage();
      const path = options.path ?? '/lab/newsletter/';
      await page.goto(`${base}${path}${options.motion ? '' : '?nomotion=1'}${options.hash ?? ''}`, {
        waitUntil: 'networkidle',
      });
      if (options.js !== false) await page.evaluate(() => document.fonts.ready);
      await run(page, check);
    } catch (error) {
      if (attempt < 3) continue;
      check(`${options.name ?? 'block'}: ran to the end`, false, String(error).split('\n')[0]);
    } finally {
      await context.close();
    }
    for (const [name, ok, detail] of checks) {
      results.push(ok);
      console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
    }
    return;
  }
}

const isOpen = (page) => page.evaluate(() => document.querySelector('#newsletter').open);
const openIt = async (page, selector = LINK) => {
  await page.click(selector);
  await page.waitForSelector('#newsletter[open]');
  await page.waitForTimeout(250);
};
// The whole window, or with --close the popup alone. Views marked extra are only kept with --more.
const shoot = async (page, name, extra = false) => {
  if (flag('checks') || (extra && !flag('more') && opt('only') !== name)) return;
  const clip = flag('close')
    ? await page.evaluate(() => {
        const r = document.querySelector('#newsletter').getBoundingClientRect();
        const x = Math.max(0, r.x - 10);
        const y = Math.max(0, r.y - 10);
        return { x, y, width: Math.min(innerWidth - x, r.width + 20), height: Math.min(innerHeight - y, r.height + 20) };
      })
    : undefined;
  await page.screenshot({ path: out(name), type: 'jpeg', quality: 80, clip });
};
// Sizes that must hold: nothing scrolls sideways, the field keeps its width, the popup fits.
const measure = (page) =>
  page.evaluate(() => {
    const dialog = document.querySelector('#newsletter');
    const box = dialog.getBoundingClientRect();
    const column = dialog.querySelector('.nl__column').getBoundingClientRect();
    const shaft = dialog.querySelector('.nl__shaft').getBoundingClientRect();
    return {
      field: Math.round(dialog.querySelector('input').getBoundingClientRect().width),
      rem: parseFloat(getComputedStyle(document.documentElement).fontSize),
      sideways: document.documentElement.scrollWidth > innerWidth || dialog.scrollWidth > dialog.clientWidth,
      scrolls: dialog.scrollHeight > dialog.clientHeight + 1,
      box: [Math.round(box.width), Math.round(box.height)],
      // Height of a column in lower diameters (the shaft is 50 of the piece's 82 units wide)
      slender: Math.round((column.height / ((shaft.width * 50) / 82)) * 10) / 10,
      title: dialog.querySelector('h2').textContent,
    };
  });

// ---------- Screenshots ----------
if (!flag('checks')) {
  const views = [
    { name: 'desktop', path: '/lab/newsletter/' },
    { name: 'mobile', path: '/lab/newsletter/', mobile: true },
    { name: 'desktop-el', path: '/el/lab/newsletter/', extra: true },
    { name: 'mobile-el', path: '/el/lab/newsletter/', mobile: true },
    { name: 'laptop', path: '/lab/newsletter/', viewport: { width: 1280, height: 720 }, extra: true },
    { name: 'small', path: '/el/lab/newsletter/', mobile: true, viewport: { width: 320, height: 640 }, extra: true },
  ].filter((view) => !opt('only') || view.name === opt('only'));
  for (const view of views) {
    await block(view, async (page, check) => {
      await openIt(page);
      const m = await measure(page);
      await shoot(page, view.name, view.extra);
      check(
        `${view.name}: fits, field at least 16rem, nothing sideways`,
        !m.sideways && !m.scrolls && m.field >= 16 * m.rem,
        `popup ${m.box.join('x')}, field ${m.field}px, columns ${m.slender} diameters, "${m.title}"`,
      );
    });
  }
}

// ---------- Behaviour ----------
if (!flag('shots') && !opt('only')) {
  for (const mobile of [false, true]) {
    const tag = mobile ? 'mobile' : 'desktop';
    const path = mobile ? '/el/lab/newsletter/' : '/lab/newsletter/';
    await block({ name: tag, mobile, path }, async (page, check) => {
      const sent = [];
      await openIt(page);
      // Anything that could carry the address: a request that is not a plain GET, or one that names it.
      // (The page still fetches its icon, and prefetches the contact page once the note shows its link.)
      page.on('request', (request) => {
        if (request.method() !== 'GET' || /reader|example\.com/.test(decodeURIComponent(request.url()))) {
          sent.push(`${request.method()} ${request.url()}`);
        }
      });
      check(
        `${tag}: the link opens it as a modal`,
        await page.evaluate(() => document.querySelector('#newsletter').matches(':modal')),
      );
      check(
        `${tag}: focus moved into the popup`,
        await page.evaluate(() => document.querySelector('#newsletter').contains(document.activeElement)),
        await page.evaluate(() => document.activeElement.tagName.toLowerCase()),
      );
      check(
        `${tag}: labelled by its headline`,
        await page.evaluate(() => {
          const dialog = document.querySelector('#newsletter');
          return document.getElementById(dialog.getAttribute('aria-labelledby')) === dialog.querySelector('h2');
        }),
      );
      check(
        `${tag}: the backdrop blurs the page`,
        await page.evaluate(() => {
          const style = getComputedStyle(document.querySelector('#newsletter'), '::backdrop');
          return /blur\(/.test(style.backdropFilter || style.webkitBackdropFilter || '');
        }),
      );
      check(
        `${tag}: it lies over the music button`,
        await page.evaluate(() => {
          const r = document.querySelector('[data-music-toggle]').getBoundingClientRect();
          const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return document.querySelector('#newsletter').contains(top);
        }),
      );

      // An address the browser rejects: no note, the native message instead
      await page.fill('#newsletter-email', 'not-an-address');
      await page.click('#newsletter button[type=submit]');
      await page.waitForTimeout(150);
      const invalid = await page.evaluate(() => {
        const dialog = document.querySelector('#newsletter');
        const input = dialog.querySelector('input');
        return { valid: input.validity.valid, message: input.validationMessage, sent: dialog.hasAttribute('data-sent') };
      });
      check(`${tag}: an invalid address is stopped by the browser`, !invalid.valid && !invalid.sent, invalid.message);
      await shoot(page, mobile ? 'invalid-mobile-el' : 'invalid', true);
      await page.fill('#newsletter-email', '');
      await page.click('#newsletter button[type=submit]');
      const empty = await page.evaluate(() => document.querySelector('#newsletter').hasAttribute('data-sent'));
      check(`${tag}: so is an empty field`, !empty);

      // A valid one: the honest note in place of the form
      const before = (await measure(page)).box;
      await page.fill('#newsletter-email', 'reader@example.com');
      await page.click('#newsletter button[type=submit]');
      await page.waitForTimeout(200);
      const note = await page.evaluate(() => {
        const dialog = document.querySelector('#newsletter');
        const noteEl = dialog.querySelector('[data-newsletter-note]');
        const shown = (el) => getComputedStyle(el).visibility === 'visible' && el.getClientRects().length > 0;
        return {
          note: shown(noteEl),
          form: shown(dialog.querySelector('form')),
          focused: document.activeElement === noteEl,
          href: noteEl.querySelector('a').getAttribute('href'),
          text: noteEl.textContent.trim().replace(/\s+/g, ' '),
        };
      });
      check(`${tag}: a valid address shows the note in place of the form`, note.note && !note.form && note.focused, note.text);
      check(`${tag}: the note links to the contact form`, /\/about-athena\/#contact$/.test(note.href), note.href);
      check(`${tag}: nothing was sent`, sent.length === 0, sent.join(', '));
      const m = await measure(page);
      check(
        `${tag}: the note fits and the frame keeps its size`,
        !m.sideways && !m.scrolls && m.box.join() === before.join(),
        `popup ${m.box.join('x')}`,
      );
      await shoot(page, mobile ? 'note-mobile-el' : 'note', mobile);

      // Escape closes, focus returns to the link
      await page.keyboard.press('Escape');
      await page.waitForTimeout(150);
      check(`${tag}: Escape closes it`, !(await isOpen(page)));
      check(
        `${tag}: focus is back on the link`,
        await page.evaluate((sel) => document.activeElement === document.querySelector(sel), LINK),
      );

      // The other opener; the form is fresh again
      await openIt(page, BUTTON);
      const fresh = await page.evaluate(() => {
        const dialog = document.querySelector('#newsletter');
        const form = dialog.querySelector('form');
        return getComputedStyle(form).visibility === 'visible' && dialog.querySelector('input').value === '';
      });
      check(`${tag}: data-newsletter-open opens it, with the form back and empty`, fresh);

      // A click on the drawing keeps it open; one beside the gable, or on the backdrop, closes it
      const box = await page.evaluate(() => {
        const r = document.querySelector('#newsletter .nl__frame').getBoundingClientRect();
        const c = document.querySelector('#newsletter .nl__column').getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, cx: c.x + c.width / 2, cy: c.y + c.height / 2 };
      });
      await page.mouse.click(box.cx, box.cy); // a column
      await page.mouse.click(box.x + box.w / 2, box.y + box.w * 0.12); // the tympanum
      await page.waitForTimeout(100);
      check(`${tag}: a click on the portico keeps it open`, await isOpen(page));
      await page.mouse.click(box.x + 8, box.y + 8);
      await page.waitForTimeout(150);
      check(`${tag}: a click beside the gable closes it`, !(await isOpen(page)));
      check(
        `${tag}: focus is back on the button`,
        await page.evaluate((sel) => document.activeElement === document.querySelector(sel), BUTTON),
      );
      await openIt(page);
      await page.mouse.click(3, mobile ? 3 : 450);
      await page.waitForTimeout(150);
      check(`${tag}: a click on the backdrop closes it`, !(await isOpen(page)));

      // The close control
      await openIt(page);
      await page.click('#newsletter [data-newsletter-close]');
      await page.waitForTimeout(150);
      check(`${tag}: the close control closes it`, !(await isOpen(page)));
    });
  }

  // A low window: the popup scrolls inside itself and the close control stays in reach
  await block({ name: 'low window', viewport: { width: 844, height: 390 } }, async (page, check) => {
    await openIt(page);
    await page.evaluate(() => document.querySelector('#newsletter').scrollTo(0, 9999));
    const state = await page.evaluate(() => {
      const dialog = document.querySelector('#newsletter');
      const r = dialog.querySelector('[data-newsletter-close]').getBoundingClientRect();
      return {
        scrolled: dialog.scrollTop > 0,
        inView: r.top >= 0 && r.bottom <= innerHeight,
        sideways: document.documentElement.scrollWidth > innerWidth || dialog.scrollWidth > dialog.clientWidth,
      };
    });
    check('low window: it scrolls inside itself, the close control stays in view', state.scrolled && state.inView && !state.sideways);
  });

  // With motion on: opens, and closes after its transition
  await block({ name: 'motion', motion: true }, async (page, check) => {
    await page.waitForTimeout(600);
    await openIt(page);
    await page.waitForTimeout(800);
    const shown = await page.evaluate(() => getComputedStyle(document.querySelector('#newsletter')).opacity);
    await page.keyboard.press('Escape');
    const closing = await page.evaluate(() => document.querySelector('#newsletter').classList.contains('is-closing'));
    await page.waitForTimeout(700);
    check('motion: opens fully, plays its closing transition, then closes', shown === '1' && closing && !(await isOpen(page)));
  });

  // Reduced motion: no transition at all
  await block({ name: 'reduced motion', motion: true, reducedMotion: true }, async (page, check) => {
    await openIt(page);
    const duration = await page.evaluate(() => getComputedStyle(document.querySelector('#newsletter')).transitionDuration);
    const longest = Math.max(...duration.split(',').map((d) => parseFloat(d)));
    check('reduced motion: no transition', longest < 0.01, duration);
  });

  // Arriving at .../#newsletter opens it; closing drops the fragment
  await block({ name: 'deep link', hash: '#newsletter' }, async (page, check) => {
    await page.waitForSelector('#newsletter[open]');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const state = await page.evaluate(() => ({
      hash: location.hash,
      shown: document.querySelector('#newsletter').getClientRects().length > 0,
    }));
    check('deep link: opens on arrival; closed, the fragment is gone and nothing stays on screen', state.hash === '' && !state.shown);
  });

  // After the page router has swapped pages, the one document listener still opens the new dialog once
  await block({ name: 'router' }, async (page, check) => {
    await page.evaluate(() => {
      const link = document.createElement('a');
      link.href = '/el/lab/newsletter/';
      link.id = 'lab-go';
      link.textContent = 'el';
      document.querySelector('main').prepend(link);
    });
    await page.click('#lab-go');
    await page.waitForURL('**/el/lab/newsletter/**');
    await page.waitForSelector('#newsletter[data-ready]', { state: 'attached' });
    await openIt(page);
    const state = await page.evaluate(() => ({
      dialogs: document.querySelectorAll('dialog#newsletter').length,
      lang: document.documentElement.lang,
      title: document.querySelector('#newsletter h2').textContent,
    }));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(700); // motion is on after the navigation: the closing transition plays
    check(
      'router: after a client-side navigation the popup opens and closes on the new page',
      state.dialogs === 1 && state.lang === 'el' && !(await isOpen(page)),
      state.title,
    );
  });

  // Without JavaScript: :target reveals it as a block, a plain link closes it
  await block({ name: 'no JavaScript', js: false }, async (page, check) => {
    await page.click(LINK);
    await page.waitForTimeout(200);
    const shown = await page.evaluate(() => {
      const dialog = document.querySelector('#newsletter');
      const visible = (el) => el.getClientRects().length > 0;
      return {
        dialog: visible(dialog),
        note: visible(dialog.querySelector('[data-newsletter-note]')),
        form: visible(dialog.querySelector('form')),
        link: visible(dialog.querySelector('a.nl__close')),
        position: getComputedStyle(dialog).position,
      };
    });
    check(
      'no JavaScript: #newsletter reveals the popup with the note and a close link',
      shown.dialog && shown.note && !shown.form && shown.link && shown.position === 'fixed',
      JSON.stringify(shown),
    );
    await shoot(page, 'nojs', true);
    await page.click('#newsletter a.nl__close');
    await page.waitForTimeout(200);
    check(
      'no JavaScript: the plain link closes it',
      await page.evaluate(() => document.querySelector('#newsletter').getClientRects().length === 0),
    );
  });
}

await browser.close();
const failed = results.filter((ok) => !ok).length;
console.log(failed ? `${failed} of ${results.length} failed` : `all ${results.length} passed`);
process.exit(failed ? 1 : 0);
