// /about-athena.md and /el/about-athena.md: the Markdown twin of the About page.
import type { APIRoute } from 'astro';
import { getLocale } from '../lib/locale';
import { textPages } from '../lib/markdown';

export const GET: APIRoute = ({ url }) => textPages(getLocale(url)).about();
