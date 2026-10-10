// /courses.md: the Markdown twin of the Courses page.
import type { APIRoute } from 'astro';
import { site } from '../data/site';
import { coursesMarkdown, textResponse } from '../lib/markdown';

export const GET: APIRoute = () => textResponse(coursesMarkdown(), 'text/markdown', site.routes.courses);
