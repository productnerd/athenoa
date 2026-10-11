// Turns the built site (dist/) into a PREVIEW that can live under a path, for GitHub Pages:
//   node scripts/pages-preview.mjs /athenoa
// The site itself is built for the root of its own domain and every address in it starts with "/".
// A GitHub project page is served from https://<user>.github.io/<repo>/, so this rewrites those
// addresses in the built HTML, CSS and JavaScript to start with the given prefix. It also marks
// every page "noindex" and replaces robots.txt, because a preview must not be found by search
// engines. The source is not touched: the real launch needs none of this.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = (process.argv[2] ?? '').replace(/\/+$/, '');
if (!/^\/[\w.-]+$/.test(base)) {
  console.error('usage: node scripts/pages-preview.mjs /<repo-name>');
  process.exit(1);
}
const dist = new URL('../dist/', import.meta.url).pathname;
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else files.push(path);
  }
};
walk(dist);

// "/x" but not "//host" and not already prefixed
const rooted = (url) => url.startsWith('/') && !url.startsWith('//') && !url.startsWith(`${base}/`) && url !== base;
const fix = (url) => (rooted(url) ? base + url : url);
const fixCssUrls = (text) =>
  text.replace(/url\(\s*(['"]?)(\/[^)'"]*)\1\s*\)/g, (m, q, url) => `url(${q}${fix(url)}${q})`);

let changed = 0;
for (const file of files) {
  let text;
  if (/\.html$/.test(file)) {
    text = readFileSync(file, 'utf8');
    const before = text;
    // attributes that hold one address
    text = text.replace(/\b(href|src|action|poster|data-[\w-]*(?:src|href|link))=(["'])(\/[^"']*)\2/g, (m, attr, q, url) => `${attr}=${q}${fix(url)}${q}`);
    // srcset holds several
    text = text.replace(/\bsrcset=(["'])([^"']*)\1/g, (m, q, set) => `srcset=${q}${set.split(',').map((part) => part.replace(/^(\s*)(\/\S*)/, (x, sp, url) => sp + fix(url))).join(',')}${q}`);
    // addresses inside style attributes and <style> blocks
    text = fixCssUrls(text);
    // sound files named in inline scripts
    text = text.replace(/(["'`])(\/audio\/[^"'`]+)\1/g, (m, q, url) => `${q}${fix(url)}${q}`);
    // a preview is not for search engines
    text = text.replace(/<meta name="robots"[^>]*>/g, '').replace(/<head>/, '<head><meta name="robots" content="noindex, nofollow">');
    if (text !== before) changed++;
  } else if (/\.css$/.test(file)) {
    text = readFileSync(file, 'utf8');
    const before = text;
    text = fixCssUrls(text);
    if (text !== before) changed++;
  } else if (/\.(js|mjs)$/.test(file)) {
    text = readFileSync(file, 'utf8');
    const before = text;
    // public files and built chunks named as strings
    text = text.replace(/(["'`])(\/(?:audio|textures|_astro)\/[^"'`]*)\1/g, (m, q, url) => `${q}${fix(url)}${q}`);
    if (text !== before) changed++;
  } else continue;
  writeFileSync(file, text);
}
writeFileSync(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log(`preview under ${base}: ${changed} of ${files.length} files rewritten`);
