// Nostos: the visitor's progress, kept in this browser only (localStorage, one key), in the
// prototype's shape so the two stay compatible: { xp, days, srs, known, best, done }.
// Experience points climb Diotima's ladder (the rungs are shown on the play page). Nothing is sent
// anywhere; accounts and sync may come later (tasks/nostos.md, Progress).

export interface Progress {
  xp: number;
  /** points earned per day, "2026-11-04": 12 */
  days: Record<string, number>;
  /** Leitner boxes for the Logos cards: concept id -> { box, due } */
  srs: Record<string, { box: number; due: string }>;
  /** stars the visitor knows: concept id -> the day it was marked */
  known: Record<string, string>;
  /** best scores per activity */
  best: Record<string, number>;
  /** rounds played per activity */
  done: Record<string, number>;
  /** the visitor's own links (Threads): concept id -> what it reminds them of */
  threads?: Record<string, string>;
  /** the path: step id -> 1 once read, or [box, due] for a step that comes back in Review */
  path?: Record<string, 1 | [number, string]>;
  /** the lesson last begun on the path: [chapter, lesson] (where Continue goes on from) */
  at?: [number, number];
  v: 1;
}

const KEY = 'nostos-progress-v1';
const blank = (): Progress => ({ xp: 0, days: {}, srs: {}, known: {}, best: {}, done: {}, v: 1 });

export const today = () => new Date().toISOString().slice(0, 10);

export function load(): Progress {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return Object.assign(blank(), JSON.parse(saved));
  } catch {
    // private window or storage switched off: start empty, keep going
  }
  return blank();
}

export function save(progress: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // nothing to do: the round still counts on this page
  }
  window.dispatchEvent(new CustomEvent('nostos:progress', { detail: progress }));
}

/** Adds experience points for today and saves. Returns the new total. */
export function award(points: number) {
  const progress = load();
  if (!points) return progress.xp;
  progress.xp += points;
  progress.days[today()] = (progress.days[today()] || 0) + points;
  save(progress);
  return progress.xp;
}

/** Marks a star as known (or not), and gives two points the first time */
export function setKnown(id: string, known: boolean) {
  const progress = load();
  if (known && !progress.known[id]) {
    progress.known[id] = today();
    progress.xp += 2;
    progress.days[today()] = (progress.days[today()] || 0) + 2;
  } else if (!known) {
    delete progress.known[id];
  }
  save(progress);
}
