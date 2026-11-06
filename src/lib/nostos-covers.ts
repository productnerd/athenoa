// Nostos: real covers for the Bookshelf's books, to choose between (client request, 6 November 2026).
// Two sets: a page from each book's first printed edition (src/data/nostos-editions.json, researched and
// licence-checked in tasks/nostos-editions.md), and a front cover of an edition from 1900 to 1930
// (src/data/nostos-vintage.json, tasks/nostos-vintage.md), once it is there. The files are in
// src/assets/nostos-covers/<set>/, cropped and shrunk to 900px. Captions are NEW WORDING (the first
// editions' approved by the client, 6 November 2026).
import type { ImageMetadata } from 'astro';
import first from '../data/nostos-editions.json';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/nostos-covers/*/*.jpg', { eager: true });
const optional = import.meta.glob<{ default: Edition[] }>('../data/nostos-vintage.json', { eager: true });
const vintage = Object.values(optional)[0]?.default ?? [];

type Edition = { work: string; title_en: string; title_el: string; attribution: string };
export const coverSets = ['first', 'vintage'] as const;
export type CoverSet = (typeof coverSets)[number];
export type Cover = { image: ImageMetadata; caption: { en: string; el: string }; credit: string | null };

const lists: Record<CoverSet, Edition[]> = { first, vintage };
const covers = Object.fromEntries(
  coverSets.map((set) => [
    set,
    new Map(
      lists[set]
        .map((e) => {
          const image = files[`../assets/nostos-covers/${set}/${e.work}.jpg`]?.default;
          // a credit where the library asks for one (public domain otherwise needs none)
          const credit = /^public domain\.?$/i.test(e.attribution) ? null : e.attribution.replace(/^public domain[.;]\s*(suggested credit:\s*)?/i, '');
          return image ? ([e.work, { image, caption: { en: e.title_en, el: e.title_el }, credit }] as const) : null;
        })
        .filter((x) => x !== null),
    ),
  ]),
) as Record<CoverSet, Map<string, Cover>>;

export const coverFor = (set: CoverSet, work: string) => covers[set].get(work);
/** the sets that have at least one cover */
export const coverSetsReady = coverSets.filter((set) => covers[set].size > 0);
