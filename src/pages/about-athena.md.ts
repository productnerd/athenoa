// /about-athena.md: the Markdown twin of the About Athena page.
import type { APIRoute } from 'astro';
import { aboutMarkdown, textResponse } from '../lib/markdown';

export const GET: APIRoute = () => textResponse(aboutMarkdown(), 'text/markdown', '/about-athena/');
