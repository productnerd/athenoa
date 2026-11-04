// Nostos, the path: one route through everything in Nostos, built at build time from src/data/nostos/.
// A chapter for each talk, in the order of talks.json, then one for the items no talk claims. Inside a
// chapter the items follow the talk (by their timestamp where they have one, otherwise by their place in
// their own list), each idea is introduced just before the first item that speaks of it, and the whole
// is cut into lessons of about eight steps. Every step has a short id made from its content, so the
// visitor's progress survives when items are added or reordered.
//
// THE CONTENT IS NEW WORDING generated from her talks, for Athena to review (src/lib/nostos.ts).
import {
  concepts,
  distinctions,
  etymologies,
  images,
  library,
  lines,
  myths,
  plain,
  practices,
  questions,
  quiz,
  seconds,
  sequences,
  talkName,
  talks,
  truefalse,
} from './nostos';

/** c idea · q question · tf true or false · s order · m myth · e roots · d distinction · i image
 *  p practice · w question to carry · l her line · x bookshelf passage */
export type StepKind = 'c' | 'q' | 'tf' | 's' | 'm' | 'e' | 'd' | 'i' | 'p' | 'w' | 'l' | 'x';
export type Step = { k: StepKind; [field: string]: unknown };
/** the kinds that come back in Review (the rest are read, not asked) */
export const asked: StepKind[] = ['c', 'q', 'tf', 's', 'm', 'e', 'd', 'i'];

const LESSON = 8;

// a short, stable id from the content (FNV-1a, base 36)
const hash = (text: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
};

type Entry = { u: string; step: Step; at: number; text: string; talk?: string };
const entries: Entry[] = [];
const taken = new Set<string>();
function add(kind: StepKind, key: string, step: Omit<Step, 'k'>, text: string, talk?: string, at = -1) {
  let u = `${kind}${hash(key)}`;
  while (taken.has(u)) u += 'x';
  taken.add(u);
  entries.push({ u, step: { k: kind, ...step }, at, text: plain(text), talk });
}
// where an item falls in its talk, 0 to 1: its timestamp, or its place among the items of its kind
const place = <T extends { talk?: string; t?: string | number }>(list: T[]) => {
  const count = new Map<string, number>();
  const seen = new Map<string, number>();
  list.forEach((x) => x.talk && count.set(x.talk, (count.get(x.talk) ?? 0) + 1));
  return (x: T) => {
    if (!x.talk) return -1;
    const n = seen.get(x.talk) ?? 0;
    seen.set(x.talk, n + 1);
    const talk = talks.find((t) => t.id === x.talk);
    const length = seconds(talk?.dur);
    const s = seconds(x.t);
    return s && length ? Math.min(1, s / length) : (n + 0.5) / count.get(x.talk)!;
  };
};

{
  let at = place(quiz);
  for (const x of quiz) add('q', x.q, { ...x }, `${x.q} ${x.a} ${x.explain ?? ''}`, x.talk, at(x));
  at = place(truefalse);
  for (const x of truefalse) add('tf', x.s, { ...x }, `${x.s} ${x.explain ?? ''}`, x.talk, at(x));
  at = place(sequences);
  for (const x of sequences) add('s', x.id || x.title, { ...x }, `${x.title} ${x.steps.join(' ')}`, x.talk, at(x));
  at = place(myths);
  for (const x of myths) add('m', x.id || x.title, { ...x }, `${x.title} ${x.beats.map((b) => b.beat).join(' ')}`, x.talk, at(x));
  at = place(etymologies);
  for (const x of etymologies) add('e', x.word, { ...x }, `${x.word} ${x.reading}`, x.talk, at(x));
  // a distinction without both glosses cannot be asked: it is read instead
  at = place(distinctions);
  for (const x of distinctions)
    add('d', `${x.a}|${x.b}`, { ...x, read: !(x.a_gloss && x.b_gloss) || undefined }, `${x.a} ${x.b} ${x.point ?? ''}`, x.talk, at(x));
  at = place(images);
  for (const x of images) add('i', x.image, { ...x }, `${x.image} ${x.meaning}`, x.talk, at(x));
  at = place(practices);
  for (const x of practices) add('p', x.title, { ...x }, `${x.title} ${x.why ?? ''}`, x.talk, at(x));
  at = place(questions);
  for (const x of questions) add('w', x.q, { ...x }, x.q, x.talk, at(x));
  at = place(lines);
  for (const x of lines) add('l', x.text, { ...x }, x.text, x.talk, at(x));
  for (const w of library.works) {
    const excerpts = w.excerpts.map((e) => ({ ...e, work: w.title, author: w.author }));
    at = place(excerpts);
    for (const e of excerpts)
      add(
        'x',
        `${w.id}|${e.ref}|${e.label ?? ''}`,
        { work: e.work, author: e.author, ref: e.ref, label: e.label, translation: e.translation, translator: e.translator, reading: e.her_reading, talk: e.talk, t: e.t },
        `${e.label ?? ''} ${e.her_reading ?? ''}`,
        e.talk,
        at(e),
      );
  }
}

// ---------- chapters ----------
export type Chapter = { id: string; title: string; talk?: string; lessons: string[][]; steps: Record<string, Step> };
const order = talks.map((t) => t.id);
const introduced = new Set<string>();

function chapter(id: string, title: string, list: Entry[], talk?: string): Chapter {
  list.sort((a, b) => a.at - b.at);
  // the ideas this chapter introduces: those that come up in this talk and in no earlier one
  const ideas = concepts.filter((c) => !introduced.has(c.id) && (talk ? c.talks.some((r) => r.id === talk) : true));
  ideas.forEach((c) => introduced.add(c.id));
  // an idea is spoken of when its Greek or its name appears as a whole word
  const words = (c: (typeof concepts)[number]) =>
    [c.greek, c.label.replace(/^the\s+/i, '').replace(/\s*\(.*?\)/g, '')]
      .filter(Boolean)
      .map((w) => plain(w!).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter((w) => w.length > 2)
      .map((w) => new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, 'u'));
  // where each idea is introduced: just before the first item that speaks of it, else at the moment
  // the talk reaches it, else spread through the chapter; never more ideas in a row than the chapter
  // needs, so a lesson is not a list of new words
  const length = seconds(talks.find((t) => t.id === talk)?.dur);
  const spots = ideas.map((c, k) => {
    const found = words(c);
    const hit = list.findIndex((e) => found.some((w) => w.test(e.text)));
    const s = seconds(c.talks.find((r) => r.id === talk)?.t);
    const at = hit >= 0 ? hit : s && length ? list.findIndex((e) => e.at >= s / length) : -1;
    return { c, at: at >= 0 ? at : Math.floor(((k + 0.5) / ideas.length) * list.length) };
  });
  const most = Math.max(1, Math.ceil(ideas.length / Math.max(1, list.length)));
  const before = new Map<number, Entry[]>();
  spots
    .sort((a, b) => a.at - b.at || b.c.weight - a.c.weight)
    .forEach((spot, k) => {
      const at = Math.min(Math.max(spot.at, Math.floor(k / most)), Math.max(0, list.length - 1));
      before.set(at, [...(before.get(at) ?? []), { u: `c${spot.c.id}`, step: { k: 'c', id: spot.c.id }, at: -1, text: '' }]);
    });
  const route: Entry[] = [];
  list.forEach((e, n) => route.push(...(before.get(n) ?? []), e));
  if (!list.length) route.push(...(before.get(0) ?? []));
  // lessons of about eight steps, as even as they come
  const count = Math.max(1, Math.round(route.length / LESSON));
  const lessons = Array.from({ length: count }, (_, j) =>
    route.slice(Math.round((j * route.length) / count), Math.round(((j + 1) * route.length) / count)).map((e) => e.u),
  );
  return { id, title, talk, lessons, steps: Object.fromEntries(route.filter((e) => e.step.k !== 'c').map((e) => [e.u, e.step])) };
}

export const chapters: Chapter[] = [
  ...order.map((id) => chapter(id, talkName(id), entries.filter((e) => e.talk === id), id)),
  // what no talk claims (and any idea not met yet) closes the path
  chapter('across', '', entries.filter((e) => !e.talk || !order.includes(e.talk))),
].filter((c) => c.lessons.some((l) => l.length));

/** The outline the play page carries: chapters and their lessons as lists of step ids */
export const pathOutline = chapters.map((c) => ({ id: c.id, title: c.title, talk: c.talk, lessons: c.lessons }));
/** How many steps come back in Review: every idea and every step that asks something */
export const askedTotal = chapters.reduce(
  (n, c) => n + c.lessons.flat().filter((u) => u.startsWith('c') || (asked.includes(c.steps[u].k) && !c.steps[u].read)).length,
  0,
);
