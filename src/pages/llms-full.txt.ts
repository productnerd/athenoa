// /llms-full.txt: the whole site's copy as one Markdown document.
import type { APIRoute } from 'astro';
import { llmsFullTxt, textResponse } from '../lib/markdown';

export const GET: APIRoute = () => textResponse(llmsFullTxt(), 'text/plain');
