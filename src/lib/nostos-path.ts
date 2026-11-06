// Nostos, the path: one route through everything in Nostos, built at build time from src/data/nostos/.
// A chapter for each talk, in the order of talks.json, then one for the items no talk claims. Inside a
// chapter the items follow the talk (by their timestamp where they have one, otherwise by their place in
// their own list), each idea is introduced just before the first item that speaks of it, and the whole
// is cut into lessons of about eight steps. Every step has a short id made from its content, so the
// visitor's progress survives when items are added or reordered.
//
// THE CONTENT IS NEW WORDING generated from her talks, for Athena to review (src/lib/nostos.ts).
import {
  conceptById,
  concepts,
  distinctions,
  edges,
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
 *  k a connection: one of Athena's links between two ideas, met as soon as both are known
 *  p practice · w question to carry · l her line · x bookshelf passage */
export type StepKind = 'c' | 'q' | 'tf' | 's' | 'm' | 'e' | 'd' | 'i' | 'k' | 'p' | 'w' | 'l' | 'x';
export type Step = { k: StepKind; [field: string]: unknown };
/** the kinds that come back in Review (the rest are read, not asked) */
export const asked: StepKind[] = ['c', 'q', 'tf', 's', 'm', 'e', 'd', 'i', 'k'];

const LESSON = 8;

// a short, stable id from the content (FNV-1a, base 36)
const hash = (text: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
};

type Entry = { u: string; step: Step; at: number; text: string; main?: string; talk?: string };
const entries: Entry[] = [];
const taken = new Set<string>();
// `main` is what the item is about (its question, title or word), without its explanation
function add(kind: StepKind, key: string, step: Omit<Step, 'k'>, text: string, talk?: string, at = -1, main?: string) {
  let u = `${kind}${hash(key)}`;
  while (taken.has(u)) u += 'x';
  taken.add(u);
  entries.push({ u, step: { k: kind, ...step }, at, text: plain(text), main: main ? plain(main) : undefined, talk });
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
  for (const x of quiz) add('q', x.q, { ...x }, `${x.q} ${x.a} ${x.explain ?? ''}`, x.talk, at(x), `${x.q} ${x.a}`);
  at = place(truefalse);
  for (const x of truefalse) add('tf', x.s, { ...x }, `${x.s} ${x.explain ?? ''}`, x.talk, at(x), x.s);
  at = place(sequences);
  for (const x of sequences) add('s', x.id || x.title, { ...x }, `${x.title} ${x.steps.join(' ')}`, x.talk, at(x), x.title);
  at = place(myths);
  for (const x of myths) add('m', x.id || x.title, { ...x }, `${x.title} ${x.beats.map((b) => b.beat).join(' ')}`, x.talk, at(x), x.title);
  at = place(etymologies);
  for (const x of etymologies) add('e', x.word, { ...x }, `${x.word} ${x.reading}`, x.talk, at(x), `${x.word} ${x.translit ?? ''}`);
  // a distinction without both glosses cannot be asked: it is read instead
  at = place(distinctions);
  for (const x of distinctions)
    add('d', `${x.a}|${x.b}`, { ...x, read: !(x.a_gloss && x.b_gloss) || undefined }, `${x.a} ${x.b} ${x.point ?? ''}`, x.talk, at(x), `${x.a} ${x.b}`);
  at = place(images);
  for (const x of images) add('i', x.image, { ...x }, `${x.image} ${x.meaning}`, x.talk, at(x), x.image);
  at = place(practices);
  for (const x of practices) add('p', x.title, { ...x }, `${x.title} ${x.why ?? ''}`, x.talk, at(x), x.title);
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
        `${e.work} ${e.label ?? ''}`,
      );
  }
}

// ---------- chapters ----------
/** A chapter: a stage of the arc (`stage`, with the place on the journey it shows, `scene`), or, before
 *  the arc was made, a talk */
export type Chapter = { id: string; title: string; talk?: string; stage?: string; scene?: string; lessons: string[][]; steps: Record<string, Step> };
const order = talks.map((t) => t.id);
const introduced = new Set<string>();
// an idea is spoken of when its Greek or its name appears as a whole word
function spokenOf(c: (typeof concepts)[number]) {
  return [c.greek, c.label.replace(/^the\s+/i, '').replace(/\s*\(.*?\)/g, '')]
    .filter(Boolean)
    .map((w) => plain(w!).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter((w) => w.length > 2)
    .map((w) => new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, 'u'));
}

// One chapter's route, before the connections: its items in the order of the talk, each idea
// introduced just before the first item that speaks of it
function route(talk: string | undefined, list: Entry[]): Entry[] {
  list.sort((a, b) => a.at - b.at);
  // the ideas this chapter introduces: those that come up in this talk and in no earlier one
  const ideas = concepts.filter((c) => !introduced.has(c.id) && (talk ? c.talks.some((r) => r.id === talk) : true));
  ideas.forEach((c) => introduced.add(c.id));
  const words = spokenOf;
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
  const out: Entry[] = [];
  list.forEach((e, n) => out.push(...(before.get(n) ?? []), e));
  if (!list.length) out.push(...(before.get(0) ?? []));
  return out;
}

// A chapter's title is its talk's, without Athena's name: everything here is hers (client direction,
// 6 November 2026). "Dr Athena D. Potari on Plato and Non-Duality" becomes "Plato and Non-Duality",
// "The Art of Living - Dr Athena Potari" becomes "The Art of Living". Talks & Articles keeps the titles
// as published.
const NAME = String.raw`(?:Dr\.?\s+)?Athena(?:\s+(?:D\.|Despina|Despoina))?\s+Potari`;
const chapterTitle = (title: string) => {
  const t = title
    .replace(new RegExp(`^${NAME}\\s*:\\s*`), '')
    .replace(new RegExp(`^${NAME}\\s+on\\s+her\\s+`), 'The ')
    .replace(new RegExp(`^${NAME}\\s+on\\s+`), '')
    .replace(new RegExp(`\\s*[-–—]\\s*${NAME}\\s*$`), '')
    .replace(new RegExp(`\\s+with\\s+${NAME}`), '')
    .trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

type RouteOf = { id: string; title: string; talk?: string; stage?: string; scene?: string; route: Entry[] };

// ---------- the arc (src/data/nostos-arc.json) ----------
// One considered arc of Athena's teaching in nine stages, each a place on the journey home (client
// direction, 6 November 2026): every idea is taught in the stage the arc gives it, in the arc's order,
// and every item (question, myth, root, passage...) follows the last of the ideas it is about, whatever
// talk it came from. Without the arc, a chapter per talk as before.
type Arc = { stages: { id: string; scene: string }[]; ideas: Record<string, string[]> };
const arc = Object.values(import.meta.glob<Arc>('../data/nostos-arc.json', { eager: true, import: 'default' }))[0];

function arcRoutes(a: Arc): RouteOf[] {
  const stageOf = new Map<string, number>();
  const rank = new Map<string, number>();
  let r = 0;
  a.stages.forEach((st, si) =>
    (a.ideas[st.id] ?? []).forEach((id) => {
      if (conceptById(id) && !stageOf.has(id)) stageOf.set(id, si), rank.set(id, r++);
    }),
  );
  // an idea the arc does not name yet (from a talk added since) joins the stage of its theme, at its end
  const byTheme: Record<string, string> = { path: 'call', soul: 'soul', ethics: 'goodlife', cosmos: 'cosmos', ways: 'call', thinkers: 'call', gods: 'mysteries' };
  for (const c of concepts)
    if (!stageOf.has(c.id)) stageOf.set(c.id, Math.max(0, a.stages.findIndex((st) => st.id === byTheme[c.group]))), rank.set(c.id, r++);
  const pos = (id: string) => stageOf.get(id)! * 10000 + rank.get(id)!;
  const found = concepts.map((c) => ({ id: c.id, words: spokenOf(c) }));
  const about = (text: string) => found.filter((f) => f.words.some((w) => w.test(text))).map((f) => f.id);
  // a talk's stage, for an item that names no idea: where most of what the talk teaches is taught
  const talkStage = new Map<string, number>();
  for (const t of order) {
    const votes = new Map<number, number>();
    concepts.filter((c) => c.talks.some((x) => x.id === t)).forEach((c) => votes.set(stageOf.get(c.id)!, (votes.get(stageOf.get(c.id)!) ?? 0) + c.weight));
    talkStage.set(t, [...votes].sort((x, y) => y[1] - x[1])[0]?.[0] ?? 0);
  }
  // each item follows the last of the ideas it is about (its main text first, else its whole text)
  const anchored = new Map<string, Entry[]>();
  const loose = new Map<number, Entry[]>();
  for (const e of entries) {
    const ids = (e.main && about(e.main).length ? about(e.main) : about(e.text)).sort((x, y) => pos(x) - pos(y));
    const last = ids[ids.length - 1];
    if (last) anchored.set(last, [...(anchored.get(last) ?? []), e]);
    else {
      const si = e.talk ? talkStage.get(e.talk) ?? 0 : 0;
      loose.set(si, [...(loose.get(si) ?? []), e]);
    }
  }
  // the kinds taken in turn, so a run of steps on one idea is not all questions
  const mixed = (list: Entry[]) => {
    const byKind = new Map<string, Entry[]>();
    list.sort((x, y) => x.at - y.at).forEach((e) => byKind.set(e.step.k, [...(byKind.get(e.step.k) ?? []), e]));
    const out: Entry[] = [];
    const queues = [...byKind.values()];
    while (queues.some((q) => q.length)) queues.forEach((q) => q.length && out.push(q.shift()!));
    return out;
  };
  const NOW_ITEMS = 5;
  const LATER = 3;
  return a.stages.map((st, si) => {
    const ideas = [...stageOf].filter(([, s]) => s === si).map(([id]) => id).sort((x, y) => pos(x) - pos(y));
    const route: Entry[] = [];
    const later: Entry[] = [];
    for (const id of ideas) {
      introduced.add(id);
      route.push({ u: `c${id}`, step: { k: 'c', id }, at: -1, text: '' });
      const own = mixed(anchored.get(id) ?? []);
      route.push(...own.slice(0, NOW_ITEMS));
      later.push(...own.slice(NOW_ITEMS));
      // what an earlier idea still has to say comes back a few steps at a time
      route.push(...later.splice(0, LATER));
    }
    route.push(...later.splice(0), ...mixed(loose.get(si) ?? []));
    return { id: st.id, title: '', stage: st.id, scene: st.scene, route };
  });
}

const routes: RouteOf[] = arc
  ? arcRoutes(arc)
  : [
      ...order.map((id) => ({ id, title: chapterTitle(talkName(id)), talk: id as string | undefined, route: route(id, entries.filter((e) => e.talk === id)) })),
      // what no talk claims (and any idea not met yet) closes the path
      { id: 'across', title: '', talk: undefined, route: route(undefined, entries.filter((e) => !e.talk || !order.includes(e.talk))) },
    ];

// ---------- connections ----------
// Athena's links, where she says why. Each is met as soon as both of its ideas are known: the moment the
// second one is introduced, it is tested against the first (client direction, 6 November 2026), so
// what is learnt is tied to what was learnt before. Up to two come straight after the new idea; any
// more wait and come one every couple of steps after it, so a well-linked idea late on the path does
// not bring a wall of them at once. The further along, the more of them there are: the graph of what
// is known grows denser.
const herLinks = edges.filter((e) => e.her && e.why && e.why.length > 12 && conceptById(e.a) && conceptById(e.b));
const tied = new Map<string, Set<string>>();
const linksOf = new Map<string, typeof herLinks>();
for (const e of herLinks) {
  tied.set(e.a, (tied.get(e.a) ?? new Set()).add(e.b));
  tied.set(e.b, (tied.get(e.b) ?? new Set()).add(e.a));
  linksOf.set(e.a, [...(linksOf.get(e.a) ?? []), e]);
  linksOf.set(e.b, [...(linksOf.get(e.b) ?? []), e]);
}
// an idea's name taken out of a sentence (its label, its Greek, its spelling, and the stems of its
// longer words, so "immanent" goes with "Immanence"): a question must not answer itself
const unnamed = new Set(['the', 'and', 'of', 'as', 'in', 'to', 'its', 'his', 'her', 'their', 'with', 'from']);
const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function blank(text: string, ...ids: string[]) {
  return ids.reduce((out, id) => {
    const c = conceptById(id);
    if (!c) return out;
    const whole = [c.label.replace(/\s*\(.*?\)/g, ''), ...(c.label.match(/\(([^)]*)\)/)?.slice(1) ?? []), c.greek, c.translit]
      .filter((w): w is string => !!w && w.trim().length > 2)
      .map((w) => new RegExp(`(?<!\\p{L})${esc(w.trim())}(?!\\p{L})`, 'giu'));
    const stems = c.label
      .replace(/[()]/g, ' ')
      .split(/[\s,·/–-]+/)
      .filter((w) => w.length >= 5 && !unnamed.has(w.toLowerCase()))
      .map((w) => new RegExp(`(?<!\\p{L})${esc(w.slice(0, Math.max(5, w.length - 3)))}\\p{L}*`, 'giu'));
    return [...whole, ...stems].reduce((t, re) => t.replace(re, '___'), out);
  }, text);
}
// the step for one link, `fresh` the idea just met, `known` the one met before
function connection(e: (typeof herLinks)[number], fresh: string, known: string): Entry {
  const key = `${e.a}|${e.b}`;
  // other ideas Athena links to neither end, for "which idea is at the other end?" (in Review)
  const not = concepts
    .filter((c) => c.weight >= 2 && c.id !== e.a && c.id !== e.b && !tied.get(e.a)?.has(c.id) && !tied.get(e.b)?.has(c.id))
    .map((c) => c.id)
    .sort((x, y) => hash(key + x).localeCompare(hash(key + y)))
    .slice(0, 5);
  // other reasons, for "how does Athena connect them?": first from the two ideas' other links, so
  // they sound alike, then from anywhere; every name blanked, the right reason's too
  const near = [...(linksOf.get(fresh) ?? []), ...(linksOf.get(known) ?? [])].filter((x) => x !== e);
  const far = herLinks.filter((x) => x !== e && !near.includes(x)).sort((x, y) => hash(key + x.a + x.b).localeCompare(hash(key + y.a + y.b)));
  const seen = new Set<string>();
  const alts = [...near.sort((x, y) => hash(key + x.a + x.b).localeCompare(hash(key + y.a + y.b))), ...far]
    .map((x) => blank(x.why!, x.a, x.b))
    .filter((w) => w.length > 12 && !seen.has(w) && (seen.add(w), true))
    .slice(0, 3);
  let u = `k${hash(key)}`;
  while (taken.has(u)) u += 'x';
  taken.add(u);
  return {
    u,
    step: { k: 'k', a: fresh, b: known, why: e.why, ask: blank(e.why!, known), bare: blank(e.why!, fresh, known), alts, not },
    at: -1,
    text: '',
  };
}
const NOW = 2;
const GAP = 2;
const known = new Set<string>();
const waiting: Entry[] = [];
const placedRoutes = routes.map((r) => {
  const out: Entry[] = [];
  let since = 0;
  for (const e of r.route) {
    out.push(e);
    if (e.step.k === 'c') {
      const id = e.step.id as string;
      const fresh = (linksOf.get(id) ?? [])
        .map((x) => ({ x, other: x.a === id ? x.b : x.a }))
        .filter(({ other }) => known.has(other))
        .sort((p, q) => conceptById(q.other)!.weight - conceptById(p.other)!.weight)
        .map(({ x, other }) => connection(x, id, other));
      known.add(id);
      out.push(...fresh.slice(0, NOW));
      waiting.push(...fresh.slice(NOW));
      since = 0;
    } else if (e.step.k !== 'k' && waiting.length && ++since >= GAP) {
      out.push(waiting.shift()!);
      since = 0;
    }
  }
  return { ...r, route: out };
});
// what is still waiting at the very end closes the last chapter
placedRoutes[placedRoutes.length - 1].route.push(...waiting.splice(0));

// lessons of about eight steps, as even as they come
function chapter(r: (typeof placedRoutes)[number]): Chapter {
  const count = Math.max(1, Math.round(r.route.length / LESSON));
  const lessons = Array.from({ length: count }, (_, j) =>
    r.route.slice(Math.round((j * r.route.length) / count), Math.round(((j + 1) * r.route.length) / count)).map((e) => e.u),
  );
  return { id: r.id, title: r.title, talk: r.talk, stage: r.stage, scene: r.scene, lessons, steps: Object.fromEntries(r.route.filter((e) => e.step.k !== 'c').map((e) => [e.u, e.step])) };
}

export const chapters: Chapter[] = placedRoutes.map(chapter).filter((c) => c.lessons.some((l) => l.length));

/** The outline the play page carries: chapters and their lessons as lists of step ids */
export const pathOutline = chapters.map((c) => ({ id: c.id, title: c.title, talk: c.talk, stage: c.stage, scene: c.scene, lessons: c.lessons }));
/** How many steps come back in Review: every idea and every step that asks something */
export const askedTotal = chapters.reduce(
  (n, c) => n + c.lessons.flat().filter((u) => u.startsWith('c') || (asked.includes(c.steps[u].k) && !c.steps[u].read)).length,
  0,
);
