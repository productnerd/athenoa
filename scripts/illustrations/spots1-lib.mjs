// Shared helpers for the spots-1 illustration generators (athena, owl, sun-rays, waves).
// Everything is plain geometry: curves are sampled to polylines, hidden parts are cut away
// against occluder polygons (so the drawings need no fills at all), and what is left is
// written back out as smooth cubic paths.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

export const TAU = Math.PI * 2;
const here = dirname(fileURLToPath(import.meta.url));
export const outDir = resolve(here, '../../src/assets/illustrations');

// ---------- numbers ----------
export const fmt = (v) => {
  const r = Math.round(v * 10) / 10;
  return r === 0 ? '0' : String(r);
};
export const xy = (p) => `${fmt(p[0])} ${fmt(p[1])}`;

export function prng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- vectors ----------
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const mul = (a, k) => [a[0] * k, a[1] * k];
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const norm = (a) => {
  const l = Math.hypot(a[0], a[1]) || 1;
  return [a[0] / l, a[1] / l];
};
export const perp = (a) => [-a[1], a[0]];

// ---------- Bézier shapes: { start, segs: [[c1, c2, p], ...] } ----------
export const shape = (start, ...segs) => ({ start, segs });
export function shapeD(s, close = false) {
  return `M${xy(s.start)}` + s.segs.map(([a, b, c]) => `C${xy(a)} ${xy(b)} ${xy(c)}`).join('') + (close ? 'Z' : '');
}
const cubic = (p0, a, b, p1, t) => {
  const u = 1 - t;
  const k0 = u * u * u,
    k1 = 3 * u * u * t,
    k2 = 3 * u * t * t,
    k3 = t * t * t;
  return [k0 * p0[0] + k1 * a[0] + k2 * b[0] + k3 * p1[0], k0 * p0[1] + k1 * a[1] + k2 * b[1] + k3 * p1[1]];
};
export function shapePts(s, per = 28) {
  const pts = [s.start];
  let p0 = s.start;
  for (const [a, b, c] of s.segs) {
    for (let i = 1; i <= per; i++) pts.push(cubic(p0, a, b, c, i / per));
    p0 = c;
  }
  return pts;
}
export function mirrorShape(s, cx) {
  const m = ([x, y]) => [2 * cx - x, y];
  return { start: m(s.start), segs: s.segs.map((seg) => seg.map(m)) };
}
export function reverseShape(s) {
  const pts = [s.start, ...s.segs.map((g) => g[2])];
  const segs = [];
  for (let i = s.segs.length - 1; i >= 0; i--) {
    const [a, b] = s.segs[i];
    segs.push([b, a, pts[i]]);
  }
  return { start: pts[pts.length - 1], segs };
}
export const joinShapes = (a, b) => ({ start: a.start, segs: [...a.segs, ...b.segs] });
// half runs down the right side from the top centre to the bottom centre
export const symmetric = (half, cx) => joinShapes(half, reverseShape(mirrorShape(half, cx)));
export const mirrorPts = (pts, cx) => pts.map(([x, y]) => [2 * cx - x, y]);

// ---------- polylines ----------
export function resample(pts, step) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + dist(pts[i - 1], pts[i]));
  const total = L[L.length - 1];
  if (total === 0) return [pts[0]];
  const k = Math.max(1, Math.round(total / step));
  const out = [];
  let j = 0;
  for (let i = 0; i <= k; i++) {
    const t = (total * i) / k;
    while (j < L.length - 2 && L[j + 1] < t) j++;
    const span = L[j + 1] - L[j] || 1;
    out.push(lerp(pts[j], pts[j + 1], (t - L[j]) / span));
  }
  return out;
}

// Catmull-Rom through the points, written as C + S commands
export function smooth(pts, closed = false) {
  const n = pts.length;
  if (n < 2) return '';
  if (n === 2) return `M${xy(pts[0])}L${xy(pts[1])}`;
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${xy(pts[0])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1),
      p1 = get(i),
      p2 = get(i + 1),
      p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += i === 0 ? `C${xy(c1)} ${xy(c2)} ${xy(p2)}` : `S${xy(c2)} ${xy(p2)}`;
  }
  return d + (closed ? 'Z' : '');
}

// Interpolate key points into a dense Catmull-Rom polyline
export function spline(keys, per = 16) {
  const n = keys.length;
  const get = (i) => keys[Math.max(0, Math.min(n - 1, i))];
  const pts = [keys[0]];
  for (let i = 0; i < n - 1; i++) {
    const p0 = get(i - 1),
      p1 = get(i),
      p2 = get(i + 1),
      p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    for (let k = 1; k <= per; k++) pts.push(cubic(p1, c1, c2, p2, k / per));
  }
  return pts;
}

// ---------- occlusion ----------
export function polygon(pts) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [x, y] of pts) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { pts, x0, y0, x1, y1 };
}
function inside(p, pg) {
  const { pts } = pg;
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i],
      b = pts[j];
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function edgeDist(p, pg) {
  const { pts } = pg;
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[j],
      b = pts[i];
    const vx = b[0] - a[0],
      vy = b[1] - a[1];
    const l2 = vx * vx + vy * vy || 1;
    let t = ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / l2;
    t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vy * t);
    if (d < best) best = d;
  }
  return best;
}
// true when the point lies in any polygon, or closer than `gap` to one
export function blocker(polys, gap = 0) {
  return (p) =>
    polys.some((pg) => {
      if (p[0] < pg.x0 - gap || p[0] > pg.x1 + gap || p[1] < pg.y0 - gap || p[1] > pg.y1 + gap) return false;
      return inside(p, pg) || (gap > 0 && edgeDist(p, pg) < gap);
    });
}
function boundary(a, b, hidden) {
  // a is visible, b is hidden: find the last visible point between them
  let lo = a,
    hi = b;
  for (let i = 0; i < 10; i++) {
    const mid = lerp(lo, hi, 0.5);
    if (hidden(mid)) hi = mid;
    else lo = mid;
  }
  return lo;
}
// Split a dense polyline into the runs that are not hidden
export function visible(pts, hidden) {
  const runs = [];
  let run = null;
  let prev = null;
  let prevHidden = true;
  for (const p of pts) {
    const h = hidden(p);
    if (!h) {
      if (!run) {
        run = [];
        if (prev && prevHidden) run.push(boundary(p, prev, hidden));
      }
      run.push(p);
    } else if (run) {
      run.push(boundary(prev, p, hidden));
      runs.push(run);
      run = null;
    }
    prev = p;
    prevHidden = h;
  }
  if (run) runs.push(run);
  return runs.filter((r) => r.length > 1 && pathLength(r) > 1.5);
}
export function pathLength(pts) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += dist(pts[i - 1], pts[i]);
  return l;
}

// ---------- output ----------
export const path = (d) => `<path d="${d}"/>`;
export function writeSvg(name, w, h, strokeWidth, body) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" ` +
    `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
  const file = resolve(outDir, `${name}.svg`);
  writeFileSync(file, svg);
  console.log(`${name}.svg  ${(svg.length / 1024).toFixed(1)} KB`);
}
