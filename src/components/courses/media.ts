// Resolves Course.image (a file name without extension) to the photo in src/assets/media.
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../../assets/media/*.{jpg,jpeg,png,webp}', {
  eager: true,
});

export function courseImage(name: string): ImageMetadata {
  const hit = Object.entries(files).find(([path]) => path.split('/').pop()!.replace(/\.\w+$/, '') === name);
  if (!hit) throw new Error(`Course image "${name}" not found in src/assets/media`);
  return hit[1].default;
}

// Every course card shows its photo in the same frame, so a photo is cropped to fit. This is the point
// of each one that must stay in view (CSS object-position); a photo not listed is centred.
const focus: Record<string, string> = {
  'course-platos-republic': '50% 50%',
  'course-marcus-aurelius': '50% 50%',
  'plato-statue': '62% 40%',
};

export const courseFocus = (name: string): string | undefined => focus[name];

// A picture that is a lettered banner, much wider than the card's frame. The card shows it whole
// instead of cropping through its words.
const banners = new Set(['course-non-duality']);
export const courseBanner = (name: string): boolean => banners.has(name);

// A symbol for each course, shown under the summary of the enrolment request (EnrollFlow.astro).
// These are drawings from the symbol set that are used nowhere else on the site:
//   the Orphic egg, the One before it divides, for the course on non-duality;
//   the cave and the sun for the Republic; the ladder of ascent for Marcus Aurelius and the virtues;
//   the cicada of the Phaedrus, servant of the Muses, for the Cratylus. Others take the butterfly (psyche).
const symbols: Record<string, string> = {
  'the-hidden-non-duality-of-ancient-greek-philosophy': 'orphic-egg',
  'platos-republic': 'cave-sun',
  'marcus-aurelius-the-self': 'ladder',
  'plato-cratylus-platonic-virtues': 'cicada',
};
export const courseSymbol = (slug: string): string => symbols[slug] ?? 'butterfly';
