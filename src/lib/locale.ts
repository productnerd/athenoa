// Languages: English at the root, Greek under /el/, and Ancient Greek under /grc/.
// English and Greek are the site's two written languages (MainLocale): they are the ones offered to
// search engines, given markdown twins and described in the structured data. Ancient Greek is a
// third reading of the same pages, added for the pleasure of it; it is a draft, kept out of the
// index, and wherever a component has only English and Greek words of its own it borrows the Greek.
export type MainLocale = 'en' | 'el';
export type Locale = MainLocale | 'grc';
export const locales: MainLocale[] = ['en', 'el'];

const prefix = /^\/(el|grc)(?=\/|$)/;

export const getLocale = (url: URL | string): Locale => {
  const path = typeof url === 'string' ? url : url.pathname;
  return (path.match(prefix)?.[1] as Locale | undefined) ?? 'en';
};

/** English or Greek: the language whose small word lists, facts and files a page falls back on. */
export const mainLocale = (locale: Locale): MainLocale => (locale === 'en' ? 'en' : 'el');

/** The same page in the given language. */
export const pathIn = (locale: Locale, pathname: string): string => {
  const bare = pathname.replace(prefix, '') || '/';
  return locale === 'en' ? bare : `/${locale}${bare}`;
};

/** The path without its language prefix, for comparing pages across languages. */
export const barePath = (pathname: string): string => pathname.replace(prefix, '') || '/';
