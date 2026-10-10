// Quick look at any SVG files, side by side, without a browser: node symbols-b-peek.mjs out.png width a.svg b.svg ...
// A width under 10 is a scale instead (pixels per unit of the viewBox), so stroke weights can be compared.
// Add --blue for crème ink on Greek blue. currentColor and the paper variable are substituted,
// because the renderer does not know the page's ink.
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const args = process.argv.slice(2);
const blue = args.includes('--blue');
const [out, width, ...files] = args.filter((a) => a !== '--blue');
const paper = blue ? '#0b1c8c' : '#f2e9d3';
const ink = blue ? '#f2e9d3' : '#0b1c8c';
const pad = 24;

const tiles = [];
let x = pad;
let height = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8')
    .replaceAll('currentColor', ink)
    .replace(/var\(--paper[^)]*\)/g, paper)
    .replace(/var\(--blue-light[^)]*\)/g, '#b3c0f3')
    .replace(/var\(--blue-deep[^)]*\)/g, '#071260')
    .replace(/var\(--blue[^)]*\)/g, '#0b1c8c');
  const [, , , vw, vh] = src.match(/viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"/).map(Number);
  const w = Math.round(Number(width) < 10 ? vw * Number(width) : Number(width));
  const input = await sharp(Buffer.from(src), { density: (72 * w) / vw }).resize({ width: w }).png().toBuffer();
  const h = Math.round((w * vh) / vw);
  tiles.push({ input, left: x, top: pad });
  x += w + pad;
  height = Math.max(height, h);
}
await sharp({ create: { width: x, height: height + pad * 2, channels: 3, background: paper } })
  .composite(tiles)
  .png({ compressionLevel: 9 })
  .toFile(out);
