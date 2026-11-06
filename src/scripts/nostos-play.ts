// Nostos: the activities (tasks/nostos.md, Play), ported from the prototype's startActivity() and act*
// functions (reference/nostos-prototype/app.js), restyled to the site: quiet feedback by ink and a small
// mark, no colours for right and wrong, nothing that bounces. Each activity fetches its own material
// from /nostos/data/<name>.json when it starts. Progress lives in this browser (nostos-progress.ts).
//
// The two activities that need Claude (Socratic sparring, Teach it back) are not here: they stay hidden
// until Maria decides on the server function they need.
//
// THE CONTENT IS NEW WORDING generated from her talks, for Athena to review (src/lib/nostos.ts).
import { navigate } from 'astro:transitions/client';
import { playSound } from './sound';
import { award, load, save, today, type Progress } from './nostos-progress';
import { explainWrong, hasKey, markAnswer, noteAnswer } from './nostos-tutor';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Words = Record<string, any>;
type Concept = { id: string; label: string; greek?: string; translit?: string; group: string; weight: number; freq: number; take: string };
type Arena = { stage: HTMLElement; progress: (f: number) => void; score: (s: string) => void };

let W: Words = {};
let feedBase = '/nostos/data/';
let mapBase = '/nostos/';
// the path and Review run on a page of their own (src/pages/nostos/path.astro); the activities in a dialog
let pageMode = false;
let playHref = '/nostos/play/';
let pathHref = '/nostos/path/';
const feeds = new Map<string, Promise<any>>();
const feed = <T = any>(name: string): Promise<T> => {
  if (!feeds.has(name)) {
    const request = fetch(`${feedBase}${name}.json`).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
    request.catch(() => feeds.delete(name));
    feeds.set(name, request);
  }
  return feeds.get(name)!;
};

// ---------- small helpers ----------
type Child = Node | string | null | undefined | false;
function h(tag: string, attrs: Record<string, any> | null = null, ...children: (Child | Child[])[]) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'style') Object.assign(node.style, value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) if (child) node.append(child);
  return node;
}
const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key) => (key in values ? String(values[key]) : `{${key}}`));
const shuffle = <T>(list: T[]) => {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
const pick = <T>(list: T[], n: number) => shuffle(list).slice(0, n);
const clip = (text: string, n: number) => (text.length > n ? `${text.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : text);
const seconds = (t?: string | number) => {
  if (!t) return 0;
  if (typeof t === 'number') return Math.floor(t);
  const parts = t.split(':').map(Number);
  return parts.every((n) => !Number.isNaN(n)) ? parts.reduce((a, b) => a * 60 + b, 0) : 0;
};
const youtube = (id: string, t?: string | number) => `https://www.youtube.com/watch?v=${id}${seconds(t) ? `&t=${seconds(t)}s` : ''}`;
const greek = (text: string, cls = '') => h('span', { class: `ng ${cls}`, lang: 'grc' }, text);
const MARK_RIGHT = '<svg class="nmark" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12.8c2 1.6 3.5 3.3 4.8 5.2 2.6-4.8 6-8.7 10.2-12"/></svg>';
const MARK_WRONG = '<svg class="nmark" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6.4c4.2 3.6 8 7.6 12 11.6M18 6c-4 4-8 7.8-12 12"/></svg>';
const mark = (right: boolean) => {
  const span = h('span', { class: 'nmark-wrap' });
  span.innerHTML = (right ? MARK_RIGHT : MARK_WRONG) + `<span class="visually-hidden">${right ? W.arena.right : W.arena.wrong}</span>`;
  return span;
};
const unsure = (item: { uncertain?: boolean }) =>
  item.uncertain ? h('span', { class: 'nunsure', title: W.uncertain }, h('span', { class: 'visually-hidden' }, W.uncertain)) : null;

// ---------- the ladder of progress ----------
const rungIndex = (xp: number) => {
  let index = 0;
  (W.rungs as [number, string, string][]).forEach((rung, k) => {
    if (xp >= rung[0]) index = k;
  });
  return index;
};
const streak = (p: Progress) => {
  let n = 0;
  const day = new Date();
  const key = (d: Date) => d.toISOString().slice(0, 10);
  if (!p.days[today()]) day.setDate(day.getDate() - 1);
  while (p.days[key(day)]) {
    n++;
    day.setDate(day.getDate() - 1);
  }
  return n;
};
let liveNote: HTMLElement | null = null;
function earn(points: number) {
  if (!points) return;
  const before = rungIndex(load().xp);
  const xp = award(points);
  const after = rungIndex(xp);
  if (!liveNote) return;
  liveNote.textContent = after > before ? fill(W.arena.newRung, { name: W.rungs[after][1] }) : fill(W.arena.points, { n: points });
  liveNote.classList.remove('is-on');
  void liveNote.offsetWidth;
  liveNote.classList.add('is-on');
}
const played = (id: string) => {
  const p = load();
  p.done[id] = (p.done[id] || 0) + 1;
  save(p);
};

// ---------- the arena: one dialog for every activity ----------
let dialog: HTMLDialogElement;
let cleanup: (() => void) | null = null;
/** Close: the dialog on the play page; back to the play page from the path page */
const leave = () => (pageMode ? navigate(playHref) : dialog.close());

// ---------- the map beside a lesson (path page): shown with every new idea, that star chosen ----------
// (client direction, 6 November 2026). The map page is loaded once, in a frame, as the map alone
// (?embed: no note beside it); each idea after that is sent to it, so it moves to its star without
// loading again.
const mapPanel = () => document.querySelector<HTMLElement>('[data-path-map]');
let mapReady = false;
let mapWanted = '';
function showMap(id: string) {
  const panel = mapPanel();
  const frame = panel?.querySelector<HTMLIFrameElement>('[data-path-frame]');
  if (!panel || !frame) return;
  mapWanted = id;
  if (!frame.getAttribute('src')) {
    mapReady = false;
    frame.addEventListener('load', () => {
      mapReady = true;
      frame.contentWindow?.postMessage({ nostosStar: mapWanted }, location.origin);
    });
    frame.setAttribute('src', `${mapBase}?embed&star=${encodeURIComponent(id)}`);
  } else if (mapReady) frame.contentWindow?.postMessage({ nostosStar: id }, location.origin);
  // over the map its own cursor takes over: this page's one is put away, not left at the edge
  frame.onpointerenter = () => document.querySelector('[data-cursor]')?.classList.remove('is-here');
  panel.hidden = false;
  document.querySelector('.npage')?.classList.add('has-map');
}
function hideMap() {
  const panel = mapPanel();
  if (panel) panel.hidden = true;
  document.querySelector('.npage')?.classList.remove('has-map');
}
const talkNames: Record<string, string> = {};
// The line under an answer naming the talk it comes from ("In Athena's talk …") is not shown for now
// (client direction, 6 November 2026); set this to true to bring it back everywhere at once.
const showSources = false;
const talkRef = (id?: string, t?: string | number) =>
  showSources && id && talkNames[id]
    ? h(
        'p',
        { class: 'nfrom' },
        `${W.arena.from} `,
        h('a', { href: youtube(id, t), target: '_blank', rel: 'noopener', lang: 'en' }, clip(talkNames[id], 70) + (t ? ` · ${t}` : '')),
      )
    : null;

function openArena(title: string, section: string): Arena {
  cleanup?.();
  cleanup = null;
  const stage = h('div', { class: 'narena__stage' });
  const bar = h('span', { class: 'narena__fill' });
  const score = h('span', { class: 'narena__score' });
  liveNote = h('span', { class: 'narena__note', 'aria-live': 'polite' });
  const close = h('button', { type: 'button', class: 'narena__close', 'aria-label': W.arena.close, onclick: leave });
  close.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M5 5.4c4.6 4.2 9 8.8 14 13.4M19 5c-4.4 4.8-9.2 9-13.8 14"></path></svg>';
  const sheet = dialog.querySelector('.narena__sheet')!;
  sheet.replaceChildren(
    close,
    h(
      'div',
      { class: 'narena__head' },
      h('p', { class: 'narena__section' }, section),
      h('h2', { class: 'narena__title t-3', id: 'narena-title' }, title),
      h('div', { class: 'narena__meta' }, score, liveNote),
      h('div', { class: 'narena__bar', role: 'progressbar', 'aria-label': W.arena.progress, 'aria-valuemin': 0, 'aria-valuemax': 100 }, bar),
    ),
    stage,
  );
  if (pageMode) {
    hideMap();
    window.scrollTo(0, 0);
  } else {
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }
  const barBox = sheet.querySelector<HTMLElement>('.narena__bar')!;
  return {
    stage,
    progress: (f) => {
      bar.style.width = `${Math.round(f * 100)}%`;
      barBox.setAttribute('aria-valuenow', String(Math.round(f * 100)));
    },
    score: (s) => (score.textContent = s),
  };
}

function finish(A: Arena, id: string, message: string, extra?: Node | null) {
  played(id);
  A.progress(1);
  A.stage.replaceChildren(
    h('div', { class: 'nend' }, greek(W.arena.end, 'nend__word'), h('p', { class: 'nend__msg' }, message), extra ?? null),
    h(
      'div',
      { class: 'nrow nrow--centre' },
      h('button', { type: 'button', class: 'btn', onclick: () => start(id) }, W.arena.again),
      h('button', { type: 'button', class: 'btn btn--ghost', onclick: leave }, W.arena.back),
    ),
  );
  (A.stage.querySelector('.btn') as HTMLElement)?.focus();
}

/** A multiple-choice question: options as paper strips; after the answer the right one is inked
 *  and marked, a wrong choice is crossed, and an explanation and a Next button follow. */
function choose(
  stage: HTMLElement,
  prompt: Node,
  right: string,
  wrongs: string[],
  answered: (ok: boolean) => void,
  next: () => void,
  explain?: Node | null,
  whyNot?: WhyNot,
) {
  const options = shuffle([right, ...wrongs]);
  const box = h('div', { class: 'nopts', role: 'group' });
  options.forEach((text) => {
    const button = h('button', { type: 'button', class: 'nopt' }, h('span', { class: 'nopt__text' }, text)) as HTMLButtonElement;
    button.addEventListener('click', () => {
      const ok = text === right;
      box.querySelectorAll<HTMLButtonElement>('.nopt').forEach((b) => {
        b.disabled = true;
        const isRight = b.querySelector('.nopt__text')!.textContent === right;
        if (isRight) {
          b.classList.add('is-right');
          b.prepend(mark(true));
        } else if (b !== button) b.classList.add('is-other');
      });
      if (!ok) {
        button.classList.add('is-wrong');
        button.prepend(mark(false));
      }
      answered(ok);
      const go = h('button', { type: 'button', class: 'btn', onclick: next }, W.arena.next);
      // a wrong choice: why it is not Athena's answer, from what the choice itself is (another idea's
      // meaning, another link's reason...), or from the tutor (with the visitor's key)
      const whyBox = !ok && whyNot ? whyNote(whyNot(text)) : null;
      stage.append(whyBox ?? '', explain ?? '', h('div', { class: 'nrow' }, go));
      go.focus({ preventScroll: true });
    });
    box.append(button);
  });
  stage.append(prompt, box);
  (box.firstElementChild as HTMLElement)?.focus({ preventScroll: true });
}

/** Why a wrong choice is wrong: a line at once, a promise of one from the tutor, or nothing */
type WhyNot = (chosen: string) => string | Promise<string> | null;
/** The "Why not yours" note: its lines at once, or a line from the tutor once it comes */
function whyNote(...lines: (string | Promise<string> | null | undefined)[]) {
  const shown = lines.filter((l): l is string | Promise<string> => !!l);
  if (!shown.length) return null;
  const box = h('div', { class: 'nwhynot' }, h('p', { class: 'nwhynot__h' }, W.tutor.whyNot));
  shown.forEach((line) => {
    if (typeof line === 'string') return box.append(h('p', null, line));
    const wait = h('p', { class: 'nsmall' }, W.tutor.whyNotThinking);
    box.append(wait);
    line.then((t) => wait.replaceWith(h('p', null, t))).catch(() => wait.remove());
  });
  return box;
}

// ---------- the activities ----------
const INTERVALS = [0, 1, 3, 7, 16, 35];
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const cardPool = (concepts: Concept[]) => concepts.filter((c) => c.greek && c.take);

async function cards(A: Arena) {
  const pool = cardPool(await feed<Concept[]>('concepts'));
  const p = load();
  const due = pool
    .filter((c) => !p.srs[c.id] || p.srs[c.id].due <= today())
    .sort((x, y) => (p.srs[x.id]?.box || 0) - (p.srs[y.id]?.box || 0) || y.freq - x.freq);
  const deck = (due.length ? due : pick(pool, 10)).slice(0, 12);
  let i = 0;
  let good = 0;
  const show = () => {
    if (i >= deck.length) return finish(A, 'cards', fill(W.cards.result, { good, n: deck.length }));
    A.progress(i / deck.length);
    A.score(`${i + 1} / ${deck.length}`);
    const c = deck[i];
    const box = load().srs[c.id]?.box || 0;
    const card = h(
      'button',
      { type: 'button', class: 'nflip', 'aria-label': W.cards.turn, 'aria-pressed': 'false' },
      h(
        'span',
        { class: 'nflip__in' },
        h(
          'span',
          { class: 'nflip__face' },
          h('span', { class: 'nsmall' }, fill(W.cards.box, { n: box + 1 })),
          greek(c.greek!, 'nflip__greek'),
          c.translit ? h('span', { class: 'nflip__translit', lang: 'grc-Latn' }, c.translit) : null,
        ),
        h(
          'span',
          { class: 'nflip__face nflip__back' },
          h('span', { class: 'nsmall' }, W.groups[c.group] ?? ''),
          h('span', { class: 'nflip__label' }, c.label),
          h('span', { class: 'nflip__take', lang: 'en' }, clip(c.take, 380)),
        ),
      ),
    );
    const grade = h(
      'div',
      { class: 'nrow nrow--centre', hidden: true },
      h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => rate(0) }, W.cards.again),
      h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => rate(1) }, W.cards.hazy),
      h('button', { type: 'button', class: 'btn', onclick: () => rate(2) }, W.cards.got),
    );
    card.addEventListener('click', () => {
      const on = card.classList.toggle('is-on');
      card.setAttribute('aria-pressed', String(on));
      grade.hidden = false;
    });
    const rate = (r: number) => {
      const next = r === 0 ? 0 : r === 1 ? box : Math.min(5, box + 1);
      const progress = load();
      progress.srs[c.id] = { box: next, due: addDays(INTERVALS[next]) };
      save(progress);
      if (r === 2) {
        good++;
        earn(5);
      }
      i++;
      show();
    };
    A.stage.replaceChildren(card, grade);
    card.focus({ preventScroll: true });
  };
  show();
}

async function match(A: Arena) {
  const pool = cardPool(await feed<Concept[]>('concepts')).filter((c) => c.label.length < 34);
  const set = pick(pool, 6);
  const left = shuffle(set);
  const right = shuffle(set);
  let chosen: string | null = null;
  let done = 0;
  let misses = 0;
  const t0 = Date.now();
  const timer = h('span', { class: 'ntimer' }, '0.0 s');
  const tick = window.setInterval(() => (timer.textContent = `${((Date.now() - t0) / 1000).toFixed(1)} s`), 100);
  cleanup = () => clearInterval(tick);
  const L = h('div', { class: 'nmatch__col' });
  const R = h('div', { class: 'nmatch__col' });
  const hint = h('p', { class: 'nsmall nmatch__hint', 'aria-live': 'polite' });
  left.forEach((c) =>
    L.append(
      h(
        'button',
        {
          type: 'button',
          class: 'ntile',
          'data-id': c.id,
          'aria-pressed': 'false',
          onclick: (e: Event) => {
            L.querySelectorAll('.ntile').forEach((t) => {
              t.classList.remove('is-sel');
              t.setAttribute('aria-pressed', 'false');
            });
            const t = e.currentTarget as HTMLElement;
            t.classList.add('is-sel');
            t.setAttribute('aria-pressed', 'true');
            chosen = c.id;
            hint.textContent = '';
          },
        },
        greek(c.greek!),
      ),
    ),
  );
  right.forEach((c) =>
    R.append(
      h(
        'button',
        {
          type: 'button',
          class: 'ntile',
          'data-id': c.id,
          onclick: (e: Event) => {
            const t = e.currentTarget as HTMLButtonElement;
            if (!chosen) {
              hint.textContent = W.match.first;
              return;
            }
            if (chosen === c.id) {
              const g = L.querySelector<HTMLButtonElement>(`[data-id="${CSS.escape(c.id)}"]`)!;
              [t, g].forEach((x) => {
                x.classList.add('is-done');
                x.classList.remove('is-sel');
                x.disabled = true;
                x.prepend(mark(true));
              });
              chosen = null;
              done++;
              A.progress(done / 6);
              if (done === 6) {
                clearInterval(tick);
                const s = +((Date.now() - t0) / 1000).toFixed(1);
                const p = load();
                const best = p.best.match && p.best.match < s ? p.best.match : s;
                p.best.match = best;
                save(p);
                earn(20 + (s < 30 ? 10 : 0) - Math.min(10, misses * 2));
                finish(A, 'match', fill(W.match.result, { s: s.toFixed(1), m: misses, best }));
              }
            } else {
              misses++;
              t.classList.remove('is-miss');
              void t.offsetWidth;
              t.classList.add('is-miss');
            }
          },
        },
        c.label,
      ),
    ),
  );
  A.score('6');
  A.stage.replaceChildren(
    h('div', { class: 'nrow nrow--between' }, h('p', { class: 'nprompt' }, W.match.prompt), timer),
    h('div', { class: 'nmatch' }, L, R),
    hint,
  );
}

async function quiz(A: Arena, opt: { concept?: string } = {}) {
  const [items] = await Promise.all([feed<any[]>('quiz'), feed('talks').then((t) => Object.assign(talkNames, t))]);
  let pool = items.slice();
  if (opt.concept) {
    const c = (await feed<Concept[]>('concepts')).find((x) => x.id === opt.concept);
    if (c) {
      const keys = [c.label, c.greek, c.id].filter(Boolean).map((s) => s!.toLowerCase());
      const related = pool.filter((q) => keys.some((k) => `${q.q} ${q.a} ${q.explain ?? ''}`.toLowerCase().includes(k)));
      if (related.length >= 3) pool = related;
    }
  }
  const qs = pick(pool, Math.min(10, pool.length));
  let i = 0;
  let right = 0;
  const show = () => {
    if (i >= qs.length)
      return finish(A, 'quiz', `${fill(W.quiz.result, { r: right, n: qs.length })} ${right >= qs.length * 0.8 ? W.quiz.well : W.quiz.again}`);
    A.progress(i / qs.length);
    A.score(`${right} · ${i + 1} / ${qs.length}`);
    const q = qs[i];
    A.stage.replaceChildren();
    choose(
      A.stage,
      h('p', { class: 'nprompt', lang: 'en' }, q.q, unsure(q)),
      q.a,
      (q.wrong ?? []).slice(0, 3),
      (ok) => {
        if (ok) {
          right++;
          earn(8);
        }
      },
      () => {
        i++;
        show();
      },
      h('div', { class: 'nexplain' }, q.explain ? h('p', { lang: 'en' }, q.explain) : null, talkRef(q.talk, q.t)),
    );
  };
  show();
}

async function lightning(A: Arena) {
  const [items] = await Promise.all([feed<any[]>('truefalse'), feed('talks').then((t) => Object.assign(talkNames, t))]);
  const deck = shuffle(items);
  let i = 0;
  let score = 0;
  let run = 0;
  let left = 60;
  let over = false;
  const timer = h('span', { class: 'ntimer' }, '60');
  const tick = window.setInterval(() => {
    left--;
    timer.textContent = String(left);
    A.progress((60 - left) / 60);
    if (left <= 0) end();
  }, 1000);
  let wait = 0;
  cleanup = () => {
    clearInterval(tick);
    clearTimeout(wait);
  };
  const end = () => {
    if (over) return;
    over = true;
    cleanup?.();
    const p = load();
    p.best.tf = Math.max(p.best.tf || 0, score);
    save(p);
    earn(Math.round(score / 2));
    finish(A, 'tf', fill(W.tf.result, { s: score, b: p.best.tf }));
  };
  const show = () => {
    if (over) return;
    if (i >= deck.length) return end();
    const item = deck[i];
    A.score(fill(W.tf.score, { s: score, k: run }));
    const answer = h('div', { class: 'nexplain', 'aria-live': 'polite' });
    const go = (value: boolean, button: HTMLElement) => {
      A.stage.querySelectorAll<HTMLButtonElement>('.nopt').forEach((b) => (b.disabled = true));
      const ok = value === item.true;
      if (ok) {
        run++;
        score += Math.min(5, run);
      } else run = 0;
      button.classList.add(ok ? 'is-right' : 'is-wrong');
      button.prepend(mark(ok));
      answer.replaceChildren(h('p', { lang: 'en' }, item.explain ?? ''));
      i++;
      wait = window.setTimeout(show, ok ? 900 : 1900);
    };
    A.stage.replaceChildren(
      h('div', { class: 'nrow nrow--between' }, h('p', { class: 'nsmall' }, W.tf.label), timer),
      h('p', { class: 'nprompt nprompt--big', lang: 'en' }, item.s, unsure(item)),
      h(
        'div',
        { class: 'ntwo' },
        h('button', { type: 'button', class: 'nopt nopt--two', onclick: (e: Event) => go(true, e.currentTarget as HTMLElement) }, greek('ἀληθές'), h('span', null, W.tf.yes)),
        h('button', { type: 'button', class: 'nopt nopt--two', onclick: (e: Event) => go(false, e.currentTarget as HTMLElement) }, greek('ψευδές'), h('span', null, W.tf.no)),
      ),
      answer,
    );
  };
  show();
}

/** One of Athena's sequences to put in order, on a ladder filled from the foot. The caller clears the
 *  stage first; answered() gets whether the order was right, and the Next button calls next(). */
function ladderStep(stage: HTMLElement, s: any, answered: (ok: boolean) => void, next: () => void, nextLabel = W.arena.next) {
  const steps: string[] = s.steps;
  const order: number[] = [];
  // the ladder: a rung for every step, filled from the bottom
  const ladder = h('ol', { class: 'nladder', reversed: true });
  const pool = h('div', { class: 'ntiles' });
  const check = h('button', { type: 'button', class: 'btn', disabled: true }, W.ladder.check) as HTMLButtonElement;
  const tiles = shuffle(steps.map((text, k) => ({ text, k })));
  const draw = () => {
    ladder.replaceChildren(
      ...steps.map((_, n) => {
        const k = order[n];
        return h(
          'li',
          { class: 'nladder__rung' },
          k === undefined
            ? null
            : h(
                'button',
                {
                  type: 'button',
                  class: 'ntile ntile--rung',
                  onclick: () => {
                    order.splice(n, 1);
                    draw();
                  },
                },
                steps[k],
              ),
        );
      }),
    );
    pool.querySelectorAll<HTMLButtonElement>('.ntile').forEach((b) => {
      const used = order.includes(Number(b.dataset.k));
      b.disabled = used;
      b.classList.toggle('is-used', used);
    });
    check.disabled = order.length !== steps.length;
  };
  tiles.forEach((tile) =>
    pool.append(
      h(
        'button',
        {
          type: 'button',
          class: 'ntile',
          'data-k': tile.k,
          onclick: () => {
            order.push(tile.k);
            draw();
          },
        },
        tile.text,
      ),
    ),
  );
  check.addEventListener('click', () => {
    const ok = order.every((k, n) => k === n);
    ladder.replaceChildren(
      ...steps.map((text, n) =>
        h('li', { class: `nladder__rung ${order[n] === n ? 'is-right' : 'is-wrong'}` }, h('span', { class: 'ntile ntile--rung ntile--still' }, mark(order[n] === n), text)),
      ),
    );
    pool.remove();
    check.remove();
    answered(ok);
    // the steps out of place (two at most): where they were put, and where they come
    const misplaced = order.map((k, n) => ({ k, n })).filter(({ k, n }) => k !== n).slice(0, 2);
    stage.append(
      whyNote(...misplaced.map(({ k, n }) => fill(W.tutor.orderWas, { step: steps[k], at: n + 1, right: k + 1 }))) ?? '',
      h('div', { class: 'nexplain' }, s.note ? h('p', { lang: 'en' }, s.note) : null, talkRef(s.talk, s.t)),
      h('div', { class: 'nrow' }, h('button', { type: 'button', class: 'btn', onclick: next }, nextLabel)),
    );
  });
  stage.append(
    h('p', { class: 'nsmall' }, W.ladder.prompt),
    h('h3', { class: 'nsubject', lang: 'en' }, s.title, unsure(s)),
    h('div', { class: 'nladder-wrap' }, ladder, pool),
    h('div', { class: 'nrow' }, check),
  );
  draw();
}

async function ladders(A: Arena) {
  const [items] = await Promise.all([feed<any[]>('sequences'), feed('talks').then((t) => Object.assign(talkNames, t))]);
  const set = pick(items, 4);
  let si = 0;
  let climbed = 0;
  const show = () => {
    if (si >= set.length) return finish(A, 'ladder', fill(W.ladder.result, { r: climbed, n: set.length }));
    A.progress(si / set.length);
    A.score(fill(W.ladder.of, { i: si + 1, n: set.length }));
    A.stage.replaceChildren();
    ladderStep(
      A.stage,
      set[si],
      (ok) => {
        earn(ok ? 20 : 5);
        if (ok) climbed++;
      },
      () => (si++, show()),
      W.ladder.next,
    );
  };
  show();
}

async function mythDecoder(A: Arena) {
  const [items] = await Promise.all([feed<any[]>('myths'), feed('talks').then((t) => Object.assign(talkNames, t))]);
  const m = pick(items, 1)[0];
  const readings: string[] = items.flatMap((x: any) => x.beats.map((b: any) => b.reading)).filter(Boolean);
  let i = 0;
  let right = 0;
  const show = () => {
    if (i >= m.beats.length) return finish(A, 'myth', fill(W.myth.result, { r: right, n: m.beats.length }), talkRef(m.talk));
    A.progress(i / m.beats.length);
    A.score(`${right}`);
    const beat = m.beats[i];
    A.stage.replaceChildren();
    choose(
      A.stage,
      h(
        'div',
        null,
        h('p', { class: 'nsmall' }, `${m.title} · ${fill(W.myth.beat, { i: i + 1, n: m.beats.length })}`, unsure(m)),
        h('p', { class: 'nprompt nprompt--big', lang: 'en' }, beat.beat),
        h('p', { class: 'nsmall' }, W.myth.ask),
      ),
      clip(beat.reading, 220),
      pick(readings.filter((r) => r !== beat.reading), 2).map((r) => clip(r, 220)),
      (ok) => {
        if (ok) {
          right++;
          earn(8);
        }
      },
      () => {
        i++;
        show();
      },
    );
  };
  show();
}

/** Build one Greek word from its roots: the right roots and three decoys as tiles. answered() gets
 *  whether it was built without a wrong tile. The caller clears the stage first. */
function forgeStep(
  stage: HTMLElement,
  e: any,
  allParts: { part: string; meaning: string }[],
  answered: (ok: boolean) => void,
  next: () => void,
  nextLabel = W.arena.next,
) {
  const need: string[] = e.parts.map((p: any) => p.part);
  const decoys = pick(
    allParts.filter((p) => !need.includes(p.part)),
    3,
  );
  const tiles = shuffle([...e.parts, ...decoys]);
  const chosen: string[] = [];
  const wrongly: { part: string; meaning: string }[] = [];
  let missed = false;
  const slot = h('div', { class: 'nslot' });
  const pool = h('div', { class: 'ntiles' });
  const reveal = () => {
    pool.remove();
    answered(!missed);
    stage.append(
      whyNote(...wrongly.slice(0, 3).map((p) => fill(W.tutor.notRoot, { part: p.part, meaning: p.meaning }))) ?? '',
      h('div', { class: 'nexplain' }, h('p', { class: 'nstatus' }, W.forge.status[e.status] ?? e.status), h('p', { lang: 'en' }, e.reading), talkRef(e.talk)),
      h('div', { class: 'nrow' }, h('button', { type: 'button', class: 'btn', onclick: next }, nextLabel)),
    );
  };
  tiles.forEach((p: any) =>
    pool.append(
      h(
        'button',
        {
          type: 'button',
          class: 'ntile ntile--root',
          onclick: (ev: Event) => {
            const t = ev.currentTarget as HTMLButtonElement;
            if (need.includes(p.part) && !chosen.includes(p.part)) {
              chosen.push(p.part);
              t.disabled = true;
              t.classList.add('is-used');
              slot.append(h('span', { class: 'ntile ntile--root ntile--still' }, greek(p.part), h('span', { class: 'ngloss', lang: 'en' }, p.meaning)));
              if (chosen.length === need.length) reveal();
            } else {
              missed = true;
              if (!need.includes(p.part) && !wrongly.some((w) => w.part === p.part)) wrongly.push(p);
              t.classList.remove('is-miss');
              void t.offsetWidth;
              t.classList.add('is-miss');
            }
          },
        },
        greek(p.part),
        h('span', { class: 'ngloss', lang: 'en' }, p.meaning),
      ),
    ),
  );
  stage.append(
    h('p', { class: 'nsmall' }, W.forge.prompt),
    greek(e.word, 'nbig'),
    e.translit ? h('p', { class: 'ntranslit', lang: 'grc-Latn' }, e.translit, unsure(e)) : unsure(e),
    slot,
    pool,
  );
}

async function forge(A: Arena) {
  const [items] = await Promise.all([feed<any[]>('etymologies'), feed('talks').then((t) => Object.assign(talkNames, t))]);
  const set = pick(items, 6);
  const allParts: { part: string; meaning: string }[] = items.flatMap((e: any) => e.parts);
  let i = 0;
  let right = 0;
  const show = () => {
    if (i >= set.length) return finish(A, 'forge', fill(W.forge.result, { r: right, n: set.length }));
    A.progress(i / set.length);
    A.score(`${right}`);
    A.stage.replaceChildren();
    forgeStep(
      A.stage,
      set[i],
      allParts,
      (ok) => {
        if (ok) right++;
        earn(ok ? 10 : 4);
      },
      () => (i++, show()),
      W.forge.next,
    );
  };
  show();
}

// Find the link (from the prototype's map game, moved into the play flow at the client's wish): she ties
// one idea to another and says why; given her reason, choose the idea at the other end
async function links(A: Arena) {
  const [list, concepts] = await Promise.all([feed<[string, string, string][]>('links'), feed<Concept[]>('concepts')]);
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const set = pick(list, 8);
  let i = 0;
  let found = 0;
  const name = (c: Concept) => (c.greek ? `${c.label} · ${c.greek}` : c.label);
  const show = () => {
    if (i >= set.length) return finish(A, 'links', fill(W.links.result, { r: found, n: set.length }));
    A.progress(i / set.length);
    A.score(`${found}`);
    const [a, b, why] = Math.random() < 0.5 ? set[i] : [set[i][1], set[i][0], set[i][2]];
    const from = byId.get(a)!;
    const to = byId.get(b)!;
    // three other ideas, none of them linked to the first by her
    const taken = new Set(list.filter((l) => l[0] === a || l[1] === a).flatMap((l) => [l[0], l[1]]));
    const decoys = pick(
      concepts.filter((c) => !taken.has(c.id) && c.weight >= 2),
      3,
    );
    A.stage.replaceChildren();
    choose(
      A.stage,
      h(
        'div',
        null,
        h('p', { class: 'nsmall' }, fill(W.links.ask, { label: from.label })),
        h('p', { class: 'nprompt nprompt--big', lang: 'en' }, `“${why}”`),
        h('p', { class: 'nsmall' }, W.links.choose),
      ),
      name(to),
      decoys.map(name),
      (ok) => {
        if (ok) {
          found++;
          earn(15);
        }
      },
      () => {
        i++;
        show();
      },
      h(
        'div',
        { class: 'nexplain' },
        h('p', { lang: 'en' }, h('a', { href: `${mapBase}?star=${encodeURIComponent(from.id)}` }, from.label), ' · ', h('a', { href: `${mapBase}?star=${encodeURIComponent(to.id)}` }, to.label)),
      ),
    );
  };
  show();
}

/** One of Athena's distinctions: a gloss, and the two Greek words as the arms of the letter Υ.
 *  answered() gets whether the right arm was chosen. The caller clears the stage first. */
function forkStep(stage: HTMLElement, d: any, answered: (ok: boolean) => void, next: () => void, nextLabel = W.arena.next) {
  const side = Math.random() < 0.5 ? 'a' : 'b';
  const gloss = side === 'a' ? d.a_gloss : d.b_gloss;
  const after = h('div');
  const go = (value: string, button: HTMLElement) => {
    stage.querySelectorAll<HTMLButtonElement>('.nfork__arm').forEach((b) => (b.disabled = true));
    const ok = value === side;
    button.classList.add(ok ? 'is-right' : 'is-wrong');
    button.prepend(mark(ok));
    answered(ok);
    const [right, wrong] = side === 'a' ? [d.a, d.b] : [d.b, d.a];
    after.replaceChildren(
      (!ok && whyNote(fill(W.tutor.otherSide, { gloss, right, wrong, other: side === 'a' ? d.b_gloss : d.a_gloss }))) || '',
      h(
        'div',
        { class: 'nexplain' },
        h('p', { lang: 'en' }, greek(d.a), ` ${d.a_gloss} · `, greek(d.b), ` ${d.b_gloss}`),
        d.point ? h('p', { lang: 'en' }, d.point) : null,
        talkRef(d.talk),
      ),
      h('div', { class: 'nrow' }, h('button', { type: 'button', class: 'btn', onclick: next }, nextLabel)),
    );
    (after.querySelector('.btn') as HTMLElement)?.focus({ preventScroll: true });
  };
  const y = h('div', { class: 'nfork__y', 'aria-hidden': 'true' });
  y.innerHTML = '<svg viewBox="0 0 200 90" preserveAspectRatio="none"><path d="M100 88V52C100 34 74 22 50 4M100 52C100 34 126 22 150 4"/></svg>';
  stage.append(
    h('p', { class: 'nsmall' }, W.fork.prompt),
    h('p', { class: 'nprompt nprompt--big nprompt--centre', lang: 'en' }, `“${gloss}”`, unsure(d)),
    h(
      'div',
      { class: 'nfork' },
      h('button', { type: 'button', class: 'nopt nfork__arm', onclick: (e: Event) => go('a', e.currentTarget as HTMLElement) }, greek(d.a)),
      h('button', { type: 'button', class: 'nopt nfork__arm', onclick: (e: Event) => go('b', e.currentTarget as HTMLElement) }, greek(d.b)),
      y,
    ),
    after,
  );
}

async function fork(A: Arena) {
  const [items] = await Promise.all([feed<any[]>('distinctions'), feed('talks').then((t) => Object.assign(talkNames, t))]);
  const set = pick(items, 8);
  let i = 0;
  let right = 0;
  const show = () => {
    if (i >= set.length) return finish(A, 'fork', fill(W.fork.result, { r: right, n: set.length }));
    A.progress(i / set.length);
    A.score(`${right}`);
    A.stage.replaceChildren();
    forkStep(
      A.stage,
      set[i],
      (ok) => {
        if (ok) {
          right++;
          earn(6);
        }
      },
      () => (i++, show()),
      W.fork.next,
    );
  };
  show();
}

async function threads(A: Arena, opt: { concept?: string } = {}) {
  const concepts = (await feed<Concept[]>('concepts')).filter((c) => c.take);
  const chosen = opt.concept ? concepts.find((c) => c.id === opt.concept) : undefined;
  const set = chosen ? [chosen] : pick(concepts.filter((c) => c.weight >= 3 && c.group !== 'thinkers'), 3);
  let i = 0;
  let kept = 0;
  const show = () => {
    if (i >= set.length) return finish(A, 'threads', fill(W.threads.result, { n: Object.keys(load().threads ?? {}).length }));
    A.progress(i / set.length);
    A.score(`${i + 1} / ${set.length}`);
    const c = set[i];
    const mine = load().threads?.[c.id] ?? '';
    const lead = h('p', { class: 'nsmall nthread__lead' }, W.threads.hint);
    const area = h('textarea', { class: 'nthread__text', rows: 3, 'aria-label': W.threads.prompt, lang: '' }) as HTMLTextAreaElement;
    area.value = mine;
    const nudges = h(
      'div',
      { class: 'nrow nrow--tight' },
      ...Object.values(W.threads.nudges as Record<string, { label: string; line: string }>).map((n) =>
        h('button', { type: 'button', class: 'nchip', onclick: () => ((lead.textContent = n.line), area.focus()) }, n.label),
      ),
    );
    const keep = h(
      'button',
      {
        type: 'button',
        class: 'btn',
        onclick: () => {
          const text = area.value.trim();
          if (!text) return area.focus();
          const p = load();
          const first = !p.threads?.[c.id];
          p.threads = { ...(p.threads ?? {}), [c.id]: text };
          save(p);
          if (first) earn(6);
          kept++;
          i++;
          show();
        },
      },
      W.threads.keep,
    );
    A.stage.replaceChildren(
      h(
        'div',
        { class: 'nthread__idea' },
        c.greek ? greek(c.greek, 'nthread__greek') : null,
        h('h3', { class: 'nsubject' }, c.label),
        h('p', { lang: 'en' }, clip(c.take, 260)),
        h('a', { class: 'nsmall', href: `${mapBase}?star=${encodeURIComponent(c.id)}` }, W.mapLink),
      ),
      h('label', { class: 'nprompt' }, W.threads.prompt),
      lead,
      nudges,
      area,
      h('div', { class: 'nrow' }, keep, h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => (i++, show()) }, W.threads.skip)),
    );
    area.focus({ preventScroll: true });
  };
  show();
  void kept;
}

async function askesis(A: Arena) {
  const [practices, questions] = await Promise.all([
    feed<any[]>('practices'),
    feed<any[]>('questions'),
    feed('talks').then((t) => Object.assign(talkNames, t)),
  ]);
  const day = today();
  const seed = [...day].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const p = practices[seed % practices.length];
  const q = questions[(seed * 7) % questions.length];
  const doneToday = load().best.askesis === Number(day.replaceAll('-', ''));
  A.score(day);
  A.progress(doneToday ? 1 : 0);
  const did = h(
    'button',
    {
      type: 'button',
      class: 'btn',
      disabled: doneToday,
      onclick: (e: Event) => {
        const b = e.currentTarget as HTMLButtonElement;
        const progress = load();
        progress.best.askesis = Number(day.replaceAll('-', ''));
        progress.done.askesis = (progress.done.askesis || 0) + 1;
        save(progress);
        earn(25);
        b.disabled = true;
        b.textContent = W.askesis.done;
        A.progress(1);
      },
    },
    doneToday ? W.askesis.done : W.askesis.did,
  );
  const all = () => {
    A.stage.replaceChildren(
      h('h3', { class: 'nsubject' }, W.askesis.allTitle),
      h(
        'div',
        { class: 'nall' },
        ...practices.map((x) =>
          h(
            'details',
            { class: 'nall__item' },
            h('summary', { lang: 'en' }, x.title),
            h('ul', { class: 'nsteps', lang: 'en' }, ...(x.steps ?? []).map((s: string) => h('li', null, s))),
            x.why ? h('p', { class: 'nsmall', lang: 'en' }, x.why) : null,
          ),
        ),
      ),
    );
  };
  A.stage.replaceChildren(
    h('p', { class: 'nsmall' }, W.askesis.today),
    h('h3', { class: 'nsubject', lang: 'en' }, p.title, unsure(p)),
    h('ul', { class: 'nsteps', lang: 'en' }, ...(p.steps ?? []).map((s: string) => h('li', null, s))),
    p.why ? h('div', { class: 'nexplain' }, h('p', { lang: 'en' }, p.why), talkRef(p.talk)) : null,
    q
      ? h('div', { class: 'ncarry' }, h('p', { class: 'nsmall' }, W.askesis.carry), h('p', { class: 'ncarry__q', lang: 'en' }, q.q), talkRef(q.talk))
      : null,
    h('div', { class: 'nrow' }, did, h('button', { type: 'button', class: 'btn btn--ghost', onclick: all }, W.askesis.all)),
  );
}

const ACTIVITIES: Record<string, { run: (A: Arena, opt?: any) => Promise<void>; section: string }> = {
  cards: { run: cards, section: 'remember' },
  match: { run: match, section: 'remember' },
  quiz: { run: quiz, section: 'remember' },
  tf: { run: lightning, section: 'remember' },
  ladder: { run: ladders, section: 'understand' },
  myth: { run: mythDecoder, section: 'understand' },
  forge: { run: forge, section: 'understand' },
  fork: { run: fork, section: 'understand' },
  links: { run: links, section: 'understand' },
  threads: { run: threads, section: 'own' },
  askesis: { run: askesis, section: 'own' },
};

async function start(id: string, opt: any = {}) {
  const act = ACTIVITIES[id];
  if (!act) return;
  const A = openArena(W.acts[id].name, W.sections[act.section].title);
  A.stage.replaceChildren(h('p', { class: 'nsmall' }, '…'));
  try {
    await act.run(A, opt);
  } catch {
    A.stage.replaceChildren(h('p', null, W.failed));
  }
}

// ---------- the path: everything, in the order of her talks (src/lib/nostos-path.ts) ----------
type Step = Record<string, any> & { k: string };
type Chapter = { id: string; title: string; talk?: string; stage?: string; scene?: string; names?: { en: string; el: string }; lessons: string[][] };
let outline: Chapter[] = [];
const chapterOf = new Map<string, number>();
const pageLang = () => (document.documentElement.lang.startsWith('en') ? 'en' : 'el');
const chapterName = (ci: number) =>
  outline[ci].names?.[pageLang()] ?? (outline[ci].stage ? W.path.stages?.[outline[ci].stage!] ?? outline[ci].stage : outline[ci].title || W.path.across);
/** "The Cave and the Light · Chapter 2 of 4" with stages; "The path · Chapter 3 of 27" without */
const chapterPlace = (ci: number) => {
  const st = outline[ci].stage;
  if (!st || !outline.some((c) => c.names)) return `${W.path.title} · ${fill(W.path.chapter, { i: ci + 1, n: outline.length })}`;
  const same = outline.filter((c) => c.stage === st);
  return `${W.path.stages?.[st] ?? st} · ${fill(W.path.chapter, { i: same.indexOf(outline[ci]) + 1, n: same.length })}`;
};
const met = (p: Progress, u: string) => p.path?.[u] !== undefined;
const lessonDone = (p: Progress, lesson: string[]) => lesson.every((u) => met(p, u));
/** the first lesson with a step not met yet */
/** Where the visitor is: the first lesson not yet walked from the one they last began (they may have
 *  started a chapter out of order, from its card: client direction, 6 November 2026), else from the
 *  furthest they have begun, else the first not walked anywhere */
function here(p: Progress) {
  const all = outline.flatMap((c, ci) => c.lessons.map((lesson, li) => ({ ci, li, lesson })));
  const open = (x: (typeof all)[number]) => !lessonDone(p, x.lesson);
  let from = p.at && outline[p.at[0]]?.lessons[p.at[1]] ? all.findIndex((x) => x.ci === p.at![0] && x.li === p.at![1]) : -1;
  if (from < 0) all.forEach((x, k) => x.lesson.some((u) => met(p, u)) && (from = k));
  const next = all.slice(Math.max(0, from)).find(open) ?? all.find(open);
  return next ? { ci: next.ci, li: next.li } : null;
}
/** the steps due in Review: the least remembered and the longest waiting first */
const dueList = (p: Progress) =>
  Object.entries(p.path ?? {})
    .filter((e): e is [string, [number, string]] => Array.isArray(e[1]) && e[1][1] <= today())
    .sort((a, b) => a[1][0] - b[1][0] || a[1][1].localeCompare(b[1][1]))
    .map(([u]) => u);

/** What a set of steps needs: their chapters' files, the ideas, and the material for decoys */
async function stepsFor(ids: string[]) {
  const wanted = [...new Set(ids.map((u) => chapterOf.get(u)).filter((ci) => ci !== undefined))] as number[];
  const [concepts, parts, ety, , pictures, reasons] = await Promise.all([
    feed<Concept[]>('concepts'),
    Promise.all(wanted.map((ci) => feed<Record<string, Step>>(`path-${outline[ci].id}`))),
    feed<any[]>('etymologies'),
    feed('talks').then((t) => Object.assign(talkNames, t)),
    feed<Record<string, Picture>>('art').catch(() => ({}) as Record<string, Picture>),
    feed<Record<string, Record<string, string>>>('whynot').catch(() => ({}) as Record<string, Record<string, string>>),
  ]);
  const all: Record<string, Step> = Object.assign({}, ...parts);
  const ideas = new Map(concepts.map((c) => [c.id, c]));
  const list = Object.values(all);
  return {
    concepts,
    idea: (id: string) => ideas.get(id),
    picture: (id: string) => pictures[id] as Picture | undefined,
    /** why a quiz's wrong option is wrong, as written for it (src/data/nostos-whynot.json) */
    whyNot: (q: string, option: string) => reasons[q]?.[option] ?? null,
    step: (u: string): Step | undefined => (u.startsWith('c') ? (ideas.has(u.slice(1)) ? { k: 'c', concept: ideas.get(u.slice(1)) } : undefined) : all[u]),
    images: list.filter((x) => x.k === 'i').map((x) => x.meaning as string),
    imageOf: new Map(list.filter((x) => x.k === 'i').map((x) => [x.meaning as string, x.image as string])),
    readings: list.filter((x) => x.k === 'm').flatMap((x) => x.beats.map((b: any) => b.reading as string)),
    parts: ety.flatMap((e: any) => e.parts) as { part: string; meaning: string }[],
  };
}
type Material = Awaited<ReturnType<typeof stepsFor>>;
type Picture = { src: string; w: number; h: number; en: string; el: string; page: string; credit: { text: string; licenceUrl?: string } | null };
/** A picture of the art Athena refers to (src/lib/nostos-art.ts): its caption links to its page, and
 *  the credit follows where the licence asks for one */
function picture(p?: Picture) {
  if (!p) return null;
  const caption = document.documentElement.lang.startsWith('en') ? p.en : p.el;
  const img = h('img', { src: p.src, width: p.w, height: p.h, alt: caption, loading: 'lazy', decoding: 'async' });
  return h(
    'figure',
    { class: 'nart' },
    img,
    h(
      'figcaption',
      null,
      h('a', { href: p.page, target: '_blank', rel: 'noopener' }, caption),
      p.credit ? h('span', { class: 'nart__credit' }, ' · ', p.credit.licenceUrl ? h('a', { href: p.credit.licenceUrl, target: '_blank', rel: 'noopener' }, p.credit.text) : p.credit.text) : null,
    ),
  );
}

/** An idea's mark on the map (its theme's star shape, in its colour), drawn from the page's symbols */
function starMark(group: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'nstarmark');
  svg.setAttribute('viewBox', '-1.5 -1.5 3 3');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#nsh-${group}`);
  svg.append(use);
  return svg;
}

/** One step, to learn (first time on the path) or to recall (Review). Reading steps call answered(null)
 *  when the visitor moves on; the rest call answered(right or not) when they answer. */
function ask(stage: HTMLElement, s: Step, mode: 'learn' | 'recall', M: Material, answered: (ok: boolean | null) => void, next: () => void) {
  // what kind of step it is; a new idea's in a pill of its own, the others quietly (client direction)
  const head = h('p', { class: `nsmall nkind${s.k === 'c' && mode === 'learn' ? ' nkind--pill' : ''}` }, W.path.kinds[s.k] ?? '');
  const go = (ok: boolean | null) => {
    const button = h('button', { type: 'button', class: 'btn', onclick: () => (answered(ok), next()) }, W.arena.next);
    return h('div', { class: 'nrow' }, button);
  };
  const read = (...body: Child[]) => {
    stage.append(head, ...(body.filter(Boolean) as (Node | string)[]), go(null));
    (stage.querySelector('.nrow .btn') as HTMLElement)?.focus({ preventScroll: true });
  };
  const from = talkRef(s.talk, s.t);
  switch (s.k) {
    case 'c': {
      const c: Concept = s.concept;
      if (mode === 'learn') {
        // a new idea: the map shows where it sits
        if (pageMode) showMap(c.id);
        stage.append(
          head,
          h(
            'div',
            { class: 'nidea' },
            c.greek ? greek(c.greek, 'nbig') : null,
            c.translit ? h('p', { class: 'ntranslit', lang: 'grc-Latn' }, c.translit) : null,
            h('h3', { class: 'nsubject', lang: 'en' }, c.label),
            h('p', { class: 'nsmall' }, W.groups[c.group] ?? ''),
            picture(M.picture(c.id)),
            h('p', { class: 'nidea__take', lang: 'en' }, c.take),
          ),
          go(true),
        );
        return (stage.querySelector('.nrow .btn') as HTMLElement)?.focus({ preventScroll: true });
      }
      const near = M.concepts.filter((x) => x.id !== c.id && x.take);
      const same = near.filter((x) => x.group === c.group);
      const chosen = pick(same.length >= 2 ? same : near, 2);
      const owner = new Map(chosen.map((x) => [clip(x.take, 200), x.label]));
      return choose(
        stage,
        h('div', null, head, c.greek ? greek(c.greek, 'nbig') : null, h('h3', { class: 'nsubject', lang: 'en' }, c.label), h('p', { class: 'nsmall' }, W.path.meaning)),
        clip(c.take, 200),
        [...owner.keys()],
        answered,
        next,
        null,
        (text) => (owner.has(text) ? fill(W.tutor.otherIdea, { label: owner.get(text)! }) : null),
      );
    }
    case 'q':
      return choose(
        stage,
        h('div', null, head, h('p', { class: 'nprompt', lang: 'en' }, s.q, unsure(s))),
        s.a,
        (s.wrong ?? []).slice(0, 3),
        answered,
        next,
        h('div', { class: 'nexplain' }, s.explain ? h('p', { lang: 'en' }, s.explain) : null, from),
        (text) => M.whyNot(s.q, text) ?? (hasKey() ? explainWrong(feedBase, s.q, s.a, text, s.explain ?? '') : null),
      );
    case 'tf': {
      const after = h('div');
      const pickSide = (value: boolean, button: HTMLElement) => {
        stage.querySelectorAll<HTMLButtonElement>('.nopt').forEach((b) => (b.disabled = true));
        const ok = value === s.true;
        button.classList.add(ok ? 'is-right' : 'is-wrong');
        button.prepend(mark(ok));
        answered(ok);
        after.replaceChildren(
          (!ok && whyNote(s.true ? W.tutor.tfTrue : W.tutor.tfFalse)) || '',
          h('div', { class: 'nexplain' }, s.explain ? h('p', { lang: 'en' }, s.explain) : null, from),
          h('div', { class: 'nrow' }, h('button', { type: 'button', class: 'btn', onclick: next }, W.arena.next)),
        );
        (after.querySelector('.btn') as HTMLElement)?.focus({ preventScroll: true });
      };
      return stage.append(
        head,
        h('p', { class: 'nprompt nprompt--big', lang: 'en' }, s.s, unsure(s)),
        h(
          'div',
          { class: 'ntwo' },
          h('button', { type: 'button', class: 'nopt nopt--two', onclick: (e: Event) => pickSide(true, e.currentTarget as HTMLElement) }, greek('ἀληθές'), h('span', null, W.tf.yes)),
          h('button', { type: 'button', class: 'nopt nopt--two', onclick: (e: Event) => pickSide(false, e.currentTarget as HTMLElement) }, greek('ψευδές'), h('span', null, W.tf.no)),
        ),
        after,
      );
    }
    case 's':
      return ladderStep(stage, s, answered, next);
    case 'e':
      return forgeStep(stage, s, M.parts, answered, next);
    case 'd':
      if (!s.read) return forkStep(stage, s, answered, next);
      return read(
        h('p', { class: 'nprompt', lang: 'en' }, greek(s.a), ` ${s.a_gloss ?? ''} · `, greek(s.b), ` ${s.b_gloss ?? ''}`),
        s.point ? h('div', { class: 'nexplain' }, h('p', { lang: 'en' }, s.point), from) : from,
      );
    case 'i': {
      const others = pick(
        M.images.filter((x) => x !== s.meaning),
        2,
      );
      if (others.length < 2) return read(h('p', { class: 'nprompt nprompt--big', lang: 'en' }, s.image), h('div', { class: 'nexplain' }, h('p', { lang: 'en' }, s.meaning), from));
      return choose(stage, h('div', null, head, h('p', { class: 'nprompt nprompt--big', lang: 'en' }, s.image, unsure(s))), s.meaning, others, answered, next, from, (text) =>
        M.imageOf.has(text) ? fill(W.tutor.otherImage, { image: M.imageOf.get(text)! }) : null,
      );
    }
    case 'm': {
      const beats: { beat: string; reading: string }[] = s.beats;
      // to learn: the whole story, moment by moment; to recall: one moment of it
      const order = mode === 'learn' ? beats.map((_, k) => k) : [Math.floor(Math.random() * beats.length)];
      let b = 0;
      let right = 0;
      const beat = () => {
        const k = order[b];
        const bt = beats[k];
        const others = pick(
          M.readings.filter((r) => r !== bt.reading),
          2,
        ).map((r) => clip(r, 220));
        stage.replaceChildren();
        const prompt = h(
          'div',
          null,
          head,
          h('p', { class: 'nsmall' }, `${s.title} · ${fill(W.myth.beat, { i: k + 1, n: beats.length })}`, unsure(s)),
          h('p', { class: 'nprompt nprompt--big', lang: 'en' }, bt.beat),
        );
        const onward = () => {
          b++;
          if (b < order.length) return beat();
          answered(right * 2 >= order.length);
          next();
        };
        if (others.length < 2) {
          stage.append(prompt, h('div', { class: 'nexplain' }, h('p', { lang: 'en' }, bt.reading)));
          right++;
          return stage.append(h('div', { class: 'nrow' }, h('button', { type: 'button', class: 'btn', onclick: onward }, W.arena.next)));
        }
        prompt.append(h('p', { class: 'nsmall' }, W.myth.ask));
        choose(stage, prompt, clip(bt.reading, 220), others, (ok) => ok && right++, onward, b === order.length - 1 ? from : null);
      };
      return beat();
    }
    case 'k': {
      // A connection (src/lib/nostos-path.ts): one of Athena's links, met the moment its second idea is
      // known. First time (and every other time in Review): both ideas side by side, and "how does
      // Athena connect them?", her reason among three others, every name blanked so the link itself is
      // what is asked. Otherwise: given the idea just met and her reason (the other name blanked),
      // which idea is at the other end?
      const fresh = M.idea(s.a);
      const known = M.idea(s.b);
      if (!fresh || !known) return read(h('p', { class: 'nprompt', lang: 'en' }, `“${s.why}”`));
      // (no map beside a connection: each card carries its idea's mark from the map instead)
      const name = (c: Concept) => (c.greek ? `${c.label} · ${c.greek}` : c.label);
      const answer = h('div', { class: 'nexplain' }, h('p', { lang: 'en' }, `“${s.why}”`), h('p', { lang: 'en' }, `${fresh.label} · ${known.label}`));
      const alts = ((s.alts ?? []) as string[]).filter((x) => x !== s.bare);
      const altOf = new Map(((s.alts ?? []) as string[]).map((x, k) => [x, (s.altsOf ?? [])[k] as [string, string] | undefined]));
      const whyLink: WhyNot = (text) => {
        const pair = altOf.get(text);
        const [a, b] = pair ? [M.idea(pair[0]), M.idea(pair[1])] : [];
        return a && b ? fill(W.tutor.otherLink, { a: a.label, b: b.label }) : null;
      };
      const others = pick((s.not as string[]).map(M.idea).filter((c): c is Concept => !!c), 3);
      const how = alts.length >= 2 && (mode === 'learn' || Math.random() < 0.5 || others.length < 3);
      if (how) {
        // (an idea passed over by skipping ahead is assumed known; its meaning is given in a line)
        const unmet = (c: Concept) => !isNew(c) && !met(load(), `c${c.id}`);
        const isNew = (c: Concept) => c === fresh;
        const side = (c: Concept, fresh: boolean) =>
          h(
            'span',
            { class: `nconnect__idea${fresh ? ' is-new' : ''}`, 'data-g': c.group },
            starMark(c.group),
            c.greek ? h('span', { class: 'ng nconnect__greek', lang: 'grc' }, c.greek) : null,
            h('span', { class: 'nconnect__label', lang: 'en' }, c.label),
            unmet(c) ? h('span', { class: 'nconnect__take', lang: 'en' }, clip(c.take, 130)) : null,
          );
        return choose(
          stage,
          h(
            'div',
            null,
            head,
            h('div', { class: 'nconnect' }, side(fresh, true), h('span', { class: 'nconnect__line', 'aria-hidden': 'true' }), side(known, false)),
          ),
          s.bare,
          alts.slice(0, 3),
          answered,
          next,
          answer,
          whyLink,
        );
      }
      if (others.length < 3) return read(h('p', { class: 'nprompt', lang: 'en' }, `“${s.why}”`), answer);
      return choose(
        stage,
        h(
          'div',
          null,
          head,
          h('p', { class: 'nsmall' }, fill(W.links.ask, { label: fresh.label })),
          h('p', { class: 'nprompt nprompt--big', lang: 'en' }, `“${s.ask}”`),
          h('p', { class: 'nsmall' }, W.links.choose),
        ),
        name(known),
        others.map(name),
        answered,
        next,
        answer,
        (text) => {
          const c = others.find((x) => name(x) === text);
          return c ? fill(W.tutor.otherEnd, { label: c.label, take: clip(c.take, 160) }) : null;
        },
      );
    }
    case 'p':
      return read(
        h('h3', { class: 'nsubject', lang: 'en' }, s.title, unsure(s)),
        h('ul', { class: 'nsteps', lang: 'en' }, ...(s.steps ?? []).map((x: string) => h('li', null, x))),
        s.why ? h('div', { class: 'nexplain' }, h('p', { lang: 'en' }, s.why), from) : from,
      );
    case 'w':
      // with the visitor's API key, a question to carry is answered in writing and marked
      if (pageMode && hasKey())
        return written(
          stage,
          head,
          s.q,
          `A reflective question Athena asks her students to carry${s.why ? ` (${s.why})` : ''}. There is no single right answer: judge how deeply and honestly the student engages, and how well it fits Athena's teaching.`,
          (verdict) => (writtenPoints(verdict), answered(null)),
          next,
        );
      return read(h('p', { class: 'ncarry__q', lang: 'en' }, s.q, unsure(s)), from);
    case 'l':
      return read(h('blockquote', { class: 'hand hand--m nline', lang: 'en' }, s.text), from);
    case 'x':
      return read(
        h('p', { class: 'nsmall', lang: 'en' }, [s.author, s.work, s.ref].filter(Boolean).join(' · ')),
        s.label ? h('h3', { class: 'nsubject', lang: 'en' }, s.label) : null,
        h('blockquote', { class: 'npass', lang: 'en' }, s.translation),
        s.translator ? h('p', { class: 'nsmall', lang: 'en' }, s.translator) : null,
        s.reading ? h('div', { class: 'nexplain' }, h('p', { class: 'hand hand--m nline', lang: 'en' }, s.reading), from) : from,
      );
    default:
      return read();
  }
}

/** The first time a step is met on the path: read steps are kept as met, the rest go into Review */
/** Tell the tutor what was just answered (src/scripts/nostos-tutor.ts): the step as on screen, the choice */
function logAnswer(kind: string, ok: boolean | null) {
  const stage = document.querySelector<HTMLElement>('.narena__stage');
  if (ok === null || !stage) return;
  const chosen = stage.querySelector(ok ? '.nopt.is-right .nopt__text' : '.nopt.is-wrong .nopt__text')?.textContent ?? undefined;
  noteAnswer({ kind: W.path.kinds?.[kind] ?? kind, prompt: stage.innerText.replace(/\n+/g, ' · '), chosen, ok });
}

/** A written answer, marked by the tutor against Athena's teaching (only with the visitor's API key) */
function written(stage: HTMLElement, head: Node, question: string, reference: string, done: (verdict: string | null) => void, next: () => void) {
  const T = W.tutor.own;
  const box = h('textarea', { class: 'nwrite', rows: 5, placeholder: T.placeholder, 'aria-label': question }) as HTMLTextAreaElement;
  const check = h('button', { type: 'button', class: 'btn' }, T.check) as HTMLButtonElement;
  const skip = h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => (done(null), next()) }, T.skip);
  const out = h('div', { class: 'nfeedback', 'aria-live': 'polite' });
  const row = h('div', { class: 'nrow' }, check, skip);
  check.addEventListener('click', async () => {
    const answer = box.value.trim();
    if (answer.length < 3) return box.focus();
    check.disabled = true;
    box.readOnly = true;
    out.replaceChildren(h('p', { class: 'nsmall' }, T.checking));
    try {
      const marked = await markAnswer(feedBase, question, reference, answer);
      out.replaceChildren(
        h('p', { class: `nfeedback__verdict is-${marked.verdict}` }, T.verdicts[marked.verdict] ?? ''),
        h('p', null, marked.feedback),
        marked.missing ? h('p', { class: 'nsmall' }, `${T.missed}: ${marked.missing}`) : null,
      );
      noteAnswer({ kind: T.kind, prompt: question, chosen: answer.slice(0, 300), verdict: marked.verdict });
      done(marked.verdict);
    } catch {
      // the answer stays, to try again (or skip)
      out.replaceChildren(h('p', { class: 'nsmall' }, W.tutor.error));
      check.disabled = false;
      box.readOnly = false;
      return;
    }
    const go = h('button', { type: 'button', class: 'btn', onclick: next }, W.arena.next);
    row.replaceChildren(go);
    go.focus({ preventScroll: true });
  });
  stage.append(head, h('p', { class: 'nprompt' }, question), box, out, row);
  box.focus({ preventScroll: true });
}
const writtenPoints = (verdict: string | null) => verdict && earn(verdict === 'close' ? 8 : verdict === 'partly' ? 4 : 2);

function meet(u: string, kind: string, ok: boolean | null) {
  const p = load();
  if (met(p, u)) return;
  logAnswer(kind, ok);
  p.path = { ...(p.path ?? {}), [u]: ok === null ? 1 : ok ? [1, addDays(INTERVALS[1])] : [0, today()] };
  save(p);
  earn(ok === null ? 2 : kind === 'c' ? 5 : ok ? 8 : 0);
}

async function walk(ci: number, li: number) {
  const chapter = outline[ci];
  const ids = chapter.lessons[li];
  // the address names the lesson, so a reload comes back to it; Continue goes on from here
  if (pageMode) history.replaceState(history.state, '', `${pathHref}?c=${ci}&l=${li}`);
  const p0 = load();
  if (p0.at?.[0] !== ci || p0.at?.[1] !== li) save({ ...p0, at: [ci, li] });
  const A = openArena(chapterName(ci), chapterPlace(ci));
  A.stage.replaceChildren(h('p', { class: 'nsmall' }, '…'));
  try {
    const M = await stepsFor(ids);
    const fresh = !lessonDone(load(), ids);
    let i = fresh ? ids.findIndex((u) => !met(load(), u)) : 0;
    let wrote = false;
    // with the visitor's API key, a new lesson ends with one question in their own words: the
    // lesson's weightiest new idea, or else one of its connections
    const ownWords = () => {
      const ideas = ids.filter((u) => u.startsWith('c')).map((u) => M.idea(u.slice(1))).filter((c): c is Concept => !!c);
      const idea = ideas.sort((a, b) => b.weight - a.weight)[0];
      if (idea) return { question: fill(W.tutor.own.idea, { label: idea.label }), reference: idea.take };
      const link = ids.map((u) => M.step(u)).find((st) => st?.k === 'k');
      const [a, b] = [M.idea(link?.a), M.idea(link?.b)];
      return link && a && b ? { question: fill(W.tutor.own.link, { a: a.label, b: b.label }), reference: link.why } : null;
    };
    const show = () => {
      if (i >= ids.length) {
        const own = fresh && pageMode && !wrote && hasKey() ? ownWords() : null;
        if (!own) return walked(A, ci, li, fresh, M);
        wrote = true;
        hideMap();
        A.progress(1);
        A.stage.replaceChildren();
        return written(A.stage, h('p', { class: 'nsmall nkind' }, W.tutor.own.kind), own.question, own.reference, writtenPoints, () =>
          walked(A, ci, li, fresh, M),
        );
      }
      A.progress(i / ids.length);
      A.score(fill(W.path.lesson, { i: li + 1, n: chapter.lessons.length }));
      const u = ids[i];
      const s = M.step(u);
      const onward = () => {
        i++;
        show();
      };
      if (!s) return meet(u, '', null), onward();
      hideMap();
      A.stage.replaceChildren();
      ask(A.stage, s, 'learn', M, (ok) => meet(u, s.k, ok), onward);
    };
    show();
  } catch {
    A.stage.replaceChildren(h('p', null, W.failed));
  }
}

function walked(A: Arena, ci: number, li: number, fresh: boolean, M?: Material) {
  A.progress(1);
  if (fresh) earn(10);
  const chapter = outline[ci];
  const last = li === chapter.lessons.length - 1;
  const at = here(load());
  if (pageMode) return telos(ci, li, at, M);
  A.stage.replaceChildren(
    h(
      'div',
      { class: 'nend' },
      greek(W.arena.end, 'nend__word'),
      h('p', { class: 'nend__msg' }, fill(W.path.lessonDone, { i: li + 1, n: chapter.lessons.length })),
      last ? h('p', { class: 'nend__msg', lang: 'en' }, fill(W.path.chapterDone, { title: chapterName(ci) })) : null,
      last && chapter.talk ? h('p', null, h('a', { href: youtube(chapter.talk), target: '_blank', rel: 'noopener' }, W.path.watch)) : null,
      at ? null : h('p', { class: 'nend__msg' }, W.path.doneAll),
    ),
    h(
      'div',
      { class: 'nrow nrow--centre' },
      at ? h('button', { type: 'button', class: 'btn', onclick: () => walk(at.ci, at.li) }, W.path.next) : null,
      h('button', { type: 'button', class: 'btn btn--ghost', onclick: leave }, W.path.back),
    ),
  );
  (A.stage.querySelector('.btn') as HTMLElement)?.focus();
}

/** The end of a lesson on the path page: a screen of its own over the lesson (client direction) */
function telos(ci: number, li: number, at: { ci: number; li: number } | null, M?: Material) {
  hideMap();
  const p = load();
  const chapter = outline[ci];
  const last = li === chapter.lessons.length - 1;
  // the ideas met in this lesson, by their Greek where they have it
  const ideas = chapter.lessons[li]
    .filter((u) => u.startsWith('c'))
    .map((u) => M?.idea(u.slice(1)))
    .filter((c): c is Concept => !!c);
  const close = (then: () => void) => {
    screen.classList.add('is-leaving');
    window.setTimeout(() => {
      screen.remove();
      then();
    }, 450);
  };
  // the stage's own symbol, at the head (client direction)
  const art = h('span', { class: 'ntelos__art', 'aria-hidden': 'true' });
  const tpl = document.querySelector<HTMLTemplateElement>(`template[data-stage-art="${chapter.stage ?? ''}"]`);
  if (tpl) art.append(tpl.content.cloneNode(true));
  const stones = h(
    'ol',
    { class: 'ntelos__stones', 'aria-hidden': 'true' },
    ...chapter.lessons.map((lesson, k) => h('li', { class: lessonDone(p, lesson) ? 'is-done' : k === li ? 'is-done' : '' })),
  );
  const screen = h(
    'div',
    { class: 'ntelos', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'ntelos-word' },
    h(
      'div',
      { class: 'ntelos__in' },
      art,
      h('p', { class: 'ntelos__place', id: 'ntelos-word' }, fill(W.path.lessonDone, { i: li + 1, n: chapter.lessons.length })),
      greek(W.arena.end, 'ntelos__word'),
      stones,
      ideas.length
        ? h(
            'ul',
            { class: 'ntelos__ideas' },
            ...ideas.map((c) => h('li', null, c.greek ? greek(c.greek) : null, h('span', { lang: 'en' }, c.label))),
          )
        : null,
      at ? null : h('p', { class: 'ntelos__msg' }, W.path.doneAll),
      h(
        'div',
        { class: 'ntelos__ways' },
        at ? h('button', { type: 'button', class: 'btn', onclick: () => close(() => walk(at.ci, at.li)) }, W.path.next) : null,
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => close(leave) }, W.path.back),
      ),
    ),
  );
  document.body.append(screen);
  requestAnimationFrame(() => requestAnimationFrame(() => screen.classList.add('is-on')));
  playSound('/audio/arrive.mp3', 0.04);
  (screen.querySelector('.btn') as HTMLElement)?.focus({ preventScroll: true });
}

// ---------- Review: what the path has covered, a little before it would be forgotten ----------
async function review() {
  const A = openArena(W.review.title, W.path.title);
  A.stage.replaceChildren(h('p', { class: 'nsmall' }, '…'));
  // the end of a round: its result, and the way back to Learn (never on into a lesson: client
  // direction, 6 November 2026)
  const end = (message: string) => {
    A.progress(1);
    A.stage.replaceChildren(
      h('div', { class: 'nend' }, greek(W.arena.end, 'nend__word'), h('p', { class: 'nend__msg' }, message)),
      h('div', { class: 'nrow nrow--centre' }, h('button', { type: 'button', class: 'btn', onclick: leave }, W.path.back)),
    );
    (A.stage.querySelector('.btn') as HTMLElement)?.focus();
  };
  try {
    const due = dueList(load()).slice(0, 12);
    if (!due.length) return end(`${W.review.none} ${W.review.empty}`);
    const M = await stepsFor(due);
    const queue = due.filter((u) => M.step(u));
    const n = queue.length;
    const again = new Set<string>();
    let i = 0;
    let right = 0;
    const show = () => {
      if (i >= queue.length) return end(fill(W.review.result, { r: right, n }));
      A.progress(i / queue.length);
      A.score(`${right} · ${Math.min(i + 1, n)} / ${n}`);
      const u = queue[i];
      hideMap();
      A.stage.replaceChildren();
      ask(
        A.stage,
        M.step(u)!,
        'recall',
        M,
        (ok) => {
          logAnswer(M.step(u)!.k, ok);
          const p = load();
          const was = p.path?.[u];
          const box = Array.isArray(was) ? was[0] : 0;
          const up = Math.min(5, box + 1);
          p.path = { ...(p.path ?? {}), [u]: ok ? [up, addDays(INTERVALS[up])] : [0, addDays(1)] };
          save(p);
          if (ok && !again.has(u)) {
            right++;
            earn(5);
          }
          // a slip comes back once more before the end of the round
          if (!ok && !again.has(u)) {
            again.add(u);
            queue.push(u);
          }
        },
        () => {
          i++;
          show();
        },
      );
    };
    show();
  } catch {
    A.stage.replaceChildren(h('p', null, W.failed));
  }
}

// ---------- the page around the activities ----------
function refresh(root: HTMLElement) {
  const p = load();
  // under each activity: how often it was played, and the best scores
  root.querySelectorAll<HTMLElement>('[data-act]').forEach((button) => {
    const id = button.dataset.act!;
    const extra = button.querySelector<HTMLElement>('[data-played]');
    if (extra) {
      const n = p.done[id] || 0;
      extra.textContent = n === 0 ? '' : n === 1 ? W.playedOnce : fill(W.played, { n });
    }
    const count = button.querySelector<HTMLElement>('[data-count]');
    if (!count) return;
    if (id === 'match') count.textContent = p.best.match ? fill(W.acts.match.count, { n: p.best.match }) : W.acts.match.none;
    if (id === 'tf') count.textContent = p.best.tf ? fill(W.acts.tf.count, { n: p.best.tf }) : W.acts.tf.none;
    if (id === 'threads') count.textContent = fill(W.acts.threads.count, { n: Object.keys(p.threads ?? {}).length });
  });
  // the ascent's line: how much of the path is walked
  if (outline.length) {
    const all = outline.reduce((n, c) => n + c.lessons.length, 0);
    const walkedN = outline.reduce((n, c) => n + c.lessons.filter((l) => lessonDone(p, l)).length, 0);
    const line = root.querySelector<HTMLElement>('[data-path-line]');
    if (line) line.textContent = here(p) ? fill(W.path.overall, { done: walkedN, n: all }) : W.path.doneAll;
  }
  // the journey (Learn page): every lesson a stone, walked, current or still ahead; each chapter's count
  if (outline.length) {
    const at = here(p);
    root.querySelectorAll<HTMLButtonElement>('[data-node]').forEach((stone) => {
      const ci = Number(stone.dataset.c);
      const li = Number(stone.dataset.l);
      const done = lessonDone(p, outline[ci].lessons[li]);
      const now = !!at && at.ci === ci && at.li === li;
      stone.classList.toggle('is-done', done);
      stone.classList.toggle('is-here', now);
      // only the stone you are on and those walked can be chosen; any other chapter is begun from its card
      stone.disabled = !done && !now;
      if (now) stone.setAttribute('aria-current', 'step');
      else stone.removeAttribute('aria-current');
      const go = stone.querySelector<HTMLElement>('[data-node-go]');
      if (go) {
        go.textContent = now ? (Object.keys(p.path ?? {}).length ? W.path.go : W.path.begin) : '';
        // beside the stone, on the side the trail leaves free
        const x = parseFloat(stone.parentElement?.style.getPropertyValue('--x') || '0');
        go.dataset.side = x > 0.15 ? 'left' : 'right';
      }
    });
    root.querySelectorAll<HTMLElement>('[data-ch]').forEach((section) => {
      const c = outline[Number(section.dataset.ch)];
      // a chapter not yet begun and further on than where you are: it can be skipped to, from its card
      const ci = Number(section.dataset.ch);
      const skip = section.querySelector<HTMLElement>('[data-skip-ch]');
      // every chapter but the one you are in, and not yet walked to its end, can be begun from its card
      if (skip) skip.hidden = !at || at.ci === ci || c.lessons.every((l) => lessonDone(p, l));
      const walked = c.lessons.filter((l) => lessonDone(p, l)).length;
      section.querySelector<HTMLElement>('[data-ch-fill]')?.style.setProperty('--f', String(walked / c.lessons.length));
      const count = section.querySelector<HTMLElement>('[data-ch-count]');
      // (nothing said while none is walked: the empty bar says it)
      if (count) count.textContent = walked ? fill(W.path.overall, { done: walked, n: c.lessons.length }) : '';
    });
  }
  // the pinned button: Begin, then Continue; gone once everything is walked
  const goButton = root.querySelector<HTMLElement>('[data-path-go]');
  if (goButton) {
    goButton.hidden = !here(p);
    const label = goButton.querySelector('[data-path-go-label]');
    if (label) label.textContent = Object.keys(p.path ?? {}).length ? W.path.go : W.path.begin;
  }
  // the rail: a stage whose lessons are all walked is marked
  root.querySelectorAll<HTMLElement>('[data-rail]').forEach((m) => {
    const of = outline.filter((c) => c.stage === m.dataset.rail);
    m.classList.toggle('is-done', of.length > 0 && of.every((c) => c.lessons.every((l) => lessonDone(p, l))));
  });
  const due = dueList(p).length;
  const badge = root.querySelector<HTMLElement>('[data-review-badge]');
  if (badge) {
    badge.hidden = !due;
    badge.textContent = String(due);
  }
  const reviewLine = root.querySelector<HTMLElement>('[data-review-line]');
  if (reviewLine) reviewLine.textContent = due ? fill(W.review.due, { n: due }) : W.review.none;
  const reviewButton = root.querySelector<HTMLButtonElement>('[data-review]');
  if (reviewButton) reviewButton.disabled = !due;
  // Review's memory: every idea and question the path asks, met or not yet
  const total = Number(root.dataset.asked ?? 0);
  const seen = Object.values(p.path ?? {}).filter((v): v is [number, string] => Array.isArray(v));
  const r = rungIndex(p.xp);
  // the ascent
  root.querySelectorAll<HTMLElement>('[data-rung]').forEach((li) => {
    const k = Number(li.dataset.rung);
    li.classList.toggle('is-reached', k <= r);
    li.classList.toggle('is-here', k === r);
    const togo = li.querySelector<HTMLElement>('[data-togo]');
    if (togo) togo.textContent = k === r + 1 ? fill(W.ascent.toGo, { n: W.rungs[k][0] - p.xp }) : '';
  });
  const stat = (name: string, value: string | number) => {
    const node = root.querySelector<HTMLElement>(`[data-stat="${name}"]`);
    if (node) node.textContent = String(value);
  };
  stat('xp', p.xp);
  stat('streak', streak(p));
  stat('known', `${Object.keys(p.known).length} / ${root.dataset.stars}`);
  stat('long', seen.filter((s) => s[0] >= 3).length);
  const counts = [0, 0, 0, 0, 0, 0];
  counts[0] = Math.max(0, total - seen.length);
  seen.forEach((s) => counts[s[0]]++);
  const most = Math.max(...counts, 1);
  root.querySelectorAll<HTMLElement>('[data-box]').forEach((bar) => {
    const k = Number(bar.dataset.box);
    bar.style.setProperty('--h', String(Math.max(0.04, counts[k] / most)));
    bar.querySelector('[data-box-n]')!.textContent = String(counts[k]);
  });
}

let stopPage: (() => void) | undefined;
function setup() {
  stopPage?.();
  stopPage = undefined;
  const root = document.querySelector<HTMLElement>('[data-nplay]');
  const words = document.querySelector('[data-nplay-words]');
  if (!root || !words) return;
  W = JSON.parse(words.textContent ?? '{}');
  feedBase = root.dataset.feedSrc ?? feedBase;
  mapBase = root.dataset.mapHref ?? mapBase;
  dialog = root.querySelector<HTMLDialogElement>('[data-arena]')!;
  pageMode = 'pathPage' in root.dataset;
  playHref = root.dataset.playHref ?? playHref;
  pathHref = root.dataset.pathHref ?? pathHref;
  const ac = new AbortController();
  const on = { signal: ac.signal };
  const path = document.querySelector('[data-npath]');
  outline = JSON.parse(path?.textContent ?? '[]');
  chapterOf.clear();
  outline.forEach((c, ci) => c.lessons.forEach((l) => l.forEach((u) => chapterOf.set(u, ci))));

  // the path page: straight into the lesson asked for (?c=&l=), Review (?review), or the next lesson,
  // behind the loading screen, which fades away once it is ready (and has been read: a few seconds)
  if (pageMode) {
    const params = new URLSearchParams(location.search);
    const [c, l] = [Number(params.get('c')), Number(params.get('l'))];
    const at = here(load());
    const loader = document.querySelector<HTMLElement>('[data-load]');
    const began = performance.now();
    if (loader) {
      const quotes = JSON.parse(document.querySelector('[data-quotes]')?.textContent ?? '[]') as string[];
      const quote = loader.querySelector('[data-load-quote]');
      if (quote && quotes.length) quote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
      requestAnimationFrame(() => requestAnimationFrame(() => loader.classList.add('is-on')));
      // a breath of wind as it opens, the sea while it waits, a soft bell as the lesson appears
      playSound('/audio/wind.mp3', 0.035);
      window.setTimeout(() => playSound('/audio/sea.mp3', 0.04, { after: 3.6, over: 1.8 }), 300);
    }
    const ready = (task: Promise<unknown> | void) =>
      Promise.resolve(task).finally(() => {
        if (!loader) return;
        const calm = !document.documentElement.classList.contains('motion');
        // (held a little over five seconds, longer than the loading itself, so the line can be taken in)
        const wait = calm ? 600 : Math.max(0, 5200 - (performance.now() - began));
        window.setTimeout(() => {
          loader.classList.add('is-leaving');
          playSound('/audio/arrive.mp3', 0.05);
          window.setTimeout(() => (loader.hidden = true), 650);
        }, wait);
      });
    if (params.has('review')) ready(review());
    else if (params.has('c') && outline[c]?.lessons[l]) ready(walk(c, l));
    else if (at) ready(walk(at.ci, at.li));
    else {
      ready();
      const A = openArena(W.path.title, '');
      A.progress(1);
      A.stage.replaceChildren(
        h('div', { class: 'nend' }, greek(W.arena.end, 'nend__word'), h('p', { class: 'nend__msg' }, W.path.doneAll)),
        h('div', { class: 'nrow nrow--centre' }, h('button', { type: 'button', class: 'btn', onclick: leave }, W.path.back)),
      );
    }
    document.addEventListener(
      'keydown',
      (event) => {
        // (not while writing: the tutor's box or a written answer; the tutor's Escape is its own)
        if (event.key === 'Escape' && !(event.target as Element).closest?.('[data-tutor], textarea, input')) leave();
      },
      on,
    );
    stopPage = () => {
      ac.abort();
      cleanup?.();
    };
    return;
  }
  document.documentElement.classList.add('nostos-play-live');

  root.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) => {
    b.disabled = false;
    b.addEventListener('click', () => start(b.dataset.act!), on);
  });
  // the path and Review open their own page
  root.querySelector('[data-review]')?.addEventListener('click', () => navigate(`${pathHref}?review`), on);
  root.querySelector('[data-path-go]')?.addEventListener(
    'click',
    () => {
      const at = here(load());
      if (at) navigate(`${pathHref}?c=${at.ci}&l=${at.li}`);
    },
    on,
  );
  // a stone on the journey: that lesson, on the path page
  root.querySelector('[data-journey]')?.addEventListener(
    'click',
    (event) => {
      // skipping to a chapter further on: the path was made to be walked in order, so ask first
      const skip = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-skip-ch]');
      const ask = root.querySelector<HTMLDialogElement>('[data-pop="skip"]');
      if (skip && ask) {
        ask.dataset.to = `${pathHref}?c=${skip.dataset.skipCh}&l=0`;
        ask.showModal();
        return;
      }
      const stone = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-node]');
      if (stone && !stone.disabled) navigate(`${pathHref}?c=${stone.dataset.c}&l=${stone.dataset.l}`);
    },
    on,
  );
  root.querySelectorAll<HTMLButtonElement>('[data-rail]').forEach((m) =>
    m.addEventListener(
      'click',
      () => {
        const ci = Number(m.dataset.railCh);
        const skip = root.querySelector<HTMLElement>(`[data-ch="${ci}"] [data-skip-ch]`);
        const ask = root.querySelector<HTMLDialogElement>('[data-pop="skip"]');
        // a stage further on asks first, as its first chapter would; otherwise it is scrolled to
        if (skip && !skip.hidden && ask) {
          ask.dataset.to = `${pathHref}?c=${ci}&l=0`;
          ask.showModal();
        } else {
          const calm = !document.documentElement.classList.contains('motion');
          document.getElementById(`stage-${m.dataset.rail}`)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
        }
      },
      on,
    ),
  );
  root.querySelector('[data-skip-go]')?.addEventListener(
    'click',
    () => {
      const ask = root.querySelector<HTMLDialogElement>('[data-pop="skip"]')!;
      ask.close();
      if (ask.dataset.to) navigate(ask.dataset.to);
    },
    on,
  );
  root.querySelector('[data-skip-stay]')?.addEventListener('click', () => root.querySelector<HTMLDialogElement>('[data-pop="skip"]')?.close(), on);
  // Review and the ascent open as popups from their floating buttons
  root.querySelectorAll<HTMLElement>('[data-pop-open]').forEach((button) =>
    button.addEventListener('click', () => root.querySelector<HTMLDialogElement>(`[data-pop="${button.dataset.popOpen}"]`)?.showModal(), on),
  );
  root.querySelectorAll<HTMLDialogElement>('[data-pop]').forEach((pop) => {
    pop.querySelector('[data-pop-close]')?.addEventListener('click', () => pop.close(), on);
    pop.addEventListener('click', (event) => event.target === pop && pop.close(), on);
  });
  root.querySelector('[data-surprise]')?.addEventListener(
    'click',
    () => start(pick(['ladder', 'myth', 'forge', 'fork', 'links', 'quiz', 'threads'], 1)[0]),
    on,
  );
  dialog.addEventListener(
    'close',
    () => {
      cleanup?.();
      cleanup = null;
      refresh(root);
    },
    on,
  );
  dialog.addEventListener(
    'click',
    (event) => {
      if (event.target === dialog) dialog.close();
    },
    on,
  );
  window.addEventListener('nostos:progress', () => refresh(root), on);

  // erase progress, after asking
  const reset = root.querySelector<HTMLElement>('[data-reset]');
  reset?.addEventListener(
    'click',
    () => {
      const area = root.querySelector<HTMLElement>('[data-reset-area]')!;
      area.replaceChildren(
        h(
          'div',
          { class: 'nrow' },
          h('p', { class: 'nsmall' }, W.ascent.resetAsk),
          h(
            'button',
            {
              type: 'button',
              class: 'btn',
              onclick: () => {
                save({ xp: 0, days: {}, srs: {}, known: {}, best: {}, done: {}, v: 1 });
                area.replaceChildren(h('p', { class: 'nsmall', role: 'status' }, W.ascent.erased));
              },
            },
            W.ascent.resetYes,
          ),
          h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => area.replaceChildren() }, W.ascent.resetNo),
        ),
      );
    },
    on,
  );

  refresh(root);
  // the journey opens at the stone you are on
  const current = root.querySelector<HTMLElement>('.nnode.is-here');
  const started = Object.keys(load().path ?? {}).length > 0;
  if (current && started) current.scrollIntoView({ block: 'center' });

  // straight into an activity from a link: ?quiz=<idea> from the map, ?play=<activity>
  const params = new URLSearchParams(location.search);
  if (params.get('quiz')) start('quiz', { concept: params.get('quiz') });
  else if (params.get('thread')) start('threads', { concept: params.get('thread') });
  else if (params.get('play') && ACTIVITIES[params.get('play')!]) start(params.get('play')!);

  stopPage = () => {
    ac.abort();
    cleanup?.();
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove('nostos-play-live');
  };
}

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', () => stopPage?.());
