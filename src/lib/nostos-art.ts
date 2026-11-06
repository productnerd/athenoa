// Nostos: pictures of the art Athena refers to (client request, 6 November 2026). The list is
// src/data/nostos-art.json (researched from Wikimedia Commons, each licence read from its file page; see
// tasks/nostos-art.md); the files are in src/assets/nostos-art/, shrunk to 1600px. One picture per
// idea: the one the idea heads, or else the first that shows it. It appears in the idea's note (map)
// and on its step on the path. Captions are NEW WORDING, English and Greek.
import type { ImageMetadata } from 'astro';
import list from '../data/nostos-art.json';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/nostos-art/*.jpg', { eager: true });

export type Art = (typeof list)[number] & { image: ImageMetadata };
export const art: Art[] = list
  .map((a) => ({ ...a, image: files[`../assets/nostos-art/${a.id}.jpg`]?.default }))
  .filter((a): a is Art => Boolean(a.image));

const forIdea = new Map<string, Art>();
for (const a of art) if (!forIdea.has(a.concepts[0])) forIdea.set(a.concepts[0], a);
for (const a of art) for (const id of a.concepts) if (!forIdea.has(id)) forIdea.set(id, a);
export const artFor = (id: string) => forIdea.get(id);

/** The credit a licence asks for: none for public domain and CC0; otherwise the photographer and the
 *  licence (linked), as the file's page gives them */
export function credit(a: Art) {
  if (/^(public domain|cc0)/i.test(a.licence)) return null;
  const m = a.attribution.match(/^(.*?)\s*\((https?:[^)]+)\)/);
  return { text: (m ? m[1] : a.attribution).replace(/^©\s*/, ''), licenceUrl: m?.[2] };
}
