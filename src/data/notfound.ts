// Not-found page (404). The only copy on the site that does not come from athenoa.academy.
// Both languages are rendered into the one page; the address decides which one shows
// (see src/components/notfound/NotFoundScene.astro).
//
// The quotation is Democritus, fragment 171 in Diels-Kranz (DK 68 B171), preserved by Stobaeus,
// Eclogae II 7, 3i. It is given as the manuscripts and Diels-Kranz have it, in the Ionic dialect
// (εὐδαιμονίη, not εὐδαιμονία; βοσκήμασιν and οἰκεῖ, where Wachsmuth's Stobaeus prints the
// conjectures βοσκήμασι and οἰκέει), with iota subscript where Diels prints it adscript
// (χρυσῷ for χρυσῶι). Do not "correct" the spelling. Checked on 2026-10-10 against the
// Diels-Kranz text at ancientsource.daphnet.iliesi.cnr.it (68-B,171) and against the readings
// reported by A. N. Zoumbos, "Εἰς Δημόκριτον", Živa Antika 12.1. The same ancient text is shown
// in both languages; only the rendering under it changes.
//
// Two alternates, checked the same day against Perseus (Burnet; Bywater) and Greek Wikisource:
//   Plato, Crito 48b:  οὐ τὸ ζῆν περὶ πλείστου ποιητέον ἀλλὰ τὸ εὖ ζῆν
//   Aristotle, Nicomachean Ethics I 7, 1098a18–20:  μία γὰρ χελιδὼν ἔαρ οὐ ποιεῖ, οὐδὲ μία ἡμέρα·
//     οὕτω δὲ οὐδὲ μακάριον καὶ εὐδαίμονα μία ἡμέρα οὐδ᾽ ὀλίγος χρόνος
const quote = {
  text: 'εὐδαιμονίη οὐκ ἐν βοσκήμασιν οἰκεῖ οὐδὲ ἐν χρυσῷ· ψυχὴ οἰκητήριον δαίμονος',
  lang: 'grc',
} as const;

// CLIENT DIRECTION, 11 October 2026 (replaces the first brief; do not restore the old parts):
// no visible heading, no "courses" link. One button ("Take me home") with a line above it and a line
// below it. In Greek the line below is Cavafy's own, from "Ithaka" (Ιθάκη, 1911), checked against
// Greek Wikisource: «να εύχεσαι νάναι μακρύς ο δρόμος, / γεμάτος περιπέτειες, γεμάτος γνώσεις».
// "daimon" is explained in the translation of the Democritus fragment, as the client asked.
export const notfound = {
  en: {
    // Read by screen readers and used for the page title; not shown.
    heading: 'Page not found',
    wander: 'Not everybody who wanders is lost',
    home: { label: 'Take me home', href: '/' },
    journey: 'but let the journey be long and filled with adventures',
    journeySource: '',
    quote: {
      ...quote,
      translation:
        'Happiness does not dwell in herds, nor in gold; the soul is the dwelling-place of the daimon, our guiding spirit.',
      source: 'Democritus, fragment 171 (DK 68 B171)',
    },
  },
  el: {
    heading: 'Η σελίδα δεν βρέθηκε',
    wander: 'Δεν είναι χαμένοι όλοι όσοι περιπλανιούνται',
    home: { label: 'Πάρε με σπίτι', href: '/el/' },
    journey: 'να εύχεσαι νάναι μακρύς ο δρόμος, γεμάτος περιπέτειες',
    journeySource: 'Κ. Π. Καβάφης, «Ιθάκη»',
    quote: {
      ...quote,
      translation:
        'Η ευδαιμονία δεν κατοικεί σε κοπάδια ούτε σε χρυσάφι· η ψυχή είναι η κατοικία του δαίμονος, του εσωτερικού μας οδηγού.',
      source: 'Δημόκριτος, απόσπασμα 171 (DK 68 B171)',
    },
  },
} as const;

export type NotFoundLocale = keyof typeof notfound;
