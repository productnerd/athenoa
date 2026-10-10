// Markdown twins of the pages, for AI agents and other readers that prefer text to HTML.
// Everything here is built from the same data files the HTML pages use, so the two cannot drift.
// Used by the .md endpoints, /llms.txt, /llms-full.txt and <Seo> (which links each page to its twin).
import { site } from '../data/site';
import { home } from '../data/home';
import { about } from '../data/about';
import { courses, coursesPage, registrationTab, courseHref, coursePageHref, type Course } from '../data/courses';

// ---------- HTML fragments to Markdown ----------

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (text: string) =>
  text.replace(/&(#\d+|\w+);/g, (whole, code: string) =>
    code[0] === '#' ? String.fromCodePoint(Number(code.slice(1))) : (entities[code] ?? whole),
  );

/** Copy with its tags removed: for places that take plain text only, such as structured data. */
export const plain = (html: string): string =>
  decode(html.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();

// Emphasis marks must hug the words, so spaces at the edges of a tag move outside the marks.
const wrap = (mark: string) => (_whole: string, _tag: string, inner: string) =>
  inner.trim() ? inner.replace(/^(\s*)([\s\S]*?)(\s*)$/, `$1${mark}$2${mark}$3`) : inner;

/** One run of copy (plain, or with strong, em, i, u, span) as a single line of Markdown. */
export const inline = (html: string): string =>
  decode(
    html
      .replace(/\*/g, '\\*') // asterisks in the copy are decoration, not emphasis
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, wrap('**'))
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, wrap('*'))
      .replace(/<[^>]+>/g, ''), // u and span have no Markdown form: keep their words
  )
    .replace(/\s+/g, ' ')
    .trim();

/** The rich-text fields in the data (p, ul, ol, li, blockquote around inline tags) as Markdown. */
export const htmlToMarkdown = (html: string): string => {
  const out: string[] = [];
  const loose = (text: string) => text.trim() && out.push(inline(text));
  let last = 0;
  for (const match of html.matchAll(/<(p|ul|ol|blockquote)>([\s\S]*?)<\/\1>/g)) {
    const [whole, tag, inner] = match;
    loose(html.slice(last, match.index));
    if (tag === 'p') out.push(inline(inner));
    else if (tag === 'blockquote') out.push(htmlToMarkdown(inner).replace(/^.*$/gm, (line) => `> ${line}`.trimEnd()));
    else out.push(list([...inner.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((item) => inline(item[1])), tag === 'ol'));
    last = match.index + whole.length;
  }
  loose(html.slice(last));
  return out.join('\n\n');
};

// ---------- Small builders ----------

type Part = string | false | undefined;
const blocks = (...parts: Part[]) => parts.filter(Boolean).join('\n\n');
const list = (items: string[], ordered = false) =>
  items.map((item, i) => `${ordered ? `${i + 1}.` : '-'} ${item}`).join('\n');
const absolute = (path: string) => new URL(path, site.url).href;

/** HTML page path to the path of its Markdown twin. The one list of pages that have a twin. */
export const twins: Record<string, string> = {
  '/': '/index.md',
  '/about-athena/': '/about-athena.md',
  '/courses/': '/courses.md',
  ...Object.fromEntries(courses.map((course) => [coursePageHref(course.slug), `/courses/${course.slug}.md`])),
};

// Links between pages lead to the Markdown twin. Anchors, forms and outside links stay as they are.
const twinOf = (href: string) => {
  const course = courses.find((item) => href === courseHref(item.slug));
  return absolute(twins[course ? coursePageHref(course.slug) : href] ?? href);
};
const link = (label: string, href: string) => `[${inline(label)}](${twinOf(href)})`;
const webLink = (label: string, href: string) => `[${inline(label)}](${absolute(href)})`;

/** Front matter names the web page a twin belongs to, then the page follows. */
const twin = (page: { path: string; title: string; description?: string }, body: string) =>
  [
    '---',
    `title: ${JSON.stringify(page.title)}`,
    page.description && `description: ${JSON.stringify(page.description)}`,
    `canonical: ${absolute(page.path)}`,
    `lang: ${site.locale}`,
    '---',
    '',
    body,
    '',
  ]
    .filter((line) => line !== undefined)
    .join('\n');

/** Moves every heading down, so a whole page can sit under another heading. */
const demote = (markdown: string, levels = 1) => markdown.replace(/^#/gm, '#'.repeat(levels + 1));

// ---------- Pages ----------

const field = (name: string) => about.contact.fields.find((item) => item.name === name)!.label;

const contactLines = () => [
  webLink(site.footer.contactFormLabel, site.routes.contact),
  ...site.emails.map((email) => `[${email}](mailto:${email})`),
  `[${site.phone.display}](${site.phone.href})`,
];

const contactSection = (level = 2) =>
  blocks(
    `${'#'.repeat(level)} ${inline(about.contact.title)}`,
    inline(about.contact.intro),
    list(contactLines()),
    inline(about.contact.note),
    `${'#'.repeat(level + 1)} ${inline(site.footer.followTitle)}`,
    list(site.social.map((item) => `[${item.name}](${item.url})`)),
  );

const homeBody = () => {
  const { hero, membership, announcement, seminar, series, transmission, start, benefits } = home;
  return blocks(
    `# ${inline(hero.titleLines.join(' '))}`,

    `## ${inline(membership.title)}`,
    inline(membership.question),
    ...membership.points.flatMap((point) => [`### ${inline(point.title)}`, inline(point.text)]),
    link(membership.cta.label, membership.cta.href),

    // The announcement has no title of its own on the page: a rule sets it apart instead.
    '---',
    inline(announcement.greeting),
    inline(announcement.text),
    list(announcement.courses.map((item) => (item.href ? link(item.title, item.href) : inline(item.title)))),
    inline(announcement.newsletter.text),
    link(announcement.newsletter.cta.label, announcement.newsletter.cta.href),

    `## ${inline(seminar.title)}`,
    inline(seminar.kicker),
    inline(seminar.open),
    inline(seminar.note),

    `## ${inline(series.title)}`,
    inline(series.text),
    link(series.cta.label, series.cta.href),

    `## ${inline(transmission.title)}`,
    inline(transmission.text),
    link(transmission.cta.label, transmission.cta.href),

    `## ${inline(start.title)}`,
    inline(start.lines.join(' ')),

    `## ${inline(benefits.title)}`,
    inline(benefits.question),
    ...benefits.items.flatMap((item) => [
      `### ${inline(item.title)}`,
      item.italic ? `*${inline(item.text)}*` : inline(item.text),
    ]),
  );
};

const aboutBody = () =>
  blocks(
    `# ${inline(about.title)}`,
    ...about.intro.map(inline),
    `## ${inline(about.saysTitle)}`,
    ...about.story.flatMap((part) => part.paragraphs.map(inline)),
    contactSection(),
  );

// The facts a visitor weighs first: who teaches, when, and what it costs.
const courseFacts = (course: Course) =>
  list(
    [
      `${coursesPage.ui.taughtBy} ${course.instructor}`,
      course.schedule,
      course.price && `${course.price.label} ${course.price.display}`,
    ]
      .filter((fact) => fact !== undefined)
      .map(inline),
  );

const courseIntro = (course: Course) =>
  course.status === 'open'
    ? [course.summary && inline(course.summary), courseFacts(course)]
    : [inline(coursesPage.ui.placeholderBadge), inline(coursesPage.ui.placeholderNote), courseFacts(course)];

const courseBody = (course: Course, { contact = true } = {}) =>
  blocks(
    `# ${inline(course.title)}`,
    ...courseIntro(course),

    ...course.sections.flatMap((section) => [
      `## ${inline(section.label)}`,
      `*${inline(section.sublabel)}*`,
      htmlToMarkdown(section.html),
    ]),

    ...(course.status === 'open'
      ? [
          `## ${inline(registrationTab.label)}`,
          `*${inline(registrationTab.sublabel)}*`,
          course.registrationNote && inline(course.registrationNote),
          course.price && `**${inline(course.price.label)}** ${inline(course.price.display)}`,
          course.includesLabel && inline(course.includesLabel),
          course.includes && list(course.includes.map(inline)),
          webLink(coursesPage.ui.enroll, coursePageHref(course.slug)),
          // Until a Stripe link is set in courses.ts, enrolment is completed by email.
          course.stripePaymentLink
            ? webLink(coursesPage.ui.payWithStripe, course.stripePaymentLink)
            : inline(coursesPage.ui.paymentNotConnected),
        ]
      : []),

    contact && contactSection(),
  );

const coursesHead = () => blocks(`# ${inline(coursesPage.title)}`, inline(coursesPage.description));

const coursesBody = () =>
  blocks(
    coursesHead(),
    ...courses.flatMap((course) => [
      `## ${link(course.title, coursePageHref(course.slug))}`,
      ...courseIntro(course),
    ]),
    contactSection(),
  );

export const homeMarkdown = () => twin({ path: '/', ...home.meta }, homeBody());
export const aboutMarkdown = () => twin({ path: '/about-athena/', ...about.meta }, aboutBody());
export const coursesMarkdown = () =>
  twin({ path: site.routes.courses, title: coursesPage.title, description: coursesPage.description }, coursesBody());
export const courseMarkdown = (course: Course) =>
  twin({ path: coursePageHref(course.slug), title: course.title, description: course.summary }, courseBody(course));

// ---------- Whole-site files ----------

const opening = () => blocks(`# ${site.name}`, `> ${inline(site.description)}`, inline(site.mission));

/** /llms.txt in the llmstxt.org format: name, summary, notes, then links to the twins. */
export const llmsTxt = () => {
  const entry = (label: string, path: string, note?: string) =>
    `- [${inline(label)}](${absolute(path)})${note ? `: ${inline(note)}` : ''}`;
  const homeNote = [home.membership, home.seminar, home.series, home.transmission, home.benefits]
    .map((section) => section.title)
    .join(' · ');
  return (
    blocks(
      opening(),
      list([
        `${field('email')}: ${site.emails.join(', ')}`,
        `${field('phone')}: ${site.phone.display}`,
        `${site.footer.contactFormLabel}: ${absolute(site.routes.contact)}`,
        ...site.social.map((item) => `${item.name}: ${item.url}`),
        'The links below are Markdown copies of the web pages. ' +
          'Each copy gives the address of its web page under `canonical`.',
      ]),

      '## Pages',
      [
        entry(site.nav[0].label, twins['/'], homeNote),
        entry(site.nav[1].label, twins['/about-athena/'], about.intro[0]),
        entry(coursesPage.title, twins['/courses/'], coursesPage.description),
      ].join('\n'),

      `## ${inline(coursesPage.title)}`,
      courses
        .map((course) =>
          entry(course.title, twins[coursePageHref(course.slug)], course.summary ?? coursesPage.ui.placeholderBadge),
        )
        .join('\n'),

      '## Optional',
      entry('llms-full.txt', '/llms-full.txt', 'Every page above in one file'),
    ) + '\n'
  );
};

/** /llms-full.txt: the whole site's copy as one Markdown document. */
export const llmsFullTxt = () => {
  const page = (path: string, body: string, levels = 1) =>
    demote(body, levels).replace(/^(#+ .*)$/m, `$1\n\n<${absolute(path)}>`);
  return (
    blocks(
      opening(),
      page('/', homeBody()),
      page('/about-athena/', aboutBody()),
      page(site.routes.courses, coursesHead()),
      ...courses.map((course) => page(coursePageHref(course.slug), courseBody(course, { contact: false }), 2)),
    ) + '\n'
  );
};

/** Response for the text endpoints. `canonical` tells search engines which web page a twin copies. */
export const textResponse = (body: string, type: 'text/markdown' | 'text/plain', canonical?: string) =>
  new Response(body, {
    headers: {
      'Content-Type': `${type}; charset=utf-8`,
      ...(canonical && { Link: `<${absolute(canonical)}>; rel="canonical"` }),
    },
  });
