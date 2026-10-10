// schema.org builders for JSON-LD. Pages pass the results to <Base schema={[...]}>.
//
// Every value comes from the data files; nothing is filled in from outside knowledge.
// Facts that exist only as prose (a founding year, a degree, an award) go through said():
// they are published only while the copy still says them, so an edit to the text cannot
// leave a stale claim behind in the structured data.
import type { ImageMetadata } from 'astro';
import { site } from './site';
import { about } from './about';
import { coursePageHref, coursesPage, type Course } from './courses';
import { plain } from '../lib/markdown';

type Json = Record<string, unknown>;

const page = (path: string) => `${site.url}${path}`;
const ORGANIZATION = page('/#organization');
const WEBSITE = page('/#website');
const ATHENA = page('/about-athena/#athena');

// Photographs live in src/assets and are published under hashed names, so their addresses are looked up.
const media = import.meta.glob<ImageMetadata>('../assets/media/*', { eager: true, import: 'default' });
const photo = (name: string) => {
  const file = Object.entries(media).find(([path]) => path.startsWith(`../assets/media/${name}.`))?.[1];
  return file && new URL(file.src, site.url).href;
};

const copy = plain(
  [site.description, site.mission, ...about.intro, ...about.story.flatMap((part) => part.paragraphs)].join(' '),
);
const warned = new Set<string>();

/** Returns `value` only while the copy contains every phrase it rests on (by default, the value itself). */
function said<T>(value: T, ...phrases: string[]): T | undefined {
  const missing = (phrases.length ? phrases : [String(value)]).find((phrase) => !copy.includes(phrase));
  if (missing === undefined) return value;
  if (!warned.has(missing)) console.warn(`[schema] left out a fact: the copy no longer says "${missing}"`);
  warned.add(missing);
  return undefined;
}
/** Drops what said() left out. An empty list becomes undefined, so the property is omitted. */
const some = <T>(items: (T | undefined)[]) => {
  const kept = items.filter((item) => item !== undefined);
  return kept.length ? kept : undefined;
};

// site.founder carries the title: "Dr. Athena Despoina Potari".
const [, honorific, founderName] = site.founder.match(/^(Dr\.)\s+(.+)$/) ?? [undefined, undefined, site.founder];

// Short forms for pointing at the two main entities from any page. Each page's JSON-LD stands alone,
// so a reference carries the name and address as well as the @id.
const organizationRef: Json = {
  '@type': 'EducationalOrganization',
  '@id': ORGANIZATION,
  name: site.name,
  url: page('/'),
};
const athenaRef: Json = { '@type': 'Person', '@id': ATHENA, name: founderName, url: page('/about-athena/') };
const socialProfiles = site.social.map((item) => item.url);

export const organizationSchema = (): Json => ({
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  '@id': ORGANIZATION,
  name: site.name,
  alternateName: some([said('Academy of Hellenic Wisdom ATHENOA'), said('Philosophical Academy ATHENOA')]),
  url: page('/'),
  logo: photo('logo'),
  description: site.description,
  slogan: site.mission,
  founder: athenaRef,
  foundingDate: said(
    '2019',
    'In 2019, these two streams of my life',
    'united in the founding of the Academy of Hellenic Wisdom ATHENOA',
  ),
  email: site.emails,
  telephone: site.phone.href.replace(/^tel:00/, '+'),
  sameAs: socialProfiles,
  knowsAbout: some(
    [
      'Ancient Hellenic Wisdom',
      'Greek Philosophy',
      'Platonic Academy',
      'Dialectics',
      'Etymology',
      'Ancient Greek Language',
      'Meditations',
      'Methods of Self-Knowledge',
      'Ancient Hieratic Art',
      'Orphic Hymns',
    ].map((topic) => said(topic)),
  ),
});

export const websiteSchema = (): Json => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': WEBSITE,
  name: site.name,
  url: page('/'),
  description: site.description,
  inLanguage: site.locale,
  publisher: organizationRef,
});

export const personSchema = (): Json => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': ATHENA,
  name: founderName,
  alternateName: said('Athena Potari'),
  honorificPrefix: honorific,
  jobTitle: said('Founder', 'founder of the Philosophical Academy'),
  description: plain(about.intro[0]),
  url: page('/about-athena/'),
  image: photo(about.story[0].image),
  worksFor: organizationRef,
  alumniOf: some([
    said(
      { '@type': 'CollegeOrUniversity', name: 'University of Oxford' },
      'doctoral studies at the University of Oxford',
    ),
    said({ '@type': 'CollegeOrUniversity', name: 'LSE' }, 'Master’s Degree with Distinction from the LSE'),
    said({ '@type': 'EducationalOrganization', name: 'Athens College' }, 'I graduated from the Athens College'),
  ]),
  award: said(
    'Philosophy Award of the Academy of Athens, 2020',
    'In 2020, I was honored with the Philosophy Award of the Academy of Athens',
  ),
  memberOf: said(
    { '@type': 'Organization', name: 'Galileo Commission' },
    'I am a member of the Central Committee',
    'the Galileo Commission',
  ),
  knowsAbout: some(
    [
      'Greek Philosophy',
      'Platonic Philosophy',
      'Greek Political Philosophy',
      'Political Cosmology',
      'Orphic–Pythagorean Tradition',
      'Ancient Greek women philosophers',
    ].map((topic) => said(topic)),
  ),
  sameAs: socialProfiles,
});

const courseUrl = (course: Course) => page(coursePageHref(course.slug));
const numberWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

// How a course runs, read from its own copy ("This four-week course", "Each week we will explore",
// "The platform we use for the sessions is Zoom"). No dates, session lengths or start times are given
// there, so none appear here.
const courseInstance = (course: Course): Json => {
  const text = plain(course.sections.map((section) => section.html).join(' '));
  const weeks = numberWords.indexOf(text.match(/\b(\w+)-week course\b/i)?.[1].toLowerCase() ?? '') + 1;
  const access = course.sections.find((section) => section.id === 'access')?.html.match(/<p>([\s\S]*?)<\/p>/)?.[1];
  return {
    '@type': 'CourseInstance',
    name: course.schedule,
    description: access && plain(access),
    courseMode: text.includes('The platform we use for the sessions is Zoom') ? 'Online' : undefined,
    courseSchedule:
      weeks && /\beach week\b/i.test(text)
        ? { '@type': 'Schedule', repeatFrequency: 'Weekly', repeatCount: weeks }
        : undefined,
    instructor: course.instructor === site.founder ? athenaRef : { '@type': 'Person', name: course.instructor },
  };
};

const courseOffer = (course: Course, price: NonNullable<Course['price']>): Json => ({
  '@type': 'Offer',
  category: 'Paid',
  price: price.amount,
  priceCurrency: price.currency,
  url: courseUrl(course),
  // The copy quotes the price before tax: "€200 & VAT (24%)".
  description: `${price.label} ${price.display}`,
  priceSpecification: {
    '@type': 'PriceSpecification',
    price: price.amount,
    priceCurrency: price.currency,
    valueAddedTaxIncluded: price.vatRate > 0 ? false : undefined,
  },
});

/** A course that is open carries its description, run and price. A placeholder carries its name only. */
export const courseSchema = (course: Course): Json => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  '@id': `${courseUrl(course)}#course`,
  name: course.title,
  url: courseUrl(course),
  provider: organizationRef,
  ...(course.status === 'open' && {
    description: course.summary,
    image: photo(course.image),
    hasCourseInstance: courseInstance(course),
    offers: course.price && courseOffer(course, course.price),
  }),
});

/** For the Courses page: the list of courses, each pointing at its own page. */
export const courseListSchema = (list: Course[]): Json => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  '@id': page(`${site.routes.courses}#list`),
  name: coursesPage.title,
  itemListElement: list.map((course, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: course.title,
    url: courseUrl(course),
  })),
});

export const breadcrumbSchema = (trail: { name: string; path: string }[]): Json => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: `${site.url}${item.path}`,
  })),
});
