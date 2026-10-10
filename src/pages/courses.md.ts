// /courses.md and /el/courses.md: the Markdown twin of the Courses page.
import type { APIRoute } from 'astro';
import { getLocale } from '../lib/locale';
import { textPages } from '../lib/markdown';

export const GET: APIRoute = ({ url }) => textPages(getLocale(url)).courses();
