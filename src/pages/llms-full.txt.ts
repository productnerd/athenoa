// /llms-full.txt and /el/llms-full.txt: one language's whole copy as one Markdown document.
import type { APIRoute } from 'astro';
import { getLocale } from '../lib/locale';
import { textPages } from '../lib/markdown';

export const GET: APIRoute = ({ url }) => textPages(getLocale(url)).llmsFull();
