// Shared helpers for the Olympus footer scene (olympus-far.mjs, olympus-mid.mjs, olympus-near.mjs).
import { writeFileSync } from 'node:fs';

export const OUT = new URL('../../src/assets/illustrations/', import.meta.url);
export const PAPER = 'var(--paper, #f2e9d3)';
export const LIGHT = 'var(--blue-light, #b3c0f3)';

/** Seeded random numbers, so a rerun writes the same drawing. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const n = (v) => String(Math.round(v * 10) / 10);
export const P = (p) => `${n(p[0])} ${n(p[1])}`;
export const lerp = (a, b, t) => a + (b - a) * t;
export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** Catmull-Rom through the points, written as cubic Béziers. */
export function smooth(pts, closed = false, k = 6) {
  const len = pts.length;
  const get = (i) => (closed ? pts[((i % len) + len) % len] : pts[Math.max(0, Math.min(len - 1, i))]);
  let d = `M${P(pts[0])}`;
  const last = closed ? len : len - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / k, p1[1] + (p2[1] - p0[1]) / k];
    const c2 = [p2[0] - (p3[0] - p1[0]) / k, p2[1] - (p3[1] - p1[1]) / k];
    d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return closed ? d + 'Z' : d;
}
/** The same curve without its leading M, to continue an open path. */
export const smoothOn = (pts, k) => smooth(pts, false, k).replace(/^M[^C]+/, '');

/** Rock: straight runs between the points, each with a slight hand-drawn bow. */
export function rock(pts, r, bow = 1.3, move = true) {
  let d = move ? `M${P(pts[0])}` : '';
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const m = (r() - 0.5) * 2 * bow * Math.min(1, len / 26);
    d += `Q${P([(a[0] + b[0]) / 2 - (dy / len) * m, (a[1] + b[1]) / 2 + (dx / len) * m])} ${P(b)}`;
  }
  return d;
}

/** A crooked line from a to b: the way a spur or a gully runs down a rock face. */
export function zig(a, b, r, amp = 5, step = 24) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const steps = Math.max(1, Math.round(len / step));
  const pts = [a];
  let side = r() < 0.5 ? 1 : -1;
  for (let i = 1; i < steps; i++) {
    const t = (i + (r() - 0.5) * 0.3) / steps;
    const o = side * amp * (0.45 + r() * 0.55);
    pts.push([a[0] + dx * t - (dy / len) * o, a[1] + dy * t + (dx / len) * o]);
    side = -side;
  }
  pts.push(b);
  return pts;
}

/** Point at fraction t (0..1) of a polyline's length. */
export function along(pts, t) {
  const seg = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(l);
    total += l;
  }
  let want = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) return mix(pts[i], pts[i + 1], seg[i] ? want / seg[i] : 0);
    want -= seg[i];
  }
  return pts[pts.length - 1];
}

/** y(x) through control points (x ascending), Catmull-Rom in y: the same curve smooth() draws. */
export function curve(ctrl) {
  return (x) => {
    let i = 0;
    while (i < ctrl.length - 2 && x > ctrl[i + 1][0]) i++;
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p0 = ctrl[Math.max(0, i - 1)];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    const t = Math.max(0, Math.min(1, (x - p1[0]) / (p2[0] - p1[0])));
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1[1] +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
    );
  };
}

/** Collects shapes by kind and writes one SVG, grouping neighbours of the same kind. */
export function sheet(viewBox, strokeWidth) {
  const items = [];
  const add = (kind) => (d) => {
    if (d) items.push({ kind, d });
  };
  const open = {
    line: '',
    paper: `<g fill="${PAPER}">`,
    mask: `<g fill="${PAPER}" stroke="none">`,
    wash: `<g fill="${LIGHT}" stroke="none" data-nodraw="">`,
    ink: '<g fill="currentColor">',
  };
  return {
    line: add('line'), // stroke only
    paper: add('paper'), // paper fill and stroke: hides what is behind
    mask: add('mask'), // paper fill, no stroke
    wash: add('wash'), // flat light-blue wash, fades in after the lines
    ink: add('ink'), // solid ink
    write(name) {
      let body = '';
      let kind = null;
      for (const item of items) {
        if (item.kind !== kind) {
          if (kind && kind !== 'line') body += '</g>';
          body += open[item.kind];
          kind = item.kind;
        }
        body += `<path d="${item.d}"/>`;
      }
      if (kind && kind !== 'line') body += '</g>';
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
      writeFileSync(new URL(name, OUT), svg);
      console.log(name, `${(svg.length / 1024).toFixed(1)} KB`, `${items.length} paths`);
    },
  };
}
