// /courses/<slug>.md and /el/courses/<slug>.md: the Markdown twin of each course page, with the course in full.
import type { APIRoute, GetStaticPaths } from 'astro';
import { courses } from '../../data/courses';
import { getLocale } from '../../lib/locale';
import { textPages } from '../../lib/markdown';

// Slugs are the same in both languages.
export const getStaticPaths: GetStaticPaths = () => courses.map((course) => ({ params: { slug: course.slug } }));

export const GET: APIRoute = ({ url, params }) => textPages(getLocale(url)).course(params.slug!);
