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
/** an option; `note` is a short line in plain words under it, so the phrase is easy to recognise */
type Option = { text: string; to: Score; note?: string };
export type Item =
  | { kind: 'choice'; id: string; prompt: string; options: Option[]; max?: number }
  | { kind: 'ladder'; id: string; prompt: string; rungs: Option[]; max?: number }
  /** a line of 5 or 7 points between two ends (client direction, 7 November 2026: scales wherever
   *  they fit, for nuance), with an optional label on its middle point. `to` counts from −1 at the left
   *  end to +1 at the right; `mid` scores the nearer the answer is to the middle (a mean between two
   *  excesses), `ends` the further from it, either way */
  | { kind: 'scale'; id: string; prompt: string; left: string; right: string; middle?: string; steps?: 5 | 7; to?: Score; mid?: Score; ends?: Score }
  | { kind: 'pairs'; id: string; prompt: string; pairs: { a: string; aTo: Score; b: string; bTo: Score }[] }
  | { kind: 'rank'; id: string; prompt: string; options: Option[] }
  | { kind: 'points'; id: string; prompt: string; total: number; options: { text: string; to: string }[] }
  | { kind: 'multi'; id: string; prompt: string; max: number; options: Option[] }
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
/** Where each reflection stands on the path (client direction, 7 November 2026: part of the path, more
 *  often between lessons than at a chapter's end): straight after the lesson in which the last of the
 *  ideas it rests on is met, at the latest at the end of the chapter it was written for; the last one,
 *  which reads all the others, at the end of that chapter. Keyed by "chapter index:lesson index" (the
 *  lesson it follows). */
export function reflectionSpots(chapters: { id: string; lessons: string[][] }[]) {
  const spots = new Map<string, Reflection>();
  for (const r of reflections) {
    const end = chapters.findIndex((c) => c.id === r.after);
    if (end < 0) continue;
    let at: [number, number] = [end, chapters[end].lessons.length - 1];
    const ideas = new Set(r.concepts.map((id) => `c${id}`));
    let found: [number, number] | null = null;
    for (let ci = 0; ci <= end; ci++)
      chapters[ci].lessons.forEach((lesson, li) => {
        if (lesson.some((u) => ideas.has(u))) found = [ci, li];
      });
    // the last reflection reads all the others: it closes the path
    if (found && r.n !== reflections.length) at = found;
    // never two on the same spot: the later one moves one lesson on
    while (spots.has(at.join(':')) && at[1] + 1 < chapters[at[0]].lessons.length) at = [at[0], at[1] + 1];
    spots.set(at.join(':'), r);
  }
  return spots;
}
