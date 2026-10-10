// sun-rays.svg and waves.svg: the two line fields (Apollonian light, the sea).
// node scripts/illustrations/spots1-fields.mjs
import { TAU, resample, smooth, path, writeSvg, prng, fmt } from './spots1-lib.mjs';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// =====================================================================================
// sun-rays: wavy lines radiating from an empty disc of radius 150, ending at varied lengths
// =====================================================================================
{
  const SIZE = 800;
  const C = SIZE / 2;
  const HOLE = 150;
  const N = 76;
  const LEN = 80; // wavelength along a ray
  const rand = prng(21);
  const ray = (angle, r0, r1) => {
    const d = [Math.cos(angle), Math.sin(angle)];
    const n = [-d[1], d[0]];
    const gain = 0.9 + rand() * 0.22;
    const phase = 0.4 + (rand() - 0.5) * 0.45;
    const pts = [];
    for (let r = r0; r < r1; r += 2) pts.push(r);
    pts.push(r1);
    return smooth(
      resample(
        pts.map((r) => {
          const amp = gain * (2.2 + 6.2 * clamp01((r - HOLE) / 240));
          const off = amp * Math.sin((TAU * r) / LEN + phase);
          return [C + d[0] * r + n[0] * off, C + d[1] * r + n[1] * off];
        }),
        LEN / 5,
      ),
    );
  };
  const longEnds = [392, 322, 368, 344];
  const shortEnds = [352, 300, 334, 286];
  const rays = [];
  for (let i = 0; i < N; i++) {
    const a = ((i + (rand() - 0.5) * 0.16) * TAU) / N - TAU / 4;
    const far = i % 4 === 0 ? 0 : 6;
    rays.push(ray(a, HOLE, longEnds[i % 4] - rand() * 12 - far));
    // a shorter ray in between, starting further out so the lines never crowd at the disc
    const b = ((i + 0.5 + (rand() - 0.5) * 0.16) * TAU) / N - TAU / 4;
    rays.push(ray(b, 212 + rand() * 34, shortEnds[(i + 2) % 4] + (rand() - 0.5) * 20));
  }
  writeSvg('sun-rays', SIZE, SIZE, 2.6, rays.map(path).join(''));
}

// =====================================================================================
// waves: five parallel sea lines that run off both edges and meet themselves when tiled
// =====================================================================================
{
  const W = 1600;
  const H = 120;
  const LINES = 5;
  const STEP = 20;
  // every term has a whole number of periods in W, so y and its slope match at x = 0 and x = W
  const y = (k, x) => {
    const u = (TAU * x) / W;
    const gap = 15.2 * (1 + 0.16 * Math.sin(2 * u + 1.1));
    const amp = 12.5 * (1 + 0.22 * Math.sin(u + k * 0.7));
    return H / 2 + (k - (LINES - 1) / 2) * gap + amp * Math.sin(4 * u + k * 0.24 + 0.4) + 2 * Math.sin(9 * u + k * 1.3);
  };
  const slope = (k, x) => (y(k, x + 0.01) - y(k, x - 0.01)) / 0.02;
  const lines = [];
  for (let k = 0; k < LINES; k++) {
    let d = `M0 ${fmt(y(k, 0))}`;
    for (let x = 0; x < W; x += STEP) {
      const x1 = x + STEP;
      const c2 = `${fmt(x1 - STEP / 3)} ${fmt(y(k, x1) - (slope(k, x1) * STEP) / 3)}`;
      const end = `${fmt(x1)} ${fmt(y(k, x1))}`;
      d += x === 0 ? `C${fmt(STEP / 3)} ${fmt(y(k, 0) + (slope(k, 0) * STEP) / 3)} ${c2} ${end}` : `S${c2} ${end}`;
    }
    lines.push(d);
  }
  writeSvg('waves', W, H, 2.5, lines.map(path).join(''));
}
