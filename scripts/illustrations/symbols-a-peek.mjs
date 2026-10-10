// Look at one drawing: render any SVG of the site to PNG with the page ink and palette written in.
//   node scripts/illustrations/symbols-a-peek.mjs <file.svg> <out.png> [--w 900] [--on creme|blue|deep|light]
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const w = Number(opt('w', 900));
const on = opt('on', 'creme');
const [file, out] = args;
const { paper, ink } = {
  creme: { paper: '#f2e9d3', ink: '#0b1c8c' },
  blue: { paper: '#0b1c8c', ink: '#f9f3e3' },
  deep: { paper: '#071260', ink: '#f9f3e3' },
  light: { paper: '#b3c0f3', ink: '#071260' },
}[on];
const src = readFileSync(file, 'utf8')
  .replace('<svg ', `<svg width="${w}" `)
  .replaceAll('currentColor', ink)
  .replaceAll('var(--paper, #f2e9d3)', paper)
  .replace(/var\(--[a-z-]+,\s*(#[0-9a-fA-F]+)\)/g, '$1');
await sharp(Buffer.from(src)).flatten({ background: paper }).png().toFile(out);
console.log(out);
