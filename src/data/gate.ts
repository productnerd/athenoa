// The gate in front of the GitHub Pages preview (client request, 9 November 2026). It is shown only
// when the site is built with PUBLIC_PREVIEW_GATE=on (the preview workflow and `npm run dev`), never
// on the real launch. A velvet rope, not a lock: the pages are public files.
//
// The riddle completes one of Athena's lines (src/data/nostos/lines.json, with its talk and moment).
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
  /** Athena's line: "Ethics is an anagram of Ithaca." (talk G9I6oc0TnxI, 22:55) */
  source: { talk: 'G9I6oc0TnxI', t: '22:55' },
  hashes: [
    'c2c1bc55e07935d37b2221a326348d6210b31ffb8621e1075c7d1bc849515bde',
    'f929172811cf76fae2e3283359f4e27d7dacb9ccf6bad5f03125227a9832ccca',
    '151d8afbf6abf35fe175832017cd5659dfca038439db23995e33f1cd0d3e36a8',
    '7c554792991f9c03f0116663da1fc0532686044516d455ed53cf9f29ccb501ac',
    '6aa32e003214ac6c77014a9fd86ef4d101940a89f2c2b7b72a170c487038a3a6',
    '58a19a9b77bc4f35a98a9c023fd02d206ec8072b2ed19bd5c5a19e46abcfbc5a',
  ],
  /** said to a wrong answer: Plato, Phaedo 69c, quoting the Mysteries ("many carry the wand, few are Bacchants") */
  refusal: 'πολλοὶ μὲν ναρθηκοφόροι, βάκχοι δέ τε παῦροι.',
  /** said to the right one ("enter") */
  welcome: 'Εἴσελθε.',
  /** played as the gate opens (the lyre of the home page's seminar) */
  sound: '/audio/lyre.mp3',
  words: {
    en: { before: 'Ethics is an anagram of', after: '.', blank: 'the missing word', placeholder: 'One word', knock: 'Knock' },
    el: { before: 'Η ηθική είναι αναγραμματισμός της', after: '.', blank: 'η λέξη που λείπει', placeholder: 'Μία λέξη', knock: 'Χτυπήστε' },
    // Ancient Greek, a draft; Athena's line stays in her own (modern) Greek
    grc: { before: 'Η ηθική είναι αναγραμματισμός της', after: '.', blank: 'τὸ λεῖπον ῥῆμα', placeholder: 'Ἓν ῥῆμα', knock: 'Κροῦε' },
  } satisfies Record<Locale, Record<string, string>>,
};
