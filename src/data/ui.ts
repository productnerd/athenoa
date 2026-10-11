// Interface words that are not part of Athena's copy: labels for controls and for assistive technology.
import type { Locale } from '../lib/locale';

export const ui = {
  en: {
    skip: 'Skip to content',
    menu: 'Menu',
    mainNav: 'Main',
    footerNav: 'Footer',
    homeLink: 'ATHENOA, home',
    language: 'Language',
    toNight: 'Switch to night mode',
    toDay: 'Switch to day mode',
    socialOn: (network: string) => `ATHENOA on ${network}`,
  },
  el: {
    skip: 'Μετάβαση στο περιεχόμενο',
    menu: 'Μενού',
    mainNav: 'Κύρια πλοήγηση',
    footerNav: 'Υποσέλιδο',
    homeLink: 'ATHENOA, αρχική σελίδα',
    language: 'Γλώσσα',
    toNight: 'Νυχτερινή εμφάνιση',
    toDay: 'Ημερήσια εμφάνιση',
    socialOn: (network: string) => `Η ATHENOA στο ${network}`,
  },
  // Ancient Greek, a draft (see src/data/grc/)
  grc: {
    skip: 'Ἐπὶ τὸν λόγον',
    menu: 'Πίναξ',
    mainNav: 'Τὰ κεφάλαια',
    footerNav: 'Τὰ ἔσχατα',
    homeLink: 'ATHENOA, οἴκαδε',
    language: 'Γλῶσσα',
    toNight: 'Εἰς νύκτα',
    toDay: 'Εἰς ἡμέραν',
    socialOn: (network: string) => `ATHENOA ἐν τῷ ${network}`,
  },
} satisfies Record<Locale, Record<string, unknown>>;

// The languages offered in the header. Ancient Greek is a draft, there for the pleasure of it.
export const languages: { locale: Locale; label: string; short: string }[] = [
  { locale: 'en', label: 'English', short: 'EN' },
  { locale: 'el', label: 'Ελληνικά', short: 'ΕΛ' },
  { locale: 'grc', label: 'Ἀρχαία Ἑλληνική', short: 'ΑΡΧ' },
];
