// Generates the three layers of the Aegean footer scene (Courses pages):
//   footer-aegean-far.svg   sky: low sun in rings, clouds, gulls, far islands on the horizon
//   footer-aegean-mid.svg   calm water, the cape with its columns, an islet
//   footer-aegean-near.svg  the sea in the foreground: wave bands, dolphins, sea-worn rocks, deep water
// node scripts/illustrations/aegean-gen.mjs
//
// Footer.astro stacks the layers in a 1600 x 525 box: far sits 21 units from the top, mid 210.8,
// near 165. The horizon is one line in all three: far y 269, mid y 79, near y 125.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/assets/illustrations');
const PAPER = 'var(--paper, #f2e9d3)';
const LIGHT = 'var(--blue-light, #b3c0f3)';
const TAU = Math.PI * 2;
const SUN_X = 838; // the sun and its path on the water share one x in the far and mid layers

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
// affine placement of a local drawing: scale, rotate (degrees), then move
const place = ({ x = 0, y = 0, s = 1, rot = 0, flip = false }) => {
  const c = Math.cos((rot * Math.PI) / 180);
  const sn = Math.sin((rot * Math.PI) / 180);
  return ([px, py]) => {
    const qx = (flip ? -px : px) * s;
    const qy = py * s;
    return [x + qx * c - qy * sn, y + qx * sn + qy * c];
  };
};
// a cubic path from a start point and [c1, c2, p] triples, optionally placed
const cubic = (start, segs, t = (p) => p, close = false) =>
  `M${xy(t(start))}` + segs.map((s) => `C${s.map((p) => xy(t(p))).join(' ')}`).join('') + (close ? 'Z' : '');
// scallops: circular arcs from point to point, bulging to the left of travel when sweep is 1 on screen
const scallops = (pts, k = 0.8, sweep = 1) =>
  pts
    .slice(1)
    .map((p, i) => {
      const r = Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) * k;
      return `A${f(r)} ${f(r)} 0 0 ${sweep} ${xy(p)}`;
    })
    .join('');

const svg = (h, sw, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 ${h}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
const path = (d, attrs = '') => `<path ${attrs ? attrs + ' ' : ''}d="${d}"/>`;
const paperFill = (d) => path(d, `fill="${PAPER}" stroke="none"`);
const wash = (d, nodraw = true) => path(d, `fill="${LIGHT}" stroke="none"${nodraw ? ' data-nodraw' : ''}`);

// ====================================================================================
// FAR: sky, sun, clouds, gulls, far islands.  Horizon at y 269.
// ====================================================================================
function far() {
  const H = 269;
  const rnd = prng(7);
  const out = [];

  // --- the sun, low over the water, in widening rings that break up as they go out
  const [cx, cy] = [SUN_X, 258];
  const below = H + 36; // rings are drawn a little below the horizon: the sea in the mid layer hides them
  out.push(`<circle cx="${cx}" cy="${cy}" r="30"/>`);
  const rings = [
    { r: 44, parts: 1, gap: 0 },
    { r: 59, parts: 1, gap: 0 },
    { r: 75, parts: 3, gap: 0.07 },
    { r: 92, parts: 5, gap: 0.13 },
    { r: 110, parts: 8, gap: 0.24 },
    { r: 129, parts: 11, gap: 0.42 },
  ];
  for (const { r, parts, gap } of rings) {
    const a0 = -Math.asin(Math.min(1, (below - cy) / r));
    const span = Math.PI - 2 * a0;
    const slot = span / parts;
    let d = '';
    for (let i = 0; i < parts; i++) {
      const j0 = parts > 1 ? (rnd() - 0.5) * slot * 0.18 : 0;
      const a1 = a0 + i * slot + (slot * gap) / 2 + j0;
      const a2 = a0 + (i + 1) * slot - (slot * gap) / 2 + j0;
      const p1 = [cx + r * Math.cos(a1), cy - r * Math.sin(a1)];
      const p2 = [cx + r * Math.cos(a2), cy - r * Math.sin(a2)];
      d += `M${xy(p1)}A${r} ${r} 0 ${a2 - a1 > Math.PI ? 1 : 0} 0 ${xy(p2)}`;
    }
    out.push(path(d));
  }

  // --- far islands: long low silhouettes in a light wash, one behind another
  const island = (pts, contours) => {
    const top = pts.map(([x, h]) => [x, H - h]);
    const h = lookup(pts);
    const d = smooth(top);
    out.push(wash(`${d}V${H + 60}H${f(top[0][0])}Z`));
    out.push(path(d));
    for (const [x0, x1, k, lift = 0] of contours) {
      out.push(path(smooth(sample((x) => H - h(x) * k - lift + Math.sin(x / 23) * 0.8, x0, x1, 26))));
    }
  };
  // left: a high island behind the cape
  island(
    [
      [-40, 44],
      [0, 52],
      [38, 58],
      [72, 58],
      [108, 50],
      [150, 40],
      [196, 33],
      [236, 29],
      [272, 21],
      [306, 11],
      [334, 0],
      [356, -14],
      [372, -34],
    ],
    [
      [-40, 150, 0.74],
      [30, 250, 0.5],
      [-40, 120, 0.3],
    ],
  );
  // right: high ground running off the edge, behind the long low one
  island(
    [
      [1296, -34],
      [1322, -14],
      [1350, 2],
      [1392, 17],
      [1436, 33],
      [1478, 47],
      [1518, 56],
      [1556, 58],
      [1592, 52],
      [1626, 45],
      [1660, 42],
    ],
    [
      [1440, 1640, 0.72],
      [1420, 1560, 0.46],
      [1500, 1640, 0.24],
    ],
  );
  island(
    [
      [968, -34],
      [984, -12],
      [1000, 2],
      [1024, 14],
      [1052, 26],
      [1088, 33],
      [1122, 32],
      [1160, 24],
      [1204, 16],
      [1250, 12],
      [1296, 14],
      [1338, 20],
      [1372, 21],
      [1404, 15],
      [1432, 6],
      [1452, -6],
      [1470, -34],
    ],
    [
      [1010, 1190, 0.66],
      [1050, 1150, 0.36],
      [1290, 1420, 0.55],
    ],
  );

  // --- clouds: low scallops on a flat base, the wash printed a little off register, streaks trailing
  const cloud = (x, y, s, lobes, inner, streaks) => {
    const t = place({ x, y, s });
    const pts = lobes.map(t);
    const base = [pts[pts.length - 1], t([(lobes[0][0] + lobes[lobes.length - 1][0]) / 2, 1.6]), pts[0]];
    const d = `M${xy(pts[0])}${scallops(pts, 0.66)}${smooth(base, { cont: true })}Z`;
    const off = place({ x: x + 6 * s, y: y + 4.5 * s, s });
    const wpts = lobes.map(off);
    const wbase = [wpts[wpts.length - 1], off([(lobes[0][0] + lobes[lobes.length - 1][0]) / 2, 1.6]), wpts[0]];
    out.push(paperFill(d));
    out.push(wash(`M${xy(wpts[0])}${scallops(wpts, 0.66)}${smooth(wbase, { cont: true })}Z`));
    out.push(path(d));
    out.push(path(inner.map((arc) => `M${xy(t(arc[0]))}${scallops(arc.map(t), 0.68)}`).join('')));
    out.push(path(streaks.map(([x0, x1, yy]) => smooth([t([x0, yy]), t([(x0 + x1) / 2, yy + 1.2]), t([x1, yy - 0.4])])).join('')));
  };
  cloud(
    1168,
    150,
    1,
    [
      [0, 0],
      [22, -13],
      [56, -25],
      [98, -21],
      [132, -9],
      [158, 0],
    ],
    [
      [
        [34, -6],
        [58, -13],
      ],
      [
        [74, -11],
        [104, -9],
      ],
    ],
    [
      [-46, 34, 9],
      [112, 204, 10],
    ],
  );
  cloud(
    318,
    124,
    0.92,
    [
      [0, 0],
      [26, -12],
      [64, -20],
      [100, -24],
      [140, -12],
      [164, 0],
    ],
    [
      [
        [42, -5],
        [70, -10],
      ],
      [
        [92, -12],
        [120, -8],
      ],
    ],
    [
      [-58, 22, 8],
      [128, 196, 11],
    ],
  );
  cloud(
    884,
    176,
    0.7,
    [
      [0, 0],
      [24, -12],
      [60, -20],
      [96, -9],
      [118, 0],
    ],
    [
      [
        [34, -6],
        [60, -10],
      ],
    ],
    [[84, 168, 9]],
  );

  // --- gulls
  const gull = (x, y, w, tilt = 0) => {
    const t = place({ x, y, s: w / 10, rot: tilt });
    return `M${xy(t([-10, -1]))}Q${xy(t([-5.5, -6.5]))} ${xy(t([0, 0]))}Q${xy(t([4.5, -6]))} ${xy(t([10, -2.5]))}`;
  };
  out.push(path(gull(1010, 96, 9, -6) + gull(1046, 112, 6.5, 4) + gull(1078, 90, 5, -3)));
  out.push(path(gull(560, 78, 7.5, 5) + gull(596, 62, 5, -4)));

  return svg(420, 2, out.join(''));
}

// ====================================================================================
// MID: calm water, the cape with its columns, an islet.  Horizon at y 79.
// The cape is seen from a little above: its level top lies on the horizon, the columns
// stand against the sky and the sea shows beyond the low neck of land on the left.
// ====================================================================================
function mid() {
  const H = 79;
  const rnd = prng(23);
  const out = [];

  // --- the sea: paper down to the bottom, so the far layer sinks behind the horizon
  out.push(paperFill(`M-40 ${H}H1640V302H-40Z`));
  out.push(path(smooth(sample((x) => H + Math.sin(x / 190) * 0.35, -40, 1640, 210))));

  // --- the sun's path on the water: a spindle of short wavy strokes
  const glitterHalf = (y) => {
    const t = (y - H) / 100;
    return 8 + 30 * Math.sin(Math.min(1, t * 1.3) * Math.PI) ** 0.8 * (1 - t * 0.3);
  };
  {
    let d = '';
    let y = H + 6.5;
    let i = 0;
    while (y < H + 94) {
      const half = glitterHalf(y) * (0.82 + rnd() * 0.3);
      const off = (rnd() - 0.5) * 8;
      const n = Math.max(2, Math.round(half / 5.5));
      const pts = Array.from({ length: n * 2 + 1 }, (_, k) => {
        const u = k / (n * 2);
        return [SUN_X + off - half + u * half * 2, y + (k % 2 ? -1 : 1) * 1.3 * (i % 2 ? 1 : -1)];
      });
      d += smooth(pts);
      y += 7.4 + i * 0.8;
      i++;
    }
    out.push(path(d));
  }

  // --- calm water: long level strokes with wide gaps, further apart as they come nearer
  {
    let y = H + 9.5;
    let row = 0;
    while (y < 232) {
      const keepOut = glitterHalf(Math.min(y, H + 92)) + 24;
      let d = '';
      let x = -40 - rnd() * 160;
      while (x < 1640) {
        const len = 80 + rnd() * (row < 3 ? 260 : 200);
        const gapAfter = 60 + rnd() * (150 + row * 16);
        const x0 = x;
        let x1 = x + len;
        // leave the sun's path clear
        if (x1 > SUN_X - keepOut && x0 < SUN_X + keepOut) {
          if (x0 < SUN_X - keepOut - 40) x1 = SUN_X - keepOut;
          else {
            x = SUN_X + keepOut + rnd() * 40;
            continue;
          }
        }
        const ph = rnd() * TAU;
        const amp = 0.5 + row * 0.13;
        d += smooth(sample((xx) => y + Math.sin(xx / (60 + row * 6) + ph) * amp, x0, x1, 48));
        x = x1 + gapAfter;
      }
      out.push(path(d));
      y += 9.6 + row * 1.5;
      row++;
    }
  }

  // --- small trees and shrubs
  // a tamarisk bent by the meltemi: base at 0,0, about 30 tall, swept to the right
  const tamarisk = (x, y, s = 1, lean = 0) => {
    const t = place({ x, y, s, rot: lean });
    const crown = [
      [-5, -15],
      [-1.5, -23],
      [7, -28.5],
      [18, -28],
      [28, -23.5],
      [36, -16.5],
    ].map(t);
    const under = [
      [36, -16.5],
      [26, -13.5],
      [15, -12.5],
      [5, -13],
      [-5, -15],
    ].map(t);
    const d = `M${xy(crown[0])}${scallops(crown, 0.64)}${scallops(under, 0.75)}Z`;
    return (
      path(cubic([0, 0], [[[0.4, -6], [2.2, -11], [7, -15.5]]], t) + cubic([3.2, -10.5], [[[7, -12.5], [12, -12], [17, -15]]], t)) +
      path(d, `fill="${PAPER}"`) +
      path(
        `M${xy(t([1, -18.5]))}${scallops([[1, -18.5], [9, -22.5]].map(t), 0.7)}M${xy(t([13, -21.5]))}${scallops([[13, -21.5], [22, -21.5]].map(t), 0.7)}M${xy(t([24, -19]))}${scallops([[24, -19], [31, -16.5]].map(t), 0.7)}`,
      )
    );
  };
  // a lone olive: forked trunk, round lobed crown
  const olive = (x, y, s = 1) => {
    const t = place({ x, y, s });
    const crown = [
      [-13, -17],
      [-14.5, -25],
      [-8, -31.5],
      [1, -34],
      [10, -31],
      [15.5, -24],
      [13.5, -16.5],
      [5, -13.5],
      [-5, -13.5],
      [-13, -17],
    ].map(t);
    return (
      path(
        cubic([-2.4, 0], [[[-1.6, -4], [-0.6, -7], [-2.2, -10.5]], [[-3.5, -13], [-6, -14.5], [-7.5, -17]]], t) +
          cubic([2.4, 0], [[[1.4, -4], [1.8, -7], [0.8, -10]], [[2.5, -13], [5.5, -14.5], [7.5, -17.5]]], t) +
          cubic([-0.4, -11.5], [[[0, -13.5], [0.2, -15], [0.3, -17]]], t),
      ) +
      path(`M${xy(crown[0])}${scallops(crown, 0.62)}Z`, `fill="${PAPER}"`) +
      path(
        `M${xy(t([-7.5, -22]))}${scallops([[-7.5, -22], [-1, -26.5]].map(t), 0.7)}M${xy(t([2, -26]))}${scallops([[2, -26], [9.5, -22.5]].map(t), 0.7)}M${xy(t([-3, -19]))}${scallops([[-3, -19], [4.5, -19]].map(t), 0.7)}`,
      )
    );
  };
  const shrub = (x, y, r = 4.2) =>
    path(`M${f(x - r)} ${f(y)}A${f(r)} ${f(r * 1.05)} 0 0 1 ${f(x + r)} ${f(y)}Z`, `fill="${PAPER}"`) + path(`M${f(x)} ${f(y)}v${f(r * 0.8)}`);

  // --- the islet off to the right
  {
    const top = [
      [1118, 119],
      [1132, 108],
      [1152, 98],
      [1176, 86],
      [1202, 75],
      [1226, 67],
      [1248, 63.5],
      [1266, 66],
      [1280, 75],
      [1296, 82],
      [1314, 83.5],
      [1330, 92],
      [1344, 104],
      [1356, 114],
      [1364, 119.5],
    ];
    const baseY = 119.5;
    const d = smooth(top);
    out.push(paperFill(`${d}L1364 ${baseY}L1118 ${baseY}Z`));
    out.push(path(d));
    const yTop = lookup(top);
    const strata = [
      [1146, 1240, 0.3],
      [1196, 1318, 0.55],
      [1156, 1344, 0.8],
    ];
    out.push(
      path(
        strata
          .map(([x0, x1, k]) => smooth(sample((x) => yTop(x) + (baseY - yTop(x)) * k + Math.sin(x / 17) * 0.7, x0, x1, 24)))
          .join(''),
      ),
    );
    out.push(tamarisk(1238, 66, 0.9, -3));
    out.push(shrub(1304, 84, 3.6) + shrub(1172, 89, 3.2));
    // detached rocks and the ripples under them
    out.push(path('M1378 120Q1381.5 111 1389.5 111Q1398 112 1401 120M1088 119.5Q1091 113.5 1097 113.5Q1103 114.5 1105 119.5', `fill="${PAPER}"`));
    out.push(
      path(
        'M1110 120.5L1180 120M1198 119.8L1268 120.6M1286 120.2L1370 120.4M1128 127L1192 126.4M1220 127.2L1316 126.6M1340 126.8L1412 127.4M1168 134L1252 133.4M1280 134.2L1344 133.8M1078 126.2L1110 126.6',
      ),
    );
  }

  // --- the cape
  {
    const sky = [
      [-40, 98],
      [30, 92.5],
      [100, 89],
      [170, 91],
      [240, 98.5],
      [310, 105],
      [380, 103],
      [440, 95.5],
      [500, 85.5],
      [545, 78.5],
      [572, 75],
    ];
    const cliff = [
      [720, 75],
      [727, 80.5],
      [728.5, 91],
      [738, 96],
      [742, 110],
      [749, 122],
      [760, 127],
      [765, 140],
      [781, 149.5],
    ];
    const water = [
      [-40, 166],
      [100, 164],
      [260, 161],
      [420, 158],
      [560, 155],
      [690, 152],
      [781, 149.5],
    ];
    const ySky = lookup([...sky, ...cliff]);
    const yWat = lookup(water);
    const outline = `${smooth(sky)}L${cliff.map(xy).join('L')}`;
    out.push(paperFill(`${outline}L${[...water].reverse().map(xy).join('L')}Z`));
    out.push(path(outline));

    // terraces: long lines lying along the slope
    const terrace = (x0, x1, k, ph) => sample((x) => ySky(x) + (yWat(x) - ySky(x)) * k + Math.sin(x / 41 + ph) * 1.2, x0, x1, 30);
    const runs = [
      [20, 300, 0.27, 0.4],
      [352, 560, 0.25, 2.1],
      [-40, 176, 0.51, 1.3],
      [214, 486, 0.5, 3.0],
      [520, 676, 0.47, 0.2],
      [58, 380, 0.75, 2.2],
      [414, 650, 0.74, 1.0],
    ];
    out.push(path(runs.map((r) => smooth(terrace(...r))).join('')));

    // the cliff face: strata falling to the sea, echoing the edge
    {
      const lines = [
        [9, 0, 1],
        [20, 0.25, 1],
        [33, 0, 0.7],
        [48, 0.3, 1],
        [66, 0.1, 0.62],
      ];
      let d = '';
      for (const [dx, from, to] of lines) {
        const pts = cliff
          .map(([x, y], i) => [x - dx - i * 1.1, y + 3.5 + dx * 0.08])
          .filter((_, i) => i / (cliff.length - 1) >= from && i / (cliff.length - 1) <= to)
          .filter(([x, y]) => y < yWat(x) - 2.5);
        if (pts.length > 1) d += poly(pts);
      }
      out.push(path(d));
    }

    // the temple platform and the columns
    {
      const base = 68;
      out.push(path(`M574 75V71.5H716V75`, `fill="${PAPER}"`));
      out.push(path(`M578 71.5V${base}H712V71.5`, `fill="${PAPER}"`));
      const top = 22.5;
      const col = (x, capital = true) => {
        let s = path(`M${f(x - 4.3)} ${base}L${f(x - 3.5)} ${top}H${f(x + 3.5)}L${f(x + 4.3)} ${base}`, `fill="${PAPER}"`);
        if (capital) s += path(`M${f(x - 5.9)} ${top}v-4h11.8v4Z`, `fill="${PAPER}"`);
        return s;
      };
      const xs = [588, 607.4, 626.8, 646.2, 665.6];
      out.push(xs.map((x) => col(x)).join(''));
      out.push(path(`M581.4 18.5V10.5H672.2V18.5Z`, `fill="${PAPER}"`));
      out.push(col(687.5));
      // a broken shaft
      out.push(path(`M699.3 ${base}L699.9 45L703.2 41.5L707.2 46L707.7 ${base}`, `fill="${PAPER}"`));
    }

    // trees on the slopes, all leaning the same way
    out.push(tamarisk(62, 92.5, 1.4, -2));
    out.push(tamarisk(226, 99, 1.2, 2));
    out.push(tamarisk(386, 104, 1.5, -1));
    out.push(tamarisk(462, 112, 1.0, 3));
    out.push(olive(524, 86, 1.3));
    out.push([shrub(140, 111, 4.6), shrub(300, 124, 4.2), shrub(322, 146, 4.8), shrub(500, 121, 4.4), shrub(168, 147, 4.2), shrub(608, 117, 4.2), shrub(14, 131, 4.6), shrub(668, 136, 4)].join(''));

    // rocks at the foot of the cape
    out.push(path('M789 151Q791.5 140.5 800 140Q809 141 812 151M820 151.5Q822.5 145 828 145Q834 146 836 151.5', `fill="${PAPER}"`));

    // the shore: a broken waterline with a few boulders, and ripples lying under it
    {
      let d = '';
      let x = -40;
      while (x < 772) {
        const len = 40 + rnd() * 120;
        const x1 = Math.min(774, x + len);
        d += `M${f(x)} ${f(yWat(x) + 0.4)}L${f(x1)} ${f(yWat(x1) + 0.4)}`;
        x = x1;
        if (rnd() < 0.7) {
          const n = 1 + Math.floor(rnd() * 3);
          for (let i = 0; i < n && x < 762; i++) {
            const w = 8 + rnd() * 9;
            const h = 3.4 + rnd() * 4;
            d += `M${f(x)} ${f(yWat(x) + 0.4)}Q${f(x + w * 0.3)} ${f(yWat(x) - h * 1.9)} ${f(x + w)} ${f(yWat(x + w) + 0.4)}`;
            x += w;
          }
        } else x += 10 + rnd() * 16;
      }
      out.push(path(d));
      let r = '';
      for (const dy of [6.4, 13.2]) {
        let xx = -40 + rnd() * 40;
        while (xx < 850 - dy * 2) {
          const len = 26 + rnd() * 66;
          r += `M${f(xx)} ${f(yWat(xx) + dy)}L${f(xx + len)} ${f(yWat(xx + len) + dy + (rnd() - 0.5) * 0.6)}`;
          xx += len + 22 + rnd() * (44 + dy * 4);
        }
      }
      out.push(path(r));
    }
  }

  return svg(300, 2.2, out.join(''));
}

// ====================================================================================
// NEAR: the sea in the foreground.  The waves begin near y 224; the band of deep water near y 289.
// ====================================================================================
function near() {
  const rnd = prng(41);
  const out = [];

  // a flowing wave: sharper crests than troughs, slowly drifting in phase and height
  const wave = ({ y, a, lam, ph = 0, mod = 0.55, Lam = 880, psi = 0 }) => (x) => {
    const th = (TAU * x) / lam + ph + mod * Math.sin((TAU * x) / Lam + psi);
    const amp = a * (0.78 + 0.22 * Math.sin((TAU * x) / (Lam * 0.63) + psi * 1.7 + 1));
    return y - amp * (Math.cos(th) + 0.16 * Math.cos(2 * th));
  };
  const edge = (fn, lam) => smooth(sample(fn, -40, 1640, lam / 9));
  // broken lines that follow a wave lower down in the same band
  const followers = (spec, lam, drops, { minLen = 150, maxLen = 420, gap = 70 } = {}) => {
    let d = '';
    drops.forEach(([dy, k, shift], i) => {
      const fn = wave({ ...spec, y: spec.y + dy, a: spec.a * k, ph: (spec.ph ?? 0) - shift });
      let x = -40 - rnd() * 160;
      while (x < 1640) {
        const len = minLen + rnd() * (maxLen - minLen);
        d += smooth(sample(fn, x, Math.min(1650, x + len), lam / 9));
        x += len + gap * (0.6 + rnd() * 1.1) + i * 12;
      }
    });
    return d;
  };

  const A = { y: 224, a: 3.6, lam: 132, ph: 0.6, psi: 0.4 };
  const B = { y: 254, a: 5.6, lam: 204, ph: 2.2, psi: 1.9, Lam: 990 };
  const D = { y: 289, a: 5.2, lam: 330, ph: 1.2, psi: 5.0, Lam: 1400 };

  // --- sea-worn rocks at the right, the furthest first
  const rock = (pts, marks = '') => path(`${smooth(pts)}Z`, `fill="${PAPER}"`) + (marks ? path(marks) : '');
  out.push(
    rock(
      [
        [1492, 250],
        [1497, 214],
        [1510, 193],
        [1532, 179],
        [1560, 171],
        [1594, 169],
        [1624, 177],
        [1646, 191],
        [1662, 209],
        [1670, 250],
      ],
      'M1520 200C1544 192 1576 190 1604 196M1552 214C1580 208 1612 210 1640 220M1588 170C1584 178 1586 186 1592 194',
    ),
  );

  // --- dolphins, leaping in front of the first band
  const dolphin = (pl) => {
    const t = place(pl);
    const body = cubic(
      [13, 42],
      [
        [[22, 30], [33, 19], [45, 15.5]],
        [[47, 12], [47.5, 7], [48.5, 3]],
        [[53, 6], [57, 10], [59, 14.5]],
        [[68, 15.5], [78, 20], [85, 27.5]],
        [[87.5, 30], [89, 33], [91, 34.5]],
        [[94, 36], [97, 38.5], [99, 41.5]],
        [[96, 42.5], [92, 42.5], [88, 41.5]],
        [[82, 41], [76, 39], [70, 37.5]],
        [[58, 34.5], [44, 34], [33, 38]],
        [[26, 41], [20, 45], [16, 48.5]],
        [[14, 51], [11, 55], [5, 58]],
        [[7, 54], [8, 50], [8.5, 47.5]],
        [[6, 45], [3, 42], [0, 37]],
        [[5, 38], [9, 39.5], [13, 42]],
      ],
      t,
      true,
    );
    const fin = cubic([73, 38], [[[73, 43], [70, 48], [65, 51]], [[65, 46], [66, 42], [67, 37.5]]], t);
    const face = `M${xy(t([97.5, 41.3]))}L${xy(t([90, 38.6]))}M${xy(t([84.5, 32.6]))}l0.01 0`;
    return path(body, `fill="${PAPER}"`) + path(fin, `fill="${PAPER}"`) + path(face);
  };
  out.push(dolphin({ x: 968, y: 190, s: 0.62, rot: -14 }));
  out.push(dolphin({ x: 1040, y: 204, s: 0.55, rot: 30 }));

  // --- band A: small waves, paper
  out.push(path(`${edge(wave(A), A.lam)}V362H-40Z`, `fill="${PAPER}"`));
  out.push(path(followers(A, A.lam, [[9.4, 0.8, 0.5], [18.8, 0.62, 1.1]], { minLen: 130, maxLen: 350, gap: 70 })));

  // the big rock and a smaller one beside it, standing in the first band
  out.push(
    rock(
      [
        [1350, 280],
        [1354, 250],
        [1365, 227],
        [1384, 208],
        [1410, 197],
        [1441, 194],
        [1470, 200],
        [1492, 214],
        [1506, 234],
        [1512, 280],
      ],
      'M1372 224C1398 214 1432 214 1462 224C1478 229 1490 238 1500 248M1396 240C1418 234 1444 236 1464 246M1446 194.5C1440 202 1440 210 1445 217',
    ),
  );
  out.push(
    rock(
      [
        [1284, 280],
        [1288, 258],
        [1300, 244],
        [1320, 238],
        [1340, 243],
        [1350, 258],
        [1353, 280],
      ],
      'M1300 256C1314 250 1330 251 1342 259',
    ),
  );

  // --- band B: larger waves, in a light wash
  out.push(path(`${edge(wave(B), B.lam)}V362H-40Z`, `fill="${LIGHT}"`));
  out.push(
    rock(
      [
        [1206, 310],
        [1212, 288],
        [1228, 277],
        [1252, 275],
        [1272, 282],
        [1280, 310],
      ],
      'M1224 290C1238 285 1254 286 1266 293',
    ),
  );
  out.push(path(followers(B, B.lam, [[11.5, 0.8, 0.45], [23, 0.58, 0.9]], { minLen: 200, maxLen: 480, gap: 90 })));

  // --- deep water: the solid band the copyright line sits on
  const deep = wave(D);
  out.push(path(`${edge(deep, D.lam)}V362H-40Z`, `fill="currentColor"`));
  // pebbles and low rocks breaking the surface, as silhouettes
  const pebble = (x, w, h) => {
    const y = deep(x + w / 2) + 3;
    return `M${f(x)} ${f(y)}C${f(x + w * 0.05)} ${f(y - h * 1.25)} ${f(x + w * 0.8)} ${f(y - h * 1.35)} ${f(x + w)} ${f(y)}Z`;
  };
  out.push(
    path(
      [pebble(1166, 22, 8), pebble(1192, 13, 5), pebble(1296, 30, 11), pebble(1334, 16, 6), pebble(1546, 34, 12), pebble(1586, 18, 7)].join(''),
      `fill="currentColor"`,
    ),
  );
  out.push(path(followers(D, D.lam, [[11, 0.7, 0.5]], { minLen: 160, maxLen: 380, gap: 150 }), `stroke="${LIGHT}"`));

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
