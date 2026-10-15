// The faded Olympus range behind the home hero (client request, 15 October 2026): two silhouettes,
// no outline, filled with tints a shade off the sky (--peak-far, --peak-near, set in Hero.astro).
//
// The far range is the Olympus massif as it is seen from the east, from Litochoro and the coast:
// a broad, heavy mountain rising from the low hills of Lower Olympus on the left (south), over the
// rounded shoulder of Agios Antonios, to the cluster of rock summits in the middle (Skolio, Mytikas,
// then Stefani, the "Throne of Zeus", with its seat between two horns), then the Plateau of the Muses
// with the small dome of Profitis Ilias, and the long ridge falling away north (right) towards the
// Pierian hills. The near range is those low, rounded foothills. Points are drawn by hand from that
// outline and joined with smooth curves, so the mountain is not spiky.
// node scripts/illustrations/hero-peaks.mjs  ->  src/assets/illustrations/hero-peaks.svg
import { writeFileSync } from 'node:fs';

const W = 1600;
const H = 500;

// [x, height] as shares of the width and of the height
const FAR = [
  [-0.02, 0.2], [0.04, 0.24], [0.1, 0.28], [0.16, 0.33], [0.21, 0.4], [0.25, 0.47], // Lower Olympus
  [0.29, 0.55], [0.32, 0.6], [0.345, 0.62], [0.365, 0.64], // Agios Antonios, rounded
  [0.385, 0.68], [0.4, 0.74], [0.41, 0.725], [0.425, 0.765], // Skolio
  [0.44, 0.82], [0.448, 0.81], [0.456, 0.775], // Mytikas, then the Louki couloir
  [0.466, 0.805], [0.474, 0.785], [0.481, 0.8], // Stefani: two horns and the seat between
  [0.495, 0.74], [0.515, 0.705], [0.54, 0.7], [0.56, 0.715], [0.575, 0.705], // Plateau of the Muses, Profitis Ilias
  [0.6, 0.67], [0.64, 0.6], [0.69, 0.52], [0.75, 0.45], [0.81, 0.39], [0.87, 0.34], [0.93, 0.3], [1.02, 0.26],
];
const NEAR = [
  [-0.02, 0.12], [0.07, 0.19], [0.15, 0.24], [0.23, 0.21], [0.31, 0.16], [0.4, 0.18], [0.5, 0.23],
  [0.6, 0.21], [0.7, 0.26], [0.8, 0.3], [0.9, 0.25], [1.02, 0.19],
];

// The whole range a little right, so the summits rise in the open sky over the left of the temple's
// roof, between it and the title
const SHIFT = 0.11;

// Catmull-Rom through the points, as cubic Béziers: smooth, and it passes through every point
function curve(points, shift = 0) {
  const p = points.map(([x, h]) => [(x + shift) * W, H - h * H]);
  let d = `M${p[0][0].toFixed(1)} ${H}L${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [a, b, c, e] = [p[i - 1] ?? p[i], p[i], p[i + 1], p[i + 2] ?? p[i + 1]];
    const t = 1 / 6;
    const c1 = [b[0] + (c[0] - a[0]) * t, b[1] + (c[1] - a[1]) * t];
    const c2 = [c[0] - (e[0] - b[0]) * t, c[1] - (e[1] - b[1]) * t];
    d += `C${c1.map((v) => v.toFixed(1)).join(' ')} ${c2.map((v) => v.toFixed(1)).join(' ')} ${c.map((v) => v.toFixed(1)).join(' ')}`;
  }
  return `${d}L${p.at(-1)[0].toFixed(1)} ${H}Z`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><path fill="var(--peak-far, #a8b5ee)" d="${curve([[-0.2, 0.17], ...FAR], SHIFT)}"/><path fill="var(--peak-near, #9eacea)" d="${curve(NEAR)}"/></svg>\n`;
writeFileSync('src/assets/illustrations/hero-peaks.svg', svg);
console.log('hero-peaks.svg', svg.length, 'bytes');
