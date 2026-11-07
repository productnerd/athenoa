// Nostos, praxis (client request, 7 November 2026): a practical activity at the end of a chapter of
// Learn, an olive leaf on the trail. Six kinds: a guided meditation (timer, soft wind, a bell at each
// step, Start and Skip), a challenge over a few days or a few times (a check-in each day), a mission
// done once and reported, a piece of writing, a ritual (dated, with a calendar file, or whenever it is
// needed), and four small tools (an audit of where one is asleep, a sorting of Greek values, a journal of
// beauty with photos, a talk of Athena's to watch). Content: one JSON file each in
// src/data/nostos-praxis/, in the format of tasks/nostos-praxis-spec.md, checked by
// scripts/nostos-praxis-check.mjs. THE WORDING IS NEW, proposed, for Athena to review.
//
// TODO (later phase, Maria, 7 November 2026; not built yet):
// - Claude looks at the photos of the journal of beauty (and other photo tasks) and answers.
// - Claude reads a challenge's week of notes at its end.
// - The meditations read aloud (an ElevenLabs voice, never Athena's own): each step can carry an audio
//   file (`audio`), played over the wind.
// - Reminders for challenges (a calendar file for each day, or, with accounts, email or push).

export type Step = { text: string; seconds: number; audio?: string };
export type Praxis = {
  id: string;
  chapter: string;
  n: number;
  kind: 'meditation' | 'challenge' | 'mission' | 'make' | 'ritual' | 'tool';
  title: string;
  line: string;
  intro: string;
  does: string;
  trains: string;
  practices: number[];
  concepts: string[];
  later?: string;
  // meditation
  minutes?: number;
  steps?: Step[] | string[];
  // challenge
  days?: number;
  times?: number;
  each?: string;
  when?: string;
  note?: string;
  end?: string;
  // mission
  report?: string[];
  // make
  prompts?: { label: string; hint?: string; placeholder?: string }[];
  // ritual
  date?: string | null;
  calendar?: boolean;
  // tool
  tool?: 'asleep-audit' | 'values-sort' | 'beauty-journal' | 'watch-talk';
  areas?: { id: string; name: string; hint?: string }[];
  questions?: string[];
  values?: { greek: string; translit?: string; name: string; means: string; concept?: string }[];
  photos?: number;
  intangibles?: number;
  talk?: string;
  from?: string;
  before?: string[];
  after?: string[];
};

const files = import.meta.glob<Praxis>('../data/nostos-praxis/*.json', { eager: true, import: 'default' });
export const praxes: Praxis[] = Object.values(files).sort((a, b) => a.n - b.n);
/** the practical activity at the end of a chapter, if it has one */
export const praxisFor = (chapter: string) => praxes.find((p) => p.chapter === chapter);
/** how long it takes, in words: minutes for a meditation, days or times for a challenge */
export const sizeOf = (p: Praxis) =>
  p.kind === 'meditation' ? { minutes: p.minutes ?? 0 } : p.days ? { days: p.days } : p.times ? { times: p.times } : {};
