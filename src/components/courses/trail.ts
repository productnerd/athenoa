// The breadcrumb trail shared by the courses pages: Home, then Courses, in the language of the page.
import { content } from '../../data';
import { pathIn, type Locale } from '../../lib/locale';

export function trail(locale: Locale) {
  const { site, coursesPage } = content(locale);
  const homePath = pathIn(locale, '/');
  // The header menu no longer lists Home (the logo links there); the footer still names it.
  const home = site.footer.links.find((link) => link.href === homePath)?.label ?? site.name;
  return [
    { name: home, path: homePath },
    { name: coursesPage.title, path: site.routes.courses },
  ];
}
