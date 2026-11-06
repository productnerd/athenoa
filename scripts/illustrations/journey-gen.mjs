// Generates the nine environment drawings that line the Learn path of Nostos, one per stage of the
// homecoming (three chapters each: chapter ci of 27 takes drawing floor(ci * 9 / 27)):
//   journey-1-departure.svg  a small harbour at dawn: the village on its hill, the lighthouse on the mole,
//                            a caïque raising its sail, nets drying on the quay
//   journey-2-sea.svg        the open sea: long swells, dolphins, far islands, gulls, the boat under sail
//   journey-3-olives.svg     the hills of Attica: an old olive tree, dry-stone terraces, the goat path, goats,
//                            a cicada on the trunk
//   journey-4-mountain.svg   the road up Parnassus: peaks over the clouds, a forest of firs, the mule track
//   journey-5-delphi.svg     Delphi: the shining cliffs, the temple's columns on the polygonal wall, the tholos,
//                            the tripod, laurel, the Castalian spring, the two eagles of Zeus
//   journey-6-cave.svg       Plato's cave: the prisoners, the low wall and its bearers, the fire, the shadows on
//                            the wall, the way up to the light
//   journey-7-night.svg      the night sky over a ridge: the Milky Way, the Bear and Orion, the Pleiades, the
//                            moon, a small figure looking up
//   journey-8-eleusis.svg    Eleusis: Demeter's sheaf, wheat and poppies, a procession of torches to the gate
//   journey-9-ithaca.svg     Ithaca at evening: the house with a lit window and Penelope's loom, the olive,
//                            Argos at the door, the boat home in the harbour
// node scripts/illustrations/journey-gen.mjs
// Look at them with scripts/illustrations/journey-render.mjs.
//
// Each drawing is 1600 x 1000, shown full width behind the path, bottom-aligned, faint (25 to 35%).
// The stones run down the middle, so x 560 to 1040 stays empty above y 620 (`open`). The bottom band
// (y 700 to 1000) carries each place by itself, because on a phone it is most of what shows.
// One stroke weight for all nine, set only on the root <svg>, so a page can thicken it on small screens.
// Motifs run on from one drawing into the next: the harbour water becomes the open sea, the sea shows
// between the hills of Attica, the goat path becomes the mule track, Parnassus stands behind Delphi, its
// rock becomes the cave, the way up leads to the ridge under the stars, the moon stays over Eleusis, and
// the harbour of Ithaca answers the harbour of the departure.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/assets/illustrations');
const PAPER = 'var(--paper, #f2e9d3)';
const LIGHT = 'var(--blue-light, #b3c0f3)';
const TAU = Math.PI * 2;
const SW = 2.6; // the stroke weight of the footers' nearest layers, at the same scale
// the empty column the stones run down
const open = (x, y) => x > 556 && x < 1044 && y < 624;

// ---------- small geometry kit (from aegean-gen.mjs) ----------
const f = (v) => {
  const r = Math.round(v * 10) / 10;
  return r === 0 ? '0' : String(r);
};
const xy = (p) => `${f(p[0])} ${f(p[1])}`;
function prng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Catmull-Rom through the points, written as C + S commands. `cont` continues an open path.
function smooth(pts, { closed = false, cont = false } = {}) {
  const n = pts.length;
  if (n < 2) return '';
  if (n === 2) return `${cont ? 'L' : 'M'}${xy(pts[0])}L${xy(pts[1])}`;
  const get = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `${cont ? 'L' : 'M'}${xy(pts[0])}`;
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
const poly = (pts, closed = false) => `M${pts.map(xy).join('L')}${closed ? 'Z' : ''}`;
// piecewise-linear lookup through [x, y] points
const lookup = (pts) => (x) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
};
const sample = (fn, x0, x1, step) => {
  const n = Math.max(2, Math.round((x1 - x0) / step));
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / n;
    return [x, fn(x)];
  });
};
// affine placement of a local drawing: flip, scale, rotate (degrees), then move
const place = ({ x = 0, y = 0, s = 1, rot = 0, flip = false }) => {
  const c = Math.cos((rot * Math.PI) / 180);
  const sn = Math.sin((rot * Math.PI) / 180);
  return ([px, py]) => {
    const qx = (flip ? -px : px) * s;
    const qy = py * s;
    return [x + qx * c - qy * sn, y + qx * sn + qy * c];
  };
};
// scallops: circular arcs from point to point; with sweep 1 they bulge to the left of travel on screen
const scallops = (pts, k = 0.8, sweep = 1) =>
  pts
    .slice(1)
    .map((p, i) => {
      const r = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) * k;
      return `A${f(r)} ${f(r)} 0 0 ${sweep} ${xy(p)}`;
    })
    .join('');
// a polygon with worn corners: each corner is cut back by r (or the point's own third value) and rounded
function worn(pts, r = 6, { closed = true, cont = false } = {}) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const cmd = i === 0 && !cont ? 'M' : 'L';
    if (!closed && (i === 0 || i === n - 1)) {
      d += `${cmd}${xy(p)}`;
      continue;
    }
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = p[2] ?? r;
    const ra = Math.min(rr, da * 0.46);
    const rb = Math.min(rr, db * 0.46);
    const p1 = [p[0] + ((a[0] - p[0]) * ra) / da, p[1] + ((a[1] - p[1]) * ra) / da];
    const p2 = [p[0] + ((b[0] - p[0]) * rb) / db, p[1] + ((b[1] - p[1]) * rb) / db];
    d += `${cmd}${xy(p1)}Q${xy(p)} ${xy(p2)}`;
  }
  return d + (closed ? 'Z' : '');
}
// a broken line that follows fn from x0 to x1: strokes of random length with gaps, kept out of masked places
function broken(fn, x0, x1, rnd, { len = [80, 220], gap = [18, 60], step = 30, ok = () => true, min = 14, lead = 0 } = {}) {
  let d = '';
  let x = x0 + lead;
  while (x < x1) {
    const b = Math.min(x1, x + len[0] + rnd() * (len[1] - len[0]));
    let run = [];
    const flush = () => {
      if (run.length >= 2 && run[run.length - 1][0] - run[0][0] >= min) {
        const every = Math.max(1, Math.round(step / 6));
        const kept = run.filter((_, i) => i % every === 0 || i === run.length - 1);
        if (kept.length > 2 && kept[kept.length - 1][0] - kept[kept.length - 2][0] < 7) kept.splice(kept.length - 2, 1);
        d += smooth(kept);
      }
      run = [];
    };
    const n = Math.max(1, Math.ceil((b - x) / 6));
    for (let i = 0; i <= n; i++) {
      const xx = x + ((b - x) * i) / n;
      const yy = fn(xx);
      if (ok(xx, yy)) run.push([xx, yy]);
      else flush();
    }
    flush();
    x = b + gap[0] + rnd() * (gap[1] - gap[0]);
  }
  return d;
}
// a sum of slow sines: the swell of a wave line
const swell = (base, parts) => (x) => base + parts.reduce((s, [a, l, p]) => s + a * Math.sin((TAU * x) / l + p), 0);
// a Catmull-Rom curve through ctrl, sampled about every `step` units (for lines cut into strokes)
function curve(ctrl, step = 8) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    const n = Math.max(1, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push(
        [0, 1].map(
          (j) =>
            0.5 *
            (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3),
        ),
      );
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}
// dense points cut into strokes of random length with gaps; `ok` drops points in masked places
function dashes(pts, rnd, { len = [60, 160], gap = [14, 40], every = 3, ok = () => true } = {}) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  let d = '';
  let s = -rnd() * len[0];
  const end = L[L.length - 1];
  while (s < end) {
    const e = s + len[0] + rnd() * (len[1] - len[0]);
    let run = [];
    const flush = () => {
      const kept = run.filter((_, i) => i % every === 0 || i === run.length - 1);
      if (kept.length >= 2) d += smooth(kept);
      run = [];
    };
    for (let i = 0; i < pts.length; i++) {
      if (L[i] < s || L[i] > e) continue;
      if (ok(pts[i][0], pts[i][1])) run.push(pts[i]);
      else flush();
    }
    flush();
    s = e + gap[0] + rnd() * (gap[1] - gap[0]);
  }
  return d;
}
// parallel lines `gap` apart at `angle` degrees, clipped to the polygon pts, trimmed `inset` at each end
function hatch(pts, gap, angle = 0, { inset = 2.5, phase = 0.5 } = {}) {
  const a = (angle * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const rot = pts.map(([x, y]) => [x * c + y * s, -x * s + y * c]);
  const ys = rot.map((p) => p[1]);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  let d = '';
  for (let y = y0 + gap * phase; y < y1; y += gap) {
    const xs = [];
    for (let i = 0; i < rot.length; i++) {
      const [ax, ay] = rot[i];
      const [bx, by] = rot[(i + 1) % rot.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const u0 = xs[i] + inset;
      const u1 = xs[i + 1] - inset;
      if (u1 - u0 < 3) continue;
      d += `M${xy([u0 * c - y * s, u0 * s + y * c])}L${xy([u1 * c - y * s, u1 * s + y * c])}`;
    }
  }
  return d;
}

// Rewrite path data in relative commands to tenths of a unit: the same drawing in about two thirds of
// the bytes (nine of these are inlined in one page). Positions are tracked in whole tenths so the
// rounding never builds up along a path.
const ARITY = { M: 2, L: 2, T: 2, C: 6, S: 4, Q: 4, A: 7, H: 1, V: 1, Z: 0 };
function compact(d) {
  const tokens = d.match(/[MLTCSQAHVZmltcsqahvz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  const num = (v) => {
    const s = String(v / 10);
    return s.replace(/^(-?)0\./, '$1.');
  };
  let out = '';
  let last = '';
  const emit = (cmd, vals) => {
    let s = cmd === last && cmd !== 'm' ? '' : cmd;
    let prev = s ? null : 'num';
    for (const v of vals) {
      const t = typeof v === 'string' ? v : num(v);
      if (prev !== null && !t.startsWith('-') && !(t.startsWith('.') && prev.includes('.'))) s += ' ';
      s += t;
      prev = t;
    }
    out += s;
    last = cmd === 'm' ? 'l' : cmd;
  };
  let i = 0;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = '';
  const tenth = (v) => Math.round(Number(v) * 10);
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++];
    else if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
    const C = cmd.toUpperCase();
    const rel = cmd !== C;
    if (C === 'Z') {
      emit('z', []);
      cx = sx;
      cy = sy;
      continue;
    }
    const a = tokens.slice(i, i + ARITY[C]);
    i += ARITY[C];
    const ax = (v) => (rel ? cx + tenth(v) : tenth(v));
    const ay = (v) => (rel ? cy + tenth(v) : tenth(v));
    if (C === 'H') {
      const x = ax(a[0]);
      emit('h', [x - cx]);
      cx = x;
    } else if (C === 'V') {
      const y = ay(a[0]);
      emit('v', [y - cy]);
      cy = y;
    } else if (C === 'A') {
      const x = ax(a[5]);
      const y = ay(a[6]);
      emit('a', [tenth(a[0]), tenth(a[1]), tenth(a[2]), a[3], a[4], x - cx, y - cy]);
      cx = x;
      cy = y;
    } else {
      const pts = [];
      for (let k = 0; k < a.length; k += 2) pts.push([ax(a[k]), ay(a[k + 1])]);
      const [x, y] = pts[pts.length - 1];
      emit(C === 'M' ? (out ? 'm' : 'M') : C.toLowerCase(), pts.flatMap(([px, py]) => (C === 'M' && !out ? [px, py] : [px - cx, py - cy])));
      cx = x;
      cy = y;
      if (C === 'M') {
        sx = x;
        sy = y;
      }
    }
  }
  return out;
}

const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax meet" fill="none" stroke="currentColor" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
const path = (d, attrs = '') => (d ? `<path ${attrs ? attrs + ' ' : ''}d="${compact(d)}"/>` : '');
const paperFill = (d) => path(d, `fill="${PAPER}" stroke="none"`);
const papered = (d) => path(d, `fill="${PAPER}"`);
const wash = (d) => path(d, `fill="${LIGHT}" stroke="none"`);
const ink = (d) => path(d, 'fill="currentColor" stroke="none"');
const circ = (cx, cy, r) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
// points the size of the stroke: a stroke of no length with round caps
const dots = (pts) => pts.map((p) => `M${xy(p)}h.1`).join('');
const box = (x, y, w, h) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const arched = (x, y, w, h) => `M${f(x)} ${f(y + h)}V${f(y + w / 2)}A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w)} ${f(y + w / 2)}V${f(y + h)}Z`;
const T = (t, pts) => pts.map(t);

// ---------- shared motifs ----------
// a low sun in widening rings that break up as they go out; disc and rings run on below `below`
function sun(cx, cy, r, rings, below, rnd) {
  let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`;
  let d = '';
  rings.forEach((rr, k) => {
    const a0 = -Math.asin(Math.min(1, (below - cy) / rr));
    const span = Math.PI - 2 * a0;
    const n = Math.min(k, 4);
    const cuts = [0];
    for (let g = 1; g <= n; g++) cuts.push(g / (n + 1) + (rnd() - 0.5) * 0.1);
    cuts.push(1);
    const gapAngle = (12 + k * 2.4) / rr;
    for (let i = 0; i < cuts.length - 1; i++) {
      const a1 = a0 + cuts[i] * span + (i === 0 ? 0 : gapAngle / 2);
      const a2 = a0 + cuts[i + 1] * span - (i === cuts.length - 2 ? 0 : gapAngle / 2);
      const p1 = [cx + rr * Math.cos(a1), cy - rr * Math.sin(a1)];
      const p2 = [cx + rr * Math.cos(a2), cy - rr * Math.sin(a2)];
      d += `M${xy(p1)}A${f(rr)} ${f(rr)} 0 ${a2 - a1 > Math.PI ? 1 : 0} 0 ${xy(p2)}`;
    }
  });
  return s + path(d);
}
// the sun's path on water: short level strokes, a few to a row, widening as they come nearer
function glitter(cx, y0, y1, rnd, { w0 = 12, grow = 0.5, ok = () => true } = {}) {
  let d = '';
  let y = y0;
  let row = 0;
  while (y < y1) {
    const half = w0 + (y - y0) * grow;
    const n = row < 2 ? 1 : row < 6 ? 2 : 3;
    let x = cx - half * (0.75 + rnd() * 0.3) + (row % 2 ? 5 : -4);
    for (let i = 0; i < n; i++) {
      const l = ((half * 2) / n) * (0.5 + rnd() * 0.4);
      if (ok(x, y) && ok(x + l, y))
        d += smooth([
          [x, y + (rnd() - 0.5) * 0.8],
          [x + l / 2, y + (rnd() - 0.5) * 1.4],
          [x + l, y + (rnd() - 0.5) * 0.8],
        ]);
      x += l + 7 + rnd() * half * 0.3;
    }
    y += 6.6 + row * 0.8;
    row++;
  }
  return d;
}
// calm water: long level strokes with gaps, further apart as they come nearer
function calm(rnd, y0, y1, ok, { step = 7.4, grow = 1.3, len = [70, 230], gap = [34, 96], x0 = -40, x1 = 1640 } = {}) {
  let d = '';
  let y = y0;
  let row = 0;
  while (y < y1) {
    const yy = y;
    const ph = rnd() * TAU;
    const amp = 0.45 + row * 0.08;
    const fn = (x) => yy + Math.sin(x / (70 + row * 7) + ph) * amp;
    d += broken(fn, x0, x1, rnd, {
      len: [len[0] + row * 10, len[1] + row * 18],
      gap: [gap[0] + row * 3, gap[1] + row * 9],
      step: 54,
      ok,
      min: 22,
      lead: -rnd() * 140,
    });
    y += step + row * grow;
    row++;
  }
  return d;
}
// streaks of cloud: thin level strokes
const streak = (x0, x1, y, lift = 0) =>
  smooth([
    [x0, y],
    [x0 + (x1 - x0) * 0.3, y - 1.2 - lift],
    [x0 + (x1 - x0) * 0.68, y - 0.4 - lift],
    [x1, y + 0.8],
  ]);
// a cloud: scalloped above and level below, its wash printed a little off register (aegean-gen.mjs)
const cloud = (x, y, s, lobes, inner, streaks, washed = true) => {
  const t = place({ x, y, s });
  const outline = (tt) => {
    const pts = lobes.map(tt);
    const w = lobes[lobes.length - 1][0];
    const base = [pts[pts.length - 1], tt([w * 0.66, 2.2]), tt([w * 0.3, 2.6]), pts[0]];
    return `M${xy(pts[0])}${scallops(pts, 0.62)}${smooth(base, { cont: true })}Z`;
  };
  const d = outline(t);
  return (
    paperFill(d) +
    (washed ? wash(outline(place({ x: x + 7 * s, y: y + 5.5 * s, s }))) : '') +
    path(d) +
    path(inner.map((arc) => `M${xy(t(arc[0]))}${scallops(arc.map(t), 0.66)}`).join('')) +
    path(streaks.map(([x0, x1, yy]) => smooth([t([x0, yy]), t([(x0 + x1) / 2, yy + 1.4]), t([x1, yy - 0.3])])).join(''))
  );
};
// a gull far off: two wing strokes meeting at the body
const gull = (x, y, w, tilt = 0) => {
  const t = place({ x, y, s: w / 10, rot: tilt });
  return `M${xy(t([-10, -1.5]))}Q${xy(t([-5.5, -7]))} ${xy(t([0, 0]))}Q${xy(t([4.5, -6.5]))} ${xy(t([10, -3]))}`;
};
// a four-pointed star (island-gen.mjs)
const star4 = (x, y, s) => {
  const p = (dx, dy) => xy([x + dx * s, y + dy * s]);
  return `M${p(0.2, -11)}Q${p(1.1, -2.4)} ${p(7.6, 0.4)}Q${p(1.2, 1.8)} ${p(-0.4, 11)}Q${p(-1.4, 2.2)} ${p(-7.8, -0.2)}Q${p(-1.2, -1.8)} ${p(0.2, -11)}Z`;
};
// a crescent moon, horns to the upper left
const moon = (mx, my, r) => {
  const at = (deg, rr = r) => [mx + rr * Math.cos((deg * Math.PI) / 180), my + rr * Math.sin((deg * Math.PI) / 180)];
  const a = at(-78);
  const b = at(38);
  return `M${xy(a)}A${f(r)} ${f(r)} 0 1 0 ${xy(b)}A${f(r * 0.94)} ${f(r * 0.94)} 0 0 1 ${xy(a)}Z`;
};
// a hill: paper under the profile down to `bottom`, the outline, and terrace lines that follow it
function hill(top, rnd, { bottom = 1010, lines = [], ok = () => true, outline = true, len = [110, 260], gap = [16, 44] } = {}) {
  const topY = lookup(top);
  const x0 = top[0][0];
  const x1 = top[top.length - 1][0];
  let s = paperFill(`${smooth(top)}L${f(x1)} ${bottom}L${f(x0)} ${bottom}Z`);
  if (outline) s += path(smooth(top));
  let d = '';
  for (const [dy, a, b, lead = 0] of lines) {
    d += broken((x) => topY(x) + dy + Math.sin(x / 47 + dy) * 1.1 + Math.sin(x / 131 + dy * 1.7) * 1.6, a, b, rnd, {
      len,
      gap,
      step: 36,
      min: 26,
      lead,
      ok: (x, y) => y > topY(x) + 5 && ok(x, y),
    });
  }
  return s + path(d);
}
// a tuft of grass: a few blades fanning from a point
const tuft = (x, y, h, rnd, n = 4) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.32 + (rnd() - 0.5) * 0.2;
    const l = h * (0.6 + rnd() * 0.5);
    const tip = [x + Math.cos(a) * l, y + Math.sin(a) * l];
    d += `M${xy([x + (i - n / 2) * 1.5, y])}Q${xy([x + Math.cos(a) * l * 0.4, y + Math.sin(a) * l * 0.55])} ${xy(tip)}`;
  }
  return d;
};
// pebbles: small rounded stones
const pebble = (x, y, w, rnd) => {
  const h = w * (0.45 + rnd() * 0.2);
  return smooth(
    [
      [x - w / 2, y],
      [x - w * 0.3, y - h * 0.8],
      [x + w * 0.15, y - h],
      [x + w / 2, y - h * 0.3],
      [x + w * 0.2, y + h * 0.1],
    ],
    { closed: true },
  );
};

// a crown of leaves: a scalloped outline round an ellipse, flatter underneath
function clump(cx, cy, rx, ry, rnd, { n = 7, flat = 0.55, k = 0.62 } = {}) {
  const top = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI + (Math.PI * i) / n;
    const j = 1 + (rnd() - 0.5) * 0.18;
    top.push([cx + rx * Math.cos(a) * j, cy + ry * Math.sin(a) * j]);
  }
  const m = Math.max(2, Math.round(n / 2));
  const under = [];
  for (let i = 1; i < m; i++) {
    const a = (Math.PI * i) / m;
    under.push([cx + rx * Math.cos(a) * (0.88 + rnd() * 0.08), cy + ry * flat * Math.sin(a)]);
  }
  return `M${xy(top[0])}${scallops(top, k)}${scallops([top[n], ...under, top[0]], 0.9)}Z`;
}
// marks inside a crown: short scallop pairs
const leafMarks = (cx, cy, rx, ry, rnd, n = 2) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const px = cx + (rnd() - 0.5) * rx * 1.1;
    const py = cy + (rnd() - 0.2) * ry * 0.7;
    const w = rx * (0.26 + rnd() * 0.12);
    d += `M${xy([px - w, py])}${scallops([[px - w, py], [px, py - w * 0.3], [px + w, py]], 0.66)}`;
  }
  return d;
};
// a leaf: an almond from p, pointing at angle a
const leaf = (p, a, l, w = 0.24) => {
  const e = [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l];
  const nx = -Math.sin(a) * l * w;
  const ny = Math.cos(a) * l * w;
  const m = [(p[0] + e[0]) / 2, (p[1] + e[1]) / 2];
  return `M${xy(p)}Q${xy([m[0] + nx, m[1] + ny])} ${xy(e)}Q${xy([m[0] - nx, m[1] - ny])} ${xy(p)}`;
};
// a young olive: forked trunk, round lobed crown (aegean-gen.mjs), base at x, y, about 36 tall at s 1
function olive(x, y, s, rnd) {
  const t = place({ x, y, s });
  const crown = [[-17, -17], [-16, -27], [-6, -34.5], [8, -35.5], [18, -28.5], [21.5, -18]].map(([a, b]) => t([a + (rnd() - 0.5) * 2, b + (rnd() - 0.5) * 2]));
  const under = [[21.5, -18], [10, -14], [-4, -13.5], [-17, -17]].map(t);
  under[0] = crown[crown.length - 1];
  under[under.length - 1] = crown[0];
  const d = `M${xy(crown[0])}${scallops(crown, 0.62)}${scallops(under, 0.8)}Z`;
  const trunk = smooth(T(t, [[0.5, 0], [-1.4, -5.5], [1.4, -10], [-0.6, -15.5]])) + smooth(T(t, [[0.6, -8.6], [4.6, -11.6], [8, -15.6]]));
  const inner = s > 0.9 ? `M${xy(t([-9, -22]))}${scallops(T(t, [[-9, -22], [0, -26.5]]), 0.68)}` + `M${xy(t([4, -25.5]))}${scallops(T(t, [[4, -25.5], [13, -22.5]]), 0.68)}` : '';
  return path(trunk) + papered(d) + path(inner);
}
// an old olive: a twisted, hollow trunk that splits into two limbs, under a crown of many clumps.
// Base at x, y; about 215 tall and 250 wide at s 1.
function oldOlive(x, y, s, rnd, { flip = false } = {}) {
  const t = place({ x, y, s, flip });
  const L = [[-30, 2], [-22, -10], [-23, -28], [-15, -46], [-17, -64], [-26, -82], [-40, -100], [-56, -118]];
  const cl = [[-44, -124], [-30, -108], [-16, -92], [-6, -82]];
  const cr = [[-2, -86], [5, -102], [11, -120], [15, -140]];
  const R = [[30, -136], [27, -116], [22, -96], [21, -78], [15, -60], [19, -40], [24, -20], [34, 2]];
  const trunk = smooth(T(t, L)) + smooth(T(t, cl), { cont: true }) + smooth(T(t, cr), { cont: true }) + smooth(T(t, R), { cont: true }) + 'Z';
  let lines =
    smooth(T(t, [[-30, 2], [-44, 6], [-58, 8]])) +
    smooth(T(t, [[34, 2], [46, 5], [60, 6]])) +
    smooth(T(t, [[-12, -2], [-7, -20], [-9, -38], [-4, -58], [-12, -76], [-27, -96]])) +
    smooth(T(t, [[12, -2], [8, -22], [10, -42], [6, -62], [9, -82], [12, -104]])) +
    smooth(T(t, [[22, -8], [16, -30], [17, -44]])) +
    smooth(T(t, [[-4, -30], [0, -40], [-2, -54], [-7, -44]]), { closed: true });
  const branches =
    smooth(T(t, [[-50, -112], [-76, -128], [-96, -136]])) +
    smooth(T(t, [[-36, -104], [-34, -130], [-26, -152]])) +
    smooth(T(t, [[12, -132], [8, -156], [12, -176]])) +
    smooth(T(t, [[26, -128], [46, -146], [64, -158]])) +
    smooth(T(t, [[24, -112], [52, -120], [78, -124]]));
  const clumps = [
    [-62, -172, 46, 26],
    [0, -194, 54, 28],
    [60, -178, 46, 26],
    [-104, -142, 40, 23],
    [-36, -152, 50, 28],
    [36, -150, 48, 27],
    [88, -136, 34, 20],
    [-72, -120, 34, 18],
    [62, -114, 30, 17],
  ];
  let crown = '';
  for (const [cx, cy, rx, ry] of clumps) {
    const c = t([cx, cy]);
    let lv = '';
    for (let k = 0; k < 3; k++) {
      const p = [c[0] + (rnd() - 0.5) * rx * s * 1.1, c[1] + (rnd() - 0.3) * ry * s * 0.7];
      lv += leaf(p, -Math.PI / 2 + (rnd() - 0.5) * 2.2, 7 * s, 0.2);
    }
    crown += papered(clump(c[0], c[1], rx * s, ry * s, rnd, { n: 7 })) + path(lv);
  }
  return papered(trunk) + path(lines) + path(branches) + crown;
}
// a fir: a spire of drooping tiers on a short trunk; base at x, y
function fir(x, y, h, rnd, { tiers, spine = false } = {}) {
  const n = tiers ?? Math.max(3, Math.min(6, Math.round(h / 22)));
  const w = h * 0.22;
  const j = () => (rnd() - 0.5) * h * 0.025;
  const R = [];
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    const yy = -h + h * 0.9 * u;
    const wi = w * (0.3 + 0.7 * u);
    R.push([wi + j(), yy + h * 0.02]);
    if (i < n) R.push([wi * 0.4, yy - h * 0.012 + j() * 0.3]);
  }
  R.push([w * 0.1, -h * 0.07], [w * 0.1, 0]);
  const Lf = R.map(([px, py]) => [-px * (0.92 + rnd() * 0.16), py]).reverse();
  const pts = [[j() * 0.5, -h], ...R, ...Lf].map(([px, py]) => [x + px, y + py]);
  return papered(poly(pts, true)) + (spine ? path(`M${xy([x, y - h * 0.86])}L${xy([x + 0.5, y - h * 0.08])}`) : '');
}
// a line of far forest: the jagged edge of the treetops along fn, papered down to `depth` below it
function treeline(fn, x0, x1, h, rnd, depth = 30) {
  const top = [];
  let x = x0;
  while (x < x1) {
    const w = h * (0.3 + rnd() * 0.5);
    const hh = h * (rnd() < 0.2 ? 0.25 : 0.45 + rnd() * 0.75);
    top.push([x, fn(x) - rnd() * h * 0.15], [x + w * (0.4 + rnd() * 0.2), fn(x + w / 2) - hh]);
    x += w;
  }
  top.push([x1, fn(x1)]);
  const base = sample((xx) => fn(xx) + depth, x0, x1, 80).reverse();
  return papered(poly([...top, ...base], true));
}
// a cypress: a tall flame of dark green (island-gen.mjs)
const cypress = (x, y, h, w) => {
  const pts = [[x - w * 0.36, y], [x - w * 0.5, y - h * 0.16], [x - w * 0.52, y - h * 0.4], [x - w * 0.36, y - h * 0.68], [x - w * 0.12, y - h * 0.92], [x + 0.4, y - h], [x + w * 0.18, y - h * 0.88], [x + w * 0.42, y - h * 0.62], [x + w * 0.54, y - h * 0.36], [x + w * 0.48, y - h * 0.14], [x + w * 0.36, y]];
  return (
    papered(smooth(pts) + 'Z') +
    path(
      smooth([[x - w * 0.14, y - h * 0.12], [x + w * 0.04, y - h * 0.32], [x - w * 0.06, y - h * 0.52]]) +
        smooth([[x + w * 0.16, y - h * 0.46], [x + w * 0.02, y - h * 0.64], [x + w * 0.08, y - h * 0.8]]),
    )
  );
};
// a whitewashed cube house: windows and maybe a door; base at y
function cube(x, base, w, h, rnd, { door = false, wins = 1 } = {}) {
  const top = base - h;
  let d = '';
  for (let i = 0; i < wins; i++) {
    const wx = x + w * (wins === 1 ? 0.3 + rnd() * 0.3 : 0.18 + i * 0.5) - 4;
    d += box(wx, top + h * 0.28, 8, 10);
  }
  if (door) d += arched(x + w * (0.62 + rnd() * 0.12) - 5, base - 17, 10, 17);
  return papered(worn([[x, base], [x, top], [x + w, top], [x + w, base]], 1.4)) + path(`M${f(x - 1.5)} ${f(top + 3.5)}H${f(x + w + 1.5)}`) + path(d);
}
// a bollard on a quay (island-gen.mjs)
const bollard = (x, y) =>
  papered(
    `M${f(x - 4.6)} ${f(y + 6)}V${f(y - 3)}C${f(x - 4.6)} ${f(y - 5.2)} ${f(x - 7.6)} ${f(y - 5.4)} ${f(x - 7.6)} ${f(y - 8)}C${f(x - 7.6)} ${f(y - 11.4)} ${f(x + 7.6)} ${f(y - 11.4)} ${f(x + 7.6)} ${f(y - 8)}C${f(x + 7.6)} ${f(y - 5.4)} ${f(x + 4.6)} ${f(y - 5.2)} ${f(x + 4.6)} ${f(y - 3)}V${f(y + 6)}`,
  );
const rope = (from, to, sag = 6) => smooth([from, [from[0] * 0.45 + to[0] * 0.55, (from[1] + to[1]) / 2 + sag], to]);

// A caïque in profile, stern at 0, bow at L to the right (flip for the other way), waterline at y 0
// (island-gen.mjs, without the rig: each drawing rigs its own boat). Returns the hull and the mast foot.
function hull(pl, L, rnd) {
  const t = place(pl);
  const hs = L * 0.118;
  const hm = L * 0.094;
  const hb = L * 0.172;
  const sheer = [[0, -hs], [L * 0.14, -hs + L * 0.014], [L * 0.36, -hm - 0.4], [L * 0.58, -hm], [L * 0.78, -hm - L * 0.018], [L * 0.92, -hb + L * 0.034], [L, -hb]];
  const bow = [[L, -hb], [L * 0.985, -hb * 0.6], [L * 0.955, -hb * 0.24], [L * 0.905, 0]];
  const stern = [[L * 0.075, 0], [L * 0.022, -hs * 0.36], [0, -hs]];
  const d = `${smooth(T(t, sheer))}${smooth(T(t, bow), { cont: true })}L${xy(t([L * 0.075, 0]))}${smooth(T(t, stern), { cont: true })}Z`;
  const bw = L * 0.032;
  const bandLo = sheer.map(([x, y]) => [x, y + bw - (x > L * 0.9 ? (x - L * 0.9) * 0.06 : 0)]);
  const band = `${smooth(T(t, sheer))}${smooth(T(t, [...bandLo].reverse()), { cont: true })}Z`;
  let lines = smooth(T(t, [[L - 1.4, -hb + 2], [L + 1, -hb - L * 0.03], [L + 4, -hb - L * 0.062]]));
  lines += smooth(T(t, [[L * 0.03, -L * 0.04], [-L * 0.03, -L * 0.03], [-L * 0.036, L * 0.024]]));
  lines += smooth(T(t, sheer.slice(1, -1).map(([x, y]) => [x, (y + bw) * 0.45])));
  return { d: papered(d) + wash(band) + path(smooth(T(t, bandLo))) + path(lines), t, deck: (u) => lookup(sheer)(u * L) };
}
// its reflection: short wavering strokes under the hull, shorter as they go down (island-gen.mjs)
const reflection = (x0, x1, y, rnd) => {
  let d = '';
  for (let i = 0; i < 3; i++) {
    const yy = y + 6 + i * 6.4;
    const inset = (x1 - x0) * (0.06 + i * 0.13);
    let x = x0 + inset + rnd() * 6;
    const end = x1 - inset;
    while (x < end - 8) {
      const l = Math.min(end - x, 16 + rnd() * 28);
      d += smooth([[x, yy], [x + l * 0.5, yy + (rnd() - 0.5) * 2.2], [x + l, yy]]);
      x += l + 6 + rnd() * 9;
    }
  }
  return d;
};

// A dolphin built along an arc (aegean-gen.mjs): tail at u 0, beak at u 1.
function dolphin(pl, { L = 100, bend = 1.1 } = {}) {
  const t = place(pl);
  const R = L / bend;
  const th = (u) => -bend / 2 + bend * u;
  const c = (u) => [R * (Math.sin(th(u)) + Math.sin(bend / 2)), R * (-Math.cos(th(u)) + Math.cos(bend / 2))];
  const nrm = (u) => [Math.sin(th(u)), -Math.cos(th(u))];
  const tan = (u) => [Math.cos(th(u)), Math.sin(th(u))];
  const top = lookup([[0, 2.2], [0.12, 3.8], [0.26, 7.2], [0.4, 10.6], [0.54, 12.4], [0.66, 12.6], [0.76, 11.8], [0.83, 10.6], [0.875, 8.8], [0.905, 6], [0.925, 3.9], [0.95, 3], [1, 2]]);
  const bot = lookup([[0, 2.2], [0.12, 3.6], [0.26, 6.4], [0.4, 9], [0.54, 10.4], [0.66, 10.4], [0.76, 9.4], [0.84, 7.6], [0.9, 5], [0.94, 3.3], [1, 2]]);
  const at = (u, off) => {
    const p = c(u);
    const n = nrm(u);
    return [p[0] + n[0] * off, p[1] + n[1] * off];
  };
  const us = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.78, 0.83, 0.87, 0.9, 0.925, 0.95, 0.975, 1];
  const dorsal = us.map((u) => at(u, top(u)));
  const ventral = us.map((u) => at(u, -bot(u))).reverse();
  const tip = [c(1)[0] + tan(1)[0] * 2, c(1)[1] + tan(1)[1] * 2];
  const p0 = c(0);
  const t0 = tan(0);
  const n0 = nrm(0);
  const fl = (a, b) => [p0[0] - t0[0] * a + n0[0] * b, p0[1] - t0[1] * a + n0[1] * b];
  const body =
    smooth([...dorsal, tip, ...ventral].map(t)) +
    `Q${xy(t(fl(2, -7.5)))} ${xy(t(fl(12, -8.5)))}` +
    `Q${xy(t(fl(7, -3.4)))} ${xy(t(fl(5.5, 0)))}` +
    `Q${xy(t(fl(7, 3.4)))} ${xy(t(fl(12, 8.5)))}` +
    `Q${xy(t(fl(2, 7.5)))} ${xy(t(dorsal[0]))}Z`;
  const fin =
    `M${xy(t(at(0.575, top(0.575) - 1.5)))}` +
    `Q${xy(t(at(0.53, top(0.53) + 8.5)))} ${xy(t(at(0.42, top(0.42) + 10)))}` +
    `Q${xy(t(at(0.48, top(0.48) + 3.2)))} ${xy(t(at(0.455, top(0.455) - 1.5)))}`;
  const flipper =
    `M${xy(t(at(0.77, -bot(0.77) * 0.5)))}` +
    `Q${xy(t(at(0.75, -bot(0.75) - 5)))} ${xy(t(at(0.655, -bot(0.655) - 5.5)))}` +
    `Q${xy(t(at(0.69, -bot(0.69) + 0.5)))} ${xy(t(at(0.725, -bot(0.725) * 0.56)))}Z`;
  const flankU = [0.1, 0.2, 0.32, 0.44, 0.56, 0.68, 0.76, 0.815];
  const flankOff = [0.2, 0.4, -0.4, -1.4, -2, -1.6, -0.4, 1.2];
  const flank = flankU.map((u, i) => at(u, flankOff[i]));
  const brow = [at(0.86, 2.6), at(0.9, 2.4), at(0.925, top(0.925))];
  const back = us.filter((u) => u > 0.1 && u < 0.925).map((u) => at(u, top(u)));
  const backWash = `${smooth([at(0.1, top(0.1)), ...back, at(0.925, top(0.925))].map(t))}${smooth([...flank, ...brow].reverse().map(t), { cont: true })}Z`;
  const eye = t(at(0.848, -0.4));
  const mouth = smooth([at(1, -0.3), at(0.95, -0.9), at(0.905, -1.7), at(0.878, -1)].map(t));
  return (
    papered(fin) +
    papered(body) +
    wash(backWash) +
    path(body) +
    path(smooth(flank.map(t)) + mouth) +
    papered(flipper) +
    path(dots([eye]))
  );
}

// A small robed figure, feet at 0,0, about 58 tall at s 1, facing right (flip faces left).
// pose: stand, walk, torch, gaze (head back, an arm raised to the sky), haul (both hands up on a rope),
// carry (both hands up on a pole), sit (seated on the ground, knees drawn up)
function figure(pl, pose = 'stand') {
  const t = place(pl);
  const s = pl.s ?? 1;
  const head = (cx, cy, r = 5) => {
    const c = t([cx, cy]);
    return papered(circ(c[0], c[1], r * s));
  };
  if (pose === 'sit') {
    const robe = [[11, 0], [12, -9], [9, -21], [4, -30], [-2, -31], [-6, -27], [-11, -21], [-16, -18], [-19, -13], [-18, -6], [-17, 0]];
    return papered(smooth(T(t, robe)) + 'Z') + path(smooth(T(t, [[-3, -27], [-9, -20], [-15, -16]]))) + head(-4, -37, 4.8);
  }
  const robe =
    pose === 'walk' || pose === 'torch'
      ? [[-9, 0], [-7.5, -14], [-6.5, -28], [-6, -38], [-3.5, -44], [3, -44.5], [6, -40], [7, -28], [10, -12], [13, 0]]
      : [[-8, 0], [-8, -12], [-6.5, -27], [-6, -38], [-3.5, -44], [3, -44.5], [6, -40], [6.5, -28], [8.5, -12], [10.5, 0]];
  let lines = smooth(T(t, [[1, -27], [2, -12], [2.5, 0]]));
  let extra = '';
  let hd = head(0.6, -50.5);
  if (pose === 'stand' || pose === 'walk') lines += smooth(T(t, [[4, -40], [6.5, -29], [pose === 'walk' ? 9 : 6, -21]]));
  if (pose === 'gaze') {
    hd = head(-1.6, -50.2);
    lines += smooth(T(t, [[4, -40], [11, -52], [17, -64]]));
  }
  if (pose === 'haul') lines += smooth(T(t, [[4, -40], [11, -50], [16, -58]])) + smooth(T(t, [[2, -38], [10, -46], [15, -53]]));
  if (pose === 'carry') lines += smooth(T(t, [[4, -40], [8, -49], [9, -58]])) + smooth(T(t, [[-2, -40], [5, -48], [8.5, -54]]));
  if (pose === 'torch') {
    lines += smooth(T(t, [[4, -40], [9, -46], [12, -52]])) + `M${xy(t([11, -45]))}L${xy(t([14.5, -68]))}`;
    extra = papered(smooth(T(t, [[15, -67], [11.5, -72], [12.5, -79], [16.5, -88]])) + smooth(T(t, [[16.5, -88], [19.5, -79], [18.5, -72], [15, -67]]), { cont: true }) + 'Z');
  }
  return papered(smooth(T(t, robe)) + 'Z') + hd + path(lines) + extra;
}

// ====================================================================================
// 1. DEPARTURE: a small harbour at dawn.
// The sun comes up out of the sea between the lighthouse on the mole and a far headland; the village
// climbs its hill on the left with the chapel on top; in the middle a caïque is raising its sail, a
// sailor hauling on the halyard; nets dry on poles on the quay, which runs along the foot.
// ====================================================================================
function departure() {
  const rnd = prng(11);
  const o = [];
  const HZ = 652;
  const SUNX = 1292;
  const QUAY = 900;

  // --- sky: the sun rising, streaks of cloud, gulls
  o.push(sun(SUNX, HZ - 9, 24, [38, 53, 70, 90, 113], HZ + 6, rnd));
  o.push(path(streak(1196, 1390, 486) + streak(1250, 1350, 498, 0.4) + streak(1400, 1590, 450) + streak(1450, 1560, 462) + streak(1200, 1300, 404)));
  o.push(path(gull(1214, 360, 9, -6) + gull(1248, 382, 6.5, 5) + gull(1420, 318, 8, 4) + gull(1452, 336, 5.5, -4) + gull(330, 196, 8, -5) + gull(362, 214, 5.5, 6)));

  // --- the sea from the horizon down, the far headland on the right
  o.push(paperFill(`M480 ${HZ}H1640V1010H480Z`));
  o.push(path(smooth(sample((x) => HZ + Math.sin(x / 190) * 0.4, 520, 1640, 200))));
  o.push(hill([[1418, HZ + 1], [1446, 640], [1488, 619], [1536, 603], [1588, 594], [1640, 591]], rnd, { bottom: HZ + 1, lines: [[16, 1470, 1640], [30, 1520, 1640, 20]] }));

  // --- the mole: a long breakwater of great blocks running in from the right
  const moleTop = [[1084, 727], [1098, 721], [1300, 719], [1500, 717], [1640, 716]];
  const moleFoot = [[1640, 752], [1400, 753], [1200, 755], [1098, 757], [1080, 750]];
  const onMole = (x, y) => x > 1074 && y > 712 && y < 764;

  // --- the village hill on the left, from the chapel down to its shore
  const hillTop = [[-40, 334], [20, 314], [80, 302], [150, 306], [220, 332], [290, 380], [350, 438], [410, 498], [462, 560], [510, 616], [560, 652], [612, 676]];
  const hillShore = [[612, 676], [566, 694], [500, 712], [420, 728], [300, 742], [150, 750], [-40, 754]];
  const shoreY = lookup([...hillShore].reverse());
  const onHill = (x, y) => x < 616 && y < shoreY(x) + 10;

  // --- the boats: the caïque raising its sail at the quay, a small boat moored to the right
  const B = { x: 640, y: 866, L: 300 };
  const b2 = { x: 1180, y: 884, L: 136 };
  const inBoat = (x, y) => (x > B.x - 18 && x < B.x + B.L + 18 && y > B.y - 60 && y < B.y + 24) || (x > b2.x - 14 && x < b2.x + b2.L + 14 && y > b2.y - 30 && y < b2.y + 22);

  // --- water: the sun's path, then calm strokes down to the quay
  o.push(path(glitter(SUNX, HZ + 4, 850, rnd, { w0: 12, grow: 0.36, ok: (x, y) => !onMole(x, y) && !inBoat(x, y) })));
  o.push(
    path(
      calm(rnd, HZ + 5, QUAY - 6, (x, y) => !onHill(x, y) && !onMole(x, y) && !inBoat(x, y) && Math.abs(x - SUNX) > 24 + (y - HZ) * 0.4 && x > 470, {
        step: 7.2,
        grow: 1.15,
      }),
    ),
  );

  // the mole and its blocks
  o.push(papered(`${smooth(moleTop)}L1640 752${smooth(moleFoot, { cont: true })}Z`));
  {
    let d = '';
    let x = 1104 + rnd() * 10;
    while (x < 1630) {
      d += `M${f(x)} ${f(724)}L${f(x - 1.5 + rnd() * 3)} ${f(752)}`;
      x += 34 + rnd() * 40;
    }
    d += broken((x) => 737 + Math.sin(x / 80) * 0.8, 1100, 1640, rnd, { len: [60, 160], gap: [20, 50], step: 30, min: 20 });
    o.push(path(d));
  }

  // --- the lighthouse at the end of the mole: tower, gallery, lantern, dome, and its light still burning
  {
    const x = 1136;
    const base = 721;
    const top = 524;
    o.push(papered(poly([[x - 25, base], [x - 17.5, top], [x + 17.5, top], [x + 25, base]], true)));
    let d = arched(x - 6, base - 26, 12, 26) + box(x - 4, 600, 8, 12);
    for (const yy of [690, 652, 614, 566]) {
      const hw = 17.5 + (25 - 17.5) * ((yy - top) / (base - top));
      d += `M${f(x - hw + 3)} ${f(yy)}H${f(x - hw + 3 + 8 + rnd() * 10)}M${f(x + hw - 14 - rnd() * 8)} ${f(yy)}H${f(x + hw - 3)}`;
    }
    o.push(path(d));
    // the gallery and its rail
    o.push(papered(box(x - 27, top - 7, 54, 7)));
    let rail = `M${f(x - 25)} ${f(top - 20)}H${f(x + 25)}`;
    for (let i = 0; i <= 6; i++) rail += `M${f(x - 25 + i * (50 / 6))} ${f(top - 7)}V${f(top - 20)}`;
    o.push(path(rail));
    // the lantern and its cap
    o.push(papered(box(x - 13, top - 54, 26, 47)));
    o.push(wash(box(x - 9, top - 50, 18, 39)));
    o.push(path(`M${f(x - 4)} ${f(top - 54)}V${f(top - 7)}M${f(x + 4)} ${f(top - 54)}V${f(top - 7)}`));
    o.push(papered(`M${f(x - 16)} ${f(top - 54)}Q${f(x - 15)} ${f(top - 76)} ${f(x)} ${f(top - 78)}Q${f(x + 15)} ${f(top - 76)} ${f(x + 16)} ${f(top - 54)}Z`));
    o.push(path(`M${f(x)} ${f(top - 78)}V${f(top - 90)}`) + papered(circ(x, top - 93, 3)));
    // its beams, short and broken
    let beams = '';
    for (const [a, r0, r1] of [[-14, 26, 70], [-4, 28, 100], [7, 26, 76], [186, 26, 56], [174, 28, 72]]) {
      const ang = (a * Math.PI) / 180;
      const c = [x, top - 30];
      const p = (r) => [c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r];
      beams += `M${xy(p(r0))}L${xy(p(r0 + (r1 - r0) * 0.55))}M${xy(p(r0 + (r1 - r0) * 0.7))}L${xy(p(r1))}`;
    }
    o.push(path(beams));
  }

  // --- the small boat, moored, and the caïque
  o.push(path(reflection(b2.x, b2.x + b2.L, b2.y, rnd)));
  {
    const h = hull({ x: b2.x + b2.L, y: b2.y, flip: true }, b2.L, rnd);
    o.push(h.d);
    // oars shipped across the thwarts
    o.push(path(`M${xy(h.t([b2.L * 0.2, -16]))}L${xy(h.t([b2.L * 0.86, -22]))}`));
  }
  o.push(path(reflection(B.x + 20, B.x + B.L - 10, B.y, rnd)));
  {
    const h = hull({ x: B.x, y: B.y }, B.L, rnd);
    const mx = B.x + B.L * 0.58;
    const deck = B.y + h.deck(0.58);
    const mTop = 636;
    // mast, forestay to the stem, backstay
    let rig = `M${f(mx)} ${f(deck)}L${f(mx + 0.8)} ${f(mTop)}`;
    rig += `M${f(mx + 0.8)} ${f(mTop + 2)}L${f(B.x + B.L + 3)} ${f(B.y - B.L * 0.21)}`;
    rig += `M${f(mx + 0.5)} ${f(mTop + 4)}L${f(B.x + 12)} ${f(B.y - 38)}`;
    // the boom along the deck, the gaff hoisted halfway, the sail slack between them
    const boom = [[mx - 2, deck - 16], [B.x + 52, deck - 22]];
    const gaff = [[mx - 1, 722], [B.x + 74, 682]];
    const sail = [gaff[0], gaff[1], [B.x + 66, 720], [B.x + 58, 760], boom[1], boom[0]];
    o.push(path(rig));
    o.push(papered(smooth([gaff[0], gaff[1]]) + smooth([gaff[1], [B.x + 64, 722], [B.x + 60, 764], boom[1]], { cont: true }) + `L${xy(boom[0])}Z`));
    let folds = '';
    for (let i = 1; i <= 4; i++) {
      const u = i / 5;
      const top = [gaff[0][0] + (gaff[1][0] - gaff[0][0]) * u, gaff[0][1] + (gaff[1][1] - gaff[0][1]) * u];
      const bot = [boom[0][0] + (boom[1][0] - boom[0][0]) * u, boom[0][1] + (boom[1][1] - boom[0][1]) * u];
      folds += smooth([[top[0], top[1] + 6], [(top[0] + bot[0]) / 2 + (i % 2 ? 7 : -5), (top[1] + bot[1]) / 2], [bot[0] + 2, bot[1] - 6]]);
    }
    // the slack of the sail lying in loose folds along the boom
    folds += `M${xy([boom[1][0] + 4, boom[1][1] + 2])}${scallops([[boom[1][0] + 4, boom[1][1] + 2], [boom[1][0] + 40, boom[1][1] + 4], [boom[1][0] + 78, boom[1][1] + 6], [mx - 6, deck - 10]], 0.6, 0)}`;
    o.push(path(folds));
    o.push(papered(`M${xy(gaff[0])}L${xy(gaff[1])}`) + path(`M${xy(boom[0])}L${xy(boom[1])}`));
    void sail;
    // a pennant at the masthead
    o.push(papered(poly([[mx + 0.8, mTop], [mx + 26, mTop + 4], [mx + 0.8, mTop + 9]], true)));
    o.push(h.d);
    // the sailor hauling on the halyard, and the helmsman at the stern
    const sx = mx + 42;
    const sy = B.y + h.deck(0.72);
    o.push(figure({ x: sx, y: sy + 1, s: 1.12, flip: true, rot: 12 }, 'haul'));
    o.push(path(`M${f(mx + 1.5)} ${f(mTop + 6)}L${f(sx - 17)} ${f(sy - 62)}M${f(sx - 14)} ${f(sy - 56)}Q${f(sx - 8)} ${f(sy - 30)} ${f(sx + 14)} ${f(sy - 4)}`));
    o.push(path(`M${f(mx + 1.2)} ${f(mTop + 6)}L${f(gaff[0][0] + 1)} ${f(gaff[0][1] - 2)}`));
    o.push(figure({ x: B.x + 40, y: B.y + h.deck(0.14) + 1, s: 1.05 }, 'stand'));
  }

  // --- the village: houses stepping up the hill, the chapel and a cypress on top
  o.push(paperFill(`${smooth(hillTop)}${smooth(hillShore, { cont: true })}Z`));
  o.push(path(smooth(hillTop) + smooth(hillShore)));
  {
    // cubes in loose rows from the top down, thicker near the shore; a nearer row overlaps the one
    // behind it, and some carry a small upper room
    const topY = lookup(hillTop);
    for (let base = 404; base <= 748; base += 23) {
      let x = -36 + rnd() * 40;
      while (x < 620) {
        const w = 32 + rnd() * 30;
        const h = 22 + rnd() * 16;
        const b = base + (rnd() - 0.5) * 8;
        const fits = b - h > topY(x) + 12 && b - h > topY(x + w) + 12 && b < shoreY(x + w) - 3 && b < shoreY(x) - 3;
        const dense = (b - 400) / 350;
        if (fits && rnd() < 0.12 + dense * 0.62) {
          o.push(cube(x, b, w, h, rnd, { door: b > 690 && rnd() > 0.5, wins: rnd() > 0.75 ? 2 : rnd() > 0.25 ? 1 : 0 }));
          if (rnd() < 0.2) o.push(cube(x + w * (rnd() > 0.5 ? 0.5 : 0.08), b - h + 1, w * 0.42, h * 0.62, rnd, { wins: 1 }));
        }
        x += w + (rnd() < 0.45 ? -8 : 4 + rnd() * 26);
      }
    }
    // the chapel: a nave with a dome on a drum and a cross, a bell gable at its end
    const cx = 120;
    const cb = 330;
    o.push(cypress(206, 346, 92, 22));
    o.push(papered(worn([[cx - 30, cb], [cx - 30, cb - 34], [cx + 30, cb - 34], [cx + 30, cb]], 1.4)));
    o.push(papered(box(cx - 13, cb - 46, 26, 12)));
    o.push(papered(`M${f(cx - 15)} ${f(cb - 46)}A15 15 0 0 1 ${f(cx + 15)} ${f(cb - 46)}Z`));
    o.push(wash(`M${f(cx - 12)} ${f(cb - 47.5)}A12 12 0 0 1 ${f(cx + 12)} ${f(cb - 47.5)}Z`));
    o.push(path(`M${f(cx)} ${f(cb - 61)}V${f(cb - 76)}M${f(cx - 5)} ${f(cb - 71)}H${f(cx + 5)}` + arched(cx - 6, cb - 18, 12, 18)));
    o.push(papered(worn([[cx - 30, cb - 34], [cx - 30, cb - 52, 2], [cx - 20, cb - 58, 3], [cx - 10, cb - 52, 2], [cx - 10, cb - 34]], 2)) + path(arched(cx - 24, cb - 50, 8, 11)));
    o.push(cypress(40, 330, 64, 17) + cypress(250, 372, 54, 15));
  }

  // --- the quay along the foot: kerb, the course of its slabs, bollards
  {
    const kerb = swell(QUAY, [[0.6, 230, 1.1], [0.3, 97, 0.2]]);
    o.push(papered(`${smooth(sample(kerb, -40, 1640, 40))}V1010H-40Z`));
    o.push(path(smooth(sample((x) => kerb(x) + 11, -40, 1640, 80))));
    let joints = '';
    for (let x = -20 + rnd() * 30; x < 1640; x += 50 + rnd() * 60) joints += `M${xy([x, kerb(x) + 1.8])}L${xy([x - 0.5, kerb(x) + 9.4])}`;
    o.push(path(joints));
    o.push(
      path(
        broken((x) => 948 + Math.sin(x / 130) * 1.2, -40, 1640, rnd, { len: [120, 300], gap: [40, 120], step: 40, min: 40, lead: -60 }) +
          broken((x) => 984 + Math.sin(x / 170) * 1.4, -40, 1640, rnd, { len: [160, 360], gap: [60, 160], step: 40, min: 40, lead: -120 }),
      ),
    );
    // mooring ropes, stern and bow, and the small boat's painter
    o.push(path(rope([B.x + 10, B.y - 36], [600, QUAY - 8], 10) + rope([B.x + B.L + 2, B.y - 46], [1000, QUAY - 8], 12) + rope([b2.x + b2.L - 6, b2.y - 14], [1350, QUAY - 8], 4)));
    o.push(bollard(600, QUAY) + bollard(1000, QUAY) + bollard(1350, QUAY));
    // a coil of rope by the bollard
    let coil = '';
    for (let i = 0; i < 4; i++) coil += `M${f(1060 - 26 + i * 6)} ${f(950)}a${f(26 - i * 6)} ${f(9 - i * 2)} 0 1 0 ${f(2 * (26 - i * 6))} 0a${f(26 - i * 6)} ${f(9 - i * 2)} 0 1 0 ${f(-2 * (26 - i * 6))} 0`;
    o.push(path(coil + `M${f(1086)} ${f(950)}Q${f(1110)} ${f(948)} ${f(1130)} ${f(962)}`));
    // a basket of fish
    o.push(papered(`M1450 952Q1452 984 1470 986H1516Q1534 984 1536 952Z`));
    o.push(papered(`M1448 952a45 9 0 1 0 90 0a45 9 0 1 0 -90 0Z`));
    o.push(path(`M1456 966H1530M1462 978H1524M1470 958V984M1486 960V986M1502 960V986M1518 958V984`));
    o.push(papered(`M1466 948Q1478 930 1494 934Q1486 944 1474 950Z`) + papered(`M1500 946Q1514 926 1528 936Q1518 944 1506 948Z`));
  }

  // --- nets hung to dry along a rope between poles, floats on the rope, and a heap of net
  {
    const poles = [[66, 798], [226, 792], [384, 800]];
    let d = '';
    let mesh = '';
    let floats = '';
    for (const [x, top] of poles) d += `M${f(x)} ${f(top - 8)}L${f(x + 1)} 990`;
    for (let i = 0; i < poles.length - 1; i++) {
      const [ax, ay] = poles[i];
      const [bx, by] = poles[i + 1];
      const ropeP = sample((x) => ay + ((by - ay) * (x - ax)) / (bx - ax) + 22 * Math.sin((Math.PI * (x - ax)) / (bx - ax)), ax, bx, 14);
      const lowP = sample((x) => ay + ((by - ay) * (x - ax)) / (bx - ax) + 22 * Math.sin((Math.PI * (x - ax)) / (bx - ax)) + 84 + Math.sin(x / 9) * 3, ax + 8, bx - 8, 14);
      d += smooth(ropeP);
      const net = [...ropeP, ...lowP.reverse()];
      d += smooth(lowP);
      mesh += hatch(net, 24, 62, { inset: 1 }) + hatch(net, 24, -62, { inset: 1, phase: 0.2 });
      // folds where the net hangs heavy
      for (const u of [0.3, 0.62]) {
        const fx = ax + (bx - ax) * u;
        const fy = ay + ((by - ay) * u) + 22 * Math.sin(Math.PI * u);
        d += smooth([[fx, fy + 4], [fx + 3, fy + 40], [fx - 1, fy + 80]]);
      }
      for (let k = 1; k < 6; k++) {
        const p = ropeP[Math.round((k / 6) * (ropeP.length - 1))];
        floats += circ(p[0], p[1] + 4, 3.6);
      }
    }
    o.push(path(mesh) + path(d) + papered(floats));
    // the heap of net on the quay
    const heap = [[430, 990], [436, 968], [458, 952], [490, 946], [524, 954], [544, 972], [548, 990]];
    o.push(papered(smooth(heap) + 'Z'));
    o.push(path(hatch(heap, 17, 56, { inset: 2 }) + hatch(heap, 17, -56, { inset: 2 })) + papered(circ(470, 951, 3.6) + circ(506, 950, 3.6) + circ(532, 960, 3.6)));
  }
  o.push(path(tuft(16, 992, 22, rnd, 5) + tuft(574, 990, 16, rnd, 3) + tuft(1580, 992, 20, rnd, 4)));

  return svg(o.join(''));
}

// ====================================================================================
// 2. OPEN SEA: the boat under full sail on the left, far islands on the horizon, gulls and clouds over
// the sides, dolphins leaping, and long swells along the foot, their crests curling over.
// ====================================================================================
// A swell's crest line that curls over at the given crests [x0, R]: it rises to the crest, rolls forward
// (to the right) into a spiral, and the face of the wave comes out from under the spiral and eases back
// up to the swell (the running wave of Greek borders, loosened).
function crestLine(fn, curls) {
  let d = '';
  let x = -40;
  let off = () => 0;
  for (const [x0, R] of curls) {
    const o0 = off;
    d += smooth(sample((xx) => fn(xx) + o0(xx), x, x0, 24));
    const c = [x0 + 0.1 * R, fn(x0) + R];
    const pts = [];
    for (let k = 1; k <= 16; k++) {
      const a = -Math.PI / 2 + (k / 16) * Math.PI * 2.3;
      const r = R * (1 - (k / 16) * 0.68);
      pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
    }
    d += smooth([[x0, fn(x0)], ...pts], { cont: true });
    const xr = x0 + 0.95 * R;
    off = (xx) => 2 * R * Math.max(0, 1 - (xx - xr) / (5 * R)) ** 2;
    x = xr;
  }
  return d + smooth(sample((xx) => fn(xx) + off(xx), x, 1640, 24));
}
function openSea() {
  const rnd = prng(22);
  const o = [];
  const HZ = 648;

  // --- clouds and gulls over the sides
  o.push(cloud(64, 262, 1.1, [[0, 0], [22, -16], [58, -30], [104, -40], [154, -30], [200, -34], [244, -18], [272, 0]], [[[40, -9], [68, -19]], [[90, -20], [128, -19]], [[172, -14], [206, -15]]], [[-70, 34, 14], [190, 340, 15], [62, 160, 25]]));
  o.push(cloud(1186, 214, 1.15, [[0, 0], [24, -14], [62, -22], [104, -36], [156, -44], [208, -30], [250, -32], [286, -17], [312, 0]], [[[46, -8], [74, -14]], [[118, -22], [154, -26]], [[176, -16], [214, -14]], [[236, -12], [264, -9]]], [[-96, 60, 15], [250, 380, 14], [120, 214, 26]]));
  o.push(cloud(1290, 448, 0.66, [[0, 0], [20, -13], [56, -25], [100, -18], [136, -20], [164, 0]], [[[34, -6], [60, -13]]], [[-74, 24, 13], [120, 236, 14]], false));
  o.push(path(streak(200, 470, 420) + streak(260, 380, 432, 0.4) + streak(60, 190, 470)));
  o.push(path(gull(300, 360, 10, -6) + gull(336, 382, 7, 5) + gull(272, 396, 5.5, -3) + gull(1236, 330, 8.5, 6) + gull(1270, 312, 6, -5) + gull(1460, 372, 6.5, 3) + gull(452, 528, 14, -8)));

  // --- the sea, and far islands standing on the horizon
  o.push(paperFill(`M-40 ${HZ}H1640V1010H-40Z`));
  const island = (pts, contours, washed) => {
    const top = pts;
    const h = lookup(pts);
    const d = smooth(top);
    const closed = `${d}V${HZ}H${f(top[0][0])}Z`;
    let s = paperFill(closed) + (washed ? wash(closed) : '') + path(d);
    for (const [x0, x1, k] of contours) s += path(smooth(sample((x) => HZ - (HZ - h(x)) * k + Math.sin(x / 31) * 0.9, x0, x1, 34)));
    return s;
  };
  o.push(island([[-40, 572], [30, 560], [100, 548], [170, 552], [240, 570], [300, 594], [360, 616], [410, 634], [450, HZ]], [[0, 300, 0.7], [60, 220, 0.42]], false));
  o.push(island([[-40, 612], [40, 604], [120, 600], [200, 608], [280, 626], [330, HZ]], [[0, 230, 0.5]], false));
  o.push(island([[1150, HZ], [1196, 632], [1250, 612], [1320, 592], [1400, 580], [1480, 584], [1560, 596], [1640, 602]], [[1260, 1500, 0.66], [1360, 1640, 0.4]], false));
  o.push(island([[1060, HZ], [1100, 640], [1150, 630], [1200, 628], [1240, 636], [1270, HZ]], [[1110, 1240, 0.5]], false));
  o.push(path(smooth(sample((x) => HZ + Math.sin(x / 190) * 0.35, -40, 1640, 200))));
  // a rocky islet nearer on the right, ledges down its face, a chapel on its back, gulls round it
  const ISLE = [[1176, 712], [1198, 684], [1232, 642], [1266, 594], [1298, 552], [1338, 522], [1384, 510], [1432, 515], [1474, 536], [1512, 568], [1550, 610], [1584, 656], [1612, 696], [1630, 714]];
  const isleY = lookup(ISLE);
  o.push(papered(`${smooth(ISLE)}Q1400 720 1176 712Z`));
  {
    let d = '';
    for (const [dy, a, b] of [[30, 1250, 1540], [62, 1220, 1580], [98, 1200, 1606], [136, 1190, 1620], [170, 1186, 1626]]) {
      d += broken((x) => Math.max(isleY(x) + dy * 0.5, Math.min(708, 512 + dy) + Math.sin(x / 37 + dy) * 2.4), a, b, rnd, { len: [40, 120], gap: [12, 36], step: 24, min: 18, ok: (x, y) => y > isleY(x) + 6 && y < 706 });
    }
    // fissures down the cliff on the seaward side
    d += smooth([[1510, 572], [1500, 620], [1510, 680]]) + smooth([[1556, 618], [1548, 660], [1556, 704]]) + smooth([[1290, 566], [1300, 620], [1290, 690]]);
    o.push(path(d));
    const cx = 1392;
    const cb = 514;
    o.push(papered(worn([[cx - 22, cb], [cx - 22, cb - 22], [cx + 22, cb - 22], [cx + 22, cb]], 1.2)) + papered(`M${f(cx - 10)} ${f(cb - 22)}A10 10 0 0 1 ${f(cx + 10)} ${f(cb - 22)}Z`) + path(`M${f(cx)} ${f(cb - 32)}V${f(cb - 42)}M${f(cx - 4)} ${f(cb - 38)}H${f(cx + 4)}` + arched(cx - 4, cb - 12, 8, 12)));
    o.push(path(gull(1340, 450, 9, -5) + gull(1372, 430, 6.5, 6) + gull(1470, 470, 7, 4) + gull(1504, 452, 5, -4)));
  }
  const onIsle = (x, y) => x > 1166 && x < 1640 && y < 720;
  // a far sail
  {
    const [sx, sy] = [900, HZ - 0.4];
    o.push(papered(poly([[sx, sy - 1.4], [sx + 0.4, sy - 16], [sx + 9, sy - 1.6]], true)) + papered(poly([[sx - 1.8, sy - 2], [sx - 1.6, sy - 12], [sx - 7.5, sy - 2.2]], true)) + path(smooth([[sx - 9, sy + 0.6], [sx, sy + 1.8], [sx + 11, sy + 0.5]])));
  }

  // --- the swells along the foot
  const w = [
    swell(792, [[5, 300, 0.4], [2.5, 610, 2.1]]),
    swell(846, [[8, 360, 1.7], [3, 760, 0.3]]),
    swell(906, [[11, 430, 3.4], [4, 900, 1.2]]),
    swell(966, [[13, 520, 0.6], [5, 1100, 2.6]]),
  ];

  // --- the boat under full sail, heeling a little
  const BX = 96;
  const BY = 786;
  const inBoat = (x, y) => x > BX - 30 && x < BX + 270 && y > 420 && y < BY + 18;
  // calm far water down to the first swell, getting longer as it comes nearer
  o.push(path(calm(rnd, HZ + 5, 790, (x, y) => !inBoat(x, y) && !onIsle(x, y) && y < w[0](x) - 6 && !(x > 880 && x < 924 && y < HZ + 9), { step: 7, grow: 1.6 })));
  o.push(path(reflection(1186, 1620, 712, rnd)));
  o.push(path(reflection(BX + 10, BX + 240, BY, rnd)));
  {
    const L = 236;
    const h = hull({ x: BX, y: BY, rot: -2 }, L, rnd);
    const t = h.t;
    const mx = L * 0.58;
    const deck = h.deck(0.58);
    const mTop = -336;
    // mainsail: luff on the mast, gaff up and aft, the leech bellied by the wind, boom along the foot
    const luffTop = [mx, mTop + 16];
    const peak = [mx - 104, mTop - 10];
    const clew = [mx - 126, deck - 20];
    const tack = [mx, deck - 18];
    o.push(path(`M${xy(t([mx, deck]))}L${xy(t([mx + 0.8, mTop]))}M${xy(t([mx + 0.8, mTop + 2]))}L${xy(t([L + 3, -L * 0.21]))}`));
    o.push(papered(smooth(T(t, [luffTop, peak])) + smooth(T(t, [peak, [mx - 140, mTop + 120], [mx - 150, mTop + 232], clew]), { cont: true }) + `L${xy(t(tack))}Z`));
    o.push(path(smooth(T(t, [[mx - 34, mTop + 12], [mx - 52, mTop + 150], [mx - 44, deck - 22]])) + smooth(T(t, [[mx - 70, mTop + 2], [mx - 100, mTop + 150], [mx - 90, deck - 21]]))));
    o.push(path(`M${xy(t(luffTop))}L${xy(t(peak))}M${xy(t(tack))}L${xy(t(clew))}`));
    // the jib, from the masthead to the stem
    o.push(papered(smooth(T(t, [[mx + 4, mTop + 12], [mx + 66, mTop + 150], [mx + 82, deck - 22]])) + `L${xy(t([L - 6, -L * 0.17]))}Z`));
    o.push(path(smooth(T(t, [[mx + 18, mTop + 60], [mx + 52, mTop + 170], [mx + 56, deck - 22]]))));
    o.push(papered(poly(T(t, [[mx + 0.8, mTop], [mx + 30, mTop + 5], [mx + 0.8, mTop + 11]]), true)));
    o.push(h.d);
    // the wake
    o.push(path(smooth([[BX - 4, BY + 3], [BX - 60, BY + 8], [BX - 120, BY + 11]]) + smooth([[BX + 10, BY + 9], [BX - 40, BY + 16], [BX - 90, BY + 20]])));
  }

  // --- dolphins, leaping out of the first swell
  o.push(dolphin({ x: 1086, y: 792, s: 1.3, rot: -9 }));
  o.push(dolphin({ x: 1262, y: 786, s: 1.02, rot: 3 }));
  o.push(dolphin({ x: 640, y: 800, s: 1.12, rot: 6 }));

  // --- the swells: each a crest line with broken lines riding under it, the nearer bands papered over
  // the farther ones; on the nearer three a few crests curl over
  const curlAt = [[], [[150, 9], [610, 8], [1060, 9], [1450, 8]], [[360, 12], [820, 11], [1290, 12]], [[110, 15], [580, 16], [1060, 15], [1500, 14]]];
  const crestNear = (fn, x) => {
    // walk to the nearest crest (the highest point) within half a wavelength
    let best = x;
    for (let xx = x - 120; xx <= x + 120; xx += 4) if (fn(xx) < fn(best)) best = xx;
    return best;
  };
  w.forEach((fn, i) => {
    const curls = curlAt[i].map(([cx, R]) => [crestNear(fn, cx), R]);
    o.push(paperFill(`${smooth(sample(fn, -40, 1640, 40))}V1010H-40Z`));
    o.push(path(crestLine(fn, curls)));
    const gapK = 1 + i * 0.5;
    const n = i === 3 ? 2 : 3;
    const clear = (x, y) => !curls.some(([x0, R]) => x > x0 - R * 1.4 && x < x0 + R * 5 && y < fn(x0) + R * 2.8);
    let d = '';
    for (let k = 1; k <= n; k++) {
      d += broken((x) => fn(x) + k * 8 * gapK + Math.sin(x / 61 + k) * 1.2, -40, 1640, rnd, {
        len: [140 + i * 40, 340 + i * 60],
        gap: [40, 120],
        step: 40,
        min: 30,
        lead: -rnd() * 200,
        ok: clear,
      });
    }
    o.push(path(d));
  });

  return svg(o.join(''));
}

// ====================================================================================
// 3. OLIVE GROVES: the hills of Attica. Far mountains with the sea between them, terraced hills
// planted with olives in rows, the goat path winding up through them with goats on it, an old olive
// tree on the left with a cicada on its trunk, dry-stone walls along the foot.
// ====================================================================================
// a goat in profile, facing right, hooves at 0,0, about 64 long
function goat(pl) {
  const t = place(pl);
  const body = [[-25, -31], [-29, -24], [-26, -16], [-12, -14], [6, -15], [14, -17], [18, -25], [20, -35], [25, -42], [31, -44.5], [35.5, -43.5], [34, -48], [28, -52.5], [23, -51], [17, -45], [12, -36], [2, -33], [-12, -34]];
  const legs = [[[-21, -17], [-22.5, -9], [-20, 0]], [[-16, -15], [-14.5, -8], [-15.5, 0]], [[9, -16], [10.5, -8], [9, 0]], [[14, -17], [15.5, -8], [17, 0]]];
  return (
    path(legs.map((l) => smooth(T(t, l))).join('')) +
    papered(smooth(T(t, body)) + 'Z') +
    path(smooth(T(t, [[24, -51], [18, -58.5], [10, -60], [6, -55.5]])) + smooth(T(t, [[-25, -31], [-29, -38], [-26.5, -40.5]])) + smooth(T(t, [[31.5, -44], [30.5, -37.5]])) + smooth(T(t, [[24, -48], [18, -45.5]])) + dots([t([29, -48])]))
  );
}
// a cicada from above, head up, about 34 long at s 1
function cicada(pl) {
  const t = place(pl);
  const wing = (sg) => smooth(T(t, [[sg * 1.5, -7], [sg * 8.5, -2], [sg * 10, 9], [sg * 6, 20], [sg * 1, 15]].map(([a, b]) => [a, b])), { closed: true });
  return (
    papered(wing(-1)) +
    papered(wing(1)) +
    path(smooth(T(t, [[-2, -4], [-6, 4], [-5, 15]])) + smooth(T(t, [[2, -4], [6, 4], [5, 15]]))) +
    papered(smooth(T(t, [[-6.5, -9], [-5, -12.5], [0, -14], [5, -12.5], [6.5, -9], [0, -7]]), { closed: true })) +
    path(dots(T(t, [[-6.5, -11], [6.5, -11]])))
  );
}
// a dry-stone wall along fn: courses of rounded stones of h / rows each
function stoneWall(fn, x0, x1, h, rnd, { rows = 2, ok = () => true } = {}) {
  let d = '';
  const sh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = x0 + (r % 2) * sh * 0.8 + rnd() * 4;
    while (x < x1 - 6) {
      const w = sh * (1.4 + rnd() * 1.6);
      const xe = Math.min(x1, x + w);
      const ya = fn(x) + r * sh;
      const yb = fn(xe) + r * sh;
      if (ok(x, ya) && ok(xe, yb))
        d += worn([[x, ya + 1], [xe, yb + 1 + (rnd() - 0.5) * 2], [xe - 1, yb + sh - 1], [x + 1, ya + sh - 1 + (rnd() - 0.5) * 2]], sh * 0.36);
      x = xe + 1.5 + rnd() * 3;
    }
  }
  return path(d);
}
function olives() {
  const rnd = prng(33);
  const o = [];
  const HZ = 656;

  // --- far mountains, the sea between them
  o.push(hill([[-40, 476], [50, 446], [130, 424], [210, 434], [290, 470], [370, 520], [440, 566], [500, 600], [556, 626], [620, 646], [690, HZ + 2]], rnd, { bottom: HZ + 2, lines: [[22, 60, 420], [46, 120, 470, 40], [70, -40, 300, 20]] }));
  o.push(hill([[872, HZ + 2], [960, 646], [1044, 626], [1100, 594], [1170, 546], [1250, 506], [1330, 482], [1420, 476], [1520, 488], [1640, 506]], rnd, { bottom: HZ + 2, lines: [[20, 1150, 1600], [44, 1100, 1560, 30], [68, 1200, 1640, 10]] }));
  o.push(path(smooth([[690, HZ + 1], [780, HZ + 1.6], [872, HZ + 1]]) + broken((x) => HZ + 8, 700, 860, rnd, { len: [30, 70], gap: [14, 30], step: 20, min: 14 }) + broken((x) => HZ + 16, 720, 840, rnd, { len: [24, 60], gap: [16, 34], step: 20, min: 14 })));
  o.push(path(gull(760, HZ - 22, 6, -4) + gull(784, HZ - 30, 4.5, 5)));

  // --- mid hills, terraced and planted with olives in rows
  const midL = [[-40, 600], [60, 584], [160, 590], [260, 620], [360, 660], [460, 690], [560, 710], [680, 722], [800, 722]];
  const midR = [[700, 736], [820, 722], [920, 700], [1020, 672], [1110, 636], [1200, 604], [1300, 582], [1400, 570], [1500, 568], [1640, 574]];
  const yL = lookup(midL);
  const yR = lookup(midR);
  o.push(hill(midL, rnd, { lines: [[22, -40, 760], [48, -40, 700, 30], [76, -40, 620, 10], [106, -40, 540, 50], [140, -40, 460]] }));
  for (const [x, d, s] of [[372, 22, 0.66], [450, 22, 0.6], [530, 20, 0.58], [610, 18, 0.54], [690, 16, 0.5], [420, 48, 0.74], [510, 46, 0.7], [600, 44, 0.66]]) o.push(olive(x, yL(x) + d, s, rnd));
  o.push(hill(midR, rnd, { lines: [[20, 780, 1640], [44, 820, 1640, 40], [70, 900, 1640, 10], [98, 1000, 1640, 60], [130, 1080, 1640, 30], [166, 1160, 1640]] }));
  for (const [x, d, s] of [[1150, 18, 0.62], [1240, 17, 0.66], [1330, 16, 0.68], [1420, 16, 0.7], [1510, 16, 0.7], [1600, 16, 0.7], [1200, 42, 0.78], [1300, 40, 0.82], [1400, 40, 0.84], [1500, 40, 0.84], [1590, 40, 0.86]]) o.push(olive(x, yR(x) + d, s, rnd));

  // --- the goat path, winding up from the foot through the terraces to the right
  {
    const c = curve([[690, 1010], [740, 940], [830, 892], [940, 858], [1030, 812], [1090, 770], [1150, 736], [1226, 706], [1300, 690]], 6);
    const left = [];
    const right = [];
    c.forEach((p, i) => {
      const q = c[Math.min(c.length - 1, i + 1)];
      const r0 = c[Math.max(0, i - 1)];
      const dx = q[0] - r0[0];
      const dy = q[1] - r0[1];
      const l = Math.hypot(dx, dy) || 1;
      const wdt = 8 + (p[1] - 690) * 0.11;
      left.push([p[0] - (dy / l) * wdt, p[1] + (dx / l) * wdt]);
      right.push([p[0] + (dy / l) * wdt, p[1] - (dx / l) * wdt]);
    });
    o.push(paperFill(poly([...left, ...right.reverse()], true)));
    o.push(path(dashes(left, rnd, { len: [80, 200], gap: [8, 24], every: 4 }) + dashes(right.reverse(), rnd, { len: [80, 200], gap: [8, 24], every: 4 })));
    let pb = '';
    for (let i = 8; i < c.length - 8; i += 7 + Math.floor(rnd() * 6)) {
      const p = c[i];
      pb += pebble(p[0] + (rnd() - 0.5) * (6 + (p[1] - 690) * 0.12), p[1] + (rnd() - 0.5) * 4, 3 + (p[1] - 690) * 0.02, rnd);
    }
    o.push(path(pb));
  }
  o.push(goat({ x: 1070, y: 788, s: 1.0, flip: true }));
  o.push(goat({ x: 1140, y: 752, s: 0.76 }));

  // --- the terrace wall in the right foreground, an olive on its terrace, a goat on top of it
  {
    const wallF = (x) => 862 - (x - 980) * 0.03 + Math.sin(x / 90) * 2;
    o.push(paperFill(`${smooth(sample(wallF, 960, 1640, 40))}V1010H960Z`));
    o.push(path(smooth(sample(wallF, 960, 1640, 40))));
    o.push(stoneWall(wallF, 966, 1640, 44, rnd));
    o.push(path(smooth(sample((x) => wallF(x) + 46, 960, 1640, 60))));
    o.push(olive(1250, 812, 1.3, rnd));
    o.push(goat({ x: 1150, y: wallF(1150) - 1, s: 1.22, flip: true }));
    o.push(path(tuft(1000, wallF(1000), 16, rnd) + tuft(1180, wallF(1180), 14, rnd) + tuft(1440, wallF(1440), 18, rnd) + tuft(1600, wallF(1600), 16, rnd)));
    // the ground under the wall, a few stones and grasses
    o.push(path(tuft(1060, 968, 20, rnd, 5) + tuft(1300, 976, 24, rnd, 5) + tuft(1520, 970, 22, rnd, 5) + pebble(1140, 960, 14, rnd) + pebble(1410, 980, 18, rnd) + pebble(1600, 950, 12, rnd)));
  }

  // --- the old olive on the left, and the cicada singing on its trunk
  o.push(oldOlive(1490, 862, 1.7, rnd, { flip: true }));
  o.push(oldOlive(232, 952, 2.5, rnd));
  o.push(cicada({ x: 246, y: 814, s: 1.05, rot: -6 }));

  // --- the dry-stone wall along the foot on the left, grasses and a thistle
  {
    const wallF = (x) => 944 + (x + 40) * 0.012 + Math.sin(x / 70) * 1.8;
    o.push(paperFill(`${smooth(sample(wallF, -40, 700, 40))}V1010H-40Z`));
    o.push(path(smooth(sample(wallF, -40, 700, 40))));
    o.push(stoneWall(wallF, -40, 700, 48, rnd));
    o.push(path(tuft(40, wallF(40), 20, rnd, 5) + tuft(420, wallF(420), 18, rnd) + tuft(560, wallF(560), 22, rnd, 5) + tuft(660, wallF(660), 14, rnd)));
    // a thistle by the path
    const tx = 640;
    const ty = wallF(640);
    let th = `M${f(tx)} ${f(ty)}Q${f(tx - 4)} ${f(ty - 40)} ${f(tx + 2)} ${f(ty - 70)}`;
    th += `M${f(tx - 2)} ${f(ty - 30)}l-12 -6l4 -3M${f(tx - 1)} ${f(ty - 46)}l11 -7l-2 -3`;
    for (let k = 0; k < 9; k++) {
      const a = -Math.PI / 2 + (k - 4) * 0.22;
      th += `M${f(tx + 2)} ${f(ty - 82)}l${f(Math.cos(a) * 13)} ${f(Math.sin(a) * 13)}`;
    }
    o.push(path(th) + papered(smooth([[tx - 6, ty - 70], [tx - 7, ty - 78], [tx + 2, ty - 84], [tx + 11, ty - 78], [tx + 10, ty - 70]]) + 'Z') + path(hatch([[tx - 6, ty - 71], [tx - 6, ty - 78], [tx + 10, ty - 78], [tx + 10, ty - 71]], 5, 45, { inset: 1 })));
  }

  return svg(o.join(''));
}

// ====================================================================================
// 4. THE MOUNTAIN ROAD: Parnassus. Two high massifs on the sides, snow on their tops and clouds lying
// along their flanks below the summits; a forest of firs climbing the slopes; the mule track zigzags up
// the foot with a laden mule and its driver, and a last olive or two where the road leaves the groves.
// ====================================================================================
// a mule in profile, facing right, hooves at 0,0, about 90 long, with a pack saddle and its load
function mule(pl) {
  const t = place(pl);
  const body = [[-36, -48], [-39, -38], [-35, -27], [-18, -25], [8, -25], [18, -28], [22, -38], [28, -52], [34, -60], [44, -56], [49, -48], [47, -43.5], [40, -45], [32, -49], [26, -57], [16, -54], [0, -53], [-20, -53]];
  const legs = [[[-30, -30], [-33, -16], [-30, -8], [-31, 0]], [[-25, -27], [-24, -14], [-26, -7], [-25, 0]], [[13, -27], [14, -13], [13, 0]], [[19, -30], [20, -14], [21, 0]]];
  const ears = smooth(T(t, [[30, -60], [26, -74], [27, -79], [32, -64]])) + smooth(T(t, [[33, -61], [33, -76], [36, -79], [36, -63]]));
  const pack = poly(T(t, [[-24, -52], [-22, -68], [10, -69], [12, -53]]), true);
  const load = smooth(T(t, [[-28, -68], [-30, -76], [-26, -84], [14, -84], [17, -76], [14, -68]]), { closed: true });
  return (
    path(legs.map((l) => smooth(T(t, l))).join('') + smooth(T(t, [[-37, -46], [-43, -34], [-41, -22]]))) +
    papered(smooth(T(t, body)) + 'Z') +
    papered(ears) +
    papered(load) +
    papered(pack) +
    path(smooth(T(t, [[-6, -84], [-6, -69]])) + smooth(T(t, [[-24, -60], [-4, -47], [10, -61]])) + dots([t([40, -51])]))
  );
}
function mountain() {
  const rnd = prng(44);
  const o = [];

  // --- the far saddle behind the middle
  o.push(hill([[480, 668], [600, 646], [720, 632], [820, 630], [920, 638], [1020, 650], [1120, 666]], rnd, { bottom: 760, lines: [[16, 520, 1080], [34, 560, 1060, 30]] }));
  // --- the two massifs: outline, ridges falling from the summits, snow left bare above a ragged line,
  // the rock below it hatched along the fall of the slope
  const massif = (top, spurs, snow, hatchPolys) => {
    let s = paperFill(`${smooth(top)}L${f(top[top.length - 1][0])} 1010L${f(top[0][0])} 1010Z`) + path(smooth(top));
    s += path(spurs.map((sp) => smooth(sp)).join(''));
    s += path(snow.map((sn) => smooth(sn)).join(''));
    s += path(hatchPolys.map(([pts, gap, ang]) => hatch(pts, gap, ang, { inset: 3 })).join(''));
    return s;
  };
  o.push(
    massif(
      [[-40, 372], [30, 300], [96, 236], [150, 186], [194, 150], [232, 166], [270, 198], [318, 236], [350, 252], [394, 236], [430, 262], [470, 320], [510, 420], [536, 520], [548, 600], [574, 644], [640, 668]],
      [
        [[194, 150], [176, 210], [190, 270], [170, 340]],
        [[194, 150], [236, 220], [262, 290]],
        [[394, 236], [384, 290], [404, 350]],
        [[96, 236], [90, 290], [64, 340]],
      ],
      [
        [[118, 214], [140, 226], [152, 214], [170, 232], [186, 222], [204, 240], [222, 226], [244, 246], [262, 240], [290, 256]],
        [[372, 248], [386, 262], [400, 252], [418, 270]],
      ],
      [
        [[[194, 152], [178, 210], [190, 270], [172, 340], [120, 360], [100, 300], [140, 240]], 9, 70],
        [[[394, 238], [386, 290], [404, 350], [360, 360], [352, 300], [362, 262]], 9, 70],
        [[[30, 302], [96, 238], [90, 292], [64, 342], [10, 364]], 10, 66],
      ],
    ),
  );
  o.push(
    massif(
      [[960, 664], [1030, 640], [1048, 610], [1080, 540], [1120, 430], [1160, 330], [1196, 262], [1226, 276], [1258, 248], [1300, 196], [1350, 134], [1388, 158], [1430, 196], [1480, 236], [1540, 262], [1600, 286], [1640, 298]],
      [
        [[1350, 134], [1330, 200], [1342, 270], [1318, 340]],
        [[1350, 134], [1400, 210], [1424, 290]],
        [[1196, 262], [1186, 320], [1200, 380]],
        [[1480, 236], [1490, 300], [1474, 350]],
      ],
      [
        [[1262, 248], [1280, 262], [1298, 248], [1316, 268], [1334, 256], [1352, 276], [1372, 262], [1392, 282], [1414, 270], [1440, 290]],
        [[1180, 296], [1194, 310], [1210, 300]],
      ],
      [
        [[[1350, 136], [1332, 200], [1344, 270], [1320, 340], [1270, 350], [1262, 290], [1300, 220]], 9, 70],
        [[[1196, 264], [1188, 320], [1202, 380], [1150, 390], [1150, 330], [1170, 290]], 9, 70],
        [[[1480, 238], [1490, 300], [1476, 350], [1430, 340], [1436, 280], [1450, 252]], 10, 66],
      ],
    ),
  );

  // --- clouds lying along the flanks, below the summits
  o.push(cloud(-60, 404, 1.25, [[0, 0], [26, -14], [64, -24], [110, -34], [160, -28], [206, -36], [252, -24], [300, -30], [340, -16], [372, 0]], [[[50, -8], [80, -15]], [[130, -20], [168, -20]], [[226, -17], [262, -15]]], [[-40, 60, 14], [300, 420, 15], [140, 260, 26]], false));
  o.push(cloud(1150, 398, 1.2, [[0, 0], [24, -14], [62, -22], [104, -34], [150, -30], [196, -38], [240, -24], [286, -28], [330, -14], [380, 0]], [[[46, -8], [74, -14]], [[118, -20], [152, -22]], [[214, -18], [252, -15]]], [[-60, 40, 14], [330, 420, 15], [120, 230, 26]], false));
  o.push(path(streak(-20, 220, 470) + streak(60, 180, 482, 0.4) + streak(1300, 1600, 476) + streak(1380, 1520, 488) + streak(1090, 1200, 520)));

  // --- the forest: a far edge of treetops, then firs, larger as they come down the slopes
  const lTop = lookup([[-40, 372], [30, 300], [96, 236], [150, 186], [194, 150], [232, 166], [270, 198], [318, 236], [350, 252], [394, 236], [430, 262], [470, 320], [510, 420], [536, 520], [548, 600], [574, 644], [640, 668]]);
  const rTop = lookup([[960, 664], [1030, 640], [1048, 610], [1080, 540], [1120, 430], [1160, 330], [1196, 262], [1226, 276], [1258, 248], [1300, 196], [1350, 134], [1388, 158], [1430, 196], [1480, 236], [1540, 262], [1600, 286], [1640, 298]]);
  o.push(treeline((x) => 520 + Math.sin(x / 60) * 6 + (x - 0) * 0.08, -40, 470, 17, rnd, 40));
  o.push(treeline((x) => 512 - (x - 1100) * 0.06 + Math.sin(x / 50) * 6, 1100, 1640, 17, rnd, 40));
  // the inner faces of the massifs, in shadow
  o.push(path(hatch([[432, 264], [470, 322], [510, 420], [540, 520], [554, 600], [530, 606], [500, 520], [466, 420], [436, 330], [418, 280]], 11, 72, { inset: 4 }) + hatch([[1194, 266], [1160, 332], [1120, 432], [1082, 540], [1050, 606], [1080, 610], [1118, 520], [1150, 430], [1180, 340], [1204, 290]], 11, 108, { inset: 4 })));
  // track: the zigzag up the foot
  const track = curve([[250, 1020], [420, 960], [640, 914], [720, 894], [660, 868], [600, 846], [700, 822], [860, 800], [990, 780], [1080, 760], [1130, 746]], 6);
  const nearTrack = (x, y, pad) => track.some((p) => Math.abs(p[0] - x) < pad + 26 && Math.abs(p[1] - y) < pad + 10);
  {
    const rows = [
      [566, 34, [[-40, 520], [1090, 1640]], 0.45],
      [630, 46, [[-40, 545], [1060, 1640]], 0.4],
      [700, 60, [[-40, 520], [1080, 1640]], 0.35],
      [690, 30, [[600, 1000]], 0.7],
      [784, 80, [[-40, 470], [1150, 1640]], 0.3],
      [872, 104, [[-40, 300], [1240, 1640]], 0.3],
    ];
    for (const [y0, h, ranges, skip] of rows) {
      for (const [a, b] of ranges) {
        let x = a + rnd() * h * 0.4;
        while (x < b) {
          const hh = h * (0.8 + rnd() * 0.4);
          const yy = y0 + (rnd() - 0.5) * h * 0.3;
          const ground = x < 800 ? lTop(x) : rTop(x);
          if (yy - hh > ground + 4 && !open(x, yy - hh) && !nearTrack(x, yy, hh * 0.2) && rnd() > skip) o.push(fir(x, yy, hh, rnd, { spine: hh > 70, tiers: hh < 50 ? 3 : undefined }));
          x += hh * (0.4 + rnd() * 0.34);
        }
      }
    }
  }
  // the track itself, the mule and its driver on it, stones along its edges
  {
    const left = [];
    const right = [];
    track.forEach((p, i) => {
      const q = track[Math.min(track.length - 1, i + 1)];
      const r0 = track[Math.max(0, i - 1)];
      const dx = q[0] - r0[0];
      const dy = q[1] - r0[1];
      const l = Math.hypot(dx, dy) || 1;
      const wdt = 9 + (p[1] - 740) * 0.17;
      left.push([p[0] - (dy / l) * wdt, p[1] + (dx / l) * wdt]);
      right.push([p[0] + (dy / l) * wdt, p[1] - (dx / l) * wdt]);
    });
    o.push(paperFill(poly([...left, ...[...right].reverse()], true)));
    o.push(path(dashes(left, rnd, { len: [90, 220], gap: [8, 22], every: 4 }) + dashes(right, rnd, { len: [90, 220], gap: [8, 22], every: 4 })));
    let st = '';
    for (let i = 6; i < left.length; i += 6 + Math.floor(rnd() * 5)) {
      const side = rnd() > 0.5 ? left : right;
      const p = side[i];
      st += pebble(p[0], p[1] + 2, 4 + (p[1] - 740) * 0.04, rnd);
    }
    o.push(path(st));
  }
  o.push(mule({ x: 540, y: 936, s: 1.35, rot: -9 }));
  o.push(figure({ x: 420, y: 962, s: 1.3, rot: -6 }, 'walk'));
  // the foot: big firs at the edges, a last olive, rocks and grass
  o.push(fir(60, 1000, 300, rnd, { tiers: 7, spine: true }));
  o.push(fir(150, 1012, 200, rnd, { tiers: 6, spine: true }));
  o.push(fir(1560, 1004, 320, rnd, { tiers: 7, spine: true }));
  o.push(fir(1452, 1012, 210, rnd, { tiers: 6, spine: true }));
  o.push(olive(300, 984, 1.6, rnd));
  o.push(olive(1290, 990, 1.3, rnd));
  o.push(papered(worn([[820, 1010], [826, 966, 10], [860, 946, 12], [904, 952, 10], [926, 980, 8], [930, 1010]], 10)) + path(smooth([[838, 966], [868, 960], [900, 968]])));
  o.push(path(tuft(760, 996, 22, rnd, 5) + tuft(960, 1000, 18, rnd, 4) + tuft(1180, 994, 22, rnd, 5) + tuft(1360, 1000, 16, rnd)));

  return svg(o.join(''));
}

// ====================================================================================
// 5. DELPHI: the two shining cliffs (Phaedriades) on the sides, Parnassus faint behind them, the two
// eagles of Zeus flying in from the ends of the earth toward each other; in the gorge the valley full of
// olives runs down to the gulf. The temple of Apollo's standing columns on the polygonal wall, fallen
// drums, the tholos, the tripod, a laurel, and the Castalian spring at the foot of the left cliff.
// ====================================================================================
// a Doric column: shaft with flutes and drum joints, capital, or a broken top; base at y
function doric(x, base, h, w, rnd, { cap = true } = {}) {
  const wt = w * 0.8;
  const yT = base - h;
  const shaft = smooth([[x - w / 2, base], [x - w * 0.47, base - h * 0.5], [x - wt / 2, yT]]);
  let top;
  let d = '';
  if (cap) {
    const ec = smooth([[x - wt / 2, yT], [x - w * 0.6, yT - 4], [x - w * 0.66, yT - 8]], { cont: true });
    top = `${ec}L${f(x - w * 0.66)} ${f(yT - 14)}L${f(x + w * 0.66)} ${f(yT - 14)}L${f(x + w * 0.66)} ${f(yT - 8)}${smooth([[x + w * 0.66, yT - 8], [x + w * 0.6, yT - 4], [x + wt / 2, yT]], { cont: true })}`;
    d += `M${f(x - w * 0.66)} ${f(yT - 8)}H${f(x + w * 0.66)}`;
  } else {
    top = `L${f(x - wt * 0.3)} ${f(yT - 4 - rnd() * 6)}L${f(x + wt * 0.05)} ${f(yT + rnd() * 4)}L${f(x + wt * 0.3)} ${f(yT - 6 - rnd() * 4)}L${f(x + wt / 2)} ${f(yT + 2)}`;
  }
  const out = `${shaft}${cap ? top : `L${f(x - wt / 2)} ${f(yT)}${top}`}${smooth([[x + wt / 2, yT], [x + w * 0.47, base - h * 0.5], [x + w / 2, base]], { cont: true })}Z`;
  for (const u of [-0.22, 0.04, 0.26]) d += `M${f(x + u * w)} ${f(base - 3)}L${f(x + u * wt)} ${f(yT + (cap ? 3 : 9))}`;
  for (let y = base - 26 - rnd() * 10; y > yT + 14; y -= 30 + rnd() * 14) d += `M${f(x - w * 0.46)} ${f(y)}h${f(w * 0.3)}M${f(x + w * 0.1)} ${f(y + 0.5)}h${f(w * 0.34)}`;
  return papered(out) + path(d);
}
// an eagle soaring, seen from below, wings spread, head turned right; about 160 across at s 1
function eagle(pl) {
  const t = place(pl);
  const wing = (sg) => {
    const m = (pts) => pts.map(([a, b]) => [sg * a, b]);
    return (
      smooth(T(t, m([[5, -5], [24, -13], [46, -19], [64, -20]]))) +
      `L${poly(T(t, m([[78, -24], [68, -15], [81, -15], [69, -8], [80, -5], [67, -2], [74, 3], [61, 3]]))).slice(1)}` +
      smooth(T(t, m([[61, 3], [46, 8], [28, 11], [12, 10], [5, 7]])), { cont: true }) +
      'Z'
    );
  };
  const body = smooth(T(t, [[-5, -3], [-5, -10], [-1, -15], [5, -17], [11, -16.5], [14, -13.5], [9, -12.5], [6, -9], [5, -2], [6, 9], [9, 22], [3, 25.5], [-3, 25.5], [-9, 22], [-6, 9]]), { closed: true });
  return papered(wing(-1)) + papered(wing(1)) + papered(body) + path(smooth(T(t, [[-38, -9], [-24, -5], [-12, -1]])) + smooth(T(t, [[38, -9], [24, -5], [12, -1]])) + smooth(T(t, [[-3, 12], [-2, 24]])) + smooth(T(t, [[3, 12], [2, 24]])) + dots([t([6.5, -13.5])]));
}
// a laurel: a dense crown of small lobes with pointed leaves standing out of it, on a few stems
function laurel(x, y, s, rnd) {
  const t = place({ x, y, s });
  let out = path(smooth(T(t, [[0, 0], [-2, -40], [-10, -80], [-24, -110]])) + smooth(T(t, [[-1, -36], [12, -70], [26, -100]])) + smooth(T(t, [[-6, -64], [-4, -110]])));
  const lobes = [[-56, -110, 34, 24], [36, -112, 34, 24], [-30, -142, 42, 30], [26, -150, 42, 30], [-4, -190, 38, 28]];
  for (const [cx, cy, rx, ry] of lobes) {
    const c = t([cx, cy]);
    // leaves standing out round the top of the lobe, drawn first so the lobe covers their stalks
    let lv = '';
    for (let k = 0; k < 3; k++) {
      const a = Math.PI * 1.25 + (k + 0.5) * (Math.PI / 6) + (rnd() - 0.5) * 0.2;
      const p = [c[0] + Math.cos(a) * rx * s * 0.82, c[1] + Math.sin(a) * ry * s * 0.82];
      lv += leaf(p, a, 15 * s * (0.8 + rnd() * 0.4), 0.2);
    }
    out += papered(lv) + papered(clump(c[0], c[1], rx * s, ry * s, rnd, { n: 9, k: 0.7 }));
    let inner = '';
    for (let k = 0; k < 3; k++) inner += leaf([c[0] + (rnd() - 0.5) * rx * s, c[1] + (rnd() - 0.4) * ry * s * 0.8], -Math.PI / 2 + (rnd() - 0.5) * 1.6, 12 * s);
    out += path(inner);
  }
  return out;
}
// a sprig of laurel: a bending stem with pointed leaves in pairs
function sprig(x, y, len, ang, rnd, flip = 1) {
  const stem = curve([[x, y], [x + Math.cos(ang) * len * 0.5 + flip * 10, y + Math.sin(ang) * len * 0.5], [x + Math.cos(ang) * len, y + Math.sin(ang) * len]], 10);
  let d = smooth(stem);
  for (let i = 2; i < stem.length; i += 2) {
    const p = stem[i];
    const q = stem[i - 1];
    const a0 = Math.atan2(p[1] - q[1], p[0] - q[0]);
    for (const side of [-1, 1]) {
      const a = a0 + side * 0.7;
      const l = 22 * (1 - i / stem.length / 2);
      const e = [p[0] + Math.cos(a) * l, p[1] + Math.sin(a) * l];
      const nx = -Math.sin(a) * 5;
      const ny = Math.cos(a) * 5;
      d += `M${xy(p)}Q${xy([(p[0] + e[0]) / 2 + nx, (p[1] + e[1]) / 2 + ny])} ${xy(e)}Q${xy([(p[0] + e[0]) / 2 - nx, (p[1] + e[1]) / 2 - ny])} ${xy(p)}`;
    }
  }
  return papered(d);
}
function delphi() {
  const rnd = prng(55);
  const o = [];

  // --- Parnassus, faint behind the cliffs
  o.push(path(smooth([[-40, 252], [40, 206], [120, 160], [176, 132], [220, 150], [280, 196], [340, 228], [400, 262]]) + smooth([[1200, 280], [1270, 226], [1340, 170], [1396, 128], [1440, 150], [1520, 196], [1640, 236]])));
  o.push(path(smooth([[120, 160], [140, 176], [160, 166], [180, 184], [204, 172], [226, 190]]) + smooth([[1352, 162], [1372, 178], [1392, 166], [1414, 184], [1436, 172], [1460, 192]])));
  // --- the eagles of Zeus, flying in from the two ends of the earth
  o.push(eagle({ x: 250, y: 132, s: 1.35, rot: -6 }));
  o.push(eagle({ x: 1350, y: 108, s: 1.25, rot: 6, flip: true }));

  // --- the valley in the gorge: far hills, the gulf, and the sea of olives
  o.push(hill([[460, 664], [560, 648], [660, 640], [760, 644], [860, 640], [960, 646], [1060, 656], [1140, 668]], rnd, { bottom: 760, lines: [[12, 520, 1100]] }));
  o.push(path(broken((x) => 680, 560, 1040, rnd, { len: [40, 120], gap: [16, 40], step: 30, min: 20 }) + broken((x) => 688, 600, 1000, rnd, { len: [30, 90], gap: [20, 50], step: 30, min: 16 })));
  {
    let d = '';
    for (let r = 0; r < 4; r++) {
      const y = 704 + r * 15;
      let x = 470 + r * 6 + rnd() * 10;
      while (x < 1130) {
        const w = 9 + r * 2.4 + rnd() * 3;
        d += `M${f(x)} ${f(y)}${scallops([[x, y], [x + w, y]], 0.55)}`;
        x += w + 2 + rnd() * 6;
      }
    }
    o.push(paperFill(`M460 700H1140V780H460Z`) + path(d));
  }

  // --- the two cliffs: tall walls of rock split by long vertical fissures, broken across by ledges in
  // short blocks, tufts of scrub on the ledges, scree at their feet
  const cliff = (outline, x0, x1, inner, foot, seed) => {
    const r = prng(seed);
    const topY = lookup(outline.filter(([x]) => x >= Math.min(x0, x1) - 60 && x <= Math.max(x0, x1) + 60).sort((p, q) => p[0] - q[0]));
    let s2 = papered(smooth(outline) + 'Z');
    let d = '';
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    const inside = (x, y) => (x0 < x1 ? x < inner(y) - 8 : x > inner(y) + 8) && y > topY(x) + 6 && y < foot(x) - 6;
    for (let x = lo + 14 + r() * 20; x < hi; x += 30 + r() * 34) {
      const pts = [];
      let xx = x;
      let drift = (r() - 0.5) * 0.6;
      const y0 = topY(x) + 8 + (r() < 0.3 ? 40 + r() * 120 : 0);
      for (let y = y0; y < foot(x) - r() * 80; y += 14) {
        drift += (r() - 0.5) * 0.35;
        xx += drift + (r() - 0.5) * 1.6;
        pts.push([xx, y]);
      }
      if (pts.length > 2) d += dashes(pts, r, { len: [140, 360], gap: [8, 22], every: 2, ok: inside });
    }
    for (let k = 0; k < 7; k++) {
      const x = lo + 20 + r() * (hi - lo - 60);
      const y = 380 + r() * 300;
      const l = 24 + r() * 50;
      const sl = (r() - 0.5) * 8;
      if (inside(x, y) && inside(x + l, y + sl)) d += smooth([[x, y], [x + l / 2, y + sl / 2 + 1.5], [x + l, y + sl]]);
    }
    s2 += path(d);
    let scrub = '';
    for (let k = 0; k < 9; k++) {
      const x = lo + 30 + r() * (hi - lo - 60);
      const y = 380 + r() * 280;
      if (!inside(x - 12, y) || !inside(x + 12, y)) continue;
      scrub += `M${f(x - 12)} ${f(y)}${scallops([[x - 12, y], [x - 4, y - 8], [x + 6, y - 9], [x + 13, y]], 0.6)}`;
    }
    return s2 + papered(scrub);
  };
  o.push(
    cliff(
      [[-40, 304], [20, 300], [44, 284], [100, 290], [130, 302], [184, 296], [222, 282], [272, 288], [310, 302], [362, 306], [392, 320], [446, 334], [472, 372], [480, 450], [494, 540], [520, 610], [556, 650], [600, 690], [640, 740], [-40, 760]],
      -40,
      470,
      lookup([[0, 470], [372, 470], [450, 480], [540, 494], [610, 520], [650, 556], [690, 600]]),
      (x) => 650 + (x < 300 ? 40 : 40 - (x - 300) * 0.25),
      551,
    ),
  );
  o.push(
    cliff(
      [[1640, 272], [1584, 266], [1560, 252], [1500, 262], [1470, 280], [1416, 274], [1380, 262], [1330, 270], [1290, 290], [1240, 296], [1210, 306], [1150, 326], [1118, 366], [1104, 450], [1094, 540], [1076, 610], [1046, 650], [1000, 700], [960, 760], [1640, 770]],
      1640,
      1110,
      lookup([[0, 1112], [366, 1112], [450, 1104], [540, 1094], [610, 1076], [650, 1046], [700, 1000]]),
      (x) => 660 + (x > 1300 ? 40 : 40 - (1300 - x) * 0.25),
      552,
    ),
  );
  // scree at the feet of the cliffs
  o.push(path(dashes(curve([[-40, 700], [200, 690], [420, 674], [560, 690]], 8), rnd, { len: [40, 120], gap: [14, 40] }) + dashes(curve([[1640, 706], [1400, 694], [1180, 680], [1040, 694]], 8), rnd, { len: [40, 120], gap: [14, 40] })));

  // --- the Castalian spring at the foot of the left cliff: a niche cut in the rock, water falling into a
  // basin, and the stream running down to the foot
  {
    o.push(papered(box(380, 610, 70, 84)) + path(box(390, 620, 50, 64) + `M380 606H450`));
    o.push(path(`M415 650v6` + smooth([[409, 660], [411, 680], [407, 700], [410, 722]]) + smooth([[415, 660], [417, 684], [414, 704], [417, 724]]) + smooth([[421, 660], [423, 682], [421, 702], [424, 722]])));
    o.push(papered(poly([[368, 718], [372, 742], [462, 742], [466, 718]], true)) + path(`M376 728H458`));
    const stream = curve([[372, 744], [330, 770], [240, 800], [150, 850], [80, 910], [30, 1010]], 8);
    const l = stream.map(([x, y]) => [x - 10 - (y - 740) * 0.06, y]);
    const r = stream.map(([x, y]) => [x + 10 + (y - 740) * 0.06, y]);
    o.push(paperFill(poly([...l, ...[...r].reverse()], true)) + path(dashes(l, rnd, { len: [80, 180], gap: [10, 26] }) + dashes(r, rnd, { len: [80, 180], gap: [10, 26] }) + dashes(stream.map(([x, y]) => [x + 2, y]), rnd, { len: [20, 50], gap: [16, 40], every: 2 })));
  }

  // --- the sanctuary terrace: the polygonal wall, the temple platform and its standing columns
  {
    const x0 = 416;
    const x1 = 884;
    const top = 806;
    const bot = 858;
    o.push(papered(box(x0, top, x1 - x0, bot - top)));
    // polygonal masonry: a zigzag joint along the middle, slanting joints up and down from its corners
    let d = '';
    const mid = [];
    for (let x = x0; x <= x1; x += 34 + rnd() * 30) mid.push([x, (top + bot) / 2 + (rnd() - 0.5) * 18]);
    mid.push([x1, (top + bot) / 2]);
    d += poly(mid);
    mid.slice(1, -1).forEach(([x, y], i) => {
      if (i % 2 === 0) d += `M${f(x)} ${f(y)}L${f(x + (rnd() - 0.5) * 24)} ${f(top)}`;
      else d += `M${f(x)} ${f(y)}L${f(x + (rnd() - 0.5) * 24)} ${f(bot)}`;
    });
    o.push(path(d));
    // the platform's three steps
    o.push(papered(box(434, 794, 432, 12)) + papered(box(446, 782, 408, 12)) + papered(box(458, 772, 384, 10)));
    const cols = [[486, 124, true], [556, 130, true], [626, 132, true], [696, 126, true], [766, 92, false], [830, 50, false]];
    for (const [x, h, cap] of cols) o.push(doric(x, 772, h, 30, rnd, { cap }));
    // fallen drums in front of the wall
    const drum = (x, y, r, l) => papered(`M${f(x)} ${f(y - r)}H${f(x + l)}A${f(r * 0.4)} ${f(r)} 0 0 1 ${f(x + l)} ${f(y + r)}H${f(x)}Z`) + papered(`M${f(x)} ${f(y - r)}a${f(r * 0.4)} ${f(r)} 0 1 0 0 ${f(2 * r)}a${f(r * 0.4)} ${f(r)} 0 1 0 0 ${f(-2 * r)}Z`) + path(`M${f(x + l * 0.3)} ${f(y - r + 2)}V${f(y + r - 2)}`);
    o.push(drum(540, 882, 15, 52) + drum(700, 892, 14, 46));
  }

  // --- the tholos of Athena Pronaia: a round stepped base, three columns and the curved beam over them
  {
    const cx = 1260;
    const base = 846;
    const rx = 150;
    const ry = 20;
    const arc = (yy, r) => `M${f(cx - r)} ${f(yy)}A${f(r)} ${f(ry)} 0 0 0 ${f(cx + r)} ${f(yy)}`;
    o.push(papered(`${arc(base + 22, rx + 14)}V${f(base + 32)}A${f(rx + 14)} ${f(ry)} 0 0 1 ${f(cx - rx - 14)} ${f(base + 32)}Z`));
    o.push(papered(`${arc(base + 10, rx + 6)}V${f(base + 22)}A${f(rx + 6)} ${f(ry)} 0 0 1 ${f(cx - rx - 6)} ${f(base + 22)}Z`));
    o.push(papered(`M${f(cx - rx)} ${f(base)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx)} ${f(base)}V${f(base + 10)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx)} ${f(base + 10)}Z`));
    const cols = [-88, 0, 88].map((dx) => [cx + dx, base + ry * Math.sqrt(1 - (dx / rx) ** 2) * 0.9]);
    for (const [x, b] of cols) o.push(doric(x, b, 156, 27, rnd));
    // the beam: two curved courses bowing toward us, triglyphs on the lower
    const yb = base - 156 + ry * 0.9 - 14;
    o.push(papered(`M${f(cx - 106)} ${f(yb - 4)}Q${f(cx)} ${f(yb + 20)} ${f(cx + 106)} ${f(yb - 4)}V${f(yb - 40)}Q${f(cx)} ${f(yb - 16)} ${f(cx - 106)} ${f(yb - 40)}Z`));
    let tg = `M${f(cx - 106)} ${f(yb - 22)}Q${f(cx)} ${f(yb + 2)} ${f(cx + 106)} ${f(yb - 22)}`;
    for (let k = -4; k <= 4; k++) {
      const x = cx + k * 24;
      const yy = yb - 22 + 24 * (1 - (k / 4.4) ** 2) * 0.5;
      tg += `M${f(x - 3)} ${f(yy + 1)}v${f(10)}M${f(x + 3)} ${f(yy + 1)}v${f(10)}`;
    }
    o.push(path(tg));
  }

  // --- the tripod on its base, between the temple and the tholos
  {
    const x = 980;
    const base = 922;
    o.push(papered(box(x - 34, base, 68, 16)));
    o.push(path(smooth([[x - 26, base - 116], [x - 30, base - 60], [x - 40, base - 4]]) + smooth([[x + 26, base - 116], [x + 30, base - 60], [x + 40, base - 4]]) + `M${f(x)} ${f(base - 112)}V${f(base - 2)}` + `M${f(x - 31)} ${f(base - 50)}Q${f(x)} ${f(base - 40)} ${f(x + 31)} ${f(base - 50)}`));
    o.push(path(`M${f(x - 46)} ${f(base - 2)}q6 -8 12 -2M${f(x + 34)} ${f(base - 2)}q6 -8 12 -2M${f(x - 6)} ${f(base - 2)}q6 -8 12 -2`));
    o.push(papered(`M${f(x - 40)} ${f(base - 124)}Q${f(x - 38)} ${f(base - 96)} ${f(x)} ${f(base - 94)}Q${f(x + 38)} ${f(base - 96)} ${f(x + 40)} ${f(base - 124)}Z`));
    o.push(papered(`M${f(x - 40)} ${f(base - 124)}a40 7 0 1 0 80 0a40 7 0 1 0 -80 0Z`));
    // two upright ring handles standing on the rim
    o.push(path(`M${f(x - 34)} ${f(base - 126)}C${f(x - 40)} ${f(base - 150)} ${f(x - 18)} ${f(base - 152)} ${f(x - 20)} ${f(base - 128)}M${f(x + 34)} ${f(base - 126)}C${f(x + 40)} ${f(base - 150)} ${f(x + 18)} ${f(base - 152)} ${f(x + 20)} ${f(base - 128)}`));
  }

  // --- a laurel at the left, sprigs in the corners, grass and stones
  o.push(laurel(186, 960, 1.6, rnd));
  o.push(sprig(1640, 980, 170, -2.6, rnd, -1));
  o.push(sprig(-20, 1000, 150, -0.5, rnd, 1));
  o.push(path(tuft(620, 1000, 22, rnd, 5) + tuft(1080, 998, 20, rnd, 4) + tuft(1450, 996, 20, rnd, 5) + pebble(880, 990, 16, rnd) + pebble(1160, 984, 12, rnd) + pebble(1500, 996, 14, rnd)));

  return svg(o.join(''));
}

// ====================================================================================
// 6. THE CAVE: Plato's cave in section. Rock on both sides; on the left wall the shadows of the
// things carried along the low wall; the prisoners seated in a row facing that wall; behind them the low
// wall with its bearers and the things they hold up; behind those the fire. On the right the way up,
// steps cut in the rock, climbs to the mouth of the cave where the sun shines in.
// ====================================================================================
function cave() {
  const rnd = prng(66);
  const o = [];
  // the hollow of the cave: rock on both sides, the walls overhanging at the top as the vault closes
  const leftEdge = [[556, -40], [556, 40], [532, 120], [486, 206], [470, 290], [500, 370], [540, 450], [532, 540], [520, 640], [500, 740], [446, 816], [310, 860], [120, 876], [-40, 880]];
  const rightEdge = [[1044, -40], [1044, 40], [1068, 130], [1116, 220], [1128, 300], [1096, 380], [1062, 460], [1068, 560], [1084, 650], [1110, 740], [1170, 812], [1300, 856], [1480, 874], [1640, 880]];
  const lx = lookup([...leftEdge].map(([x, y]) => [y, x]).sort((p, q) => p[0] - q[0]));
  const rx = lookup([...rightEdge].map(([x, y]) => [y, x]).sort((p, q) => p[0] - q[0]));
  // the mouth, high on the right: an arch of daylight
  const mouth = [[1196, 336], [1184, 262], [1196, 182], [1236, 118], [1296, 82], [1366, 76], [1426, 100], [1468, 152], [1488, 230], [1484, 330], [1420, 340], [1300, 342]];
  const inMouth = (x, y) => x > 1170 && x < 1500 && y > 60 && y < 350;
  const shadowZone = (x, y) => x > 110 && x < 500 && y > 540 && y < 810;

  // --- daylight in the mouth: the sun and its rays, a far hill, two birds
  {
    let rays = '';
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU + 0.12;
      const r1 = k % 2 ? 52 : 74;
      rays += `M${xy([1336 + Math.cos(a) * 36, 196 + Math.sin(a) * 36])}L${xy([1336 + Math.cos(a) * r1, 196 + Math.sin(a) * r1])}`;
    }
    o.push(`<circle cx="1336" cy="196" r="25"/>` + path(rays));
    o.push(path(smooth([[1190, 300], [1260, 286], [1330, 294], [1410, 280], [1490, 292]]) + gull(1236, 150, 7, -4) + gull(1262, 136, 5, 5)));
  }

  // --- the rock: paper outside the hollow, the edges of the hollow, and the courses of the vault, arcs
  // round the middle of the cave that run up both walls toward the roof
  o.push(paperFill(`${smooth(leftEdge)}L-40 -40Z`) + path(smooth(leftEdge)));
  o.push(paperFill(`${smooth(rightEdge)}L1640 -40Z${smooth(mouth, { closed: true })}`).replace('/>', ' fill-rule="evenodd"/>'));
  o.push(path(smooth(rightEdge) + smooth(mouth, { closed: true })));
  {
    let d = '';
    const way = (x, y) => x > 1100 && x < 1400 && y > 330 && y < 890;
    for (let r = 380; r < 1300; r += 58 + rnd() * 26) {
      const pts = [];
      for (let a = Math.PI * 0.98; a < Math.PI * 2.02; a += 0.008) {
        const w = 1 + Math.sin(a * 7 + r) * 0.012;
        pts.push([800 + Math.cos(a) * r * w, 940 + Math.sin(a) * r * 0.96 * w]);
      }
      d += dashes(pts, rnd, {
        len: [120, 320],
        gap: [12, 40],
        every: 3,
        ok: (x, y) => y < 900 && ((x < lx(y) - 10 && !shadowZone(x, y)) || (x > rx(y) + 10 && !inMouth(x, y) && !way(x, y))),
      });
    }
    // the rim of the mouth, a second line round it
    d += dashes(curve(mouth.map(([x, y]) => [1336 + (x - 1336) * 1.14, 214 + (y - 214) * 1.14]), 10), rnd, { len: [80, 200], gap: [20, 50] });
    o.push(path(d));
  }

  // --- the way up: steps cut along a ledge, winding up the right wall into the mouth
  {
    const c = curve([[1112, 880], [1220, 846], [1318, 800], [1260, 742], [1190, 690], [1250, 630], [1340, 574], [1284, 506], [1236, 448], [1270, 390], [1300, 338]], 4);
    const lip = c.map(([x, y]) => [x, y + 12]);
    const back = c.map(([x, y]) => [x, y - 10]);
    o.push(paperFill(poly([...lip, ...[...back].reverse()], true)));
    let d = dashes(back, rnd, { len: [60, 160], gap: [10, 26], every: 3 });
    // the steps: a stair profile along the lip
    let stair = `M${xy(lip[0])}`;
    let p = lip[0];
    for (let i = 4; i < lip.length; i += 4) {
      const q = lip[i];
      if (q[1] < p[1] - 1) stair += `H${f(q[0])}V${f(q[1])}`;
      else stair += `L${xy(q)}`;
      p = q;
    }
    o.push(path(d + stair));
    // daylight falling in from the mouth along the way
    let rays = '';
    for (const [x0, y0, x1, y1] of [[1220, 344, 1150, 560], [1290, 346, 1260, 600], [1370, 346, 1400, 560], [1440, 340, 1520, 500]]) rays += dashes(curve([[x0, y0], [x1, y1]], 8), rnd, { len: [40, 90], gap: [14, 30], every: 2 });
    o.push(path(rays));
  }

  // --- the floor of the cave
  {
    o.push(path(broken((x) => 902 + Math.sin(x / 140) * 4, -40, 1640, rnd, { len: [140, 320], gap: [30, 80], step: 40, min: 30 }) + broken((x) => 952 + Math.sin(x / 170) * 3, -40, 1640, rnd, { len: [100, 260], gap: [60, 140], step: 40, min: 30, lead: -80 })));
    let pb = '';
    for (const [x, y, w] of [[60, 920, 16], [140, 980, 22], [880, 984, 18], [1200, 960, 14], [1400, 986, 24], [1540, 930, 16], [640, 994, 14]]) pb += pebble(x, y, w, rnd);
    o.push(path(pb));
  }

  // --- the fire, drawn in line: glow in broken rings, logs, tongues of flame, sparks
  const FX = 1024;
  const FY = 878;
  {
    let rings = '';
    [64, 90, 120, 154].forEach((r, k) => {
      const n = 3 + k;
      for (let i = 0; i < n; i++) {
        const a1 = Math.PI + (i / n) * Math.PI + 0.12;
        const a2 = Math.PI + ((i + 1) / n) * Math.PI - 0.12;
        const p1 = [FX + Math.cos(a1) * r, FY - 40 + Math.sin(a1) * r];
        const p2 = [FX + Math.cos(a2) * r, FY - 40 + Math.sin(a2) * r];
        if (p1[0] < rx(p1[1]) - 4 && p2[0] < rx(p2[1]) - 4) rings += `M${xy(p1)}A${f(r)} ${f(r)} 0 0 1 ${xy(p2)}`;
      }
    });
    o.push(path(rings));
    const tongue = (bx, by, w, h, lean) =>
      papered(
        smooth([[bx - w / 2, by], [bx - w * 0.56, by - h * 0.34], [bx - w * 0.12 + lean * 0.3, by - h * 0.66], [bx + lean, by - h]]) +
          smooth([[bx + lean, by - h], [bx + w * 0.28 + lean * 0.4, by - h * 0.62], [bx + w * 0.56, by - h * 0.3], [bx + w / 2, by]], { cont: true }) +
          'Z',
      );
    o.push(tongue(FX, FY, 78, 136, -8) + tongue(FX - 24, FY, 38, 74, -12) + tongue(FX + 26, FY, 40, 88, 10) + tongue(FX - 2, FY, 36, 74, 4));
    o.push(path(smooth([[FX - 10, FY - 6], [FX - 14, FY - 30], [FX - 6, FY - 52]]) + smooth([[FX + 8, FY - 8], [FX + 12, FY - 34], [FX + 4, FY - 58]])));
    o.push(papered(worn([[FX - 58, FY + 10], [FX - 52, FY - 2], [FX + 42, FY - 14], [FX + 46, FY - 2]], 4)) + papered(worn([[FX - 46, FY - 12], [FX + 54, FY + 2], [FX + 50, FY + 12], [FX - 48, FY - 2]], 4)));
    o.push(path(dots([[FX - 30, FY - 158], [FX + 20, FY - 176], [FX + 40, FY - 148], [FX - 8, FY - 198], [FX + 6, FY - 154]]) + `M${f(FX - 18)} ${f(FY - 168)}l-4 -8M${f(FX + 30)} ${f(FY - 190)}l3 -8`));
  }

  // --- the low wall, the bearers behind it holding things up on poles: a jar, a horse, a figure
  const things = {
    jar: [[0, 0], [6, -4], [10, -14], [10, -24], [6, -31], [4, -36], [5, -40], [-5, -40], [-4, -36], [-6, -31], [-10, -24], [-10, -14], [-6, -4]],
    horse: [[-16, 0], [-17, -12], [-13, -18], [6, -18], [12, -22], [16, -30], [22, -31], [24, -27], [18, -22], [16, -14], [14, 0], [11, 0], [10, -10], [-10, -10], [-12, 0]],
    statue: [[-5, 0], [-6, -14], [-4, -24], [-3, -27], [-3.5, -30], [-2.5, -33.5], [0, -35], [2.5, -33.5], [3.5, -30], [3, -27], [4, -24], [6, -14], [5, 0]],
  };
  {
    const W0 = 640;
    const W1 = 960;
    const top = 834;
    for (const [x, thing] of [[700, 'jar'], [790, 'horse'], [880, 'statue']]) {
      o.push(figure({ x, y: top + 38, s: 1.16 }, 'carry'));
      const px = x + 10.5;
      const py = top + 38 - 58 * 1.16;
      o.push(path(`M${f(px)} ${f(py + 10)}V${f(py - 44)}`));
      const t = place({ x: px, y: py - 44, s: 1.15 });
      o.push(thing === 'horse' ? papered(poly(T(t, things[thing]), true)) : papered(smooth(T(t, things[thing]), { closed: true })));
      if (thing === 'jar') o.push(path(smooth(T(t, [[5, -35], [11, -35], [10, -28]])) + smooth(T(t, [[-5, -35], [-11, -35], [-10, -28]]))));
    }
    o.push(papered(box(W0, top, W1 - W0, 54)));
    let d = `M${W0} ${top + 18}H${W1}M${W0} ${top + 36}H${W1}`;
    for (let r = 0; r < 3; r++) for (let x = W0 + (r % 2) * 22 + 30 + rnd() * 10; x < W1 - 10; x += 44 + rnd() * 16) d += `M${f(x)} ${f(top + r * 18)}v18`;
    o.push(path(d));
  }

  // --- the prisoners: seated in a row on the floor, facing the left wall, a chain at their ankles
  {
    for (const x of [250, 340, 430, 520]) o.push(figure({ x, y: 952, s: 1.5 }, 'sit'));
    let chain = '';
    for (let x = 214; x < 520; x += 10) chain += `M${f(x)} ${f(952 + Math.sin(x / 18))}a5 2.8 0 1 0 10 0a5 2.8 0 1 0 -10 0`;
    o.push(path(chain));
  }

  // --- the shadows on the left wall: the jar, the horse and the figure, large and hatched
  {
    const shadow = (pts, closedSmooth = true) => path(closedSmooth ? smooth(pts, { closed: true }) : poly(pts, true)) + path(hatch(pts, 8, 58, { inset: 2 }));
    o.push(shadow(T(place({ x: 196, y: 800, s: 3.6 }), things.jar)));
    o.push(shadow(T(place({ x: 330, y: 742, s: 3.4 }), things.horse), false));
    const ts = place({ x: 452, y: 690, s: 3.2 });
    o.push(shadow(T(ts, things.statue)) + path(`M${xy(ts([4, -24]))}L${xy(ts([10, -36]))}`));
  }

  return svg(o.join(''));
}

// ====================================================================================
// 7. THE NIGHT SKY over a ridge: the Milky Way rising from the ridge up the left side as long flowing
// lines full of stars, Orion beside it, the Pleiades; on the right the Bear, the crescent moon and
// Arcturus; on the ridge, cypresses and a small figure looking up.
// ====================================================================================
function night() {
  const rnd = prng(77);
  const o = [];

  // --- the Milky Way: a band of flowing lines from the ridge up to the top-left corner, thick with stars,
  // a dark rift down its middle
  const spine = curve([[500, 780], [470, 640], [410, 500], [330, 360], [230, 220], [140, 90], [80, -40]], 10);
  const half = (y) => 54 + (780 - y) * 0.09;
  const across = (k) =>
    spine.map(([x, y], i) => {
      const q = spine[Math.min(spine.length - 1, i + 1)];
      const p0 = spine[Math.max(0, i - 1)];
      const dx = q[0] - p0[0];
      const dy = q[1] - p0[1];
      const l = Math.hypot(dx, dy) || 1;
      const off = k * half(y) + Math.sin(i / 5 + k * 3) * 5;
      return [x - (dy / l) * off, y + (dx / l) * off];
    });

  {
    let d = '';
    for (const k of [-1.15, -0.92, -0.72, -0.54, -0.38, -0.08, 0.06, 0.4, 0.56, 0.74, 0.94, 1.18]) d += dashes(across(k), rnd, { len: [50, 240], gap: [14, 70], every: 3, ok: (x, y) => y < 772 && !open(x, y) });
    o.push(path(d));
    // stars thick in the band
    const pts = [];
    for (let i = 0; i < 190; i++) {
      const j = Math.floor(rnd() * spine.length);
      const [x, y] = across((rnd() - 0.5) * 2.6)[j];
      if (y < 760 && x > -30 && !open(x, y)) pts.push([x + (rnd() - 0.5) * 8, y + (rnd() - 0.5) * 8]);
    }
    o.push(path(dots(pts)));
  }

  // --- stars over the sides: points, small crosses and a few four-pointed stars
  {
    const pts = [];
    for (let i = 0; i < 170; i++) {
      const x = rnd() * 1640 - 20;
      const y = rnd() * 740;
      if (open(x, y) || y > 690 + (x > 1300 ? -20 : 40) || (x < 560 && Math.abs(x - (500 - (780 - y) * 0.6)) < 90)) continue;
      pts.push([x, y]);
    }
    o.push(path(dots(pts)));
    let cr = '';
    for (const [x, y] of [[60, 520], [520, 150], [1100, 520], [1500, 600], [1580, 120], [280, 640], [1180, 40], [700, 690], [920, 700], [1250, 640], [340, 40]]) cr += `M${f(x - 4)} ${f(y)}h8M${f(x)} ${f(y - 4)}v8`;
    o.push(path(cr));
    let sp = '';
    for (const [x, y, k] of [[1560, 520, 0.55], [1110, 600, 0.5], [40, 300, 0.55], [500, 40, 0.5], [1240, 420, 0.5], [380, 560, 0.45]]) sp += star4(x, y, k);
    o.push(papered(sp));
  }
  const bright = (x, y, s = 0.9) => papered(star4(x, y, s));
  // the Pleiades
  o.push(path(dots([[452, 168], [462, 160], [470, 172], [478, 164], [466, 182], [484, 176], [458, 176]])));
  // Orion, left of the band: shoulders, belt, feet, the sword hanging from the belt
  {
    const sc = ([x, y]) => [190 + (x - 190) * 1.35, 470 + (y - 480) * 1.35];
    const S = Object.fromEntries(Object.entries({ bet: [130, 404], bel: [236, 426], b1: [164, 498], b2: [184, 494], b3: [204, 490], sai: [150, 590], rig: [252, 578], hd: [178, 372] }).map(([k, v]) => [k, sc(v)]));
    const ln = (a, b) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy);
      const g = 9 / l;
      return `M${xy([a[0] + dx * g, a[1] + dy * g])}L${xy([b[0] - dx * g, b[1] - dy * g])}`;
    };
    o.push(path(ln(S.hd, S.bet) + ln(S.hd, S.bel) + ln(S.bet, S.b1) + ln(S.bel, S.b3) + ln(S.b1, S.sai) + ln(S.b3, S.rig)));
    o.push(bright(...S.bet, 0.95) + bright(...S.rig, 1) + path(dots([S.bel, S.b1, S.b2, S.b3, S.sai, S.hd, sc([186, 520]), sc([188, 534]), sc([190, 548])])));
  }
  // the Bear on the right, its tail curving away from the middle
  {
    const S = [[1092, 140], [1084, 214], [1162, 236], [1176, 166], [1252, 152], [1320, 164], [1394, 210]].map(([x, y]) => [1090 + (x - 1084) * 1.3, 120 + (y - 140) * 1.3]);
    const ln = (a, b) => {
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy);
      const g = 10 / l;
      return `M${xy([a[0] + dx * g, a[1] + dy * g])}L${xy([b[0] - dx * g, b[1] - dy * g])}`;
    };
    o.push(path(ln(S[0], S[1]) + ln(S[1], S[2]) + ln(S[2], S[3]) + ln(S[3], S[0]) + ln(S[3], S[4]) + ln(S[4], S[5]) + ln(S[5], S[6])));
    o.push(bright(...S[0], 0.9) + bright(...S[6], 0.8) + path(dots([S[1], S[2], S[3], S[4], S[5], [S[5][0] + 10, S[5][1] - 16]])));
    // Arcturus, following the arc of the tail
    o.push(bright(1500, 352, 1.15));
  }
  // the crescent moon
  o.push(papered(moon(1400, 520, 56)) + wash(moon(1400, 520, 50)));

  // --- the ridge, a lower slope in front of it, cypresses, the figure looking up
  const ridge = [[-40, 704], [100, 694], [250, 718], [420, 766], [600, 796], [800, 794], [1000, 780], [1150, 762], [1300, 734], [1450, 706], [1640, 690]];
  const rY = lookup(ridge);
  o.push(hill(ridge, rnd, { lines: [[22, -40, 1640], [46, -40, 1640, 30], [74, -40, 1640, 10], [108, -40, 1640, 60]], len: [120, 300], gap: [30, 80] }));
  o.push(cypress(150, rY(150) + 4, 140, 32) + cypress(196, rY(196) + 4, 96, 24) + cypress(1520, rY(1520) + 4, 120, 28));
  o.push(figure({ x: 1150, y: rY(1150) + 1, s: 1.5 }, 'gaze'));
  // shrubs along the ridge
  {
    let d = '';
    for (const x of [320, 380, 700, 760, 940, 1240, 1290, 1380, 1600]) {
      const y = rY(x) + 2;
      d += `M${f(x - 14)} ${f(y)}${scallops([[x - 14, y], [x - 6, y - 9], [x + 5, y - 10], [x + 14, y]], 0.6)}`;
    }
    o.push(papered(d));
  }
  // the near slope with its path, coming up from the cave
  const near = [[-40, 884], [200, 872], [420, 892], [640, 916], [860, 912], [1080, 896], [1300, 880], [1500, 872], [1640, 876]];
  o.push(hill(near, rnd, { lines: [[26, -40, 1640], [60, -40, 1640, 40]], len: [140, 340], gap: [40, 110] }));
  {
    const p = curve([[1240, 1010], [1210, 960], [1240, 916], [1196, 860], [1160, 806], [1152, rY(1152) + 2]], 6);
    o.push(path(dashes(p.map(([x, y]) => [x - 5 - (y - 760) * 0.05, y]), rnd, { len: [60, 140], gap: [8, 20] }) + dashes(p.map(([x, y]) => [x + 5 + (y - 760) * 0.05, y]), rnd, { len: [60, 140], gap: [8, 20] })));
  }
  o.push(path(tuft(60, 1000, 24, rnd, 5) + tuft(330, 994, 20, rnd, 4) + tuft(780, 1000, 22, rnd, 5) + tuft(1000, 990, 18, rnd) + tuft(1440, 996, 24, rnd, 5) + tuft(1600, 984, 18, rnd)));

  return svg(o.join(''));
}

// ====================================================================================
// 8. ELEUSIS: Demeter's sheaf stands on the left, bound at the waist, a sickle against it and poppies
// in it; wheat and poppies fill the foot; a procession of torches walks the road through the fields to
// the sanctuary gate on the right; the bay and Salamis lie behind; the moon of the night before.
// ====================================================================================
// an ear of wheat on its stalk: a narrow head of grains in chevrons, a few awns
function ear(x, y, len, ang, rnd) {
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const nx = -dy;
  const ny = dx;
  const at = (u, v) => [x + dx * u + nx * v, y + dy * u + ny * v];
  const L = len * 0.36;
  let d = smooth([at(0, 0), at(L * 0.5, 0.8), at(L, 0)]);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const u = (i / n) * L * 0.9 + L * 0.06;
    d += `M${xy(at(u + 6, -3.6))}L${xy(at(u, 0))}L${xy(at(u + 6, 3.6))}`;
  }
  d += `M${xy(at(L, 0))}L${xy(at(L + 16, -1))}M${xy(at(L * 0.8, -3))}L${xy(at(L + 10, -8))}M${xy(at(L * 0.8, 3))}L${xy(at(L + 10, 8))}`;
  return d;
}
// a poppy: two petals round a dark seed head, on a bending stem
function poppy(x, y, h, rnd, bend = 6) {
  const top = [x + bend, y - h];
  const stem = `M${f(x)} ${f(y)}Q${f(x - bend * 0.4)} ${f(y - h * 0.5)} ${xy(top)}`;
  const t = place({ x: top[0], y: top[1], s: 1.5, rot: bend * 2 });
  const cup = smooth(T(t, [[-1, 1], [-9, -2], [-11, -10], [-6, -16], [0, -13], [6, -16], [11, -10], [9, -2], [1, 1]]));
  return path(stem) + papered(cup + 'Z') + path(`M${xy(t([0, -13]))}L${xy(t([0, -4]))}`) + ink(circ(...t([0, -14]), 3.4));
}
function eleusis() {
  const rnd = prng(88);
  const o = [];
  const HZ = 660;

  // --- the moon and a few stars still in the sky
  o.push(papered(moon(1450, 210, 34)));
  o.push(path(dots([[1260, 120], [1340, 70], [1530, 330], [1580, 90], [80, 120], [200, 60], [380, 160], [470, 90], [140, 280]])) + papered(star4(320, 230, 0.7)) + papered(star4(1180, 220, 0.65)));

  // --- the bay behind, with Salamis lying across it, and the hills
  o.push(hill([[-40, 540], [60, 520], [160, 524], [270, 556], [380, 600], [480, 630], [556, 648], [640, HZ]], rnd, { bottom: HZ, lines: [[20, -40, 500], [44, -40, 420, 30]] }));
  o.push(paperFill(`M560 ${HZ}H1100V760H560Z`) + path(`M560 ${HZ}H1100`) + path(calm(rnd, HZ + 6, 700, (x) => x > 560 && x < 1080, { step: 7, grow: 1.2, len: [40, 120], gap: [24, 60] })));
  o.push(hill([[700, HZ], [760, 652], [840, 646], [920, 648], [980, 656], [1010, HZ]], rnd, { bottom: HZ, lines: [] }));
  // the hill of the sanctuary behind the gate
  o.push(hill([[1040, 676], [1100, 640], [1160, 600], [1240, 566], [1330, 548], [1430, 546], [1530, 560], [1640, 576]], rnd, { lines: [[18, 1100, 1640], [40, 1180, 1640, 30]] }));

  // --- the fields: long furrows following the land, a road through them to the gate
  const road = curve([[-40, 900], [180, 846], [420, 806], [660, 780], [900, 760], [1100, 744], [1250, 730]], 8);
  o.push(paperFill(`M-40 700H1640V1010H-40Z`));
  {
    let d = '';
    for (let r = 0; r < 8; r++) {
      const y0 = 708 + r * (10 + r * 2.4);
      d += broken((x) => y0 + Math.sin(x / 210 + r) * 3 - (x - 800) * 0.01, -40, 1640, rnd, {
        len: [140, 360],
        gap: [30, 90],
        step: 40,
        min: 30,
        lead: -rnd() * 160,
        ok: (x, y) => !road.some((p) => Math.abs(p[0] - x) < 30 && Math.abs(p[1] - y) < 12) && !(x > 1090 && x < 1500 && y < 740) && !(x > 60 && x < 440),
      });
    }
    // distant ears along the far furrows: small ticks
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 1640;
      const y = 712 + rnd() * 70;
      if ((x > 1090 && x < 1500) || road.some((p) => Math.abs(p[0] - x) < 40 && Math.abs(p[1] - y) < 18) || (x > 60 && x < 440)) continue;
      d += `M${f(x)} ${f(y)}l1.5 -7`;
    }
    o.push(path(d));
    const l = road.map(([x, y]) => [x, y - 6 - (y - 730) * 0.12]);
    const r2 = road.map(([x, y]) => [x, y + 6 + (y - 730) * 0.12]);
    o.push(path(dashes(l, rnd, { len: [100, 260], gap: [10, 30] }) + dashes(r2, rnd, { len: [100, 260], gap: [10, 30] })));
  }

  // --- the gate of the sanctuary: steps, six columns, the frieze with its triglyphs, the pediment;
  // the enclosure wall running off on both sides
  {
    const x0 = 1100;
    const x1 = 1480;
    const base = 706;
    o.push(papered(box(1040, 650, 60, 56)) + papered(box(1480, 646, 160, 60)));
    o.push(path(`M1040 668H1100M1040 686H1100M1480 666H1640M1480 686H1640M1062 650v18M1078 668v18M1520 646v20M1560 666v20M1600 646v20`));
    o.push(papered(box(x0 - 8, base, x1 - x0 + 16, 10)) + papered(box(x0 - 16, base + 10, x1 - x0 + 32, 10)));
    const xs = [1130, 1190, 1250, 1330, 1390, 1450];
    for (const x of xs) o.push(doric(x, base, 150, 26, rnd));
    const top = base - 150 - 14;
    o.push(papered(box(x0 + 4, top - 20, x1 - x0 - 8, 20)) + papered(box(x0 + 4, top - 42, x1 - x0 - 8, 22)) + papered(box(x0 - 4, top - 48, x1 - x0 + 8, 6)));
    let tg = '';
    for (let x = x0 + 18; x < x1 - 10; x += 30) tg += `M${f(x - 3)} ${f(top - 40)}v18M${f(x + 3)} ${f(top - 40)}v18`;
    o.push(path(tg));
    o.push(papered(`M${f(x0 - 6)} ${f(top - 48)}L${f((x0 + x1) / 2)} ${f(top - 102)}L${f(x1 + 6)} ${f(top - 48)}Z`) + path(`M${f(x0 + 22)} ${f(top - 54)}L${f((x0 + x1) / 2)} ${f(top - 92)}L${f(x1 - 22)} ${f(top - 54)}Z`));
    // a wheat sheaf carved in the middle of the pediment
    o.push(path(ear((x0 + x1) / 2, top - 58, 40, -Math.PI / 2, rnd) + ear((x0 + x1) / 2 - 2, top - 58, 36, -Math.PI / 2 - 0.5, rnd) + ear((x0 + x1) / 2 + 2, top - 58, 36, -Math.PI / 2 + 0.5, rnd)));
    o.push(cypress(1060, 650, 90, 22) + cypress(1530, 646, 100, 24));
  }

  // --- the procession of torches along the road, walking to the gate
  {
    const walkers = [[330, 824, 1.0], [400, 812, 0.96], [470, 802, 0.92], [540, 793, 0.88], [610, 786, 0.84], [700, 776, 0.8], [780, 770, 0.76], [860, 764, 0.72], [940, 758, 0.68], [1010, 752, 0.64]];
    for (const [x, y, s] of walkers) o.push(figure({ x, y, s }, 'torch'));
  }

  // --- the near field: wheat bending in the wind, poppies among it
  {
    let d = '';
    let stalks = '';
    for (let i = 0; i < 34; i++) {
      const x = 440 + rnd() * 1200;
      if (x > 1600) continue;
      const y = 1004 + rnd() * 10;
      const h = 90 + rnd() * 80;
      const lean = 0.25 + rnd() * 0.25;
      const tip = [x + h * lean * 0.6, y - h];
      stalks += `M${f(x)} ${f(y)}Q${f(x + h * lean * 0.1)} ${f(y - h * 0.6)} ${xy(tip)}`;
      d += ear(tip[0], tip[1], 56 + rnd() * 16, -Math.PI / 2 + lean + 0.1, rnd);
      if (i % 3 === 0) stalks += `M${f(x + 2)} ${f(y - h * 0.4)}q10 -6 18 -20`;
    }
    o.push(path(stalks) + path(d));
    for (const [x, h, b] of [[560, 110, 8], [700, 140, 6], [830, 96, 10], [990, 130, -6], [1120, 104, 8], [1270, 150, 6], [1400, 112, -8], [1520, 136, 6], [1590, 90, 8], [660, 70, 4], [1340, 80, 6]]) o.push(poppy(x, 1006, h, rnd, b));
  }

  // --- Demeter's sheaf: stalks fanning from a tight waist bound with a twisted band, ears at the top,
  // two poppies in it and a sickle leaning against it
  {
    const cx = 250;
    const base = 990;
    const waist = 800;
    let stalks = '';
    let ears = '';
    const n = 17;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1) - 0.5;
      const bx = cx + u * 150;
      const wx = cx + u * 44;
      const tx = cx + u * 250 + (rnd() - 0.5) * 10;
      const ty = 560 + Math.abs(u) * 130 + (rnd() - 0.5) * 16;
      stalks += smooth([[bx, base], [wx, waist], [cx + u * 110, 680], [tx, ty]]);
      ears += ear(tx, ty, 60 + rnd() * 14, -Math.PI / 2 + u * 1.3, rnd);
    }
    o.push(paperFill(poly([[cx - 80, base], [cx - 24, waist], [cx - 130, 590], [cx + 130, 590], [cx + 24, waist], [cx + 80, base]], true)));
    o.push(path(stalks) + path(ears));
    o.push(papered(`M${f(cx - 30)} ${f(waist - 12)}Q${f(cx)} ${f(waist - 4)} ${f(cx + 30)} ${f(waist - 12)}V${f(waist + 12)}Q${f(cx)} ${f(waist + 20)} ${f(cx - 30)} ${f(waist + 12)}Z`));
    let tw = '';
    for (let k = -3; k <= 3; k++) tw += `M${f(cx + k * 8 - 4)} ${f(waist + 13 + Math.abs(k) * -0.6)}L${f(cx + k * 8 + 4)} ${f(waist - 11 + Math.abs(k) * -0.6)}`;
    o.push(path(tw));
    o.push(poppy(cx - 40, waist - 30, 230, rnd, -14) + poppy(cx + 30, waist - 30, 200, rnd, 16));
    // the sickle, leaning against the sheaf
    o.push(papered(`M${f(cx + 96)} ${f(base)}L${f(cx + 78)} ${f(base - 70)}L${f(cx + 86)} ${f(base - 72)}L${f(cx + 104)} ${f(base - 2)}Z`) + papered(`M${f(cx + 82)} ${f(base - 70)}C${f(cx + 70)} ${f(base - 150)} ${f(cx + 150)} ${f(base - 180)} ${f(cx + 176)} ${f(base - 120)}C${f(cx + 150)} ${f(base - 160)} ${f(cx + 96)} ${f(base - 140)} ${f(cx + 90)} ${f(base - 72)}Z`));
  }
  o.push(path(tuft(40, 1002, 24, rnd, 5) + tuft(120, 996, 18, rnd) + tuft(400, 1000, 20, rnd, 5)));

  return svg(o.join(''));
}

// ====================================================================================
// 9. ITHACA, HOME: the island harbour at evening. The sun going down in the mouth of the harbour
// between two headlands; on the left the house of two floors with its tiled roof, smoke from the
// chimney, Penelope's loom in the upper window and a lamp lit in the other, Argos lying at the door,
// the old olive beside it; on the right the hills of the island with a few houses; in the middle the
// boat home at its mooring, its sail furled; a pebbled shore along the foot.
// ====================================================================================
// Argos, lying with his head up, facing right; about 96 long at s 1
function dog(pl) {
  const t = place(pl);
  const body = [[-36, 0], [-38, -8], [-33, -16], [-20, -19], [-2, -19], [10, -20], [15, -24], [18, -31], [22, -36], [27, -37.5], [33, -35], [38, -32], [37.5, -28.5], [31, -27.5], [27, -24], [26, -16], [28, -8], [40, -4.5], [41, 0]];
  return (
    path(smooth(T(t, [[-35, -3], [-48, -1], [-56, -6]]))) +
    papered(smooth(T(t, body)) + 'Z') +
    path(smooth(T(t, [[21, -35], [17, -30], [18.5, -24]])) + smooth(T(t, [[-26, -3], [-18, -12], [-8, -4]])) + `M${xy(t([27, -4]))}L${xy(t([40, -3]))}` + dots([t([29.5, -33])]))
  );
}
// a stone house with a tiled roof (Ionian); base at y; returns its outline and the window boxes
function tiled(x, base, w, h, rnd, { rise = 34, over = 8 } = {}) {
  const top = base - h;
  let s = papered(worn([[x, base], [x, top], [x + w, top], [x + w, base]], 1.4));
  const roof = [[x - over, top + 2], [x + w * 0.16, top - rise], [x + w * 0.84, top - rise], [x + w + over, top + 2]];
  s += papered(poly(roof, true));
  let d = '';
  const rows = Math.max(2, Math.round(rise / 11));
  for (let r = 1; r < rows; r++) {
    const u = r / rows;
    const y = top + 2 - (rise + 2) * u;
    const xa = x - over + (w * 0.16 + over) * u;
    const xb = x + w + over - (w * 0.16 + over) * u;
    let p = `M${f(xa)} ${f(y)}`;
    const k = Math.max(2, Math.round((xb - xa) / 13));
    const pts = Array.from({ length: k + 1 }, (_, i) => [xa + ((xb - xa) * i) / k, y]);
    p += scallops(pts, 0.6, 0);
    d += p;
  }
  return s + path(d);
}
function ithaca() {
  const rnd = prng(99);
  const o = [];
  const HZ = 688;
  const SUNX = 880;

  // --- the evening star, a streak of cloud, gulls going home
  o.push(papered(star4(1310, 214, 1.1)) + path(dots([[1420, 150], [1520, 260], [1200, 120]])));
  o.push(path(streak(1180, 1420, 330) + streak(1240, 1360, 342, 0.4) + streak(60, 300, 230) + streak(120, 240, 242) + gull(1130, 420, 8, -4) + gull(1160, 404, 6, 5) + gull(400, 330, 7, 4)));

  // --- the sun going down in the mouth of the harbour, the sea there, the headlands either side
  o.push(sun(SUNX, HZ - 6, 22, [34, 48], HZ + 6, rnd));
  o.push(paperFill(`M480 ${HZ}H1200V1010H480Z`) + path(`M560 ${HZ}H1120`));
  const hillR = [[880, HZ + 4], [960, 682], [1040, 660], [1120, 612], [1210, 540], [1320, 466], [1430, 414], [1530, 390], [1640, 384]];
  const hillL = [[-40, 420], [60, 400], [180, 426], [300, 476], [420, 552], [520, 622], [600, 664], [680, 686], [760, 696]];
  const yR = lookup(hillR);
  o.push(hill(hillR, rnd, { lines: [[22, 940, 1640], [48, 1000, 1640, 30], [78, 1060, 1640, 10], [112, 1100, 1640, 50], [150, 1160, 1640, 20], [190, 1220, 1640]] }));
  // houses, a cypress and olives on the island's slope; one window lit
  for (const [x, d, s] of [[1250, 40, 0.8], [1460, 30, 0.9], [1560, 60, 0.9], [1180, 70, 0.7], [1380, 92, 1], [1530, 150, 1.1]]) o.push(olive(x, yR(x) + d, s, rnd));
  o.push(cypress(1600, yR(1600) + 110, 96, 22));
  o.push(tiled(1300, yR(1300) + 74, 70, 40, rnd, { rise: 22, over: 5 }) + path(box(1316, yR(1300) + 50, 10, 13)));
  o.push(tiled(1410, yR(1410) + 130, 84, 46, rnd, { rise: 26, over: 6 }) + wash(box(1428, yR(1410) + 100, 12, 15)) + path(box(1428, yR(1410) + 100, 12, 15) + arched(1468, yR(1410) + 106, 12, 24)));
  o.push(hill(hillL, rnd, { lines: [[24, -40, 700], [50, -40, 640, 30], [80, -40, 560, 10], [114, -40, 480, 40]] }));

  // --- the harbour: the sun's path, calm water, the boat home with its sail furled on the yard
  const B = { x: 690, y: 884, L: 260 };
  const inBoat = (x, y) => x > B.x - 16 && x < B.x + B.L + 16 && y > B.y - 50 && y < B.y + 24;
  o.push(path(glitter(SUNX, HZ + 4, 860, rnd, { w0: 10, grow: 0.34, ok: (x, y) => !inBoat(x, y) })));
  o.push(path(calm(rnd, HZ + 6, 920, (x, y) => !inBoat(x, y) && Math.abs(x - SUNX) > 20 + (y - HZ) * 0.38 && x > 520 && y > lookup(hillL)(x) + 8 && y > yR(x) + 8, { step: 7.4, grow: 1.2 })));
  o.push(path(reflection(B.x + 10, B.x + B.L - 10, B.y, rnd)));
  {
    const h = hull({ x: B.x, y: B.y }, B.L, rnd);
    const mx = B.x + B.L * 0.56;
    const deck = B.y + h.deck(0.56);
    const mTop = 680;
    o.push(path(`M${f(mx)} ${f(deck)}L${f(mx + 0.8)} ${f(mTop)}`) + papered(poly([[mx + 0.8, mTop], [mx + 24, mTop + 4], [mx + 0.8, mTop + 9]], true)));
    // the yard lowered along the boom, the sail furled on it in a fat roll tied at intervals
    const y0 = deck - 22;
    o.push(papered(`M${f(mx - 4)} ${f(y0 - 6)}Q${f(mx - 70)} ${f(y0 - 12)} ${f(B.x + 40)} ${f(y0 - 4)}Q${f(B.x + 30)} ${f(y0 + 4)} ${f(B.x + 42)} ${f(y0 + 8)}Q${f(mx - 70)} ${f(y0 + 6)} ${f(mx - 4)} ${f(y0 + 6)}Z`));
    let ties = '';
    for (let k = 1; k <= 5; k++) {
      const x = mx - 6 - k * ((mx - B.x - 46) / 6);
      ties += `M${f(x)} ${f(y0 - 9)}l-3 15`;
    }
    o.push(path(ties));
    o.push(h.d);
  }
  // the mooring: a stone quay along the shore below the house, a bollard and the ropes
  {
    const q = (x) => 922 + Math.sin(x / 90) * 1.2;
    o.push(papered(`${smooth(sample(q, 480, 1000, 40))}L1010 942L470 946Z`) + path(`M520 ${f(q(520) + 0.5)}v20M600 ${f(q(600))}v20M690 ${f(q(690))}v20M770 ${f(q(770))}v20M860 ${f(q(860))}v20M940 ${f(q(940))}v20`));
    o.push(path(rope([B.x + 8, B.y - 30], [640, 914], 10) + rope([B.x + B.L + 2, B.y - 44], [960, 914], 12)) + bollard(640, 922) + bollard(960, 922));
  }

  // --- the old olive beside the house
  o.push(oldOlive(118, 900, 1.68, rnd, { flip: true }));

  // --- the house: two floors, a tiled roof, the chimney and its smoke, the loom in the upper window,
  // a lamp lit in the other, the door, and Argos lying before it
  {
    const x = 262;
    const w = 268;
    const base = 900;
    const h = 290;
    const top = base - h;
    // the smoke first, behind the chimney
    o.push(path(smooth([[480, 552], [474, 520], [488, 490], [470, 456], [480, 420], [460, 384]]) + smooth([[470, 452], [452, 430], [446, 404]])));
    o.push(papered(box(468, 548, 20, 40)) + papered(box(464, 544, 28, 6)));
    o.push(tiled(x, base, w, h, rnd, { rise: 56, over: 12 }));
    // stone courses and the floor line
    o.push(path(`M${f(x)} ${f(base - 140)}H${f(x + w)}` + broken((xx) => base - 70, x + 6, x + w - 6, rnd, { len: [40, 90], gap: [16, 40], step: 20, min: 16 }) + broken((xx) => base - 210, x + 6, x + w - 6, rnd, { len: [40, 90], gap: [16, 40], step: 20, min: 16 })));
    // Penelope's loom in the upper window: two posts, the beam, the warp hanging in threads with
    // weights at their feet, the woven web along the top with a meander in it, the shutters open
    {
      const wx = x + 34;
      const wy = top + 20;
      const ww = 110;
      const wh = 108;
      o.push(papered(box(wx - 30, wy, 28, wh)) + papered(box(wx + ww + 2, wy, 28, wh)) + path(`M${f(wx - 24)} ${f(wy + wh * 0.33)}h16M${f(wx - 24)} ${f(wy + wh * 0.66)}h16M${f(wx + ww + 8)} ${f(wy + wh * 0.33)}h16M${f(wx + ww + 8)} ${f(wy + wh * 0.66)}h16`));
      o.push(papered(box(wx, wy, ww, wh)));
      o.push(wash(box(wx + 4, wy + 4, ww - 8, wh - 8)));
      const lx0 = wx + 16;
      const lx1 = wx + ww - 16;
      let d = `M${f(lx0)} ${f(wy + 4)}L${f(lx0 + 4)} ${f(wy + wh - 4)}M${f(lx1)} ${f(wy + 4)}L${f(lx1 - 4)} ${f(wy + wh - 4)}M${f(lx0 - 8)} ${f(wy + 14)}H${f(lx1 + 8)}`;
      const web = wy + 40;
      d += `M${f(lx0 + 2)} ${f(web)}H${f(lx1 - 2)}`;
      // the meander in the web
      let m = `M${f(lx0 + 4)} ${f(wy + 34)}`;
      for (let xx = lx0 + 4; xx < lx1 - 12; xx += 10) m += `v-8h5v8h5`;
      d += m;
      // warp threads and their weights
      let wts = '';
      for (let k = 0; k <= 9; k++) {
        const xx = lx0 + 5 + ((lx1 - lx0 - 10) * k) / 9;
        const yEnd = wy + wh - 14 - (k % 2) * 6;
        d += `M${f(xx)} ${f(web)}L${f(xx + (k % 2 ? 1 : -1))} ${f(yEnd)}`;
        wts += circ(xx + (k % 2 ? 1 : -1), yEnd + 3.4, 3.2);
      }
      o.push(path(d) + papered(wts));
    }
    // the lamp lit in the other window: the light, and short rays out from it
    {
      const wx = x + 196;
      const wy = top + 36;
      o.push(papered(box(wx, wy, 44, 56)) + wash(box(wx + 4, wy + 4, 36, 48)) + path(`M${f(wx + 22)} ${f(wy)}V${f(wy + 56)}M${f(wx)} ${f(wy + 28)}H${f(wx + 44)}`));
      let r = '';
      for (const [a, l] of [[-150, 18], [-120, 14], [-60, 14], [-30, 18], [0, 14], [180, 14]]) {
        const ang = (a * Math.PI) / 180;
        const c = [wx + 22, wy + 28];
        const r0 = 36;
        r += `M${xy([c[0] + Math.cos(ang) * r0, c[1] + Math.sin(ang) * r0 * 0.9])}L${xy([c[0] + Math.cos(ang) * (r0 + l), c[1] + Math.sin(ang) * (r0 + l) * 0.9])}`;
      }
      o.push(path(r));
    }
    // the ground floor: the door with its step, a small window, a bench
    o.push(papered(arched(x + 124, base - 104, 52, 104)) + path(`M${f(x + 150)} ${f(base - 78)}V${f(base)}` + dots([[x + 144, base - 50], [x + 156, base - 50]])));
    o.push(papered(box(x + 112, base, 76, 8)));
    o.push(papered(box(x + 30, base - 112, 40, 46)) + path(`M${f(x + 50)} ${f(base - 112)}V${f(base - 66)}`));
    o.push(papered(box(x + 212, base - 34, 50, 7)) + path(`M${f(x + 218)} ${f(base - 27)}V${f(base)}M${f(x + 256)} ${f(base - 27)}V${f(base)}`));
  }

  // --- the yard and the pebbled shore along the foot
  {
    o.push(papered(`M-40 908Q300 900 470 914L1010 946Q1300 940 1640 936V1010H-40Z`));
    o.push(path(smooth([[-40, 908], [300, 900], [470, 914]]) + smooth([[1010, 946], [1300, 940], [1640, 936]])));
    let pb = '';
    for (let i = 0; i < 34; i++) {
      const x = 1000 + rnd() * 640;
      const y = 956 + rnd() * 48;
      pb += pebble(x, y, 8 + (y - 950) * 0.3 + rnd() * 6, rnd);
    }
    for (let i = 0; i < 12; i++) pb += pebble(20 + rnd() * 940, 930 + rnd() * 70, 6 + rnd() * 10, rnd);
    o.push(path(pb));
    o.push(path(tuft(30, 1002, 22, rnd, 5) + tuft(220, 960, 18, rnd) + tuft(600, 994, 20, rnd, 5) + tuft(940, 1000, 18, rnd) + tuft(1060, 950, 16, rnd)));
    // Argos at the door, lying on the step's end, looking out to the harbour
    o.push(dog({ x: 506, y: 912, s: 1.45 }));
    // the path from the door down to the quay
    o.push(path(smooth([[380, 920], [420, 950], [500, 970], [560, 1000]]) + smooth([[440, 916], [500, 940], [580, 958], [650, 990]])));
  }

  return svg(o.join(''));
}

const drawings = [
  ['journey-1-departure', departure],
  ['journey-2-sea', openSea],
  ['journey-3-olives', olives],
  ['journey-4-mountain', mountain],
  ['journey-5-delphi', delphi],
  ['journey-6-cave', cave],
  ['journey-7-night', night],
  ['journey-8-eleusis', eleusis],
  ['journey-9-ithaca', ithaca],
];
const only = process.argv[2];
for (const [name, fn] of drawings) {
  if (only && !name.includes(only)) continue;
  const body = fn();
  writeFileSync(resolve(outDir, `${name}.svg`), body);
  console.log(name, `${(body.length / 1024).toFixed(1)} KB`);
}
