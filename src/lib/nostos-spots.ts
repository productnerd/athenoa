// Nostos: where the reflections and the practical activities stand on the Learn path, worked out once
// for every page that needs it: the Learn page (the mirrors and leaves on the trail, and "In practice"),
// and each reflection's and activity's own page, which opens only once the lesson before it is walked
// (client direction, 7 November 2026: nothing on the path can be jumped to before its turn).
import { pathOutline } from './nostos-path';
import { reflectionSpots } from './nostos-reflections';
import { praxisSpots } from './nostos-praxis';

export const refSpots = reflectionSpots(pathOutline);
export const pxSpots = praxisSpots(pathOutline, new Set(refSpots.keys()));

/** What a reflection or an activity waits for: the lesson it follows (its chapter and lesson numbers,
 *  the chapter's name, and the lesson's steps, all of which must be met) */
export function needOf(id: string) {
  for (const [key, item] of [...refSpots, ...pxSpots]) {
    if (item.id !== id) continue;
    const [ci, li] = key.split(':').map(Number);
    const c = pathOutline[ci];
    return { ci, li, lesson: li + 1, chapter: c.names?.en ?? c.title, ids: c.lessons[li] };
  }
  return null;
}
