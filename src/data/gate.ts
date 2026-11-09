// The gate in front of the GitHub Pages preview (client request, 9 November 2026). It is shown only
// when the site is built with PUBLIC_PREVIEW_GATE=on (the preview workflow and `npm run dev`), never
// on the real launch. A velvet rope, not a lock: the pages are public files.
//
// The riddle asks for the last word of one of Athena's ideas (with its talk and moment below).
// To change it, change the words here and the hashes: `node scripts/gate-hash.mjs <answer> <spellings…>`.
// The gate speaks only Ancient Greek, in every language (client direction, 9 November 2026): the
// inscription, the refusal and the welcome are never translated. Only Athena's line, the field and
// the button follow the page's language. NEW WORDING, proposed (see tasks/text-changes.md); the Greek
// of Athena's line is a translation back from the English and should be checked against the talk.
import type { Locale } from '../lib/locale';

export const gate = {
  /** over the door: Plato's Academy sign ("let none ignorant of geometry enter"), with the
   *  Mysteries' word for the uninitiated in place of geometry */
  inscription: 'ΑΜΥΗΤΟΣ ΜΗΔΕΙΣ ΕΙΣΙΤΩ',
  /** Athena's reading, in our words (so not set in quotation marks): ἥρως, the hero, comes from ἔρως,
   *  and without eros no one can walk the heroic path (talk xLQXoDX7i94, 12:51). Chosen by Maria. */
  source: { talk: 'xLQXoDX7i94', t: '12:51' },
  hashes: [
    'ae39c5042769e2e4e4b9e46d9da10a27ee4d90413c60eb3b49097550387a00fe',
    'e5df1e41803bab954b76aa873adc93237ca4a1b3fda5536f087ef0f55bcf0ed4',
    '123676d9837127233d1f76c67656df421ac21f7ae1ffe6b05ba0f0344793aa58',
    'aebfe7be15b011ef1178eac23fa1ad72f864ecb82a4f5551ef9478d761602d0a',
    'be581f5d5d8760c2199db78c6b9ce092e27830c2bfe7fc76a4b6dfdf95d3025c',
    'aff8d644999318efbb4dcc34e405c92e63647b52c4b2b667a68a58fae6f94bdb',
  ],
  /** said to a wrong answer: Plato, Phaedo 69c, quoting the Mysteries ("many carry the wand, few are Bacchants") */
  refusal: 'πολλοὶ μὲν ναρθηκοφόροι, βάκχοι δέ τε παῦροι.',
  /** said to the right one ("enter") */
  welcome: 'Εἴσελθε.',
  /** played as the site comes back into view, after the key and the creaking door (src/scripts/gate-sounds.ts) */
  sound: '/audio/lyre.mp3',
  words: {
    en: { before: 'There is no hero (ἥρως) without', after: '.', blank: 'the missing word', placeholder: 'One word', knock: 'Knock' },
    el: { before: 'Δεν υπάρχει ήρωας (ἥρως) χωρίς', after: '.', blank: 'η λέξη που λείπει', placeholder: 'Μία λέξη', knock: 'Χτυπήστε' },
    // Ancient Greek, a draft; the riddle stays in modern Greek
    grc: { before: 'Δεν υπάρχει ήρωας (ἥρως) χωρίς', after: '.', blank: 'τὸ λεῖπον ῥῆμα', placeholder: 'Ἓν ῥῆμα', knock: 'Κροῦε' },
  } satisfies Record<Locale, Record<string, string>>,
};
