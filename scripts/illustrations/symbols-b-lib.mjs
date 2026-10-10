// Drawing helpers for the symbols-b set (spring-cypress, tripod, butterfly, orphic-egg, cicada, wheat).
// Everything is monoline: fill none, stroke currentColor. PAPER is for a shape that has to hide the
// lines behind it.

export const PAPER = 'var(--paper, #f2e9d3)';
export const deg = Math.PI / 180;

export const n1 = (v) => String(Math.round(v * 10) / 10);
export const P = (x, y) => `${n1(x)} ${n1(y)}`;

// Seeded random, so a drawing stays the same from run to run.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth path through points (Catmull-Rom converted to cubic Béziers).
export function spline(pts, { closed = false, k = 1, move = true } = {}) {
  const n = pts.length;
  const g = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = move ? `M${P(...pts[0])}` : `L${P(...pts[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = g(i - 1);
    const p1 = g(i);
    const p2 = g(i + 1);
    const p3 = g(i + 2);
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
    d += `C${P(...c1)} ${P(...c2)} ${P(...p2)}`;
  }
  return d + (closed ? 'Z' : '');
}

function cr(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return [0, 1].map(
    (k) =>
      0.5 *
      (2 * p1[k] +
        (-p0[k] + p2[k]) * t +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
        (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3),
  );
}

// Dense points along the same curve spline() draws.
export function sample(pts, per = 10, closed = false) {
  const n = pts.length;
  const g = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < per; j++) out.push(cr(g(i - 1), g(i), g(i + 1), g(i + 2), j / per));
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

// Straight polyline through points.
export const poly = (pts, closed = false) => `M${pts.map((p) => P(...p)).join('L')}${closed ? 'Z' : ''}`;

// Cumulative lengths of a dense polyline.
export function lengths(dense) {
  const lens = [0];
  for (let i = 1; i < dense.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  }
  return lens;
}

// Point and heading at a fraction of the length of a dense polyline.
export function along(dense, frac, lens = lengths(dense)) {
  const target = Math.max(0, Math.min(1, frac)) * lens[lens.length - 1];
  let i = 1;
  while (i < lens.length - 1 && lens[i] < target) i++;
  const a = dense[i - 1];
  const b = dense[i];
  const t = (target - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
  return {
    x: a[0] + (b[0] - a[0]) * t,
    y: a[1] + (b[1] - a[1]) * t,
    ang: Math.atan2(b[1] - a[1], b[0] - a[0]),
    length: lens[lens.length - 1],
  };
}

// Evenly spaced points along a dense polyline.
export function resample(dense, count) {
  const lens = lengths(dense);
  return Array.from({ length: count }, (_, i) => {
    const p = along(dense, i / (count - 1), lens);
    return [p.x, p.y, p.ang];
  });
}

// A dense polyline moved sideways by `dist` (positive is to the left of the direction of travel on
// screen, i.e. x + sin, y - cos). `dist` may be a function of the fraction along the line.
export function offset(dense, dist) {
  const last = dense.length - 1;
  return dense.map((p, i) => {
    const a = dense[Math.max(0, i - 1)];
    const b = dense[Math.min(last, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const w = typeof dist === 'function' ? dist(i / last) : dist;
    return [p[0] + Math.sin(ang) * w, p[1] - Math.cos(ang) * w];
  });
}

// The two edges of a band of varying width around a centre line.
export function ribbon(center, widthAt, per = 3) {
  const dense = sample(center, per);
  const half = (t) => widthAt(t) / 2;
  return { L: offset(dense, (t) => -half(t)), R: offset(dense, half), dense };
}

// A pointed leaf growing from (x, y) in direction ang. `belly` is how far the sides swell,
// `bend` curls the tip sideways. `shape` places the two side handles: [along, out, along, out].
export const SLIM = [0.34, 0.92, 0.73, 0.95];
export function leaf(x, y, ang, len, belly, bend = 0, ribTo = 0.74, shape = [0.22, 1.05, 0.72, 0.9]) {
  const [u1, v1, u2, v2] = shape;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const at = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  const sag = (u) => bend * len * u * u;
  const tip = at(len, sag(1));
  const a1 = at(len * u1, -belly * v1 + sag(u1));
  const a2 = at(len * u2, -belly * v2 + sag(u2));
  const b1 = at(len * u2, belly * v2 + sag(u2));
  const b2 = at(len * u1, belly * v1 + sag(u1));
  const outline = `M${P(x, y)}C${P(...a1)} ${P(...a2)} ${P(...tip)}C${P(...b1)} ${P(...b2)} ${P(x, y)}Z`;
  const r0 = at(len * 0.1, sag(0.1));
  const r1 = at(len * 0.45, sag(0.45) * 0.8);
  const r2 = at(len * ribTo, sag(ribTo));
  const rib = `M${P(...r0)}Q${P(...r1)} ${P(...r2)}`;
  return { outline, rib, tip };
}

// Is the point inside the closed polyline?
export function inside([x, y], polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// Cut a dense polyline into the stretches that are not hidden. Each stretch ends on the boundary.
export function visibleRuns(fine, hidden, keepEvery = 1) {
  const edge = (shown, covered) => {
    let a = shown;
    let b = covered;
    for (let i = 0; i < 14; i++) {
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (hidden(m)) b = m;
      else a = m;
    }
    return a;
  };
  const runs = [];
  let run = null;
  fine.forEach((p, i) => {
    if (!hidden(p)) {
      if (!run) {
        run = i > 0 ? [edge(p, fine[i - 1])] : [];
        runs.push(run);
      }
      run.push(p);
    } else if (run) {
      run.push(edge(fine[i - 1], p));
      run = null;
    }
  });
  return runs
    .filter((r) => r.length > 1)
    .map((r) => r.filter((_, i) => i === 0 || i === r.length - 1 || i % keepEvery === 0));
}

// A wavy line from a to b: `waves` full waves of amplitude `amp`, fading in and out at the ends.
export function wavy(a, b, waves, amp, phase = 0, per = 10) {
  const n = Math.max(2, Math.round(waves * per));
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const fade = Math.min(1, t * 5, (1 - t) * 5);
    const w = Math.sin(t * waves * Math.PI * 2 + phase) * amp * fade;
    pts.push([a[0] + dx * t + nx * w, a[1] + dy * t + ny * w]);
  }
  return pts;
}

const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== false)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
const fillOf = (f) => (f === true ? PAPER : f || undefined);

// `fill` true is paper, a string is that paint. `bare` drops the stroke (for washes and masks).
export const path = (d, fill = false, bare = false) =>
  `<path d="${d}"${attrs({ fill: fillOf(fill), stroke: bare ? 'none' : undefined })}/>`;
export const circle = (cx, cy, r, fill = false) =>
  `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}"${attrs({ fill: fillOf(fill) })}/>`;
export const ellipse = (cx, cy, rx, ry, rot = 0, fill = false, bare = false) =>
  `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}"${attrs({
    transform: rot ? `rotate(${n1(rot)} ${n1(cx)} ${n1(cy)})` : undefined,
    fill: fillOf(fill),
    stroke: bare ? 'none' : undefined,
  })}/>`;
export const group = (body, o = {}) => `<g${attrs(o)}>${body}</g>`;

// Mirror a fragment left to right about x = cx.
export const mirror = (body, cx) => `<g transform="translate(${n1(2 * cx)} 0) scale(-1 1)">${body}</g>`;

export function svg(w, h, strokeWidth, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
}
