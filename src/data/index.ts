// One door to the copy in either language.
//   const { home, site } = content(getLocale(Astro.url));
// The Greek files in ./el mirror the English ones key for key. They are a DRAFT translation.
import type { Locale } from '../lib/locale';
import { site as siteEn } from './site';
import { home as homeEn } from './home';
import { about as aboutEn } from './about';
import * as coursesEn from './courses';
import { site as siteEl } from './el/site';
import { home as homeEl } from './el/home';
import { about as aboutEl } from './el/about';
import * as coursesEl from './el/courses';
import { ui } from './ui';

const en = {
  locale: 'en' as Locale,
  site: siteEn,
  home: homeEn,
  about: aboutEn,
  courses: coursesEn.courses,
  coursesPage: coursesEn.coursesPage,
  registrationTab: coursesEn.registrationTab,
  courseHref: coursesEn.courseHref,
  coursePageHref: coursesEn.coursePageHref,
  ui: ui.en,
};

// Greek has the same shape; typing it as the English content keeps components simple.
const el = {
  locale: 'el' as Locale,
  site: siteEl,
  home: homeEl,
  about: aboutEl,
  courses: coursesEl.courses,
  coursesPage: coursesEl.coursesPage,
  registrationTab: coursesEl.registrationTab,
  courseHref: coursesEl.courseHref,
  coursePageHref: coursesEl.coursePageHref,
  ui: ui.el,
} as unknown as typeof en;

export type Content = typeof en;
export const content = (locale: Locale): Content => (locale === 'el' ? el : en);
