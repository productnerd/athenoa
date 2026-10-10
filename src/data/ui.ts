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
    socialOn: (network: string) => `ATHENOA on ${network}`,
  },
  el: {
    skip: 'Μετάβαση στο περιεχόμενο',
    menu: 'Μενού',
    mainNav: 'Κύρια πλοήγηση',
    footerNav: 'Υποσέλιδο',
    homeLink: 'ATHENOA, αρχική σελίδα',
    language: 'Γλώσσα',
    socialOn: (network: string) => `Η ATHENOA στο ${network}`,
  },
} satisfies Record<Locale, Record<string, unknown>>;

export const languages: { locale: Locale; label: string; short: string }[] = [
  { locale: 'en', label: 'English', short: 'EN' },
  { locale: 'el', label: 'Ελληνικά', short: 'ΕΛ' },
];
