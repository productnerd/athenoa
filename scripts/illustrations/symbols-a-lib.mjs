// Drawing helpers for the symbols-a set (tetractys, monad, bow-lyre, cave-sun, ladder, torch).
// Monoline throughout: fill none, stroke currentColor, one weight. PAPER is for a closed shape
// that has to hide the lines behind it; DEEP is the one flat wash (the dark of the cave); INK for
// a solid point.

export const PAPER = 'var(--paper, #f2e9d3)';
export const DEEP = 'var(--blue-deep, #071260)';
export const INK = 'currentColor';
export const TAU = Math.PI * 2;

export const n1 = (v) => String(Math.round(v * 10) / 10);
export const P = (x, y) => `${n1(x)} ${n1(y)}`;

// Smooth path through points (Catmull-Rom converted to cubic Béziers).
export function spline(pts, { closed = false, k = 1, cont = false } = {}) {
  const n = pts.length;
  const g = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `${cont ? 'L' : 'M'}${P(...pts[0])}`;
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

// Straight-segment path through points.
export const poly = (pts, closed = false) =>
  `M${pts.map((p) => P(...p)).join('L')}${closed ? 'Z' : ''}`;

// The two edges of a band of varying width around a centre line (control points in, dense out).
export function ribbon(center, widthAt, per = 6) {
  const dense = sample(center, per);
  const L = [];
  const R = [];
  const last = dense.length - 1;
  dense.forEach((p, i) => {
    const a = dense[Math.max(0, i - 1)];
    const b = dense[Math.min(last, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const w = widthAt(i / last) / 2;
    L.push([p[0] - Math.sin(ang) * w, p[1] + Math.cos(ang) * w]);
    R.push([p[0] + Math.sin(ang) * w, p[1] - Math.cos(ang) * w]);
  });
  return { L, R, dense };
}

// Closed outline of a band of varying width around a centre line. A width of 0 at an end makes a point.
export function band(center, widthAt, { per = 6, every = 3 } = {}) {
  const { L, R, dense } = ribbon(center, widthAt, per);
  const l = thin(L, every);
  const r = thin(R, every).reverse();
  return { d: `${spline(l)}${spline(r, { cont: true })}Z`, L, R, dense, outline: [...L, ...R.slice().reverse()] };
}

// Keep every nth point of a dense line (plus both ends), ready for spline().
export const thin = (pts, every = 4) =>
  pts.filter((_, i) => i === 0 || i === pts.length - 1 || i % every === 0);

// Is the point inside the closed polyline?
export function inside([x, y], shape) {
  let hit = false;
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    const [xi, yi] = shape[i];
    const [xj, yj] = shape[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// Distance from a point to a polyline (closed or not).
export function distTo([x, y], line, closed = false) {
  let best = Infinity;
  const n = line.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [ax, ay] = line[i];
    const [bx, by] = line[(i + 1) % n];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy));
  }
  return best;
}

// Cut a dense line into the stretches that are not hidden. Each stretch ends on the boundary.
export function visibleRuns(dense, hidden, minLen = 6) {
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
  dense.forEach((p, i) => {
    if (!hidden(p)) {
      if (!run) {
        run = i > 0 ? [edge(p, dense[i - 1])] : [];
        runs.push(run);
      }
      run.push(p);
    } else if (run) {
      run.push(edge(dense[i - 1], p));
      run = null;
    }
  });
  const len = (r) => r.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - r[i - 1][0], p[1] - r[i - 1][1]) : 0), 0);
  return runs.filter((r) => r.length > 1 && len(r) >= minLen);
}

// A wavy line from a to b: `waves` full periods of amplitude `amp`, fading in and out at the ends.
export function wavy(a, b, { waves = 2, amp = 4, phase = 0, per = 10, taper = true } = {}) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const n = Math.max(4, Math.round(waves * per));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const env = taper ? Math.min(1, t * 5, (1 - t) * 5) : 1;
    const o = Math.sin(t * waves * TAU + phase) * amp * env;
    pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]);
  }
  return pts;
}

const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== false)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
export const path = (d, fill) => `<path d="${d}"${attrs({ fill })}/>`;
// A flat area of colour without an outline. `fade` marks it data-nodraw, so that where the page
// draws the strokes in (data-draw) the area fades in after them instead of standing there first.
export const wash = (d, fill, fade = false) => `<path d="${d}" fill="${fill}" stroke="none"${fade ? ' data-nodraw=""' : ''}/>`;
export const circle = (cx, cy, r, fill) => `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}"${attrs({ fill })}/>`;
// A solid point; it fades in with data-draw rather than being drawn.
export const dot = (cx, cy, r) => `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" fill="${INK}" data-nodraw=""/>`;
export const ellipse = (cx, cy, rx, ry, rot = 0, fill) =>
  `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}"${
    rot ? ` transform="rotate(${n1(rot)} ${n1(cx)} ${n1(cy)})"` : ''
  }${attrs({ fill })}/>`;
export const line = (a, b) => `<path d="M${P(...a)}L${P(...b)}"/>`;
// Arc of a circle from angle a0 to a1 (radians, clockwise on screen when a1 > a0).
export function arc(cx, cy, r, a0, a1) {
  const p0 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r];
  const p1 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${P(...p0)}A${n1(r)} ${n1(r)} 0 ${large} ${sweep} ${P(...p1)}`;
}

export function svg(w, h, strokeWidth, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
}
