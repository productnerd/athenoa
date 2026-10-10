// /llms.txt and /el/llms.txt: a short guide to the site for AI agents, in the llmstxt.org format.
import type { APIRoute } from 'astro';
import { getLocale } from '../lib/locale';
import { textPages } from '../lib/markdown';

export const GET: APIRoute = ({ url }) => textPages(getLocale(url)).llms();
