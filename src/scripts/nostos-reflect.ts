// Nostos, a reflection's flow (src/pages/nostos/reflect/[id].astro): one item at a time, then the
// grouping the answers fall into, scored here from each item's weights (src/lib/nostos-reflections.ts),
// and, with the visitor's own Anthropic key (the tutor's: src/scripts/nostos-tutor.ts), Claude's reading
// of the answers. Every result is kept in this browser, the last ones first, so a retake shows the last
// one. Nothing leaves the browser but the request to Anthropic, and only with the visitor's key.
//
// TODO (later phase, see src/lib/nostos-reflections.ts): the plan after the analysis, a check-in after
// 7 days, a reminder to retake after 4 to 6 weeks with the two results side by side.
import type { Item, Reflection, Score } from '../lib/nostos-reflections';
import { hasKey, readReflection, type Reading } from './nostos-tutor';

type Answer = number | string | number[] | ('a' | 'b')[];
type Saved = { at: string; type: string; scores: Score; answers: Record<string, Answer>; reading?: Reading };
type Words = Record<string, string>;
const STORE = 'nostos-reflections-v1';
const KEY = 'nostos-tutor-key';

const load = (): Record<string, Saved[]> => {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}');
  } catch {
    return {};
  }
};
const save = (all: Record<string, Saved[]>) => {
  try {
    localStorage.setItem(STORE, JSON.stringify(all));
  } catch {
    // storage switched off: the result shows, it is only not kept
  }
};
/** every reflection's results, latest last (for the journey and for the readings that compare) */
export const reflectionResults = load;

const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
const h = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: (Node | string | null | undefined)[]) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const kid of kids) if (kid != null) el.append(kid);
  return el;
};
const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

// ---------- scoring ----------
/** a point on a line of n points (1 to n), from −1 at the left end to +1 at the right */
const along = (v: number, n: number) => (v - (n + 1) / 2) / ((n - 1) / 2);
/** a line of n points to tap (a scale, or a pair): the ends largest, smaller towards the middle unless
 *  the middle is a named point of its own; `labels` name the two ends and the middle for screen readers */
function line(n: number, value: number | undefined, labelledBy: string, labels: [string, string, string], named: boolean, pick: (v: number) => void) {
  const dots = h('div', { class: 'nref__dots', role: 'radiogroup', 'aria-labelledby': labelledBy });
  for (let v = 1; v <= n; v++) {
    const x = Math.abs(along(v, n));
    const size = named && x === 0 ? 1.8 : 1.1 + 0.7 * x;
    const name = v === 1 ? labels[0] : v === n ? labels[2] : x === 0 && labels[1] ? labels[1] : `${v} of ${n}`;
    const d = h('button', { type: 'button', class: 'nref__dot', role: 'radio', 'aria-checked': String(value === v), 'aria-label': name, style: `--d:${size.toFixed(2)}rem` });
    d.classList.toggle('is-on', value === v);
    d.addEventListener('click', () => {
      dots.querySelectorAll('.nref__dot').forEach((y, k) => {
        y.classList.toggle('is-on', k + 1 === v);
        y.setAttribute('aria-checked', String(k + 1 === v));
      });
      pick(v);
    });
    dots.append(d);
  }
  return dots;
}
function score(r: Reflection, answers: Record<string, Answer>): Score {
  const s: Score = Object.fromEntries(r.types.map((t) => [t.id, 0]));
  const add = (to: Score | undefined, f = 1) => to && Object.entries(to).forEach(([k, v]) => k in s && (s[k] += v * f));
  for (const it of r.items) {
    const a = answers[it.id];
    if (a === undefined) continue;
    if (it.kind === 'choice' || it.kind === 'ladder') {
      const opts = it.kind === 'choice' ? it.options : it.rungs;
      // (where more than one may be chosen, they share the weight of one answer)
      const picks = Array.isArray(a) ? (a as number[]) : [a as number];
      picks.forEach((k) => add(opts[k]?.to, 1 / picks.length));
    }
    else if (it.kind === 'scale') {
      const x = along(a as number, it.steps ?? 5);
      add(it.to, x);
      add(it.mid, 1 - Math.abs(x));
      add(it.ends, Math.abs(x));
    }
    // each pair is a five-point line between its two ends: the nearer an end, the more it counts
    else if (it.kind === 'pairs')
      (a as (number | 'a' | 'b')[]).forEach((v, k) => {
        const x = along(v === 'a' ? 1 : v === 'b' ? 5 : (v as number), 5);
        if (it.pairs[k]) add(it.pairs[k].aTo, (1 - x) / 2), add(it.pairs[k].bTo, (1 + x) / 2);
      });
    else if (it.kind === 'rank') {
      const order = a as number[];
      order.forEach((o, p) => add(it.options[o]?.to, order.length > 1 ? (order.length - 1 - p) / (order.length - 1) : 1));
    } else if (it.kind === 'points') (a as number[]).forEach((n, j) => it.options[j] && it.options[j].to in s && (s[it.options[j].to] += (n / it.total) * 3));
    else if (it.kind === 'multi') (a as number[]).forEach((o) => add(it.options[o]?.to));
  }
  return s;
}
const topOf = (r: Reflection, s: Score) => r.types.reduce((best, t) => (s[t.id] > s[best.id] ? t : best), r.types[0]);

// an answer as words, for the reading
function said(it: Item, a: Answer | undefined): string {
  if (a === undefined) return '(skipped)';
  switch (it.kind) {
    case 'choice':
      return (Array.isArray(a) ? (a as number[]) : [a as number]).map((k) => it.options[k]?.text ?? '').join('; ');
    case 'ladder':
      return (Array.isArray(a) ? (a as number[]) : [a as number])
        .map((k) => `${it.rungs[k]?.text} (rung ${k + 1} of ${it.rungs.length}, from the bottom)`)
        .join('; ');
    case 'scale':
      return `${a} on a line from 1 ("${it.left}") to ${it.steps ?? 5} ("${it.right}")${it.middle ? `, its middle "${it.middle}"` : ''}`;
    case 'pairs':
      return (a as (number | 'a' | 'b')[])
        .map((v, k) => `${v === 'a' ? 1 : v === 'b' ? 5 : v} of 5 from "${it.pairs[k].a}" (1) to "${it.pairs[k].b}" (5)`)
        .join('; ');
    case 'rank':
      return (a as number[]).map((o, p) => `${p + 1}. ${it.options[o].text}`).join('; ');
    case 'points':
      return (a as number[]).map((n, j) => `${it.options[j].text}: ${n}`).join('; ');
    case 'multi':
      return (a as number[]).map((o) => it.options[o].text).join('; ');
    case 'text':
      return String(a);
  }
}

// ---------- the page ----------
/** every step of the lesson it follows met on the Learn path (or storage off: then it is open) */
const reached = (ids: string[]) => {
  try {
    const path = JSON.parse(localStorage.getItem('nostos-progress-v1') || '{}').path ?? {};
    return ids.every((u) => path[u] !== undefined);
  } catch {
    return true;
  }
};
let stop: (() => void) | undefined;
export function start() {
  stop?.();
  stop = undefined;
  const root = document.querySelector<HTMLElement>('[data-reflect]');
  const dataNode = document.querySelector('[data-ref-data]');
  if (!root || !dataNode) return;
  const { r, labels, titles, words: W, need } = JSON.parse(dataNode.textContent ?? '{}') as {
    r: Reflection;
    labels: Record<string, string>;
    titles: Record<string, string>;
    words: Words;
    need: string[];
  };
  // not reached yet on the path, and never taken here: it waits (client direction, 7 November 2026)
  if (!reached(need) && !load()[r.id]?.length) {
    root.querySelector<HTMLElement>('[data-ref-start]')!.hidden = true;
    root.querySelector<HTMLElement>('[data-ref-locked]')!.hidden = false;
    return;
  }
  const ac = new AbortController();
  stop = () => ac.abort();
  const on = { signal: ac.signal };
  const $ = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const feedBase = root.dataset.feedSrc ?? '/nostos/data/';
  const mapHref = root.dataset.mapHref ?? '/nostos/';

  const startCard = $('[data-ref-start]');
  const flow = $('[data-ref-flow]');
  const result = $('[data-ref-result]');
  const itemBox = $('[data-ref-item]');
  const next = $<HTMLButtonElement>('[data-ref-next]');
  const back = $<HTMLButtonElement>('[data-ref-back]');
  const fillBar = $('[data-ref-fill]');
  const stepLine = $('[data-ref-step]');

  let i = 0;
  let answers: Record<string, Answer> = {};
  const ideaLink = (id: string) => h('a', { href: `${mapHref}?star=${encodeURIComponent(id)}` }, labels[id] ?? id);

  // the last result, on the start card (a retake)
  const history = () => load()[r.id] ?? [];
  const showLast = () => {
    const last = history().at(-1);
    const el = $('[data-ref-last]');
    el.hidden = !last;
    if (last) el.textContent = fill(W.last, { date: dateOf(last.at), type: r.types.find((t) => t.id === last.type)?.name ?? '' });
  };

  // ---------- one item ----------
  const answered = (it: Item) => {
    const a = answers[it.id];
    if (a === undefined) return false;
    if (it.kind === 'pairs') return (a as unknown[]).filter((x) => x !== undefined && x !== null).length === it.pairs.length;
    if (it.kind === 'rank') return (a as number[]).length === it.options.length;
    if (it.kind === 'points') return (a as number[]).reduce((x, y) => x + y, 0) === it.total;
    if (it.kind === 'multi' || Array.isArray(a)) return (a as number[]).length > 0;
    if (it.kind === 'text') return String(a).trim().length >= 3;
    return true;
  };
  const refresh = () => {
    const it = r.items[i];
    next.disabled = !answered(it);
    next.textContent = i === r.items.length - 1 ? W.finish : W.next;
  };
  const optButton = (text: string, onTap: () => void, badge?: string, note?: string) => {
    const words = note ? h('span', { class: 'nref__optwords' }, h('span', {}, text), h('span', { class: 'nref__optnote' }, note)) : h('span', {}, text);
    const b = h('button', { type: 'button', class: 'nref__opt' }, badge !== undefined ? h('span', { class: 'nref__badge', 'aria-hidden': 'true' }, badge) : null, words);
    b.addEventListener('click', onTap, on);
    return b;
  };

  function render() {
    const it = r.items[i];
    itemBox.replaceChildren();
    fillBar.style.setProperty('--f', String(i / r.items.length));
    stepLine.textContent = fill(W.step, { i: i + 1, n: r.items.length });
    back.hidden = i === 0;
    const prompt = h('p', { class: 'nref__prompt', id: `nref-q-${it.id}` }, it.prompt);
    itemBox.append(prompt);
    const hint = (text?: string) => text && itemBox.append(h('p', { class: 'nref__hint' }, text));

    if (it.kind === 'choice' || it.kind === 'ladder') {
      const opts = it.kind === 'choice' ? it.options : it.rungs;
      const list = h('ul', { class: `nref__opts${it.kind === 'ladder' ? ' nref__opts--ladder' : ''}`, role: 'list', 'aria-labelledby': `nref-q-${it.id}` });
      // more than one may be chosen where the item says so (client direction, 7 November 2026)
      const max = it.max ?? 1;
      const chosen = (): number[] => {
        const a = answers[it.id];
        return Array.isArray(a) ? (a as number[]) : a === undefined ? [] : [a as number];
      };
      const paint = () =>
        list.querySelectorAll<HTMLElement>('.nref__opt').forEach((x, n) => {
          x.classList.toggle('is-on', chosen().includes(n));
          x.classList.toggle('is-off', max > 1 && !chosen().includes(n) && chosen().length >= max);
          if (max > 1) x.setAttribute('aria-pressed', String(chosen().includes(n)));
        });
      opts.forEach((o, k) => {
        const b = optButton(
          o.text,
          () => {
            if (max <= 1) answers[it.id] = k;
            else {
              const now = chosen().slice();
              const at = now.indexOf(k);
              if (at >= 0) now.splice(at, 1);
              else if (now.length < max) now.push(k);
              answers[it.id] = now;
            }
            paint();
            refresh();
          },
          undefined,
          o.note,
        );
        list.append(h('li', {}, b));
      });
      if (max > 1) hint(fill(W.multiHint, { n: max }));
      itemBox.append(list);
      paint();
    } else if (it.kind === 'scale') {
      const n = it.steps ?? 5;
      itemBox.append(
        h(
          'div',
          { class: 'nref__scale' },
          line(n, answers[it.id] as number | undefined, `nref-q-${it.id}`, [it.left, it.middle ?? '', it.right], !!it.middle, (v) => ((answers[it.id] = v), refresh())),
          h('p', { class: `nref__ends${it.middle ? ' nref__ends--mid' : ''}` }, h('span', {}, it.left), it.middle ? h('span', {}, it.middle) : null, h('span', {}, it.right)),
        ),
      );
      hint(W.scaleHint);
    } else if (it.kind === 'pairs') {
      const picks = (answers[it.id] as (number | 'a' | 'b')[] | undefined) ?? new Array(it.pairs.length);
      answers[it.id] = picks;
      const list = h('ul', { class: 'nref__pairs', role: 'list' });
      it.pairs.forEach((p, k) => {
        const v = picks[k] === 'a' ? 1 : picks[k] === 'b' ? 5 : (picks[k] as number | undefined);
        list.append(
          h(
            'li',
            { class: 'nref__pair' },
            h('p', { class: 'nref__ends', id: `nref-p-${it.id}-${k}` }, h('span', {}, p.a), h('span', {}, p.b)),
            line(5, v, `nref-p-${it.id}-${k}`, [p.a, '', p.b], false, (x) => ((picks[k] = x), refresh())),
          ),
        );
      });
      hint(W.pairsHint);
      itemBox.append(list);
    } else if (it.kind === 'rank') {
      const order = (answers[it.id] as number[] | undefined) ?? [];
      answers[it.id] = order;
      const list = h('ul', { class: 'nref__opts', role: 'list' });
      const paint = () =>
        list.querySelectorAll<HTMLElement>('.nref__opt').forEach((b, k) => {
          const p = order.indexOf(k);
          b.classList.toggle('is-on', p >= 0);
          b.querySelector('.nref__badge')!.textContent = p >= 0 ? String(p + 1) : '';
        });
      it.options.forEach((o, k) =>
        list.append(
          h(
            'li',
            {},
            optButton(
              o.text,
              () => {
                const p = order.indexOf(k);
                if (p >= 0) order.splice(p, 1);
                else order.push(k);
                paint();
                refresh();
              },
              '',
              o.note,
            ),
          ),
        ),
      );
      hint(W.rankHint);
      itemBox.append(list);
      const again = h('button', { type: 'button', class: 'nref__linkbtn' }, W.rankAgain);
      again.addEventListener(
        'click',
        () => {
          order.splice(0);
          paint();
          refresh();
        },
        on,
      );
      itemBox.append(again);
      paint();
    } else if (it.kind === 'points') {
      const pts = (answers[it.id] as number[] | undefined) ?? it.options.map(() => 0);
      answers[it.id] = pts;
      const left = h('p', { class: 'nref__left', 'aria-live': 'polite' });
      const list = h('ul', { class: 'nref__pts', role: 'list' });
      const rows: { n: HTMLElement; dots: HTMLElement; minus: HTMLButtonElement; plus: HTMLButtonElement }[] = [];
      const paint = () => {
        const used = pts.reduce((x, y) => x + y, 0);
        left.textContent = used === it.total ? W.pointsDone : fill(W.pointsLeft, { n: it.total - used });
        rows.forEach((row, j) => {
          row.n.textContent = String(pts[j]);
          row.dots.replaceChildren(...Array.from({ length: pts[j] }, () => h('i')));
          row.minus.disabled = pts[j] === 0;
          row.plus.disabled = used >= it.total;
        });
        refresh();
      };
      it.options.forEach((o, j) => {
        const minus = h('button', { type: 'button', 'aria-label': `− ${o.text}` }, '−') as HTMLButtonElement;
        const plus = h('button', { type: 'button', 'aria-label': `+ ${o.text}` }, '+') as HTMLButtonElement;
        const n = h('span', { class: 'nref__ptn' });
        const dots = h('span', { class: 'nref__ptdots', 'aria-hidden': 'true' });
        minus.addEventListener('click', () => ((pts[j] = Math.max(0, pts[j] - 1)), paint()), on);
        plus.addEventListener('click', () => ((pts[j] += 1), paint()), on);
        rows.push({ n, dots, minus, plus });
        list.append(h('li', { class: 'nref__pt' }, h('span', {}, o.text), h('span', { class: 'nref__ptctl' }, minus, n, plus), dots));
      });
      itemBox.append(list, left);
      paint();
    } else if (it.kind === 'multi') {
      const chosen = (answers[it.id] as number[] | undefined) ?? [];
      answers[it.id] = chosen;
      const list = h('ul', { class: 'nref__opts', role: 'list' });
      const paint = () =>
        list.querySelectorAll<HTMLElement>('.nref__opt').forEach((b, k) => {
          b.classList.toggle('is-on', chosen.includes(k));
          b.classList.toggle('is-off', !chosen.includes(k) && chosen.length >= it.max);
          b.setAttribute('aria-pressed', String(chosen.includes(k)));
        });
      it.options.forEach((o, k) =>
        list.append(
          h(
            'li',
            {},
            optButton(
              o.text,
              () => {
                const p = chosen.indexOf(k);
                if (p >= 0) chosen.splice(p, 1);
                else if (chosen.length < it.max) chosen.push(k);
                paint();
                refresh();
              },
              undefined,
              o.note,
            ),
          ),
        ),
      );
      hint(fill(W.multiHint, { n: it.max }));
      itemBox.append(list);
      paint();
    } else if (it.kind === 'text') {
      hint(it.hint ?? W.textHint);
      const area = h('textarea', { class: 'nref__write', rows: '5', 'aria-labelledby': `nref-q-${it.id}`, placeholder: it.placeholder ?? '' }) as HTMLTextAreaElement;
      area.value = (answers[it.id] as string | undefined) ?? '';
      area.addEventListener('input', () => ((answers[it.id] = area.value), refresh()), on);
      itemBox.append(area);
      requestAnimationFrame(() => area.focus({ preventScroll: true }));
    }
    refresh();
  }

  // ---------- the result ----------
  function showResult(entry: Saved) {
    flow.hidden = true;
    startCard.hidden = true;
    result.hidden = false;
    const top = r.types.find((t) => t.id === entry.type) ?? r.types[0];
    $('[data-ref-type]').textContent = top.name;
    $('[data-ref-short]').textContent = top.short;
    $('[data-ref-about]').textContent = top.about;
    const ideas = $('[data-ref-ideas]');
    ideas.replaceChildren();
    if (top.concepts?.length) {
      ideas.append(`${W.onMap}: `);
      top.concepts.forEach((c, k) => (k && ideas.append(' · '), ideas.append(ideaLink(c))));
    }
    // how the answers fall: every grouping, the largest share full
    const max = Math.max(...r.types.map((t) => Math.max(0, entry.scores[t.id] ?? 0)), 0.0001);
    $('[data-ref-profile]').replaceChildren(
      ...r.types
        .slice()
        .sort((a, b) => (entry.scores[b.id] ?? 0) - (entry.scores[a.id] ?? 0))
        .map((t) => {
          const bar = h('span', {});
          bar.style.setProperty('--v', String(Math.max(0, entry.scores[t.id] ?? 0) / max));
          return h('li', { class: t.id === top.id ? 'is-top' : '' }, h('span', {}, t.name), h('span', { class: 'nref__pbar', 'aria-hidden': 'true' }, bar));
        }),
    );
    const earlier = history().slice(0, -1).at(-1);
    const was = $('[data-ref-was]');
    was.hidden = !earlier;
    if (earlier) was.textContent = fill(W.last, { date: dateOf(earlier.at), type: r.types.find((t) => t.id === earlier.type)?.name ?? '' });
    if (entry.reading) paintReading(entry.reading);
    else if (hasKey()) askReading(entry);
    else {
      $('[data-ref-reading]').hidden = true;
      $('[data-ref-key]').hidden = false;
    }
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function paintReading(rd: Reading) {
    $('[data-ref-key]').hidden = true;
    const box = $('[data-ref-reading]');
    box.hidden = false;
    const body = $('[data-ref-reading-body]');
    body.replaceChildren(
      h('p', { class: 'nref__rhead' }, rd.headline),
      h('div', { class: 'nref__rbody' }, ...rd.portrait.split(/\n+/).filter(Boolean).map((p) => h('p', {}, p))),
      h('p', { class: 'nref__rsub' }, W.shows),
      h('ul', { class: 'nref__rlist' }, ...rd.patterns.map((p) => h('li', {}, p))),
      h('div', { class: 'nref__rgrid' }, h('div', {}, h('h4', {}, W.strength), h('p', {}, rd.strength)), h('div', {}, h('h4', {}, W.shadow), h('p', {}, rd.shadow))),
      h('p', { class: 'nref__rsub' }, W.athena),
      h('ul', { class: 'nref__rathena' }, ...rd.athena.map((a) => h('li', {}, ideaLink(a.concept), ` ${a.why}`))),
    );
  }

  async function askReading(entry: Saved) {
    $('[data-ref-key]').hidden = true;
    const box = $('[data-ref-reading]');
    box.hidden = false;
    const body = $('[data-ref-reading-body]');
    body.replaceChildren(h('p', { class: 'nref__wait' }, W.reading));
    const all = load();
    const earlier = (r.reads ?? [])
      .map((id) => ({ id, last: all[id]?.at(-1) }))
      .filter((x) => x.last)
      .map((x) => `- ${titles[x.id] ?? x.id} (${dateOf(x.last!.at)}): ${x.last!.type}${x.last!.reading ? `; reading: "${x.last!.reading.headline}"` : ''}`)
      .join('\n');
    // the same reflection taken before
    const before = history().slice(0, -1).at(-1);
    const top = r.types.find((t) => t.id === entry.type) ?? r.types[0];
    try {
      const rd = await readReflection(feedBase, {
        title: r.title,
        intro: r.intro,
        focus: r.ai,
        types: r.types.map((t) => ({ name: t.name, about: t.about })),
        result: `${top.name} (${top.short})`,
        profile: r.types.map((t) => `${t.name}: ${(entry.scores[t.id] ?? 0).toFixed(1)}`).join('; '),
        answers: r.items.map((it) => `Q: ${it.prompt}\nA: ${said(it, entry.answers[it.id])}`).join('\n\n'),
        earlier: [before ? `- This same reflection, taken ${dateOf(before.at)}: ${r.types.find((t) => t.id === before.type)?.name}` : '', earlier].filter(Boolean).join('\n'),
        concepts: Object.keys(labels),
        today: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      });
      const store = load();
      const list = store[r.id] ?? [];
      const mine = list.findIndex((x) => x.at === entry.at);
      if (mine >= 0) list[mine].reading = rd;
      store[r.id] = list;
      save(store);
      entry.reading = rd;
      if (!ac.signal.aborted) paintReading(rd);
    } catch {
      if (ac.signal.aborted) return;
      const retry = h('button', { type: 'button', class: 'btn btn--ghost' }, W.retry);
      retry.addEventListener('click', () => askReading(entry), on);
      body.replaceChildren(h('p', {}, W.failed), retry);
    }
  }

  function finish() {
    const scores = score(r, answers);
    const entry: Saved = { at: new Date().toISOString(), type: topOf(r, scores).id, scores, answers: structuredClone(answers) };
    const all = load();
    all[r.id] = [...(all[r.id] ?? []), entry].slice(-6);
    save(all);
    window.dispatchEvent(new CustomEvent('nostos:progress'));
    showResult(entry);
  }

  // ---------- wiring ----------
  $('[data-ref-begin]').addEventListener(
    'click',
    () => {
      answers = {};
      i = 0;
      startCard.hidden = true;
      result.hidden = true;
      flow.hidden = false;
      render();
      flow.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    on,
  );
  next.addEventListener(
    'click',
    () => {
      if (!answered(r.items[i])) return;
      if (i === r.items.length - 1) return finish();
      i++;
      render();
    },
    on,
  );
  back.addEventListener(
    'click',
    () => {
      if (i > 0) i--;
      render();
    },
    on,
  );
  $('[data-ref-again]').addEventListener(
    'click',
    () => {
      result.hidden = true;
      startCard.hidden = false;
      showLast();
      startCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    on,
  );
  $('[data-ref-print]').addEventListener('click', () => window.print(), on);
  $('[data-ref-key]').addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      const value = $<HTMLInputElement>('[data-ref-keyinput]').value.trim();
      if (value.length < 20) return;
      try {
        localStorage.setItem(KEY, value);
      } catch {
        return;
      }
      const last = history().at(-1);
      if (last) askReading(last);
    },
    on,
  );

  // a result already taken shows at once; Begin takes it again
  const last = history().at(-1);
  if (last && new URLSearchParams(location.search).has('again') === false) showResult(last);
  else showLast();
}
