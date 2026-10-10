// Two languages: English at the root, Greek under /el/.
export type Locale = 'en' | 'el';
export const locales: Locale[] = ['en', 'el'];

export const getLocale = (url: URL | string): Locale => {
  const path = typeof url === 'string' ? url : url.pathname;
  return path === '/el' || path.startsWith('/el/') ? 'el' : 'en';
};

/** The same page in the given language. */
export const pathIn = (locale: Locale, pathname: string): string => {
  const bare = pathname.replace(/^\/el(?=\/|$)/, '') || '/';
  return locale === 'el' ? `/el${bare}` : bare;
};

/** The path without its language prefix, for comparing pages across languages. */
export const barePath = (pathname: string): string => pathname.replace(/^\/el(?=\/|$)/, '') || '/';
