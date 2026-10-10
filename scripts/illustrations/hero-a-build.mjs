// Generates the line art for the "Portal" hero (src/components/home/hero/HeroA.astro).
//   node scripts/illustrations/hero-a-build.mjs
// Far layers are crème monoline on blue (rays, mountains, hills). Near layers are crème paper
// cut-outs carrying blue line work (ground, pines, owl), so they still read where they leave
// the blue panel and lie on the crème page.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../src/assets/illustrations');
const CUT = 'var(--cut, #f2e9d3)'; // paper of the cut-outs
const HIDE = 'var(--paper, #0b1c8c)'; // far shapes hide what is behind them with the panel colour

const f = (n) => String(Math.round(n * 10) / 10);
const P = (p) => `${f(p[0])} ${f(p[1])}`;
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A smooth curve through points (uniform Catmull-Rom written as C then S segments).
function smooth(points) {
  const n = points.length;
  const tan = (i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(n - 1, i + 1)];
    return [(b[0] - a[0]) / 6, (b[1] - a[1]) / 6];
  };
  let d = `M${P(points[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const t0 = tan(i);
    const t1 = tan(i + 1);
    const c2 = [p1[0] - t1[0], p1[1] - t1[1]];
    d += i === 0 ? `C${P([p0[0] + t0[0], p0[1] + t0[1]])} ${P(c2)} ${P(p1)}` : `S${P(c2)} ${P(p1)}`;
  }
  return d;
}
// The same curve as a continuation of an open path (no leading M).
const smoothOn = (points) => smooth(points).replace(/^M[^CS]+/, '');

const svg = (w, h, sw, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
const path = (d, attrs = '') => `<path d="${d}"${attrs ? ' ' + attrs : ''}/>`;
const save = (name, text) => {
  writeFileSync(join(OUT, `${name}.svg`), text);
  console.log(name, (text.length / 1024).toFixed(1) + ' KB');
};

/* ------------------------------------------------------------------ rays */
// Long wavy lines radiating from one point, as the hair does on the Nymfi label.
// Every line follows the same wave at the same distance, so neighbours stay parallel.
function rays() {
  const R = rng(11);
  const C = 1000;
  const LAMBDA = 264;
  const STEP = LAMBDA / 4;
  const R0 = 150;
  const body = [];
  const ray = (theta, first, last) => {
    const pts = [];
    for (let k = first; k <= last; k++) {
      const r = R0 + k * STEP;
      const amp = Math.min(19, 0.032 * r) * smoothstep((k - first) / 4);
      const d = amp * Math.sin((k * Math.PI) / 2);
      pts.push([C + r * Math.cos(theta) - d * Math.sin(theta), C + r * Math.sin(theta) + d * Math.cos(theta)]);
    }
    return path(smooth(pts));
  };
  const N = 56;
  const last = Math.round((1050 - R0) / STEP);
  for (let i = 0; i < N; i++) {
    const theta = (i / N) * Math.PI * 2 + (R() - 0.5) * 0.02;
    body.push(ray(theta, R() < 0.5 ? 0 : 1, last));
  }
  // Shorter locks between the long ones keep the outer field evenly filled.
  for (let i = 0; i < N; i++) {
    const theta = ((i + 0.5) / N) * Math.PI * 2 + (R() - 0.5) * 0.02;
    body.push(ray(theta, 5 + Math.floor(R() * 3), last));
  }
  save('hero-a-rays', svg(2000, 2000, 2.1, body.join('')));
}

/* ------------------------------------------------------------- mountains */
// The mountains of Attica as separate masses, each an outline with nested contour lines on
// its lee side. Nearer masses hide the feet of those behind.
function mountains() {
  const B = 430; // base, hidden behind the sea
  // [x0, x1, peakX, peakY, shoulder] back to front
  const masses = [
    [860, 1500, 1190, 120, 0.5],
    [1290, 1720, 1520, 176, 0.4],
    [190, 760, 455, 196, 0.55],
    [-110, 380, 110, 240, 0.4],
    [600, 1040, 815, 232, 0.5],
  ];
  const body = [];
  for (const [x0, x1, px, py, sh] of masses) {
    const h = B - py;
    const wl = px - x0;
    const wr = x1 - px;
    const outline = (k) => {
      // k scales the mass towards its foot, for the nested lines
      const q = (dx, dy) => [px + dx * k, B - (B - (py + dy)) * k];
      return [
        q(-wl, h),
        q(-wl * 0.72, h * 0.74),
        q(-wl * 0.44, h * 0.4),
        q(-wl * 0.2, h * 0.1),
        q(0, 0),
        q(wr * 0.2, h * 0.07),
        q(wr * sh, h * 0.3),
        q(wr * 0.78, h * 0.68),
        q(wr, h),
      ];
    };
    body.push(path(smooth(outline(1)), `fill="${HIDE}"`));
    // lee side only: from just past the summit down to the foot
    body.push(path(smooth(outline(0.8).slice(3, 8))));
    body.push(path(smooth(outline(0.6).slice(4, 8))));
    if (h > 220) body.push(path(smooth(outline(0.4).slice(4, 7))));
  }
  save('hero-a-mountains', svg(1600, 440, 2.4, body.join('')));
}

/* ------------------------------------------------------------------- sea */
// Rows of scallops, the scale pattern of the label, read here as the Aegean.
function sea() {
  const R = rng(21);
  const body = [];
  const W = 82;
  const rows = 4;
  for (let r = 0; r < rows; r++) {
    const y = 70 + r * 36;
    const shift = (r % 2) * (W / 2) + (R() - 0.5) * 6;
    for (let x = -W + shift; x < 1600 + W; x += W) {
      const w = W + (R() - 0.5) * 4;
      const cx = x + w / 2 + (R() - 0.5) * 3;
      const yy = y + (R() - 0.5) * 3;
      const arc = (k) => {
        const hw = (w / 2) * k * 1.04;
        const h = 46 * k;
        return `M${P([cx - hw, yy])}C${P([cx - hw, yy - h * 1.3])} ${P([cx + hw, yy - h * 1.3])} ${P([cx + hw, yy])}`;
      };
      body.push(path(arc(1), `fill="${HIDE}"`));
      body.push(path(arc(0.6)));
    }
  }
  save('hero-a-sea', svg(1600, 200, 2.4, body.join('')));
}

/* ---------------------------------------------------------------- ground */
// The crème knoll in the foreground: the page paper rising into the picture.
function ground() {
  const top = [
    [4, 262], [50, 236], [170, 214], [340, 200], [520, 194], [690, 182], [830, 156], [960, 122],
    [1070, 98], [1160, 88], [1260, 94], [1360, 112], [1440, 124],
  ];
  const bottom = [[4, 262], [70, 280], [260, 290], [600, 296], [1000, 300], [1440, 302]];
  const yAt = (pts, x) => {
    for (let i = 0; i < pts.length - 1; i++) {
      if (x <= pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], smoothstep((x - pts[i][0]) / (pts[i + 1][0] - pts[i][0])));
    }
    return pts[pts.length - 1][1];
  };
  const body = [];
  // The fill runs off the page on the right, so only the top and bottom edges are stroked.
  body.push(path(smooth(top) + 'L' + P(bottom[bottom.length - 1]) + smoothOn([...bottom].reverse()) + 'Z', `fill="${CUT}" stroke="none"`));
  body.push(path(smooth(top)));
  body.push(path(smooth(bottom)));
  const n = 9;
  for (let k = 1; k < n; k++) {
    const t = Math.pow(k / n, 1.25);
    const pts = [];
    const x0 = 60 + k * 58 + (k % 2) * 24;
    for (let x = x0; x <= 1440; x += 70) {
      const wob = Math.sin(x / 150 + k * 1.1) * 2.4;
      pts.push([x, lerp(yAt(top, x), yAt(bottom, x), t) + wob]);
    }
    body.push(path(smooth(pts)));
  }
  save('hero-a-ground', svg(1440, 306, 2.8, body.join('')));
}

/* ----------------------------------------------------------------- pines */
// An umbrella pine: a bare leaning trunk, a fan of limbs, a shallow dome of rounded clumps.
function offsetShape(center, w0, w1) {
  const left = [];
  const right = [];
  const n = center.length;
  for (let i = 0; i < n; i++) {
    const a = center[Math.max(0, i - 1)];
    const b = center[Math.min(n - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const w = lerp(w0, w1, i / (n - 1)) / 2;
    left.push([center[i][0] + nx * w, center[i][1] + ny * w]);
    right.push([center[i][0] - nx * w, center[i][1] - ny * w]);
  }
  return { left, right };
}
const cubicAt = (a, b, c, d, t) => {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
};
const sample = (a, b, c, d, n = 8) => Array.from({ length: n + 1 }, (_, i) => cubicAt(a, b, c, d, i / n));
const ribbon = (center, w0, w1, close = true) => {
  const { left, right } = offsetShape(center, w0, w1);
  return smooth(left) + 'L' + P(right[right.length - 1]) + smoothOn([...right].reverse()) + (close ? 'Z' : '');
};

function pine(name, o) {
  const R = rng(o.seed);
  const body = [];
  const { base, fork, crown } = o;
  // Limbs first: they sit behind the trunk and the crown.
  for (const [tx, ty, bend] of o.limbs) {
    const end = [crown.x + tx, crown.y + ty];
    const c1 = [fork[0] + (end[0] - fork[0]) * 0.12, fork[1] - (fork[1] - end[1]) * 0.56];
    const c2 = [end[0] - (end[0] - fork[0]) * 0.34 + bend, end[1] + (fork[1] - end[1]) * 0.26];
    body.push(path(ribbon(sample(fork, c1, c2, end, 6), o.trunk[1] * 0.74, o.trunk[1] * 0.4), `fill="${CUT}"`));
  }
  // Trunk, open at the foot where the ground covers it.
  {
    const c1 = [base[0] + o.lean[0], lerp(base[1], fork[1], 0.36)];
    const c2 = [fork[0] + o.lean[1], lerp(base[1], fork[1], 0.72)];
    const center = sample(base, c1, c2, fork, 9);
    body.push(path(ribbon(center, o.trunk[0], o.trunk[1], false), `fill="${CUT}"`));
    for (let i = 1; i < center.length - 2; i += 2) {
      const a = center[i];
      const b = center[i + 1];
      const side = i % 4 === 1 ? -0.17 : 0.19;
      const w = lerp(o.trunk[0], o.trunk[1], i / center.length);
      body.push(
        path(`M${P([lerp(a[0], b[0], 0.15) + w * side, lerp(a[1], b[1], 0.15)])}L${P([lerp(a[0], b[0], 0.8) + w * side, lerp(a[1], b[1], 0.8)])}`),
      );
    }
  }
  // Crown: rounded clumps, back row first, each with nested arcs.
  const clump = (cx, by, rx, ry, tilt, rings) => {
    const c = Math.cos(tilt);
    const s = Math.sin(tilt);
    const rot = (p) => [cx + (p[0] - cx) * c - (p[1] - by) * s, by + (p[0] - cx) * s + (p[1] - by) * c];
    const arc = (k, lift = 0) => [
      rot([cx - rx * k, by - lift]),
      rot([cx - rx * k * 1.04, by - lift - ry * k * 1.34]),
      rot([cx + rx * k * 1.04, by - lift - ry * k * 1.34]),
      rot([cx + rx * k, by - lift]),
    ];
    const [a, b, cc, d] = arc(1);
    const sag = rot([cx, by + ry * 0.34]);
    body.push(path(`M${P(a)}C${P(b)} ${P(cc)} ${P(d)}Q${P(sag)} ${P(a)}Z`, `fill="${CUT}"`));
    for (const k of rings) {
      const [a2, b2, c2, d2] = arc(k, ry * 0.02);
      body.push(path(`M${P(a2)}C${P(b2)} ${P(c2)} ${P(d2)}`));
    }
  };
  for (const [dx, dy, rx, ry, tilt, rings] of o.clumps) {
    clump(crown.x + dx + (R() - 0.5) * 3, crown.y + dy + (R() - 0.5) * 3, rx, ry, (tilt * Math.PI) / 180, rings ?? [0.7, 0.42]);
  }
  save(name, svg(o.w, o.h, o.sw, body.join('')));
}

function pines() {
  // The tall pine on the right: it leans in towards the arch.
  pine('hero-a-pine-1', {
    seed: 3,
    w: 440,
    h: 580,
    sw: 2.9,
    base: [262, 590],
    fork: [226, 236],
    lean: [-40, 30],
    trunk: [27, 16],
    crown: { x: 220, y: 142 },
    limbs: [
      [-150, 34, -12],
      [-78, 22, -4],
      [4, 20, 0],
      [84, 22, 6],
      [152, 36, 12],
    ],
    clumps: [
      // back row
      [-96, -4, 76, 50, -9],
      [92, -6, 78, 50, 9],
      [-4, -22, 92, 62, 0, [0.74, 0.5, 0.26]],
      // front row, outside in
      [-158, 42, 54, 36, -20],
      [160, 44, 54, 36, 20],
      [-84, 38, 68, 44, -8],
      [86, 38, 68, 44, 8],
      [0, 44, 70, 44, 0],
    ],
  });
  // A smaller, further pine for the left foot of the arch.
  pine('hero-a-pine-2', {
    seed: 9,
    w: 380,
    h: 460,
    sw: 3.3,
    base: [158, 470],
    fork: [190, 204],
    lean: [30, -22],
    trunk: [23, 14],
    crown: { x: 190, y: 122 },
    limbs: [
      [-128, 34, -8],
      [-52, 22, -2],
      [40, 22, 4],
      [128, 34, 8],
    ],
    clumps: [
      [-70, -4, 70, 46, -8],
      [72, -4, 70, 46, 9],
      [0, -20, 80, 54, 0, [0.72, 0.46, 0.22]],
      [-134, 40, 48, 32, -19],
      [136, 40, 48, 32, 19],
      [-52, 38, 64, 40, -5],
      [54, 40, 64, 40, 6],
    ],
  });
}

/* ------------------------------------------------------------------- owl */
// Athena's little owl on an olive sprig. Frontal, calm, symmetrical.
function owl() {
  const body = [];
  const cut = `fill="${CUT}"`;
  const ink = 'fill="currentColor"';
  const cx = 214;
  const cy = 112;
  const X = (dx) => cx + dx;
  const Y = (dy) => cy + dy;
  const m = (side, dx) => cx + side * dx; // mirror helper

  // Sprig: a tapering stem with a cut end on the left.
  const stem = [[10, 206], [84, 208], [160, 200], [240, 192], [316, 178], [372, 158], [408, 136]];
  const stemAt = (t) => {
    const u = t * (stem.length - 1);
    const i = Math.min(stem.length - 2, Math.floor(u));
    return [lerp(stem[i][0], stem[i + 1][0], u - i), lerp(stem[i][1], stem[i + 1][1], u - i)];
  };
  const leaf = (t, angle, len) => {
    const a = stemAt(t);
    const b = stemAt(Math.min(1, t + 0.04));
    const dir = Math.atan2(b[1] - a[1], b[0] - a[0]) + (angle * Math.PI) / 180;
    const tip = [a[0] + Math.cos(dir) * len, a[1] + Math.sin(dir) * len];
    const nx = -Math.sin(dir);
    const ny = Math.cos(dir);
    const w = len * 0.27;
    const mid = [lerp(a[0], tip[0], 0.46), lerp(a[1], tip[1], 0.46)];
    body.push(
      path(`M${P(a)}Q${P([mid[0] + nx * w, mid[1] + ny * w])} ${P(tip)}Q${P([mid[0] - nx * w, mid[1] - ny * w])} ${P(a)}Z`, cut),
    );
    body.push(path(`M${P([lerp(a[0], tip[0], 0.14), lerp(a[1], tip[1], 0.14)])}L${P([lerp(a[0], tip[0], 0.7), lerp(a[1], tip[1], 0.7)])}`));
  };
  // Tail feathers hang behind the sprig.
  body.push(path(`M${X(-17)} ${Y(70)}C${X(-16)} ${Y(96)} ${X(-9)} ${Y(112)} ${X(0)} ${Y(116)}C${X(9)} ${Y(112)} ${X(16)} ${Y(96)} ${X(17)} ${Y(70)}Z`, cut));
  body.push(path(`M${X(-6)} ${Y(92)}V${Y(108)}M${X(6)} ${Y(92)}V${Y(108)}`));
  // Leaves behind the stem
  leaf(0.1, -46, 54);
  leaf(0.2, 40, 50);
  leaf(0.3, -40, 58);
  leaf(0.7, -44, 56);
  leaf(0.76, 42, 50);
  leaf(0.86, -38, 52);
  leaf(0.93, 36, 44);
  leaf(0.985, -6, 50);
  // Two olives
  for (const [t, drop] of [[0.24, 30], [0.8, 26]]) {
    const a = stemAt(t);
    body.push(path(`M${P(a)}q3 ${f(drop * 0.4)} 1 ${f(drop * 0.55)}`));
    body.push(`<ellipse cx="${f(a[0] + 1)}" cy="${f(a[1] + drop * 0.55 + 11)}" rx="8" ry="11" ${cut}/>`);
  }
  body.push(path(ribbon(stem, 9, 3.4), cut));

  // Body
  body.push(
    path(
      `M${X(0)} ${Y(-80)}C${X(38)} ${Y(-80)} ${X(58)} ${Y(-52)} ${X(57)} ${Y(-14)}C${X(56)} ${Y(30)} ${X(36)} ${Y(70)} ${X(0)} ${Y(84)}C${X(-36)} ${Y(70)} ${X(-56)} ${Y(30)} ${X(-57)} ${Y(-14)}C${X(-58)} ${Y(-52)} ${X(-38)} ${Y(-80)} ${X(0)} ${Y(-80)}Z`,
      cut,
    ),
  );
  for (const s of [-1, 1]) {
    // wing: inner edge and two feather lines
    body.push(path(`M${m(s, 53)} ${Y(-2)}C${m(s, 34)} ${Y(12)} ${m(s, 27)} ${Y(46)} ${m(s, 12)} ${Y(76)}`));
    body.push(path(`M${m(s, 54)} ${Y(14)}C${m(s, 43)} ${Y(28)} ${m(s, 37)} ${Y(50)} ${m(s, 24)} ${Y(70)}`));
    body.push(path(`M${m(s, 51)} ${Y(32)}C${m(s, 46)} ${Y(44)} ${m(s, 42)} ${Y(54)} ${m(s, 34)} ${Y(62)}`));
    // face: brow over the eye, then round under it to the beak
    body.push(path(`M${X(0)} ${Y(-40)}C${m(s, 12)} ${Y(-66)} ${m(s, 42)} ${Y(-64)} ${m(s, 48)} ${Y(-38)}C${m(s, 50)} ${Y(-16)} ${m(s, 30)} ${Y(-6)} ${m(s, 7)} ${Y(-12)}`));
    body.push(`<circle cx="${m(s, 23)}" cy="${Y(-35)}" r="15.5"/>`);
    body.push(`<circle cx="${m(s, 23)}" cy="${Y(-35)}" r="6.2" ${ink}/>`);
    // toes over the stem
    const fx = m(s, 15);
    body.push(path(`M${fx - 6} ${Y(77)}q-1 7 0 12M${fx} ${Y(77)}v13M${fx + 6} ${Y(77)}q1 7 0 12`));
  }
  // beak
  body.push(path(`M${X(-6.5)} ${Y(-27)}Q${X(0)} ${Y(-34)} ${X(6.5)} ${Y(-27)}Q${X(3)} ${Y(-12)} ${X(0)} ${Y(-7)}Q${X(-3)} ${Y(-12)} ${X(-6.5)} ${Y(-27)}Z`, ink));
  // breast feathers: small scallops
  const rows = [
    [4, 3],
    [19, 2],
    [34, 3],
    [49, 2],
  ];
  for (const [dy, count] of rows) {
    const w = 17;
    const x0 = cx - (count * w) / 2;
    let d = `M${f(x0)} ${Y(dy)}`;
    for (let i = 0; i < count; i++) d += `q${w / 2} 13 ${w} 0`;
    body.push(path(d));
  }
  save('hero-a-owl', svg(420, 240, 3, body.join('')));
}

/* ------------------------------------------------------------------ star */
function star() {
  const c = 20;
  const r = 18;
  const k = 0.16 * r;
  const d = `M${c} ${c - r}Q${c + k} ${c - k} ${c + r} ${c}Q${c + k} ${c + k} ${c} ${c + r}Q${c - k} ${c + k} ${c - r} ${c}Q${c - k} ${c - k} ${c} ${c - r}Z`;
  save('hero-a-star', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="currentColor" stroke="none"><path d="${d}"/></svg>\n`);
}

rays();
mountains();
sea();
ground();
pines();
owl();
star();
