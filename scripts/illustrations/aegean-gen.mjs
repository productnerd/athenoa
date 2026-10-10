// Generates the three layers of the Aegean footer scene (Courses pages):
//   footer-aegean-far.svg   sky: a low sun in widening rings, clouds, gulls, far islands on the horizon
//   footer-aegean-mid.svg   calm water, the terraced cape with its columns and tamarisks, an islet, a far sail
//   footer-aegean-near.svg  the sea in the foreground: wave bands in three blues, dolphins, sea-worn rocks
// node scripts/illustrations/aegean-gen.mjs
//
// Footer.astro stacks the layers in a 1600 x 525 box: far sits 21 units from the top, mid 210.8,
// near 165. The horizon is one line in all three: far y 310, mid y 120, near y 166 (scene y 331).
// Narrow screens see only the middle of the scene (x 500 to 1100), so the columns, the sun and
// the dolphins all live there.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/assets/illustrations');
const PAPER = 'var(--paper, #f2e9d3)';
const LIGHT = 'var(--blue-light, #b3c0f3)';
const DEEP = 'var(--blue-deep, #071260)';
const TAU = Math.PI * 2;
const SUN_X = 962; // the sun and its path on the water share one x in the far and mid layers

// ---------- small geometry kit ----------
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
// piecewise-linear lookup through [x, y] points (for masks and for lines that follow a profile)
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

const svg = (h, sw, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 ${h}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
const path = (d, attrs = '') => `<path ${attrs ? attrs + ' ' : ''}d="${d}"/>`;
const paperFill = (d) => path(d, `fill="${PAPER}" stroke="none"`);
const papered = (d) => path(d, `fill="${PAPER}"`);
const wash = (d, nodraw = true) => path(d, `fill="${LIGHT}" stroke="none"${nodraw ? ' data-nodraw' : ''}`);

// a gull far off: two wing strokes meeting at the body
const gull = (x, y, w, tilt = 0) => {
  const t = place({ x, y, s: w / 10, rot: tilt });
  return `M${xy(t([-10, -1.5]))}Q${xy(t([-5.5, -7]))} ${xy(t([0, 0]))}Q${xy(t([4.5, -6.5]))} ${xy(t([10, -3]))}`;
};

// ====================================================================================
// FAR: sky, sun, clouds, gulls, far islands.  Horizon at y 310.
// ====================================================================================
function far() {
  const H = 310;
  const BOTTOM = 422;
  const rnd = prng(19);
  const out = [];

  // --- the sun, low over the water, in widening rings that break up as they go out.
  // Disc and rings run on below the horizon: the sea of the mid layer hides what has set.
  const [cx, cy] = [SUN_X, 293];
  const below = H + 44;
  out.push(`<circle cx="${cx}" cy="${cy}" r="29"/>`);
  const rings = [
    { r: 43, gaps: [] },
    { r: 58, gaps: [] },
    { r: 75, gaps: [0.62] },
    { r: 94, gaps: [0.2, 0.71] },
    { r: 115, gaps: [0.09, 0.4, 0.58, 0.86] },
    { r: 138, gaps: [0.15, 0.3, 0.47, 0.66, 0.8, 0.93] },
    { r: 163, gaps: [0.1, 0.22, 0.36, 0.5, 0.6, 0.73, 0.87] },
  ];
  rings.forEach(({ r, gaps }, k) => {
    if ((below - cy) / r >= 1) {
      out.push(`<circle cx="${cx}" cy="${cy}" r="${r}"/>`);
      return;
    }
    const a0 = -Math.asin((below - cy) / r);
    const span = Math.PI - 2 * a0;
    const gapAngle = (11 + k * 2.2) / r; // a gap of the same hand's width on every ring
    const cuts = [0, ...gaps.map((g) => g + (rnd() - 0.5) * 0.03), 1];
    let d = '';
    for (let i = 0; i < cuts.length - 1; i++) {
      const a1 = a0 + cuts[i] * span + (i === 0 ? 0 : gapAngle / 2);
      const a2 = a0 + cuts[i + 1] * span - (i === cuts.length - 2 ? 0 : gapAngle / 2);
      const p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
      const p2 = [cx + r * Math.cos(a2), cy - r * Math.sin(a2)];
      d += `M${xy(p1)}A${r} ${r} 0 ${a2 - a1 > Math.PI ? 1 : 0} 0 ${xy(p2)}`;
    }
    out.push(path(d));
  });

  // --- far islands: long low silhouettes. The nearer ones carry a light wash, the farthest is bare paper.
  const island = (pts, contours, washed = true) => {
    const top = pts.map(([x, h]) => [x, H - h]);
    const h = lookup(pts);
    const d = smooth(top);
    const closed = `${d}V${BOTTOM}H${f(top[0][0])}Z`;
    out.push(paperFill(closed));
    if (washed) out.push(wash(closed));
    out.push(path(d));
    for (const [x0, x1, k, lift = 0] of contours) {
      out.push(path(smooth(sample((x) => H - h(x) * k - lift + Math.sin(x / 31) * 0.9, x0, x1, 34))));
    }
  };
  // left: a high island behind the cape; only its ridge shows above the land
  island(
    [
      [-40, 70],
      [10, 82],
      [62, 93],
      [112, 96],
      [160, 88],
      [214, 74],
      [270, 64],
      [322, 58],
      [372, 46],
      [420, 28],
      [462, 6],
      [486, -30],
    ],
    [
      [-40, 96, 0.84],
      [150, 300, 0.8],
      [20, 200, 0.66],
    ],
  );
  // right: a far ridge on bare paper, running off the edge
  island(
    [
      [1296, -30],
      [1326, 4],
      [1362, 30],
      [1404, 52],
      [1448, 68],
      [1490, 75],
      [1532, 70],
      [1574, 58],
      [1612, 52],
      [1660, 50],
    ],
    [
      [1420, 1560, 0.74],
      [1560, 1660, 0.7],
    ],
    false,
  );
  // right: the long low island in front of it
  island(
    [
      [1084, -30],
      [1098, -6],
      [1118, 7],
      [1150, 17],
      [1192, 27],
      [1236, 34],
      [1278, 35],
      [1322, 29],
      [1368, 22],
      [1412, 21],
      [1456, 28],
      [1500, 38],
      [1544, 43],
      [1588, 40],
      [1626, 33],
      [1660, 30],
    ],
    [
      [1160, 1330, 0.62],
      [1210, 1290, 0.3],
      [1470, 1640, 0.6],
      [1520, 1610, 0.28],
    ],
  );

  // --- clouds: long evening clouds, scalloped above and level below, the wash printed a little
  // off register, thin streaks trailing beside them
  const cloud = (x, y, s, lobes, inner, streaks) => {
    const t = place({ x, y, s });
    const outline = (tt) => {
      const pts = lobes.map(tt);
      const w = lobes[lobes.length - 1][0];
      const base = [pts[pts.length - 1], tt([w * 0.66, 2.2]), tt([w * 0.3, 2.6]), pts[0]];
      return `M${xy(pts[0])}${scallops(pts, 0.62)}${smooth(base, { cont: true })}Z`;
    };
    const d = outline(t);
    out.push(paperFill(d));
    out.push(wash(outline(place({ x: x + 7 * s, y: y + 5.5 * s, s }))));
    out.push(path(d));
    out.push(path(inner.map((arc) => `M${xy(t(arc[0]))}${scallops(arc.map(t), 0.66)}`).join('')));
    out.push(
      path(streaks.map(([x0, x1, yy]) => smooth([t([x0, yy]), t([(x0 + x1) / 2, yy + 1.4]), t([x1, yy - 0.3])])).join('')),
    );
  };
  // upper left
  cloud(
    150,
    136,
    1,
    [
      [0, 0],
      [20, -15],
      [54, -30],
      [100, -40],
      [150, -28],
      [196, -31],
      [236, -16],
      [262, 0],
    ],
    [
      [
        [38, -9],
        [64, -19],
      ],
      [
        [84, -20],
        [122, -19],
      ],
      [
        [168, -13],
        [200, -14],
      ],
    ],
    [
      [-70, 34, 14],
      [180, 330, 15],
      [60, 150, 25],
    ],
  );
  // upper right, the longest
  cloud(
    1196,
    108,
    1,
    [
      [0, 0],
      [24, -14],
      [62, -22],
      [104, -36],
      [156, -44],
      [208, -30],
      [250, -32],
      [286, -17],
      [312, 0],
    ],
    [
      [
        [46, -8],
        [74, -14],
      ],
      [
        [118, -22],
        [154, -26],
      ],
      [
        [176, -16],
        [214, -14],
      ],
      [
        [236, -12],
        [264, -9],
      ],
    ],
    [
      [-96, 60, 15],
      [250, 392, 14],
      [120, 214, 26],
    ],
  );
  // a small one high in the middle
  cloud(
    596,
    70,
    0.8,
    [
      [0, 0],
      [20, -13],
      [56, -25],
      [100, -18],
      [136, -20],
      [164, 0],
    ],
    [
      [
        [34, -6],
        [60, -13],
      ],
      [
        [96, -9],
        [124, -9],
      ],
    ],
    [
      [-74, 24, 13],
      [120, 236, 14],
    ],
  );

  // --- gulls
  out.push(path(gull(760, 176, 10, -6) + gull(796, 196, 7, 5) + gull(728, 204, 5.5, -3)));
  out.push(path(gull(1118, 190, 8.5, 6) + gull(1152, 172, 6, -5)));
  out.push(path(gull(430, 214, 6, -4) + gull(452, 200, 4.5, 4)));

  return svg(420, 2, out.join(''));
}

// ====================================================================================
// MID: calm water, the terraced cape with its columns, an islet, a sail.  Horizon at y 120.
// The cape comes in from the left edge, climbs to the columns and falls into the sea as a cliff;
// its shore runs back towards the viewer, so the land is a long wedge across the left third.
// ====================================================================================
function mid() {
  const H = 120;
  const rnd = prng(41);
  const out = [];

  // skyline of the cape, left to right, level under the columns
  const sky = [
    [-40, 73],
    [20, 69],
    [78, 70],
    [136, 76],
    [196, 84],
    [252, 88],
    [306, 85],
    [362, 77],
    [420, 69],
    [476, 63],
    [530, 59.5],
    [580, 58],
    [640, 58],
    [700, 58],
    [716, 58.6],
  ];
  // the cliff, from the lip down to the water, in ledges
  const cliff = [
    [716, 58.6],
    [727, 63],
    [733, 73],
    [735, 85],
    [744, 89],
    [751, 97],
    [753, 108],
    [762, 112],
    [768, 120.5],
  ];
  // the shore, from the foot of the cliff back to the left edge, coming nearer as it goes
  const shore = [
    [768, 120.5],
    [742, 125.5],
    [706, 127],
    [672, 131.5],
    [634, 137],
    [590, 139],
    [546, 138.5],
    [500, 142],
    [452, 149],
    [402, 153],
    [350, 153],
    [300, 157],
    [248, 165],
    [196, 170],
    [142, 170.5],
    [88, 176],
    [30, 184],
    [-40, 188],
  ];
  const skyY = lookup([...sky, ...cliff.slice(1)]);
  const shoreY = lookup([...shore].reverse());

  // the islet on the right
  const isleTop = [
    [1128, 121],
    [1146, 112],
    [1172, 103],
    [1204, 95],
    [1238, 90],
    [1270, 91],
    [1300, 97],
    [1326, 106],
    [1348, 113],
    [1366, 121.5],
  ];
  const isleShore = [
    [1366, 121.5],
    [1340, 126],
    [1300, 129.5],
    [1250, 131],
    [1200, 129.5],
    [1160, 126],
    [1128, 121],
  ];
  const isleTopY = lookup(isleTop);
  const isleShoreY = lookup([...isleShore].reverse());

  // --- the sea: paper down to the bottom, so the far layer sinks behind the horizon
  out.push(paperFill(`M-40 ${H}H1640V302H-40Z`));
  out.push(path(smooth(sample((x) => H + Math.sin(x / 170) * 0.4, 790, 1640, 170))));

  // --- the sun's path on the water: short level strokes, a few to a row, widening as it comes nearer
  const glitterHalf = (y) => 13 + (y - H) * 0.52;
  {
    let d = '';
    let y = H + 6;
    let row = 0;
    while (y < 236) {
      const half = glitterHalf(y);
      const n = row < 2 ? 1 : row < 7 ? 2 : 3;
      let x = SUN_X - half * (0.75 + rnd() * 0.3) + (row % 2 ? 5 : -4);
      for (let i = 0; i < n; i++) {
        const l = ((half * 2) / n) * (0.5 + rnd() * 0.4);
        d += smooth([
          [x, y + (rnd() - 0.5) * 0.8],
          [x + l / 2, y + (rnd() - 0.5) * 1.4],
          [x + l, y + (rnd() - 0.5) * 0.8],
        ]);
        x += l + 7 + rnd() * half * 0.3;
      }
      y += 6.4 + row * 0.75;
      row++;
    }
    out.push(path(d));
  }

  // --- calm water: long level strokes with gaps, further apart as they come nearer
  {
    let y = H + 7.5;
    let row = 0;
    while (y < 262) {
      const yy = y;
      const keepOut = glitterHalf(Math.min(yy, 230)) + 20;
      const ph = rnd() * TAU;
      const amp = 0.45 + row * 0.1;
      const fn = (x) => yy + Math.sin(x / (70 + row * 7) + ph) * amp;
      const ok = (x, py) =>
        Math.abs(x - SUN_X) > keepOut &&
        !(x < 800 && py < shoreY(x) + 5.5) &&
        !(x > 1112 && x < 1384 && py < isleShoreY(x) + 5);
      const d = broken(fn, -40, 1640, rnd, {
        len: [70 + row * 12, 230 + row * 22],
        gap: [34 + row * 3, 96 + row * 12],
        step: 54,
        ok,
        min: 22,
        lead: -rnd() * 140,
      });
      out.push(path(d));
      y += 7.4 + row * 1.35;
      row++;
    }
  }

  // --- the cape
  out.push(
    paperFill(`${smooth(sky)}${smooth(cliff, { cont: true })}${smooth(shore, { cont: true })}Z`),
  );
  out.push(path(`${smooth(sky)}${smooth(cliff, { cont: true })}`));
  out.push(path(smooth(shore)));

  // terraces: long lines that follow the fall of the ground, broken here and there
  const terrace = (k, x0, x1, seedLead = 0) => {
    const fn = (x) => {
      const a = skyY(x);
      const b = shoreY(x);
      return a + (b - a) * k + Math.sin(x / 47 + k * 9) * 1.1;
    };
    return broken(fn, x0, x1, rnd, { len: [120, 330], gap: [16, 44], step: 36, min: 30, lead: seedLead });
  };
  out.push(path(terrace(0.2, -40, 566, 0)));
  out.push(path(terrace(0.4, -40, 700, 30)));
  out.push(path(terrace(0.6, -40, 716, 0)));
  out.push(path(terrace(0.8, -40, 690, 60)));

  // the cliff face: strata that follow the fall of the rock
  out.push(
    path(
      smooth([
        [704, 64],
        [714, 70],
        [719, 80],
        [721, 92],
        [730, 98],
        [735, 108],
        [737, 116],
      ]) +
        smooth([
          [690, 70],
          [699, 77],
          [704, 88],
          [706, 100],
          [714, 106],
          [718, 117],
        ]) +
        smooth([
          [676, 82],
          [684, 90],
          [688, 101],
          [694, 110],
          [697, 120],
        ]) +
        smooth([
          [735, 85],
          [727, 86.5],
          [721, 92],
        ]) +
        smooth([
          [753, 108],
          [744, 108.5],
          [735, 108],
        ]),
    ),
  );
  // rocks at its foot
  const skerry = (x, y, w, h, lean = 0) =>
    papered(
      smooth([
        [x - w / 2, y],
        [x - w * 0.36 + lean, y - h * 0.7],
        [x - w * 0.02 + lean, y - h],
        [x + w * 0.32 + lean, y - h * 0.66],
        [x + w / 2, y],
      ]),
    ) + path(smooth([[x - w / 2 - 5, y + 0.4], [x, y + 1.1], [x + w / 2 + 6, y + 0.3]]));
  out.push(skerry(788, 122.5, 19, 10, 1) + skerry(809, 123.5, 11, 5.5, -1) + skerry(836, 122, 8, 3.5));

  // --- the columns on the cape (as at Sounion): four under their beam, one standing free, one stump
  {
    const x0 = 596;
    const ground = 58;
    const base = ground - 6.6;
    const w = 106;
    // the stepped platform
    out.push(
      papered(
        poly(
          [
            [x0 - 5, ground],
            [x0 - 5, ground - 3.3],
            [x0 - 0.5, ground - 3.3],
            [x0 - 0.5, base],
            [x0 + w + 0.5, base],
            [x0 + w + 0.5, ground - 3.3],
            [x0 + w + 5, ground - 3.3],
            [x0 + w + 5, ground],
          ],
          true,
        ),
      ) + path(`M${f(x0 - 0.5)} ${f(ground - 3.3)}H${f(x0 + w + 0.5)}`),
    );
    const column = (c, h, cap = true) => {
      const wb = 8.2;
      const wt = 6.6;
      const yT = base - h;
      if (!cap)
        return papered(
          poly([
            [c - wb / 2, base],
            [c - wb / 2 + 0.5, yT + 2.4],
            [c - 0.6, yT],
            [c + 1.6, yT + 3],
            [c + wb / 2 - 0.4, yT + 1.4],
            [c + wb / 2, base],
          ]),
        );
      return papered(
        poly([
          [c - wb / 2, base],
          [c - wt / 2, yT],
          [c - 5.3, yT - 2.3],
          [c - 5.3, yT - 4.8],
          [c + 5.3, yT - 4.8],
          [c + 5.3, yT - 2.3],
          [c + wt / 2, yT],
          [c + wb / 2, base],
        ]),
      );
    };
    const h = 33;
    const cols = [0, 1, 2, 3].map((i) => x0 + 8.5 + i * 16.4);
    cols.forEach((c) => out.push(column(c, h)));
    // the beam over the four
    const yB = base - h - 4.8;
    out.push(
      papered(
        poly(
          [
            [cols[0] - 7, yB],
            [cols[0] - 7, yB - 6.6],
            [cols[3] + 7.4, yB - 6.6],
            [cols[3] + 7.4, yB],
          ],
          true,
        ),
      ),
    );
    out.push(column(x0 + 8.5 + 4.25 * 16.4, h));
    out.push(column(x0 + 8.5 + 5.55 * 16.4, 13, false));
  }

  // --- trees: tamarisks bent by the meltemi, and one olive beside the columns
  // base at 0,0, about 42 tall, the crown swept to the right
  const tamarisk = (x, y, s = 1, lean = 0) => {
    const t = place({ x, y, s, rot: lean });
    const crown = [
      [-11, -21],
      [-8.5, -31],
      [1, -38.5],
      [15, -41.5],
      [29, -38.5],
      [41, -32],
      [51, -24],
    ].map(t);
    const under = [
      [51, -24],
      [39, -22],
      [26, -21.5],
      [13, -19.5],
      [1, -18.5],
      [-11, -21],
    ].map(t);
    const d = `M${xy(crown[0])}${scallops(crown, 0.62)}${scallops(under, 0.78)}Z`;
    const trunk =
      smooth([[0, 0], [1.2, -8], [4.4, -15], [9.5, -21.5]].map(t)) +
      smooth([[3.6, -12.5], [1.2, -16.5], [-2.4, -20]].map(t)) +
      smooth([[7.2, -18.6], [13, -20.6], [21, -21.6]].map(t));
    const inner =
      `M${xy(t([-2, -27]))}${scallops([[-2, -27], [9, -32]].map(t), 0.68)}` +
      `M${xy(t([14, -31.5]))}${scallops([[14, -31.5], [27, -31]].map(t), 0.68)}` +
      `M${xy(t([30, -27.5]))}${scallops([[30, -27.5], [40, -25]].map(t), 0.7)}`;
    return path(trunk) + papered(d) + path(inner);
  };
  // a lone olive: forked trunk, round lobed crown
  const olive = (x, y, s = 1) => {
    const t = place({ x, y, s });
    const crown = [
      [-17, -17],
      [-16, -27],
      [-6, -34.5],
      [8, -35.5],
      [18, -28.5],
      [21.5, -18],
    ].map(t);
    const under = [
      [21.5, -18],
      [10, -14],
      [-4, -13.5],
      [-17, -17],
    ].map(t);
    const d = `M${xy(crown[0])}${scallops(crown, 0.62)}${scallops(under, 0.8)}Z`;
    const trunk =
      smooth([[0.5, 0], [-1.4, -5.5], [1.4, -10], [-0.6, -15.5]].map(t)) + smooth([[0.6, -8.6], [4.6, -11.6], [8, -15.6]].map(t));
    const inner =
      `M${xy(t([-9, -22]))}${scallops([[-9, -22], [0, -26.5]].map(t), 0.68)}` +
      `M${xy(t([4, -25.5]))}${scallops([[4, -25.5], [13, -22.5]].map(t), 0.68)}`;
    return path(trunk) + papered(d) + path(inner);
  };
  out.push(tamarisk(86, 70.5, 0.86, -2));
  out.push(tamarisk(126, 76, 0.66, 3));
  out.push(tamarisk(300, 122, 1.08, 0));
  out.push(tamarisk(444, 106, 0.8, -3));
  out.push(tamarisk(196, 152, 1.2, 2));
  out.push(olive(552, 59, 0.82));

  // --- the islet: low, terraced, one tamarisk on its back, skerries trailing off its end
  out.push(paperFill(`${smooth(isleTop)}${smooth(isleShore, { cont: true })}Z`));
  out.push(path(smooth(isleTop)));
  out.push(path(smooth(isleShore)));
  {
    const fn = (k) => (x) => {
      const a = isleTopY(x);
      const b = isleShoreY(x);
      return a + (b - a) * k + Math.sin(x / 29) * 0.7;
    };
    out.push(path(broken(fn(0.34), 1176, 1330, rnd, { len: [60, 120], gap: [14, 26], step: 30, min: 24 })));
    out.push(path(broken(fn(0.66), 1150, 1346, rnd, { len: [70, 130], gap: [14, 30], step: 30, min: 24, lead: 14 })));
  }
  out.push(tamarisk(1232, 91, 0.6, -2));
  out.push(skerry(1392, 123.5, 15, 7, -1) + skerry(1416, 124.5, 8, 3.6));

  // --- a sail far off, standing still on the horizon
  {
    const [sx, sy] = [1066, 119.6];
    out.push(
      papered(poly([[sx, sy - 1.4], [sx + 0.4, sy - 14.5], [sx + 8.4, sy - 1.6]], true)) +
        papered(poly([[sx - 1.8, sy - 2], [sx - 1.6, sy - 11], [sx - 7, sy - 2.2]], true)) +
        path(smooth([[sx - 9, sy + 0.6], [sx, sy + 1.8], [sx + 10.5, sy + 0.5]])),
    );
  }

  return svg(300, 2.2, out.join(''));
}

// ====================================================================================
// NEAR: the sea in the foreground.  Horizon would be y 166; the first wave line runs at y 236.
// Bands of water come nearer and darker: paper, light blue, then the ink of deep water with
// slow darker swells in it. Dolphins leap in the middle, sea-worn rocks stand at the right.
// ====================================================================================
function near() {
  const rnd = prng(67);
  const out = [];
  const BOTTOM = 362;
  const across = (fn, step = 40) => smooth(sample(fn, -40, 1640, step));
  const band = (fn, step = 40) => `${across(fn, step)}V${BOTTOM}H-40Z`;

  const w1 = swell(236, [
    [3.2, 176, 0.4],
    [1.5, 430, 2.1],
  ]);
  const w2 = swell(259, [
    [4.6, 250, 1.7],
    [2, 610, 0.3],
  ]);
  const w3 = swell(294, [
    [6.2, 340, 3.4],
    [2.6, 790, 1.2],
  ]);
  const w4 = swell(329, [
    [4.4, 460, 0.9],
    [2, 1100, 2.6],
  ]);

  // --- dolphins, leaping in front of the calm water and falling back behind the first wave.
  // Built along an arc: tail at u 0, beak at u 1; `top` and `bot` are the half-widths of the body.
  const dolphin = (pl, { L = 100, bend = 1.25 } = {}) => {
    const t = place(pl);
    const R = L / bend;
    const th = (u) => -bend / 2 + bend * u;
    const c = (u) => [R * (Math.sin(th(u)) + Math.sin(bend / 2)), R * (-Math.cos(th(u)) + Math.cos(bend / 2))];
    const nrm = (u) => [Math.sin(th(u)), -Math.cos(th(u))];
    const tan = (u) => [Math.cos(th(u)), Math.sin(th(u))];
    const top = lookup([
      [0, 2.3],
      [0.14, 3.7],
      [0.3, 6.6],
      [0.45, 9.3],
      [0.6, 10.6],
      [0.72, 10.4],
      [0.81, 9.2],
      [0.87, 7],
      [0.915, 4.2],
      [0.95, 2.9],
      [1, 1.5],
    ]);
    const bot = lookup([
      [0, 2.3],
      [0.14, 3.4],
      [0.3, 5.6],
      [0.45, 7.6],
      [0.6, 8.6],
      [0.72, 8.4],
      [0.82, 7.2],
      [0.9, 4.8],
      [0.95, 3],
      [1, 1.5],
    ]);
    const at = (u, off) => {
      const p = c(u);
      const n = nrm(u);
      return [p[0] + n[0] * off, p[1] + n[1] * off];
    };
    const us = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.78, 0.83, 0.87, 0.9, 0.925, 0.95, 0.975, 1];
    const dorsal = us.map((u) => at(u, top(u)));
    const ventral = us.map((u) => at(u, -bot(u))).reverse();
    const tip = (() => {
      const p = c(1);
      const tg = tan(1);
      return [p[0] + tg[0] * 1.6, p[1] + tg[1] * 1.6];
    })();
    // tail flukes
    const p0 = c(0);
    const t0 = tan(0);
    const n0 = nrm(0);
    const fl = (a, b) => [p0[0] - t0[0] * a + n0[0] * b, p0[1] - t0[1] * a + n0[1] * b];
    const body =
      smooth([...dorsal, tip, ...ventral].map(t)) +
      `Q${xy(t(fl(1.5, -10)))} ${xy(t(fl(13, -13.5)))}` +
      `Q${xy(t(fl(8, -5)))} ${xy(t(fl(6.5, 0)))}` +
      `Q${xy(t(fl(8, 5)))} ${xy(t(fl(13, 13.5)))}` +
      `Q${xy(t(fl(1.5, 10)))} ${xy(t(dorsal[0]))}Z`;
    // dorsal fin, swept back, drawn behind the body
    const fin =
      `M${xy(t(at(0.6, top(0.6) - 1)))}` +
      `Q${xy(t(at(0.54, top(0.54) + 13)))} ${xy(t(at(0.41, top(0.41) + 13.5)))}` +
      `Q${xy(t(at(0.47, top(0.47) + 4.5)))} ${xy(t(at(0.455, top(0.455) - 1)))}`;
    // flipper, drawn over the body
    const flipper =
      `M${xy(t(at(0.77, -bot(0.77) * 0.42)))}` +
      `Q${xy(t(at(0.7, -bot(0.7) - 8)))} ${xy(t(at(0.585, -bot(0.585) - 9.5)))}` +
      `Q${xy(t(at(0.66, -bot(0.66) - 1.5)))} ${xy(t(at(0.69, -bot(0.69) * 0.5)))}`;
    // the line along the flank, from behind the eye to the tail: blue back above it, pale belly below
    const flankU = [0.1, 0.2, 0.32, 0.44, 0.56, 0.68, 0.78, 0.86, 0.905];
    const flankOff = [0.3, 0.2, -0.6, -1.4, -1.8, -1.2, 0.4, 0.4, -1.6];
    const flank = flankU.map((u, i) => at(u, flankOff[i]));
    const back = us.filter((u) => u >= 0.1 && u <= 0.905).map((u) => at(u, top(u)));
    const backWash = `${smooth([at(0.1, top(0.1)), ...back, at(0.905, top(0.905))].map(t))}${smooth([...flank].reverse().map(t), { cont: true })}Z`;
    const eye = t(at(0.862, 1.3));
    const mouth = smooth([at(0.995, -0.5), at(0.95, -1.1), at(0.905, -1.6)].map(t));
    return (
      papered(fin) +
      papered(body) +
      path(backWash, `fill="${LIGHT}" stroke="none"`) +
      path(body) +
      path(smooth(flank.map(t)) + mouth) +
      papered(flipper) +
      `<circle cx="${f(eye[0])}" cy="${f(eye[1])}" r="${f(1.5 * (pl.s ?? 1))}" fill="currentColor" stroke="none"/>`
    );
  };
  out.push(dolphin({ x: 1010, y: 232, s: 0.92, rot: 24 }));
  out.push(dolphin({ x: 866, y: 238, s: 1.12, rot: -8 }));

  // --- first band: paper, one wave line and a broken one under it
  out.push(paperFill(band(w1)));
  out.push(path(across(w1)));
  out.push(
    path(
      broken((x) => (w1(x) + w2(x)) / 2 + 0.6, -40, 1640, rnd, {
        len: [120, 300],
        gap: [40, 110],
        step: 42,
        min: 40,
        lead: -60,
      }),
    ),
  );
  // rings where the dolphins leave and meet the water
  const ripple = (x, y, w) =>
    smooth([[x - w, y], [x - w * 0.4, y + 2.2], [x + w * 0.4, y + 2.2], [x + w, y]]) +
    smooth([[x - w * 0.55, y + 5], [x, y + 6.4], [x + w * 0.55, y + 5]]);
  out.push(path(ripple(872, 241.5, 17) + ripple(987, 241, 14) + ripple(1093, 241.5, 15)));

  // --- sea-worn rocks at the right: paper tops, the faces in a light wash printed a little off register
  const rock = (outline, shoulder, marks = []) => {
    const d = smooth(outline, { closed: true });
    const s0 = shoulder[0];
    const s1 = shoulder[shoulder.length - 1];
    const lower = outline.filter(([x, y]) => y > Math.min(s0[1], s1[1]) - 1);
    // the face: under the shoulder line, shifted down and to the right like a second printing
    const right = lower.filter(([x]) => x > (s0[0] + s1[0]) / 2).sort((a, b) => a[1] - b[1]);
    const left = lower.filter(([x]) => x <= (s0[0] + s1[0]) / 2).sort((a, b) => b[1] - a[1]);
    const face = [...shoulder, ...right, ...left].map(([x, y]) => [x + 5, y + 4]);
    return papered(d) + path(smooth(face, { closed: true }), `fill="${LIGHT}" stroke="none"`) + path(d) + path(smooth(shoulder) + marks.map((m) => smooth(m)).join(''));
  };
  out.push(
    rock(
      [
        [1404, 284],
        [1397, 252],
        [1401, 222],
        [1414, 194],
        [1436, 170],
        [1464, 151],
        [1498, 138],
        [1534, 131],
        [1570, 130],
        [1604, 137],
        [1632, 149],
        [1654, 164],
        [1662, 284],
      ],
      [
        [1401, 222],
        [1432, 207],
        [1470, 201],
        [1508, 206],
        [1548, 199],
        [1594, 187],
        [1632, 178],
        [1656, 172],
      ],
      [
        [
          [1432, 236],
          [1468, 229],
          [1502, 234],
        ],
        [
          [1540, 226],
          [1586, 217],
          [1632, 213],
        ],
        [
          [1508, 206],
          [1503, 222],
          [1510, 242],
        ],
        [
          [1470, 168],
          [1508, 158],
          [1548, 156],
        ],
      ],
    ),
  );
  out.push(
    rock(
      [
        [1290, 284],
        [1285, 258],
        [1291, 234],
        [1306, 214],
        [1328, 200],
        [1354, 193],
        [1380, 195],
        [1402, 205],
        [1418, 222],
        [1426, 246],
        [1428, 284],
      ],
      [
        [1291, 234],
        [1316, 226],
        [1348, 229],
        [1382, 224],
        [1418, 224],
      ],
      [
        [
          [1310, 250],
          [1340, 245],
          [1366, 249],
        ],
        [
          [1348, 229],
          [1345, 240],
        ],
      ],
    ),
  );
  out.push(
    rock(
      [
        [1214, 284],
        [1215, 258],
        [1226, 243],
        [1244, 234.5],
        [1262, 235.5],
        [1276, 245],
        [1282, 260],
        [1283, 284],
      ],
      [
        [1216, 256],
        [1238, 250],
        [1260, 252.5],
        [1281, 256],
      ],
    ),
  );
  out.push(
    papered(
      smooth([
        [1132, 262],
        [1140, 251],
        [1156, 245.5],
        [1174, 246],
        [1188, 252],
        [1196, 262],
      ]),
    ),
  );

  // --- second band: light blue
  out.push(path(band(w2), `fill="${LIGHT}"`));
  out.push(
    path(
      broken((x) => w2(x) * 0.68 + w3(x) * 0.32 + 0.4, -40, 1640, rnd, { len: [150, 360], gap: [36, 90], step: 44, min: 50, lead: -30 }) +
        broken((x) => w2(x) * 0.36 + w3(x) * 0.64 + 0.6, -40, 1640, rnd, { len: [130, 320], gap: [50, 130], step: 44, min: 50, lead: -110 }),
    ),
  );

  // --- deep water: the ink band, light lines riding near its top, slow darker swells below
  out.push(path(band(w3), 'fill="currentColor"'));
  out.push(
    path(
      broken((x) => w3(x) * 0.62 + w4(x) * 0.38 + 0.4, -40, 1640, rnd, { len: [150, 380], gap: [70, 170], step: 46, min: 60, lead: -80 }),
      `stroke="${LIGHT}"`,
    ),
  );
  out.push(path(band(w4, 56), `fill="${DEEP}" stroke="none"`));

  return svg(360, 2.6, out.join(''));
}

for (const [name, body] of [
  ['footer-aegean-far', far()],
  ['footer-aegean-mid', mid()],
  ['footer-aegean-near', near()],
]) {
  writeFileSync(resolve(outDir, `${name}.svg`), body);
  console.log(name, `${(body.length / 1024).toFixed(1)} KB`);
}
