// Greek words and phrases that the page sets as small dictionary entries: the word, how it is said,
// what kind of thing it is, and a short note shown when a visitor rests on it (src/lib/lemma.ts).
// NEW WORDING, asked for by the client on 12 October 2026 and not on the live site: the notes are
// for Athena to review. The meaning under each word is hers, taken from the page's own text.
import type { MainLocale } from '../lib/locale';

export interface Lemma {
  /** The word in Latin letters, with its accents, for readers who do not read Greek */
  say: string;
  kind: Record<MainLocale, string>;
  note: Record<MainLocale, string>;
  source: Record<MainLocale, string>;
}

export const lemmas: Record<string, Lemma> = {
  // "It is not living that matters most, but living well": οὐ τὸ ζῆν περὶ πλείστου ποιητέον ἀλλὰ τὸ εὖ ζῆν.
  'Εὖ Ζῆν': {
    say: 'eû zên',
    kind: { en: 'phrase', el: 'φράση' },
    note: {
      en: 'To live well. For Socrates what matters most is not living, but living well.',
      el: 'Το να ζει κανείς καλά. Για τον Σωκράτη σημασία δεν έχει το ζην, αλλά το ευ ζην.',
    },
    source: { en: 'Plato, Crito 48b', el: 'Πλάτων, Κρίτων 48b' },
  },
  'Γνῶθι Σαυτόν': {
    say: 'gnôthi sautón',
    kind: { en: 'maxim', el: 'παράγγελμα' },
    note: {
      en: 'One of the maxims inscribed at the temple of Apollo at Delphi.',
      el: 'Ένα από τα παραγγέλματα που ήταν χαραγμένα στον ναό του Απόλλωνα στους Δελφούς.',
    },
    source: { en: 'Pausanias 10.24.1', el: 'Παυσανίας 10.24.1' },
  },
};
