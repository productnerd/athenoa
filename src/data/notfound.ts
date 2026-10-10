// Not-found page (404). The only copy on the site that does not come from athenoa.academy.
//
// The quotation is Democritus, fragment 171 in Diels-Kranz (DK 68 B171), preserved by
// Stobaeus, Eclogae II 7, 3i. It is given as the manuscripts and Diels-Kranz have it, in the
// Ionic dialect (εὐδαιμονίη, not εὐδαιμονία), with iota subscript where Diels prints it adscript
// (χρυσῷ for χρυσῶι). Do not "correct" the spelling. The same ancient text is shown in both
// languages; only the rendering under it changes.
const quote = {
  text: 'εὐδαιμονίη οὐκ ἐν βοσκήμασιν οἰκεῖ οὐδὲ ἐν χρυσῷ· ψυχὴ οἰκητήριον δαίμονος',
  lang: 'grc',
} as const;

export const notfound = {
  en: {
    heading: 'Page not found',
    line: 'The page you were looking for is not here.',
    home: { label: 'Home', href: '/' },
    courses: { label: 'Courses', href: '/courses/' },
    quote: {
      ...quote,
      translation: 'Happiness does not dwell in herds, nor in gold; the soul is the dwelling-place of the daimon.',
      source: 'Democritus, fragment 171 (DK 68 B171)',
    },
  },
  el: {
    heading: 'Η σελίδα δεν βρέθηκε',
    line: 'Η σελίδα που αναζητούσατε δεν βρίσκεται εδώ.',
    home: { label: 'Αρχική', href: '/el/' },
    courses: { label: 'Μαθήματα', href: '/el/courses/' },
    quote: {
      ...quote,
      translation: 'Η ευδαιμονία δεν κατοικεί σε κοπάδια ούτε σε χρυσάφι· η ψυχή είναι η κατοικία του δαίμονα.',
      source: 'Δημόκριτος, απόσπασμα 171 (DK 68 B171)',
    },
  },
} as const;

export type NotFoundLocale = keyof typeof notfound;
