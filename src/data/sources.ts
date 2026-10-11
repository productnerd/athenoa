// "Where did you hear about us?" One list of answers, shared by the contact form and the enrolment
// request (SourceField.astro). New wording, asked for by the client on 11 October 2026.
// The Ancient Greek is a draft, like the rest of that language.
import type { Locale } from '../lib/locale';

export const sources = {
  en: {
    choose: 'Choose one',
    options: ['YouTube', 'Instagram', 'Facebook', 'Search engine', 'AI agent', 'Word of mouth', 'Academic work'],
    other: 'Other',
    // The label of the small field that appears when "Other" is chosen
    otherLabel: 'Where?',
    otherPlaceholder: 'Tell us where',
  },
  el: {
    choose: 'Επιλέξτε',
    options: [
      'YouTube',
      'Instagram',
      'Facebook',
      'Μηχανή αναζήτησης',
      'Βοηθός τεχνητής νοημοσύνης',
      'Από γνωστούς',
      'Ακαδημαϊκό έργο',
    ],
    other: 'Άλλο',
    otherLabel: 'Πού;',
    otherPlaceholder: 'Πείτε μας πού',
  },
  grc: {
    choose: 'Ἕλεσθε',
    options: [
      'YouTube',
      'Instagram',
      'Facebook',
      'Ζητῶν ἐν τῷ δικτύῳ',
      'Παρὰ τεχνητῆς νοήσεως',
      'Παρὰ φίλων',
      'Ἐκ συγγραμμάτων',
    ],
    other: 'Ἄλλοθεν',
    otherLabel: 'Πόθεν;',
    otherPlaceholder: 'Εἴπατε πόθεν',
  },
} satisfies Record<Locale, { choose: string; options: string[]; other: string; otherLabel: string; otherPlaceholder: string }>;
