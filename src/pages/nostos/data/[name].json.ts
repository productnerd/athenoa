// Nostos: the activities' material, one small file each, fetched only when an activity starts (so the
// play page itself stays light). Built from src/data/nostos/ at build time. Not listed in the sitemap.
// THE CONTENT IS NEW WORDING generated from her talks, for Athena to review (src/lib/nostos.ts).
import type { APIRoute } from 'astro';
import {
  concepts,
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

const clip = (text: string, n: number) => (text.length > n ? `${text.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : text);

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
      take: clip(c.take ?? '', 420),
    })),
  talks: () => Object.fromEntries(talks.map((t) => [t.id, talkName(t.id)])),
  quiz: () => quiz,
  truefalse: () => truefalse,
  sequences: () => sequences.filter((s) => s.steps?.length >= 3 && s.steps.length <= 9),
  myths: () => myths.filter((m) => m.beats?.length >= 2),
  etymologies: () => etymologies.filter((e) => e.parts?.length >= 2 && e.parts.length <= 4),
  distinctions: () => distinctions.filter((d) => d.a && d.b && d.a_gloss && d.b_gloss),
  practices: () => practices,
  questions: () => questions,
} as const;

export function getStaticPaths() {
  return Object.keys(feeds).map((name) => ({ params: { name } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(JSON.stringify(feeds[params.name as keyof typeof feeds]()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
