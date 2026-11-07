// Nostos, a practical activity's page (src/pages/nostos/praxis/[id].astro): draws the activity for its
// kind (src/lib/nostos-praxis.ts) and keeps what the visitor does and writes in this browser
// (localStorage; the journal's photos in IndexedDB). Nothing is sent anywhere.
//
// The meditation's sound is made here, with Web Audio: a soft wind (brown noise through a slowly moving
// filter) and a bowl-like bell at each step (a few sine partials fading out), so there is nothing to
// download and it can be swapped for recordings later. The site's background music pauses while a
// meditation runs and comes back after it.
//
// TODO (later phase): Claude reads a challenge's notes at its end and looks at the journal's photos;
// the meditation steps read aloud (each step may carry an `audio` file, played over the wind).
import type { Praxis, Step } from '../lib/nostos-praxis';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Words = Record<string, any>;
type Check = { at: string; did: boolean; note: string };
type Saved = { started?: string; checks?: Check[]; done?: string; answers?: Record<string, any>; notes?: { at: string; text: string }[] };
const STORE = 'nostos-praxis-v1';

const loadAll = (): Record<string, Saved> => {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}');
  } catch {
    return {};
  }
};
const saveAll = (all: Record<string, Saved>) => {
  try {
    localStorage.setItem(STORE, JSON.stringify(all));
  } catch {
    // storage switched off: it works, it is only not kept
  }
  window.dispatchEvent(new CustomEvent('nostos:progress'));
};
const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''));
const day = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000);
const longDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, any> = {}, ...kids: (Node | string | null | undefined | false)[]) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const kid of kids) if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
  return el;
}
const svgEl = (tag: string, attrs: Record<string, string | number>) => {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};

// ---------- the meditation's sound ----------
type Win = Window & { webkitAudioContext?: typeof AudioContext };
class Calm {
  ctx: AudioContext | null = null;
  wind: GainNode | null = null;
  nodes: AudioScheduledSourceNode[] = [];
  on = true;
  start() {
    if (!this.on) return;
    const Context = window.AudioContext ?? (window as Win).webkitAudioContext;
    if (!Context) return;
    this.ctx ??= new Context();
    const ctx = this.ctx;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (this.wind) return;
    // brown noise, looped
    const length = ctx.sampleRate * 6;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    // a filter that opens and closes slowly, like gusts
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.6;
    const sweep = ctx.createOscillator();
    sweep.frequency.value = 0.06;
    const sweepDepth = ctx.createGain();
    sweepDepth.gain.value = 260;
    sweep.connect(sweepDepth).connect(filter.frequency);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.11, ctx.currentTime + 4);
    const swell = ctx.createOscillator();
    swell.frequency.value = 0.045;
    const swellDepth = ctx.createGain();
    swellDepth.gain.value = 0.035;
    swell.connect(swellDepth).connect(gain.gain);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    sweep.start();
    swell.start();
    this.wind = gain;
    this.nodes = [noise, sweep, swell];
  }
  /** a bowl-like bell: a few partials, struck softly, fading over several seconds */
  bell(times = 1) {
    if (!this.on || !this.ctx) return;
    const ctx = this.ctx;
    for (let k = 0; k < times; k++) {
      const at = ctx.currentTime + 0.05 + k * 2.2;
      for (const [ratio, level, decay] of [
        [1, 0.16, 7],
        [2.01, 0.05, 4],
        [2.76, 0.07, 5],
        [5.4, 0.025, 2.5],
      ]) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 286 * ratio;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(level, at + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
        osc.connect(g).connect(ctx.destination);
        osc.start(at);
        osc.stop(at + decay + 0.1);
      }
    }
  }
  stop(soft = true) {
    if (!this.ctx || !this.wind) return;
    const ctx = this.ctx;
    const nodes = this.nodes;
    this.wind.gain.cancelScheduledValues(ctx.currentTime);
    this.wind.gain.setValueAtTime(this.wind.gain.value, ctx.currentTime);
    this.wind.gain.linearRampToValueAtTime(0, ctx.currentTime + (soft ? 3 : 0.2));
    setTimeout(() => nodes.forEach((n) => n.stop()), soft ? 3200 : 300);
    this.wind = null;
    this.nodes = [];
  }
}
// the site's background music, paused while a meditation runs
function hushMusic() {
  const audio = document.querySelector<HTMLAudioElement>('[data-music-audio]');
  if (!audio || audio.paused) return () => {};
  audio.pause();
  return () => audio.play().catch(() => {});
}

// ---------- the photos of the journal (IndexedDB) ----------
const DB = 'nostos-praxis';
function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore('photos', { keyPath: 'key' });
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}
type Photo = { key: string; owner: string; at: string; blob: Blob; caption: string };
async function photosOf(owner: string): Promise<Photo[]> {
  const d = await db();
  return new Promise((resolve) => {
    const out: Photo[] = [];
    const req = d.transaction('photos').objectStore('photos').openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (!c) return resolve(out.sort((a, b) => a.at.localeCompare(b.at)));
      if ((c.value as Photo).owner === owner) out.push(c.value);
      c.continue();
    };
    req.onerror = () => resolve(out);
  });
}
async function putPhoto(p: Photo) {
  const d = await db();
  await new Promise<void>((resolve, reject) => {
    const tx = d.transaction('photos', 'readwrite');
    tx.objectStore('photos').put(p);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dropPhoto(key: string) {
  const d = await db();
  await new Promise<void>((resolve) => {
    const tx = d.transaction('photos', 'readwrite');
    tx.objectStore('photos').delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}
/** a photo made smaller (1400px at most) before it is kept, so the browser's storage is not filled */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85));
  } catch {
    return file;
  }
}

// ---------- the page ----------
let stop: (() => void) | undefined;
export function start() {
  stop?.();
  stop = undefined;
  const root = document.querySelector<HTMLElement>('[data-praxis]');
  const node = document.querySelector('[data-px-data]');
  if (!root || !node) return;
  const { p, words: W } = JSON.parse(node.textContent ?? '{}') as { p: Praxis; words: Words };
  const body = root.querySelector<HTMLElement>('[data-px-body]')!;
  const cleanups: (() => void)[] = [];
  stop = () => cleanups.splice(0).forEach((f) => f());

  const mine = (): Saved => loadAll()[p.id] ?? {};
  const keep = (change: (s: Saved) => void) => {
    const all = loadAll();
    const s = all[p.id] ?? {};
    change(s);
    all[p.id] = s;
    saveAll(all);
    return s;
  };
  const card = (...kids: (Node | string | null | false)[]) => h('div', { class: 'npx-card' }, ...kids);
  const writer = (value = '', placeholder = '') => {
    const t = h('textarea', { class: 'npx-write', rows: 3, placeholder }) as HTMLTextAreaElement;
    t.value = value;
    return t;
  };
  const notesList = (notes: { at: string; text: string }[] = []) =>
    notes.length ? h('ul', { class: 'npx-notes' }, ...notes.slice().reverse().map((n) => h('li', {}, h('b', {}, longDate(n.at.slice(0, 10))), ` · ${n.text}`))) : null;
  const done = () => keep((s) => (s.done = new Date().toISOString()));

  // ----- a meditation -----
  function meditation() {
    const steps = (p.steps ?? []) as Step[];
    const total = steps.reduce((s, x) => s + x.seconds, 0);
    const calm = new Calm();
    let unhush = () => {};
    let i = 0;
    let left = steps[0]?.seconds ?? 0;
    let running = false;
    let last = 0;
    let timer = 0;
    const R = 46;
    const C = 2 * Math.PI * R;
    const fillRing = svgEl('circle', { class: 'npx-ring__fill', cx: 50, cy: 50, r: R, 'stroke-dasharray': C, 'stroke-dashoffset': C });
    const svg = svgEl('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' });
    svg.append(svgEl('circle', { class: 'npx-ring__track', cx: 50, cy: 50, r: R }), fillRing);
    const time = h('div', { class: 'npx-ring__time', 'aria-live': 'off' });
    const text = h('p', { class: 'npx-med__step', 'aria-live': 'polite' }, steps[0]?.text ?? '');
    const stepLine = h('p', { class: 'npx-soft' });
    const dots = h('div', { class: 'npx-dots', 'aria-hidden': 'true' }, ...steps.map(() => h('i')));
    const go = h('button', { type: 'button', class: 'btn' }, W.start) as HTMLButtonElement;
    const skip = h('button', { type: 'button', class: 'btn btn--ghost' }, W.skip) as HTMLButtonElement;
    const sound = h('button', { type: 'button', class: 'npx-sound', 'aria-pressed': 'true' }, W.soundOn) as HTMLButtonElement;
    const after = h('div', { hidden: true });
    const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.ceil(s % 60)) % 60).padStart(2, '0')}`;
    const remaining = () => left + steps.slice(i + 1).reduce((s, x) => s + x.seconds, 0);
    const paint = () => {
      const r = remaining();
      time.textContent = mm(Math.ceil(r));
      fillRing.setAttribute('stroke-dashoffset', String(C * (r / total)));
      stepLine.textContent = fill(W.step, { i: Math.min(i + 1, steps.length), n: steps.length });
      dots.querySelectorAll('i').forEach((d, k) => {
        d.classList.toggle('is-done', k < i);
        d.classList.toggle('is-now', k === i);
      });
    };
    const show = (k: number) => {
      text.classList.add('is-fading');
      setTimeout(() => {
        text.textContent = steps[k]?.text ?? '';
        text.classList.remove('is-fading');
      }, 500);
    };
    const end = () => {
      running = false;
      clearInterval(timer);
      calm.bell(3);
      calm.stop(true);
      unhush();
      unhush = () => {};
      i = steps.length;
      left = 0;
      paint();
      go.hidden = true;
      skip.hidden = true;
      done();
      after.hidden = false;
    };
    const next = () => {
      if (i >= steps.length - 1) return end();
      i++;
      left = steps[i].seconds;
      calm.bell();
      show(i);
      paint();
    };
    const tick = () => {
      const now = performance.now();
      left -= (now - last) / 1000;
      last = now;
      if (left <= 0) next();
      else paint();
    };
    go.addEventListener('click', () => {
      if (!running) {
        running = true;
        last = performance.now();
        if (i === 0 && left === steps[0].seconds) {
          unhush = hushMusic();
          calm.start();
          calm.bell();
        } else calm.start();
        timer = window.setInterval(tick, 250);
        go.textContent = W.pause;
      } else {
        running = false;
        clearInterval(timer);
        calm.stop(false);
        go.textContent = W.resume;
      }
    });
    skip.addEventListener('click', () => {
      last = performance.now();
      next();
    });
    sound.addEventListener('click', () => {
      calm.on = !calm.on;
      sound.textContent = calm.on ? W.soundOn : W.soundOff;
      sound.setAttribute('aria-pressed', String(calm.on));
      if (!calm.on) calm.stop(false);
      else if (running) calm.start();
    });
    cleanups.push(() => {
      clearInterval(timer);
      calm.stop(false);
      unhush();
    });
    // afterwards: one line on what was noticed
    const note = writer('', W.noticed);
    const kept = h('p', { class: 'npx-soft', hidden: true }, W.saved);
    const list = h('div');
    const paintNotes = () => list.replaceChildren(notesList(mine().notes) ?? '');
    after.append(
      h('p', { class: 'npx-h' }, W.noticed),
      note,
      h(
        'div',
        { class: 'npx-row' },
        h('button', {
          type: 'button',
          class: 'btn',
          onclick: () => {
            const v = note.value.trim();
            if (v) keep((s) => (s.notes = [...(s.notes ?? []), { at: new Date().toISOString(), text: v }]));
            kept.hidden = false;
            note.value = '';
            paintNotes();
          },
        }, W.save),
        h('button', {
          type: 'button',
          class: 'btn btn--ghost',
          onclick: () => {
            i = 0;
            left = steps[0].seconds;
            text.textContent = steps[0].text;
            go.hidden = false;
            skip.hidden = false;
            go.textContent = W.start;
            after.hidden = true;
            kept.hidden = true;
            paint();
          },
        }, W.again),
      ),
      kept,
    );
    paintNotes();
    paint();
    body.append(
      card(
        h('div', { class: 'npx-med' }, h('div', { class: 'npx-ring' }, svg, time), stepLine, text, dots, h('div', { class: 'npx-row' }, go, skip), sound),
        after,
        list,
      ),
    );
  }

  // ----- a challenge: days, or a number of times -----
  function challenge() {
    const byDays = !!p.days;
    const n = p.days ?? p.times ?? 1;
    const box = card();
    body.append(box);
    const draw = () => {
      const s = mine();
      box.replaceChildren();
      box.append(h('p', { class: 'npx-h' }, W.todo), h('p', { class: 'npx-big' }, p.each ?? ''));
      if (!s.started) {
        box.append(
          h('button', {
            type: 'button',
            class: 'btn',
            onclick: () => {
              keep((x) => ((x.started = day()), (x.checks = []), delete x.done));
              draw();
            },
          }, W.begin),
        );
        return;
      }
      const checks = s.checks ?? [];
      const today = day();
      const dayNo = byDays ? daysBetween(s.started, today) + 1 : checks.length + 1;
      const checkedToday = byDays && checks.some((c) => c.at.slice(0, 10) === today);
      const over = byDays ? dayNo > n || checks.length >= n : checks.length >= n;
      // the days or times, as rounds: done, passed, today
      const marks = Array.from({ length: n }, (_, k) => {
        const c = byDays ? checks.find((x) => daysBetween(s.started!, x.at.slice(0, 10)) === k) : checks[k];
        const cls = c ? (c.did ? 'is-did' : 'is-skip') : !over && k === dayNo - 1 ? 'is-today' : '';
        return h('li', { class: `npx-day ${cls}`, title: fill(byDays ? W.day : W.time, { d: k + 1 }) }, String(k + 1));
      });
      box.append(h('ul', { class: 'npx-days', role: 'list' }, ...marks), h('p', { class: 'npx-soft' }, fill(W.count, { n: checks.filter((c) => c.did).length, total: n })));
      if (!over && !checkedToday) {
        const note = writer('', p.note ?? '');
        box.append(
          h('p', { class: 'npx-h' }, `${W.checkin} · ${fill(byDays ? W.day : W.time, { d: dayNo })}`),
          h('p', {}, p.note ?? ''),
          note,
          h(
            'div',
            { class: 'npx-row' },
            h('button', { type: 'button', class: 'btn', onclick: () => (keep((x) => (x.checks = [...(x.checks ?? []), { at: new Date().toISOString(), did: true, note: note.value.trim() }])), draw()) }, W.did),
            h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => (keep((x) => (x.checks = [...(x.checks ?? []), { at: new Date().toISOString(), did: false, note: note.value.trim() }])), draw()) }, W.skipped),
          ),
        );
      } else if (!over) box.append(h('p', { class: 'npx-soft' }, W.saved));
      if (over) {
        const last = writer(s.answers?.end ?? '', '');
        box.append(
          h('p', { class: 'npx-h' }, W.endTitle),
          h('p', {}, p.end ?? ''),
          last,
          h(
            'div',
            { class: 'npx-row' },
            h('button', { type: 'button', class: 'btn', onclick: () => (keep((x) => ((x.answers = { ...(x.answers ?? {}), end: last.value.trim() }), (x.done = new Date().toISOString()))), draw()) }, W.finish),
            h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => (keep((x) => ((x.started = day()), (x.checks = []), delete x.done)), draw()) }, W.restart),
          ),
          s.done ? h('p', { class: 'npx-soft' }, W.saved) : null,
        );
      }
      const notes = checks.filter((c) => c.note).map((c) => ({ at: c.at, text: c.note }));
      const list = notesList(notes);
      if (list) box.append(list);
    };
    draw();
  }

  // ----- written answers, saved together (mission, make, ritual, and the tools' questions) -----
  function questions(list: { key: string; label: string; hint?: string; placeholder?: string }[], onSave?: () => void) {
    const s = mine();
    const areas = list.map((q) => ({ q, t: writer(s.answers?.[q.key] ?? '', q.placeholder ?? '') }));
    const kept = h('p', { class: 'npx-soft', hidden: true }, W.saved);
    return [
      ...areas.flatMap(({ q, t }) => [h('p', { class: 'npx-big' }, q.label), q.hint ? h('p', { class: 'npx-soft' }, q.hint) : null, t]),
      h(
        'div',
        { class: 'npx-row' },
        h('button', {
          type: 'button',
          class: 'btn',
          onclick: () => {
            keep((x) => {
              x.answers = { ...(x.answers ?? {}) };
              for (const { q, t } of areas) x.answers[q.key] = t.value.trim();
              if (areas.every(({ t }) => t.value.trim())) x.done = new Date().toISOString();
            });
            kept.hidden = false;
            onSave?.();
          },
        }, W.save),
      ),
      kept,
    ];
  }

  function mission() {
    const s = mine();
    const ticks = (s.answers?.steps as boolean[]) ?? [];
    const list = h(
      'ul',
      { class: 'npx-check', role: 'list' },
      ...(p.steps as string[]).map((st, k) => {
        const box = h('input', { type: 'checkbox' }) as HTMLInputElement;
        box.checked = !!ticks[k];
        box.addEventListener('change', () => keep((x) => (x.answers = { ...(x.answers ?? {}), steps: (p.steps as string[]).map((_, j) => (j === k ? box.checked : !!((x.answers?.steps as boolean[]) ?? [])[j])) })));
        return h('li', {}, h('label', {}, box, h('span', {}, st)));
      }),
    );
    body.append(
      card(h('p', { class: 'npx-h' }, W.todo), list),
      h('div', { style: 'height: var(--space-m)' }),
      card(h('p', { class: 'npx-h' }, W.report), ...questions((p.report ?? []).map((label, k) => ({ key: `r${k}`, label })))),
    );
  }

  function make() {
    body.append(
      card(
        ...questions(
          (p.prompts ?? []).map((q, k) => ({ key: `m${k}`, label: q.label, hint: q.hint, placeholder: q.placeholder })),
          () => p.end && body.querySelector('.npx-end')?.removeAttribute('hidden'),
        ),
        p.end ? h('p', { class: 'npx-big npx-end', hidden: !mine().done }, p.end) : null,
      ),
    );
  }

  function ritual() {
    const kids: (Node | null)[] = [];
    if (p.date === 'winter-solstice') {
      const now = new Date();
      let year = now.getFullYear();
      if (day(now) > `${year}-12-21`) year++;
      const iso = `${year}-12-21`;
      kids.push(h('p', { class: 'npx-big' }, fill(W.on, { date: longDate(iso) })));
      if (p.calendar) {
        kids.push(
          h('button', {
            type: 'button',
            class: 'btn btn--ghost',
            onclick: () => {
              const d = iso.replace(/-/g, '');
              const next = day(new Date(Date.parse(`${iso}T12:00:00`) + 86400000)).replace(/-/g, '');
              const esc = (x: string) => x.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
              const ics = [
                'BEGIN:VCALENDAR',
                'VERSION:2.0',
                'PRODID:-//Athenoa//Nostos//EN',
                'BEGIN:VEVENT',
                `UID:${p.id}-${d}@athenoa`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
                `DTSTART;VALUE=DATE:${d}`,
                `DTEND;VALUE=DATE:${next}`,
                `SUMMARY:${esc(p.title)}`,
                `DESCRIPTION:${esc((p.steps as string[]).join('\n'))}`,
                'END:VEVENT',
                'END:VCALENDAR',
              ].join('\r\n');
              const a = h('a', { href: URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), download: `${p.id}.ics` });
              a.click();
            },
          }, W.calendar),
        );
      }
    }
    body.append(
      card(h('p', { class: 'npx-h' }, W.todo), ...kids, h('ol', { class: 'npx-list' }, ...(p.steps as string[]).map((st) => h('li', {}, st)))),
      h('div', { style: 'height: var(--space-m)' }),
      card(...questions([{ key: 'note', label: p.note ?? W.noticed }])),
    );
  }

  // ----- the tools -----
  function asleepAudit() {
    const s = mine();
    const values: Record<string, [number, number]> = s.answers?.areas ?? {};
    const areas = p.areas ?? [];
    const plot = h('div', { class: 'npx-plot', 'aria-hidden': 'true' });
    const drawPlot = () => {
      plot.replaceChildren(
        h('span', { class: 'npx-plot__axis', style: 'left:0.5rem;top:50%;translate:0 -50%' }, W.awake),
        h('span', { class: 'npx-plot__axis', style: 'right:0.5rem;top:50%;translate:0 -50%' }, W.asleep),
        h('span', { class: 'npx-plot__axis', style: 'top:0.4rem;left:50%;translate:-50% 0' }, W.satisfied),
        h('span', { class: 'npx-plot__axis', style: 'bottom:0.4rem;left:50%;translate:-50% 0' }, W.dissatisfied),
        ...areas.map((a) => {
          const [x, y] = values[a.id] ?? [50, 50];
          return h('span', { class: 'npx-plot__dot', style: `left:${8 + x * 0.84}%;top:${8 + y * 0.84}%` }, a.name);
        }),
      );
    };
    const slider = (a: { id: string }, k: 0 | 1, l: string, r: string) => {
      const input = h('input', { type: 'range', min: 0, max: 100, value: values[a.id]?.[k] ?? 50, 'aria-label': `${l} – ${r}` }) as HTMLInputElement;
      input.addEventListener('input', () => {
        values[a.id] = values[a.id] ?? [50, 50];
        values[a.id][k] = Number(input.value);
        keep((x) => (x.answers = { ...(x.answers ?? {}), areas: values }));
        drawPlot();
      });
      return h('div', { class: 'npx-slider' }, h('span', {}, l), input, h('span', {}, r));
    };
    const list = h(
      'ul',
      { class: 'npx-areas', role: 'list' },
      ...areas.map((a) => h('li', { class: 'npx-area' }, h('p', { class: 'npx-big' }, a.name), a.hint ? h('p', { class: 'npx-soft' }, a.hint) : null, slider(a, 0, W.awake, W.asleep), slider(a, 1, W.satisfied, W.dissatisfied))),
    );
    // the area that itches most
    const pick = h(
      'ul',
      { class: 'npx-check', role: 'list' },
      ...areas.map((a) => {
        const r = h('input', { type: 'radio', name: 'npx-itch', value: a.id }) as HTMLInputElement;
        r.checked = s.answers?.itch === a.id;
        r.addEventListener('change', () => keep((x) => (x.answers = { ...(x.answers ?? {}), itch: a.id })));
        return h('li', {}, h('label', {}, r, h('span', {}, a.name)));
      }),
    );
    drawPlot();
    body.append(
      card(list),
      h('div', { style: 'height: var(--space-m)' }),
      card(h('p', { class: 'npx-h' }, W.map), plot),
      h('div', { style: 'height: var(--space-m)' }),
      card(h('p', { class: 'npx-big' }, W.itch), pick, ...questions((p.questions ?? []).map((label, k) => ({ key: `q${k}`, label })))),
    );
  }

  function valuesSort() {
    const values = p.values ?? [];
    const box = card();
    const tail = h('div');
    body.append(box, h('div', { style: 'height: var(--space-m)' }), tail);
    const showOrder = (order: number[]) => {
      box.replaceChildren(
        h('p', { class: 'npx-h' }, W.yours),
        h('ol', { class: 'npx-order' }, ...order.map((k) => h('li', {}, `${values[k].greek} · ${values[k].name}`))),
        h('button', { type: 'button', class: 'btn btn--ghost', onclick: () => sort() }, W.again),
      );
      tail.replaceChildren(card(...questions((p.questions ?? []).map((label, k) => ({ key: `q${k}`, label })))));
    };
    // binary insertion: each new value is placed among those already in order, by asking which matters more
    const sort = async () => {
      tail.replaceChildren();
      const order: number[] = [];
      const queue = values.map((_, k) => k).sort(() => Math.random() - 0.5);
      for (let placed = 0; placed < queue.length; placed++) {
        const v = queue[placed];
        let lo = 0;
        let hi = order.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          const first = await ask(v, order[mid], placed, queue.length);
          if (first) hi = mid;
          else lo = mid + 1;
        }
        order.splice(lo, 0, v);
      }
      keep((x) => ((x.answers = { ...(x.answers ?? {}), order: order.map((k) => values[k].name) }), (x.done = new Date().toISOString())));
      showOrder(order);
    };
    const option = (k: number, choose: () => void) =>
      h(
        'button',
        { type: 'button', class: 'npx-value', onclick: choose },
        h('span', { class: 'npx-value__greek', lang: 'grc' }, values[k].greek),
        h('span', { class: 'npx-value__name' }, `${values[k].name}${values[k].translit ? ` (${values[k].translit})` : ''}`),
        h('span', { class: 'npx-soft' }, values[k].means),
      );
    const ask = (a: number, b: number, placed: number, n: number) =>
      new Promise<boolean>((resolve) =>
        box.replaceChildren(
          h('p', { class: 'npx-soft' }, fill(W.placed, { i: placed, n })),
          h('p', { class: 'npx-big' }, W.which),
          h('div', { class: 'npx-pair' }, option(a, () => resolve(true)), option(b, () => resolve(false))),
        ),
      );
    const saved = mine().answers?.order as string[] | undefined;
    if (saved?.length) showOrder(saved.map((name) => values.findIndex((v) => v.name === name)).filter((k) => k >= 0));
    else
      box.append(
        h('p', { class: 'npx-big' }, W.which),
        h('button', { type: 'button', class: 'btn', onclick: () => sort() }, W.begin),
      );
  }

  async function beautyJournal() {
    const needPhotos = p.photos ?? 3;
    const needThings = p.intangibles ?? 3;
    const grid = h('ul', { class: 'npx-photos', role: 'list' });
    const counts = h('p', { class: 'npx-soft' });
    const things = h('ul', { class: 'npx-notes' });
    const urls: string[] = [];
    cleanups.push(() => urls.forEach((u) => URL.revokeObjectURL(u)));
    const redraw = async () => {
      const photos = await photosOf(p.id).catch(() => [] as Photo[]);
      const list = mine().answers?.things ?? [];
      grid.replaceChildren(
        ...photos.map((ph) => {
          const url = URL.createObjectURL(ph.blob);
          urls.push(url);
          const cap = h('input', { type: 'text', value: ph.caption, placeholder: W.caption, 'aria-label': W.caption }) as HTMLInputElement;
          cap.addEventListener('change', () => putPhoto({ ...ph, caption: cap.value.trim() }));
          return h(
            'li',
            { class: 'npx-photo' },
            h('img', { src: url, alt: ph.caption || '' }),
            cap,
            h('button', { type: 'button', class: 'npx-sound', onclick: async () => (await dropPhoto(ph.key), redraw()) }, W.remove),
          );
        }),
      );
      things.replaceChildren(...list.map((x: { at: string; text: string }) => h('li', {}, h('b', {}, longDate(x.at.slice(0, 10))), ` · ${x.text}`)));
      counts.textContent = `${fill(W.photoCount, { n: photos.length, m: needPhotos })} · ${fill(W.thingCount, { n: list.length, m: needThings })}`;
      if (photos.length >= needPhotos && list.length >= needThings && !mine().done) done();
    };
    const file = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true }) as HTMLInputElement;
    file.addEventListener('change', async () => {
      for (const f of Array.from(file.files ?? [])) {
        await putPhoto({ key: `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, owner: p.id, at: new Date().toISOString(), blob: await shrink(f), caption: '' });
      }
      file.value = '';
      redraw();
    });
    const thing = writer('', p.note ?? '');
    body.append(
      card(
        counts,
        h('p', { class: 'npx-h' }, W.addPhoto),
        h('div', { class: 'npx-row' }, h('button', { type: 'button', class: 'btn', onclick: () => file.click() }, W.addPhoto), file),
        grid,
      ),
      h('div', { style: 'height: var(--space-m)' }),
      card(
        h('p', { class: 'npx-h' }, W.addThing),
        p.note ? h('p', {}, p.note) : null,
        thing,
        h('button', {
          type: 'button',
          class: 'btn',
          onclick: () => {
            const v = thing.value.trim();
            if (!v) return;
            keep((x) => (x.answers = { ...(x.answers ?? {}), things: [...((x.answers?.things as unknown[]) ?? []), { at: new Date().toISOString(), text: v }] }));
            thing.value = '';
            redraw();
          },
        }, W.save),
        things,
      ),
    );
    redraw();
  }

  function watchTalk() {
    const id = p.talk ?? '';
    const startAt = (p.from ?? '').split(':').reduce((s, x) => s * 60 + Number(x || 0), 0);
    const frame = h(
      'div',
      { class: 'npx-video' },
      h('img', { src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, alt: '', loading: 'lazy' }),
      h('button', {
        type: 'button',
        onclick: () =>
          frame.replaceChildren(
            h('iframe', {
              src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1${startAt ? `&start=${startAt}` : ''}`,
              allow: 'autoplay; encrypted-media; picture-in-picture',
              allowfullscreen: true,
              title: p.title,
            }),
          ),
      }, h('span', {}, W.watch)),
    );
    body.append(
      card(
        (p.before ?? []).length ? h('p', { class: 'npx-h' }, W.hold) : null,
        ...(p.before ?? []).map((q) => h('p', { class: 'npx-big' }, q)),
        frame,
      ),
      h('div', { style: 'height: var(--space-m)' }),
      card(h('p', { class: 'npx-h' }, W.after), ...questions((p.after ?? []).map((label, k) => ({ key: `a${k}`, label })))),
    );
  }

  body.replaceChildren();
  if (p.kind === 'meditation') meditation();
  else if (p.kind === 'challenge') challenge();
  else if (p.kind === 'mission') mission();
  else if (p.kind === 'make') make();
  else if (p.kind === 'ritual') ritual();
  else if (p.tool === 'asleep-audit') asleepAudit();
  else if (p.tool === 'values-sort') valuesSort();
  else if (p.tool === 'beauty-journal') beautyJournal();
  else if (p.tool === 'watch-talk') watchTalk();
}
