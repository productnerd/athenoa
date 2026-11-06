// Nostos: the activities' material, one small file each, fetched only when an activity starts (so the
// play page itself stays light). Built from src/data/nostos/ at build time. Not listed in the sitemap.
// THE CONTENT IS NEW WORDING generated from her talks, for Athena to review (src/lib/nostos.ts).
import type { APIRoute } from 'astro';
import {
  conceptById,
  concepts,
  edges,
  distinctions,
  etymologies,
  myths,
  practices,
  questions,
  quiz,
  sequences,
  talkName,
  talks,
  truefalse,
} from '../../../lib/nostos';
import { chapters } from '../../../lib/nostos-path';

const feeds = {
  // the ideas, slim: what cards, match and threads need, and the words quiz looks for
  concepts: () =>
    concepts.map((c) => ({
      id: c.id,
      label: c.label,
      greek: c.greek,
      translit: c.translit,
      group: c.group,
      weight: c.weight,
      freq: c.freq,
      // whole: the path's idea steps show all of it, the activities shorten it where they need to
      take: c.take ?? '',
    })),
  talks: () => Object.fromEntries(talks.map((t) => [t.id, talkName(t.id)])),
  // the links she makes herself, where she says why: [idea, other idea, her reason]
  links: () =>
    edges
      .filter((e) => e.her && e.why && e.why.length > 12 && conceptById(e.a) && conceptById(e.b))
      .map((e) => [e.a, e.b, e.why]),
  quiz: () => quiz,
  truefalse: () => truefalse,
  sequences: () => sequences.filter((s) => s.steps?.length >= 3 && s.steps.length <= 9),
  myths: () => myths.filter((m) => m.beats?.length >= 2),
  etymologies: () => etymologies.filter((e) => e.parts?.length >= 2 && e.parts.length <= 4),
  distinctions: () => distinctions.filter((d) => d.a && d.b && d.a_gloss && d.b_gloss),
  practices: () => practices,
  questions: () => questions,
  // the path: what each chapter's lessons need, one file per chapter (path-<talk id>), loaded when a
  // lesson or a review reaches it
  ...Object.fromEntries(chapters.map((c) => [`path-${c.id}`, () => c.steps])),
} as Record<string, () => unknown>;

export function getStaticPaths() {
  return Object.keys(feeds).map((name) => ({ params: { name } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(feeds[params.name!]()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
