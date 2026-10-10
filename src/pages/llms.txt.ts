// /llms.txt: a short guide to the site for AI agents, in the llmstxt.org format.
import type { APIRoute } from 'astro';
import { llmsTxt, textResponse } from '../lib/markdown';

export const GET: APIRoute = () => textResponse(llmsTxt(), 'text/plain');
