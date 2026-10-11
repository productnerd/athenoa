// Not-found page (404). The only copy on the site that does not come from athenoa.academy.
// Both languages are rendered into the one page; the address decides which one shows
// (see src/components/notfound/NotFoundScene.astro).

// CLIENT DIRECTION, 11 October 2026 (latest; do not restore the older parts): no visible heading,
// no "courses" link, no quotation on eudaimonia. One sentence stands in the sky ("Not everybody who
// wanders is lost"), one button leads home ("Take me to Ithaka") and a small note sits under it,
// marked with an asterisk. In Greek the note is Cavafy's own, from "Ithaka" (Ιθάκη, 1911), checked
// against Greek Wikisource: «να εύχεσαι νάναι μακρύς ο δρόμος, / γεμάτος περιπέτειες, γεμάτος γνώσεις».
export const notfound = {
  en: {
    // Read by screen readers and used for the page title; not shown.
    heading: 'Page not found',
    wander: 'Not everybody who wanders is lost',
    home: { label: 'Take me to Ithaka', href: '/' },
    journey: 'but let the journey be long and filled with adventures',
    journeySource: '',
  },
  el: {
    heading: 'Η σελίδα δεν βρέθηκε',
    wander: 'Δεν είναι χαμένοι όλοι όσοι περιπλανιούνται',
    home: { label: 'Πάρε με στην Ιθάκη', href: '/el/' },
    journey: 'να εύχεσαι νάναι μακρύς ο δρόμος, γεμάτος περιπέτειες',
    journeySource: 'Κ. Π. Καβάφης, «Ιθάκη»',
  },
} as const;

export type NotFoundLocale = keyof typeof notfound;
