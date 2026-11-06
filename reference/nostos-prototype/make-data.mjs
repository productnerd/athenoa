// Builds data.js for the prototype from src/data/nostos/*.json:  node reference/nostos-prototype/make-data.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = new URL('../../src/data/nostos/', import.meta.url);
const read = (n) => JSON.parse(readFileSync(new URL(n + '.json', dir)));
const meta = read('meta');
const D = { meta: { ntranscribed: meta.transcribedTalks }, groups: meta.groups, bridges: [] };
for (const f of readdirSync(dir)) if (f.endsWith('.json') && f !== 'meta.json') D[f.slice(0, -5)] = read(f.slice(0, -5));
writeFileSync(new URL('./data.js', import.meta.url), 'window.DATA=' + JSON.stringify(D) + ';\n');
console.log('data.js written');
