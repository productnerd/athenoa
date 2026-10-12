// Generates the line-art layers of the not-found scene: a calm Aegean paper theatre.
// Run:  node scripts/illustrations/sea-build.mjs
// Writes src/assets/illustrations/sea-*.svg. Every drawing is seeded, so a rerun gives the same files.
//
// One unit is the same size in every file (the component shows each at width = viewBox width * --u),
// so the layers keep their proportions. The three wave bands are one 1600-unit tile drawn once and
// repeated four times with <use>: the component slides each band by exactly one tile, which makes
// the loop seamless, and four tiles keep a wide, low window covered while it slides.
//
// Colour: strokes follow currentColor. Washes use the palette custom properties with a hex fallback.
// Lines that lie on a blue wash are printed light, as everywhere else in the picture.
import { writeFileSync } from 'node:fs';

const OUT = new URL('../../src/assets/illustrations/', import.meta.url);
const PAPER = 'var(--paper, #f2e9d3)';
const WHITE = 'var(--creme-light, #f9f3e3)';
const LIGHT = 'var(--blue-light, #b3c0f3)';
const BLUE = 'var(--blue, #0b1c8c)';
const DEEP = 'var(--blue-deep, #071260)';

const TILE = 1600;

/* ---------- helpers ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const n1 = (v) => String(Math.round(v * 10) / 10);
const pt = (p) => `${n1(p[0])} ${n1(p[1])}`;

/** Catmull-Rom through the points, written as cubic Béziers. */
function smooth(pts) {
  const n = pts.length;
  const get = (i) => pts[Math.max(0, Math.min(n - 1, i))];
  let d = `M${pt(pts[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}

const svg = (w, h, body, sw = 2.4) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;

function save(name, content) {
  writeFileSync(new URL(`sea-${name}.svg`, OUT), content);
  console.log(`sea-${name}.svg`, `${(content.length / 1024).toFixed(1)} KB`);
}

/* ---------- water ----------
   A wave line is a list of extrema (crest, trough, crest, ...) that repeats every TILE units.
   Crests are tighter than troughs, the way a low swell looks from the shore. */

/** Extrema of one tile: 2n points, crests at even indices. Same seed = same rhythm, so rows run parallel. */
function swell({ n, seed, jitter = 0.2 }) {
  const r = rng(seed);
  const step = TILE / n;
  const crests = Array.from({ length: n }, (_, i) => (i + 0.5 + (r() - 0.5) * jitter * 2) * step);
  const lift = Array.from({ length: n }, () => 0.72 + r() * 0.56);
  const sag = Array.from({ length: n }, () => 0.75 + r() * 0.5);
  const lean = Array.from({ length: n }, () => 0.5 + (r() - 0.5) * 0.16);
  const points = [];
  for (let i = 0; i < n; i++) {
    const next = i + 1 < n ? crests[i + 1] : crests[0] + TILE;
    points.push({ x: crests[i], k: -lift[i] });
    points.push({ x: crests[i] + (next - crests[i]) * lean[i], k: sag[i] * 0.62 });
  }
  return points;
}

/** Point i of the endless line (any integer), moved by `shift` and scaled to amplitude `amp` around `y`. */
function at(points, i, { y, amp, shift = 0 }) {
  const n = points.length;
  const p = points[((i % n) + n) % n];
  return [p.x + Math.floor(i / n) * TILE + shift, y + p.k * amp];
}

/** Path through extrema a..b with level tangents: a tight turn over each crest, a slow one through each trough. */
function wavePath(points, a, b, row) {
  let prev = at(points, a, row);
  let d = `M${pt(prev)}`;
  for (let i = a + 1; i <= b; i++) {
    const cur = at(points, i, row);
    const dx = cur[0] - prev[0];
    const crestToTrough = ((((i - 1) % 2) + 2) % 2) === 0;
    const k1 = crestToTrough ? 0.3 : 0.52;
    const k2 = crestToTrough ? 0.52 : 0.3;
    d += `C${n1(prev[0] + dx * k1)} ${n1(prev[1])} ${n1(cur[0] - dx * k2)} ${n1(cur[1])} ${pt(cur)}`;
    prev = cur;
  }
  return d;
}

/** Strokes of a broken line: runs of half-waves that begin and end in a trough, repeating every tile. */
function strokes(points, row, seed, { min = 3, max = 7, gapMin = 1, gapMax = 2 } = {}) {
  // only the runs that begin in this tile: the neighbouring copies bring their own
  const r = rng(seed);
  const n = points.length; // extrema per tile
  const runs = [];
  let i = 1 + 2 * Math.floor(r() * 3); // troughs are odd
  const first = i;
  while (i < first + n - 4) {
    const len = 2 * (min + Math.floor(r() * (max - min + 1)));
    const end = Math.min(i + len, first + n - 2 * gapMin);
    runs.push([i, end]);
    i = end + 2 * (gapMin + Math.floor(r() * (gapMax - gapMin + 1)));
  }
  return runs.map(([a, b]) => wavePath(points, a, b, row)).join('');
}

/**
 * One band of water, four tiles wide: a flat wash under a wave-cut edge, a full line that
 * follows the edge and broken lines below it that calm down as they descend.
 * The tile is drawn once and repeated with <use>. Each wash reaches a little way under the next
 * one so that no seam can show, and all the washes are laid before any line.
 */
const REPEAT = 4;
function band(name, { n, seed, amp, edge, height, fill, rows, follow = 10, jitter }) {
  const points = swell({ n, seed, jitter });
  const per = points.length;
  const top = { y: edge, amp };
  const wash = `<path d="${wavePath(points, 0, per + 2, top)}V${height}H${n1(at(points, 0, top)[0])}Z"/>`;
  let lines = `<path d="${wavePath(points, 0, per, { y: edge + follow, amp: amp * 0.92, shift: 3 })}"/>`;
  rows.forEach((row, i) => {
    lines += `<path d="${strokes(points, { y: row.y, amp: amp * row.amp, shift: row.shift }, seed * 31 + i * 7, row)}"/>`;
  });
  // one copy to the left as well: it brings the lines that run on into the first tile
  const copies = (id) =>
    [-1, ...Array.from({ length: REPEAT - 1 }, (_, i) => i + 1)].map((k) => `<use href="#${id}" x="${k * TILE}"/>`).join('');
  const body =
    `<g id="sea-${name}-wash" fill="${fill}" stroke="none">${wash}</g>${copies(`sea-${name}-wash`)}` +
    `<g id="sea-${name}-lines">${lines}</g>${copies(`sea-${name}-lines`)}`;
  return svg(REPEAT * TILE, height, body);
}

/* ---------- 1. Three bands of water, far to near ---------- */
save(
  'waves-far',
  band('waves-far', {
    n: 22,
    seed: 11,
    amp: 3.4,
    edge: 12,
    follow: 8.5,
    height: 112,
    fill: LIGHT,
    rows: [
      { y: 38, amp: 0.85, shift: 19, min: 4, max: 9 },
      { y: 60, amp: 0.8, shift: 44, min: 3, max: 8, gapMax: 3 },
      { y: 84, amp: 0.75, shift: 8, min: 4, max: 9, gapMax: 3 },
    ],
  }),
);
save(
  'waves-mid',
  band('waves-mid', {
    n: 15,
    seed: 23,
    amp: 5.2,
    edge: 16,
    follow: 11,
    height: 150,
    fill: BLUE,
    rows: [
      { y: 52, amp: 0.85, shift: 30, min: 3, max: 7, gapMax: 3 },
      { y: 80, amp: 0.8, shift: 72, min: 3, max: 6, gapMax: 3 },
      { y: 108, amp: 0.75, shift: 12, min: 3, max: 7, gapMax: 3 },
      { y: 136, amp: 0.7, shift: 55, min: 2, max: 6, gapMax: 3 },
    ],
  }),
);
save(
  'waves-near',
  band('waves-near', {
    n: 10,
    seed: 37,
    amp: 7.6,
    edge: 20,
    follow: 14,
    height: 84,
    fill: DEEP,
    rows: [{ y: 62, amp: 0.8, shift: 46, min: 2, max: 5, gapMax: 3 }],
  }),
);

/* ---------- 2. The far water: the horizon and a few still ripples on bare paper ----------
   Two tiles wide and not repeated, so it still spans the window when the picture is scaled down. */
{
  const r = rng(71);
  const W = 2 * TILE;
  const line = [];
  for (let x = -20; x <= W + 20; x += 82) line.push([x, 4 + (r() - 0.5) * 1.1]);
  let body = `<path d="${smooth(line)}"/>`;
  // short ripples, longer and closer together near the horizon, thinning out towards the viewer
  const rowsAt = [14, 26, 39, 52];
  rowsAt.forEach((y, row) => {
    let x = -40 + r() * 90;
    let d = '';
    while (x < W + 20) {
      const waves = 2 + Math.floor(r() * (row === 0 ? 5 : 4 - Math.min(row, 2)));
      const half = 13 + row * 2.5 + r() * 5;
      const rise = 1.5 + row * 0.35;
      d += `M${n1(x)} ${n1(y + (r() - 0.5) * 3)}q${n1(half / 2)} ${n1(-rise)} ${n1(half)} 0`;
      for (let i = 1; i < waves * 2; i++) d += `t${n1(half * (0.9 + r() * 0.2))} ${n1((r() - 0.5) * 0.8)}`;
      x += waves * 2 * half + 70 + r() * (150 + row * 120);
    }
    body += `<path d="${d}"/>`;
  });
  save('horizon', svg(W, 62, body));
}

/* ---------- 3. The sun, low on the water, and its path of light ---------- */
{
  const cx = 150;
  const hz = 100; // horizon
  const arc = (rad, a0 = 180, a1 = 360) => {
    const p = (a) => [cx + rad * Math.cos((a * Math.PI) / 180), hz + rad * Math.sin((a * Math.PI) / 180)];
    return `M${pt(p(a0))}A${rad} ${rad} 0 0 1 ${pt(p(a1))}`;
  };
  // the path of light on the water: a paler strip of paper that also clears the still ripples behind it
  let body = `<path d="M${cx - 54} ${hz}H${cx + 54}C${cx + 44} ${hz + 22} ${cx + 22} ${hz + 44} ${cx + 12} ${hz + 62}H${cx - 12}C${cx - 22} ${hz + 44} ${cx - 44} ${hz + 22} ${cx - 54} ${hz}Z" fill="${WHITE}" stroke="none" data-nodraw=""/>`;
  body += `<path d="${arc(40)}Z" fill="${WHITE}" stroke="none" data-nodraw=""/>`;
  body += `<path d="${arc(40)}"/><path d="${arc(27, 196, 344)}"/><path d="${arc(53, 184, 300)}${arc(53, 312, 356)}"/>`;
  body += `<path d="M${cx - 60} ${hz}H${cx + 60}"/>`;
  // rays, a little uneven, like the sun in the footer
  const r = rng(5);
  let rays = '';
  for (let a = 188; a <= 352; a += 13.6) {
    const t = (a * Math.PI) / 180;
    const inner = 63 + (r() - 0.5) * 3;
    const outer = inner + 9 + r() * 9;
    rays += `M${n1(cx + inner * Math.cos(t))} ${n1(hz + inner * Math.sin(t))}L${n1(cx + outer * Math.cos(t))} ${n1(hz + outer * Math.sin(t))}`;
  }
  body += `<path d="${rays}"/>`;
  // the reflection: level ripples that narrow as they come towards us
  const widths = [80, 60, 66, 42, 26];
  let glint = '';
  widths.forEach((w, i) => {
    const y = hz + 12 + i * 10.5;
    const x0 = cx - w / 2 + (r() - 0.5) * 10;
    const half = w / 4;
    glint += `M${n1(x0)} ${n1(y)}q${n1(half / 2)} -3 ${n1(half)} 0t${n1(half)} 0t${n1(half)} 0t${n1(half)} 0`;
  });
  body += `<path d="${glint}"/>`;
  save('sun', svg(300, 164, body));
}

/* ---------- 4. Islands ---------- */
/** Lines that echo a ridge further down its flank, each one shorter than the last. */
function echoes(ridge, base, count, r, { gap = 11, from = 0.12, to = 0.9 } = {}) {
  let d = '';
  for (let k = 1; k <= count; k++) {
    const a = Math.floor(ridge.length * (from + r() * 0.16 + k * 0.03));
    const b = Math.floor(ridge.length * (to - r() * 0.2 - k * 0.04));
    const pts = [];
    for (let i = a; i <= b; i++) {
      const [x, y] = ridge[i];
      const yy = y + k * gap + (r() - 0.5) * 1.6;
      if (yy < base - 5) pts.push([x, yy]);
      else if (pts.length > 2) {
        d += smooth(pts);
        pts.length = 0;
      }
    }
    if (pts.length > 2) d += smooth(pts);
  }
  return d;
}
/** A dense ridge through the control points (Catmull-Rom). */
function resample(ctrl, step = 14) {
  const out = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    const count = Math.max(2, Math.round((p2[0] - p1[0]) / step));
    for (let s = 0; s < count; s++) {
      const t = s / count;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (j) =>
        0.5 *
        (2 * p1[j] +
          (-p0[j] + p2[j]) * t +
          (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 +
          (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([f(0), f(1)]);
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}
// 4a. A long, low island far out. Light wash.
{
  const r = rng(91);
  const base = 104;
  const ridge = resample([
    [14, base],
    [52, 92],
    [96, 74],
    [140, 52],
    [178, 36],
    [212, 30],
    [246, 38],
    [284, 56],
    [318, 60],
    [352, 48],
    [388, 40],
    [420, 46],
    [452, 62],
    [486, 82],
    [520, 96],
    [542, base],
  ]);
  let body = `<path d="${smooth(ridge)}Z" fill="${LIGHT}" stroke="none" data-nodraw=""/>`;
  body += `<path d="${smooth(ridge)}"/>`;
  body += `<path d="${echoes(ridge, base, 4, r, { gap: 12 })}"/>`;
  body += `<path d="M6 ${base}H550"/>`;
  save('island', svg(560, 108, body));
}

// 4b. The near cape with the columns of a temple on its brow, as at Sounion. Greek blue wash, pale lines.
{
  const r = rng(131);
  const base = 150;
  const ridge = resample([
    [10, base],
    [34, 141],
    [66, 124],
    [98, 104],
    [124, 96],
    [176, 95],
    [206, 88],
    [246, 70],
    [290, 54],
    [334, 44],
    [372, 42],
    [410, 47],
    [452, 58],
    [500, 66],
    [560, 64],
  ]);
  let body = `<path d="${smooth(ridge)}V${base}Z" fill="${BLUE}" stroke="none" data-nodraw=""/>`;
  body += `<path d="${echoes(ridge, base, 5, r, { gap: 13, from: 0.2, to: 1 })}" stroke="${LIGHT}"/>`;
  // two cypresses behind the temple
  const cypress = (x, y, h, w) =>
    `<path data-nodraw="" d="M${n1(x - w * 0.2)} ${y}C${n1(x - w)} ${n1(y - h * 0.25)} ${n1(x - w * 0.6)} ${n1(y - h * 0.76)} ${x} ${n1(y - h)}C${n1(x + w * 0.6)} ${n1(y - h * 0.76)} ${n1(x + w)} ${n1(y - h * 0.25)} ${n1(x + w * 0.2)} ${y}Z" fill="${DEEP}" stroke="none"/>`;
  body += cypress(190, 93, 34, 7) + cypress(202, 90, 25, 6);
  // the temple: what is left of a colonnade against the sky. Columns are single strokes, a little
  // unevenly spaced; the architrave still lies on five of them, the sixth stands alone.
  const gy = 95.5; // ground
  const cols = [127, 135.2, 143.6, 151.6, 160];
  const top = gy - 27;
  let temple = `M${cols[0] - 6} ${gy}H${cols[4] + 16}M${cols[0] - 3.5} ${gy - 4}H${cols[4] + 13}`;
  for (const x of cols) temple += `M${x} ${gy - 4}V${top + 4}`;
  temple += `M${cols[4] + 9} ${gy - 4}V${top + 9}`;
  body += `<path d="${temple}"/>`;
  body += `<path d="M${cols[0] - 3} ${top + 4}V${top}H${cols[4] + 3}V${top + 4}Z" fill="${WHITE}"/>`;
  // a path running down from the temple towards the shore
  body += `<path d="M${cols[0] - 8} ${gy}q-17 3 -32 12" stroke="${LIGHT}"/>`;
  body += `<path d="M2 ${base}H560"/>`;
  save('cape', svg(560, 154, body));
}

/* ---------- 5. Clouds: a light wash and its outline printed a little out of register ---------- */
function cloud({ w, h, base, cusps, inner = [], streaks = [], off = [7, 6] }) {
  let outline = `M${pt(cusps[0])}`;
  for (let i = 1; i < cusps.length; i++) {
    const [x0, y0] = cusps[i - 1];
    const [x1, y1, k = 0.6] = cusps[i];
    const rad = Math.hypot(x1 - x0, y1 - y0) * k;
    outline += `A${n1(rad)} ${n1(rad)} 0 0 1 ${n1(x1)} ${n1(y1)}`;
  }
  const first = cusps[0];
  const last = cusps[cusps.length - 1];
  const span = last[0] - first[0];
  outline += `C${n1(last[0] - span * 0.3)} ${n1(base + 5)} ${n1(first[0] + span * 0.34)} ${n1(base - 4)} ${pt(first)}Z`;
  // paper under the outline, so a nearer cloud hides a farther one when they pass
  let body = `<path d="${outline}" fill="${PAPER}" stroke="none" data-nodraw=""/>`;
  body += `<path d="${outline}" transform="translate(${off[0]} ${off[1]})" fill="${LIGHT}" stroke="none" data-nodraw=""/>`;
  body += `<path d="${outline}"/>`;
  if (inner.length) {
    body += `<path d="${inner
      .map(([x0, y0, x1, y1, k = 0.62]) => {
        const rad = Math.hypot(x1 - x0, y1 - y0) * k;
        return `M${x0} ${y0}A${n1(rad)} ${n1(rad)} 0 0 1 ${x1} ${y1}`;
      })
      .join('')}"/>`;
  }
  if (streaks.length) {
    body += `<path d="${streaks
      .map(([x, y, len]) => `M${x} ${y}q${n1(len * 0.25)} -3 ${n1(len * 0.5)} 0t${n1(len * 0.5)} 0`)
      .join('')}"/>`;
  }
  return svg(w, h, body);
}
save(
  'cloud-1',
  cloud({
    w: 330,
    h: 112,
    base: 86,
    cusps: [
      [26, 86],
      [44, 62, 0.62],
      [86, 40, 0.6],
      [142, 22, 0.58],
      [204, 38, 0.6],
      [252, 56, 0.6],
      [292, 86, 0.6],
    ],
    inner: [
      [98, 58, 138, 44],
      [156, 46, 196, 58],
      [66, 74, 92, 66],
    ],
    streaks: [
      [2, 100, 96],
      [214, 103, 108],
    ],
  }),
);
save(
  'cloud-2',
  cloud({
    w: 236,
    h: 84,
    base: 62,
    cusps: [
      [18, 62],
      [42, 40, 0.6],
      [92, 20, 0.58],
      [146, 34, 0.6],
      [186, 44, 0.62],
      [214, 62, 0.62],
    ],
    inner: [
      [58, 50, 92, 38],
      [112, 40, 142, 50],
    ],
    streaks: [[130, 76, 84]],
    off: [6, 5],
  }),
);
save(
  'cloud-3',
  cloud({
    w: 420,
    h: 100,
    base: 74,
    cusps: [
      [30, 74],
      [58, 54, 0.6],
      [112, 38, 0.58],
      [170, 44, 0.6],
      [226, 24, 0.58],
      [290, 40, 0.6],
      [338, 54, 0.6],
      [384, 74, 0.6],
    ],
    inner: [
      [124, 58, 164, 56],
      [238, 44, 282, 56],
      [300, 66, 334, 64],
    ],
    streaks: [
      [0, 88, 130],
      [156, 92, 90],
      [300, 89, 118],
    ],
    off: [8, 6],
  }),
);

/* ---------- 6. The boat: a small Greek hull of the old kind under one square sail, bow to the right ----------
   The stern post stands tall and curls inboard, the stem rakes forward and carries an eye; the sail is
   seen a little from the side and bellies towards the bow, so the boat reads as going to the right.
   It sails in front of the blue band, so the lines that stand against the water (the foot of the mast,
   the sheets, the shaft of the steering oar) are printed light. */
{
  let body = '';
  // the hull: outside of the stern post, keel, stem, then back along the gunwale
  const hull =
    'M34 83C22 83.5 14 104 21 128C27 148 54 160 102 160C146 160 170 152 181 134C186 125 190.5 113 192 99' +
    'C187.5 112 181 122 171 127.5C142 134.5 66 134.5 41 128C33.5 124 27 105 34 83Z';
  body += `<clipPath id="sea-boat-hull"><path d="${hull}"/></clipPath>`;
  // mast (its foot shows light against the water), and lifts from the masthead to the yardarms
  body += `<path d="M101 132V100" stroke="${LIGHT}"/><path d="M101 60V12M101 22.5L54 43.5M101 22.5L148 43.5"/>`;
  // pennant, streaming ahead
  body += `<path d="M101 12C109 9.5 115 15 124 11.5C118 17.5 109 16 101 20.5Z" fill="${BLUE}"/>`;
  // sail: hung from the yard, its forward edge full of wind, the foot arching a little
  body += `<path d="M56 43.5C74 40 128 40 146 43.5C157.5 62 162.5 88 157 110C128 104.5 88 105.5 60 113C54.5 92 53.5 64 56 43.5Z" fill="${WHITE}"/>`;
  // seams, each a little fuller than the one behind it
  body += `<path d="M78.5 41.5C76.5 62 77.5 86 81 108.5M101 40.5C103.5 60 106 84 105.5 106.5M123.5 41.5C131 62 135 86 132 107.5"/>`;
  // yard, a little longer than the head of the sail
  body += `<path d="M48 45C70 40 132 40 154 45"/>`;
  // sheets from the clews down to the gunwale
  body += `<path d="M60 113L51 131M157 110L165.5 130" stroke="${LIGHT}"/>`;
  // hull: a light wash, and the whitewashed upper strake cut to its outline
  body += `<path d="${hull}" fill="${LIGHT}" stroke="none"/>`;
  body += `<path clip-path="url(#sea-boat-hull)" d="M4 118L41 128C66 134.5 142 134.5 171 127.5L198 121V132L177 138.5C146 145.5 62 145.5 35 138.5L4 129Z" fill="${WHITE}"/>`;
  body += `<path d="${hull}"/>`;
  // an eye on the bow, as on the old ships: pointed aft, round forward, the pupil at the round end
  body += `<path d="M-1.15 0C-.75-.5-.3-1 .2-1C.75-1 1-.5 1 0C1 .5 .75 1 .2 1C-.3 1-.75 .5-1.15 0Z" transform="translate(159.5 135) scale(5 5)" fill="#fffdf6" stroke-width=".5"/><ellipse cx=".38" cy="0" rx=".62" ry="1" transform="translate(159.5 135) scale(5 5)" fill="currentColor" stroke="none"/>`;
  // steering oar over the stern quarter; the blade stays under water
  body += `<path d="M46 119L24 158" stroke="${LIGHT}"/><path d="M27 149C21.5 154.5 18 162.5 18.5 171C25 166.5 29.5 159 31.5 151.5Z" fill="${WHITE}"/>`;
  save('boat', svg(200, 178, body));
}

/* ---------- 7. The lower edge of the water: cut by hand, not ruled. Two tiles wide. ---------- */
{
  const r = rng(303);
  const W = 2 * TILE;
  const pts = [];
  const edge = (x) => [x, 20 + (r() - 0.5) * 9 + 5 * Math.sin(x / 190)];
  for (let x = -20; x < W; x += 36 + r() * 30) pts.push(edge(x));
  pts.push(edge(W + 20));
  save('floor', svg(W, 36, `<path d="${smooth(pts)}V-2H-20Z" fill="${DEEP}" stroke="none"/>`));
}
