// Nostos, the reflections (client request, 7 November 2026): every two or three chapters of Learn, a
// short exercise about oneself. The learner answers 7 to 12 varied items (at least two in their own
// words), the page scores them into one of the reflection's groupings, and Claude (on the visitor's own
// key, like the tutor) writes a personal analysis no longer than an A4 page. The content is one JSON
// file each in src/data/nostos-reflections/, in the format of tasks/nostos-reflections-spec.md, checked
// by scripts/nostos-reflections-check.mjs. THE WORDING IS NEW, proposed, for Athena to review.
//
// TODO (later phase, Maria, 7 November 2026; not built yet):
// - The plan, "what you leave with", after the analysis: each file's `later.plan` holds the plan
//   proposed in tasks/nostos-reflections.md. Perhaps in one shape for those that have one (`later.shape`):
//   Add one practice with its dose (when, how long, how often), Cut one thing, Watch one cue. Maybe not
//   for every reflection.
// - A check-in 7 days after a plan: two questions (did you do it, what changed).
// - Retake after 4 to 6 weeks, to see the movement: a reminder, and the result set beside the last one
//   (the page already keeps every past result in this browser and shows the last one on a retake).

export type Score = Record<string, number>;
export type Item =
  | { kind: 'choice'; id: string; prompt: string; options: { text: string; to: Score }[] }
  | { kind: 'ladder'; id: string; prompt: string; rungs: { text: string; to: Score }[] }
  | { kind: 'scale'; id: string; prompt: string; left: string; right: string; to: Score }
  | { kind: 'pairs'; id: string; prompt: string; pairs: { a: string; aTo: Score; b: string; bTo: Score }[] }
  | { kind: 'rank'; id: string; prompt: string; options: { text: string; to: Score }[] }
  | { kind: 'points'; id: string; prompt: string; total: number; options: { text: string; to: string }[] }
  | { kind: 'multi'; id: string; prompt: string; max: number; options: { text: string; to: Score }[] }
  | { kind: 'text'; id: string; prompt: string; hint?: string; placeholder?: string };

export type Reflection = {
  id: string;
  n: number;
  after: string;
  title: string;
  line: string;
  intro: string;
  concepts: string[];
  types: { id: string; name: string; short: string; about: string; concepts?: string[] }[];
  items: Item[];
  looks: string;
  learn: string;
  /** not used yet: see the TODO above */
  later?: { plan?: string; shape?: string };
  ai: string;
  reads?: string[];
};

// seconds each kind of item takes, for the time shown (as in the checker)
const SECONDS: Record<string, number> = { choice: 20, ladder: 20, scale: 8, rank: 30, points: 35, multi: 20, text: 75 };
export const minutesOf = (r: Reflection) =>
  Math.max(2, Math.round(r.items.reduce((s, it) => s + (it.kind === 'pairs' ? 6 * it.pairs.length : SECONDS[it.kind] ?? 20), 0) / 60));

const files = import.meta.glob<Reflection>('../data/nostos-reflections/*.json', { eager: true, import: 'default' });
export const reflections: Reflection[] = Object.values(files).sort((a, b) => a.n - b.n);
export const reflectionById = (id: string) => reflections.find((r) => r.id === id);
/** the reflection that follows a chapter, if any */
export const reflectionAfter = (chapter: string) => reflections.find((r) => r.after === chapter);
