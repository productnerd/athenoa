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
    { r: 75, gaps: [0.635] },
    { r: 94, gaps: [0.23, 0.75] },
    { r: 115, gaps: [0.11, 0.45, 0.84] },
    { r: 138, gaps: [0.18, 0.37, 0.61, 0.89] },
  ];
  rings.forEach(({ r, gaps }, k) => {
    if ((below - cy) / r >= 1) {
      out.push(`<circle cx="${cx}" cy="${cy}" r="${r}"/>`);
      return;
    }
    const a0 = -Math.asin((below - cy) / r);
    const span = Math.PI - 2 * a0;
    const gapAngle = (12 + k * 2.4) / r; // a gap of about the same hand's width on every ring
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
  // left: a high island far behind the land; its summit shows over the saddle between hill and cape
  island(
    [[110, -30], [150, 10], [190, 40], [226, 62], [262, 78], [296, 84], [330, 80], [366, 68], [404, 58], [444, 50], [486, 38], [524, 20], [552, -30]],
    [
      [236, 352, 0.86],
      [272, 330, 0.72],
    ],
  );
  // right: a far ridge on bare paper, running off the edge
  island(
    [[1290, -30], [1318, 6], [1348, 30], [1384, 50], [1422, 65], [1462, 72], [1502, 66], [1544, 56], [1586, 52], [1626, 55], [1660, 58]],
    [
      [1400, 1530, 0.78],
      [1570, 1660, 0.74],
    ],
    false,
  );
  // right: the long low island in front of it
  island(
    [[1212, -30], [1234, -4], [1262, 8], [1300, 17], [1346, 25], [1396, 30], [1444, 33], [1492, 40], [1538, 46], [1584, 44], [1626, 38], [1660, 34]],
    [
      [1300, 1450, 0.6],
      [1476, 1640, 0.66],
      [1510, 1610, 0.34],
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
    [[0, 0], [20, -15], [54, -30], [100, -40], [150, -28], [196, -31], [236, -16], [262, 0]],
    [
      [[38, -9], [64, -19]],
      [[84, -20], [122, -19]],
      [[168, -13], [200, -14]],
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
    [[0, 0], [24, -14], [62, -22], [104, -36], [156, -44], [208, -30], [250, -32], [286, -17], [312, 0]],
    [
      [[46, -8], [74, -14]],
      [[118, -22], [154, -26]],
      [[176, -16], [214, -14]],
      [[236, -12], [264, -9]],
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
    [[0, 0], [20, -13], [56, -25], [100, -18], [136, -20], [164, 0]],
    [
      [[34, -6], [60, -13]],
      [[96, -9], [124, -9]],
    ],
    [
      [-74, 24, 13],
      [120, 236, 14],
    ],
  );

  // --- gulls
  out.push(path(gull(772, 172, 10, -6) + gull(806, 194, 7, 5) + gull(742, 200, 5.5, -3)));
  out.push(path(gull(1128, 196, 8.5, 6) + gull(1160, 178, 6, -5)));
  out.push(path(gull(470, 196, 6, -4) + gull(492, 182, 4.5, 4)));

  return svg(420, 2, out.join(''));
}

// ====================================================================================
// MID: calm water, the terraced cape with its columns, an islet, a sail.  Horizon at y 120.
// A terraced hill stands at the left edge; behind it the cape climbs to the columns and falls
// into the sea as a cliff. Each shore is printed with a thin strip of light blue under it.
// ====================================================================================
function mid() {
  const H = 120;
  const rnd = prng(41);
  const out = [];

  // the hill at the left edge: crest, then the long fall to the water
  const hill = [[-40, 90], [10, 79], [58, 72], [106, 70], [154, 73], [200, 80], [244, 91], [286, 105], [324, 121], [356, 137], [382, 151], [400, 162]];
  const hillShore = [[400, 162], [372, 168], [330, 171], [282, 172], [232, 176], [180, 182], [124, 185], [66, 188], [10, 194], [-40, 198]];
  // skyline of the cape behind it, level under the columns
  const sky = [[200, 97], [250, 91], [300, 85.5], [356, 78], [414, 70], [470, 64], [526, 60], [580, 58], [640, 58], [700, 58], [716, 58.6]];
  // the cliff, from the lip down to the water, in ledges
  const cliff = [[716, 58.6], [729, 64.5, 4], [733, 80, 4], [744, 84.5, 3.5], [748, 100, 4], [760, 105.5, 3.5], [766, 120.5]];
  // the shore of the cape, from the foot of the cliff back to where the hill hides it
  const shore = [[766, 120.5], [740, 125], [704, 127], [668, 131], [628, 136], [586, 138], [544, 138], [500, 141.5], [456, 147], [412, 150], [372, 150], [340, 151]];
  const hillY = lookup(hill);
  const hillShoreY = lookup([...hillShore].reverse());
  const skyY = lookup(sky);
  const shoreY = lookup([...shore].reverse());
  // lowest land at x: the water starts under it
  const landBottom = (x) => Math.max(x <= 400 ? hillShoreY(x) : -1e3, x >= 372 && x <= 770 ? shoreY(x) : -1e3);

  // the islet on the right: long, low, close to the water
  const isleTop = [[1086, 124], [1093, 113.5], [1108, 106.5], [1132, 101], [1160, 97.5], [1186, 98], [1210, 102.5], [1234, 107.5], [1260, 108.5], [1286, 112.5], [1306, 118.5], [1320, 125.5]];
  const isleShore = [[1320, 125.5], [1298, 130], [1258, 133], [1212, 134], [1166, 133.5], [1124, 131.5], [1098, 129], [1086, 124]];
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
        Math.abs(x - SUN_X) > keepOut && py > landBottom(x) + 13 && !(x > 1070 && x < 1336 && py < isleShoreY(x) + 11);
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

  // a strip of light blue under a shore, like a second printing a little off register
  const strip = (pts, dy, tail) => {
    const low = pts.map(([x, y]) => [x + 2, y + dy]);
    if (tail) low.unshift(tail);
    return wash(`${smooth(pts)}${smooth(low.reverse(), { cont: true })}Z`);
  };

  // --- the cape
  out.push(strip(shore, 6.5, [782, 122.5]));
  out.push(paperFill(`${smooth(sky)}${worn(cliff, 4, { closed: false, cont: true })}${smooth(shore, { cont: true })}Z`));
  out.push(path(`${smooth(sky.filter(([x]) => x >= 236))}${worn(cliff, 4, { closed: false, cont: true })}`));
  out.push(path(smooth(shore.filter(([x]) => x >= 372))));

  // terraces: lines that follow the skyline down the slope, broken here and there
  {
    const line = (d, x0, x1, lead) =>
      broken((x) => skyY(x) + d * (1.12 - (x - 250) / 3400) + Math.sin(x / 43 + d) * 1 + Math.sin(x / 120 + d * 1.7) * 1.7, x0, x1, rnd, {
        len: [110, 260],
        gap: [16, 40],
        step: 36,
        min: 30,
        lead,
        ok: (x, y) => y < shoreY(x) - 6.5 && (x > 404 || y < hillY(x) - 5),
      });
    out.push(path(line(15, 250, 684, 10)));
    out.push(path(line(31, 250, 672, 40)));
    out.push(path(line(47, 250, 664, 0)));
    out.push(path(line(63, 250, 700, 30)));
  }

  // the cliff face: strata that follow the fall of the rock
  out.push(
    path(
      worn([[705, 65.5], [717, 71, 4], [721, 86.5, 4], [732, 91, 3.5], [736, 106, 4], [746, 111, 3], [750, 119.5]], 4, { closed: false }) +
        worn([[690, 74], [703, 79.5, 4], [707, 95, 4], [718, 100, 3.5], [722, 113.5, 3], [731, 121.5]], 4, { closed: false }) +
        worn([[676, 88], [688, 93, 4], [692, 108, 4], [702, 113, 3], [706, 123]], 4, { closed: false }),
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
  out.push(skerry(786, 122.5, 19, 10, 1) + skerry(807, 123.5, 11, 5.5, -1) + skerry(832, 122.3, 8, 3.5));

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
      if (!cap) return papered(poly([[c - wb / 2, base], [c - wb / 2 + 0.3, yT + 1.6], [c + wb / 2 - 0.5, yT], [c + wb / 2, base]]));
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
    out.push(papered(poly([[cols[0] - 7, yB], [cols[0] - 7, yB - 6.6], [cols[3] + 7.4, yB - 6.6], [cols[3] + 7.4, yB]], true)));
    out.push(column(x0 + 8.5 + 4.25 * 16.4, h));
    out.push(column(x0 + 8.5 + 5.5 * 16.4, 12, false));
  }

  // --- trees: tamarisks bent by the meltemi, and one olive beside the columns.
  // A tamarisk is a leaning trunk under three pads of foliage that trail off downwind (to the right).
  // Base at 0,0, about 40 tall and 75 wide.
  const pad = (t, top, under) => {
    const a = top.map(t);
    const b = [top[top.length - 1], ...under, top[0]].map(t);
    return papered(`M${xy(a[0])}${scallops(a, 0.62)}${scallops(b, 0.9)}Z`);
  };
  const tamarisk = (x, y, s = 1, lean = 0) => {
    const t = place({ x, y, s, rot: lean });
    const trunk =
      smooth([[0, 0], [0.8, -7], [4.6, -14], [11.5, -20], [20, -24.5]].map(t)) +
      smooth([[3.6, -12.6], [1.4, -17], [-2.6, -21]].map(t)) +
      smooth([[11.5, -20], [21, -19.4], [31, -17.6]].map(t));
    return (
      path(trunk) +
      pad(t, [[-13.5, -18.5], [-10, -24.5], [-1, -25.5], [6.5, -20]], [[-3, -17.6]]) +
      pad(t, [[20, -16.5], [27.5, -24], [41, -25.5], [53, -20.5], [61, -13]], [[47, -13.4], [33, -14.2]]) +
      pad(t, [[-9.5, -25.5], [-4.5, -33.5], [9, -38.5], [25, -36.5], [38, -29]], [[24, -27], [7, -25.2]]) +
      path(
        `M${xy(t([0, -31]))}${scallops([[0, -31], [10.5, -33.6]].map(t), 0.7)}` +
          `M${xy(t([15, -32.6]))}${scallops([[15, -32.6], [27, -30.4]].map(t), 0.7)}` +
          `M${xy(t([34, -20]))}${scallops([[34, -20], [46, -19]].map(t), 0.7)}`,
      )
    );
  };
  // a lone olive: forked trunk, round lobed crown
  const olive = (x, y, s = 1) => {
    const t = place({ x, y, s });
    const crown = [[-17, -17], [-16, -27], [-6, -34.5], [8, -35.5], [18, -28.5], [21.5, -18]].map(t);
    const under = [[21.5, -18], [10, -14], [-4, -13.5], [-17, -17]].map(t);
    const d = `M${xy(crown[0])}${scallops(crown, 0.62)}${scallops(under, 0.8)}Z`;
    const trunk =
      smooth([[0.5, 0], [-1.4, -5.5], [1.4, -10], [-0.6, -15.5]].map(t)) + smooth([[0.6, -8.6], [4.6, -11.6], [8, -15.6]].map(t));
    const inner =
      `M${xy(t([-9, -22]))}${scallops([[-9, -22], [0, -26.5]].map(t), 0.68)}` +
      `M${xy(t([4, -25.5]))}${scallops([[4, -25.5], [13, -22.5]].map(t), 0.68)}`;
    return path(trunk) + papered(d) + path(inner);
  };
  out.push(tamarisk(438, skyY(438) + 1, 0.7, -2));
  out.push(olive(553, 59.4, 0.82));

  // --- the hill at the left edge, in front of the cape
  out.push(strip(hillShore, 7, [414, 164]));
  out.push(paperFill(`${smooth(hill)}${smooth(hillShore, { cont: true })}Z`));
  out.push(path(smooth(hill)));
  out.push(path(smooth(hillShore)));
  {
    const line = (d, x0, x1, lead) =>
      broken((x) => hillY(x) + d * (1 + (x + 40) / 2600) + Math.sin(x / 51 + d) * 1.1 + Math.sin(x / 140 + d * 2) * 1.6, x0, x1, rnd, {
        len: [120, 280],
        gap: [16, 44],
        step: 36,
        min: 30,
        lead,
        ok: (x, y) => y < hillShoreY(x) - 7.5,
      });
    out.push(path(line(19, -40, 338, 0)));
    out.push(path(line(40, -40, 300, 50)));
    out.push(path(line(63, -40, 262, 20)));
    out.push(path(line(88, -40, 214, 70)));
  }
  out.push(tamarisk(34, hillY(34) + 1.4, 0.98, -3));
  out.push(tamarisk(150, hillY(150) + 1, 0.74, 2));
  out.push(tamarisk(232, 139, 1.16, 0));

  // --- the islet: low, terraced, one tamarisk on its back, skerries trailing off its end
  out.push(strip(isleShore, 5.5));
  out.push(paperFill(`${smooth(isleTop)}${smooth(isleShore, { cont: true })}Z`));
  out.push(path(smooth(isleTop)));
  out.push(path(smooth(isleShore)));
  {
    const line = (d, x0, x1, lead) =>
      broken((x) => isleTopY(x) + d + Math.sin(x / 29) * 0.7, x0, x1, rnd, {
        len: [56, 110],
        gap: [12, 24],
        step: 28,
        min: 22,
        lead,
        ok: (x, y) => y < isleShoreY(x) - 5,
      });
    out.push(path(line(10, 1104, 1300, 0) + line(21, 1100, 1270, 20)));
  }
  out.push(tamarisk(1146, isleTopY(1146) + 1, 0.56, -2));
  out.push(skerry(1348, 126.5, 15, 7, -1) + skerry(1371, 127.5, 8, 3.6));

  // --- a sail far off, standing still on the horizon
  {
    const [sx, sy] = [1420, 119.6];
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
// slow darker swells in it. Dolphins leap in the middle, sea-worn ledges of rock shelve into
// the water at the right.
// ====================================================================================
// A dolphin built along an arc: tail at u 0, beak at u 1; `top` and `bot` are the half-widths of the body.
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
  // tail flukes
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
  // dorsal fin, swept back, drawn behind the body
  const fin =
    `M${xy(t(at(0.575, top(0.575) - 1.5)))}` +
    `Q${xy(t(at(0.53, top(0.53) + 8.5)))} ${xy(t(at(0.42, top(0.42) + 10)))}` +
    `Q${xy(t(at(0.48, top(0.48) + 3.2)))} ${xy(t(at(0.455, top(0.455) - 1.5)))}`;
  // flipper: a leaf swept back from the chest, drawn over the body
  const flipper =
    `M${xy(t(at(0.77, -bot(0.77) * 0.5)))}` +
    `Q${xy(t(at(0.75, -bot(0.75) - 5)))} ${xy(t(at(0.655, -bot(0.655) - 5.5)))}` +
    `Q${xy(t(at(0.69, -bot(0.69) + 0.5)))} ${xy(t(at(0.725, -bot(0.725) * 0.56)))}Z`;
  // the line along the flank, from the tail to just behind the eye: blue back above it, pale belly below
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
    path(backWash, `fill="${LIGHT}" stroke="none"`) +
    path(body) +
    path(smooth(flank.map(t)) + mouth) +
    papered(flipper) +
    `<circle cx="${f(eye[0])}" cy="${f(eye[1])}" r="${f(1.5 * (pl.s ?? 1))}" fill="currentColor" stroke="none"/>`
  );
}

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

  // --- dolphins, leaping in front of the calm water and falling back behind the first wave
  out.push(dolphin({ x: 1030, y: 236, s: 0.88, rot: -5 }));
  out.push(dolphin({ x: 860, y: 224, s: 1.24, rot: 3 }));

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

  // --- sea-worn rocks at the right: blocks with worn corners, stepping down into the sea.
  // Tops and sunward sides are paper; the face turned from the sun takes a light wash,
  // printed a little off register.
  const rock = (outline, lines, face) =>
    papered(worn(outline, 9)) +
    (face ? path(worn(face.map(([x, y, r]) => [x + 3.5, y + 3, r]), 6), `fill="${LIGHT}" stroke="none"`) : '') +
    path(worn(outline, 9)) +
    path(lines.map((l) => smooth(l)).join(''));
  // the tall one, running off the edge
  out.push(
    rock(
      [[1700, 166], [1650, 152, 16], [1594, 149, 18], [1544, 162, 16], [1512, 192, 16], [1498, 236, 12], [1502, 300], [1700, 300]],
      [
        [[1516, 196], [1552, 188.5], [1600, 192], [1650, 184.5], [1690, 180]],
        [[1600, 192], [1594, 216], [1603, 240], [1600, 262]],
        [[1520, 228], [1548, 222.5], [1572, 225]],
        [[1626, 218], [1660, 212.5]],
        [[1622, 244], [1650, 240], [1680, 241]],
      ],
      [[1600, 193, 3], [1650, 185.5], [1700, 180], [1700, 300], [1601, 300], [1603, 240], [1594, 216, 8]],
    ),
  );
  // the middle one, in front of it
  out.push(
    rock(
      [[1382, 300], [1378, 254, 10], [1390, 226, 13], [1418, 210, 13], [1458, 208, 13], [1490, 222, 13], [1504, 248, 10], [1508, 300]],
      [
        [[1388, 238], [1416, 230.5], [1452, 234], [1496, 238.5]],
        [[1452, 234], [1447, 252], [1454, 268]],
        [[1398, 256], [1424, 251.5]],
      ],
      [[1452, 235, 3], [1496, 239.5], [1506, 252], [1508, 300], [1454, 300], [1447, 252, 6]],
    ),
  );
  // two small ones further out
  out.push(
    rock(
      [[1288, 300], [1288, 262, 6], [1300, 246, 9], [1324, 240.5, 9], [1346, 248, 9], [1355, 266, 6], [1357, 300]],
      [[[1292, 257.5], [1320, 252], [1352, 259]]],
      [[1320, 253, 3], [1352, 260], [1357, 300], [1318, 300]],
    ),
  );
  out.push(rock([[1206, 300], [1208, 264, 5], [1222, 253.5, 7], [1242, 255, 7], [1251, 266, 5], [1253, 300]], []));

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

// node scripts/illustrations/aegean-gen.mjs --study out.svg   writes one dolphin, large, to look at closely
const study = process.argv.indexOf('--study');
if (study > 0) {
  const body = dolphin({ x: 40, y: 70, s: 2 }) + dolphin({ x: 300, y: 70, s: 1 });
  writeFileSync(process.argv[study + 1], svg(120, 2.6, body).replace('0 0 1600 120', '0 0 460 120'));
} else {
  for (const [name, body] of [
    ['footer-aegean-far', far()],
    ['footer-aegean-mid', mid()],
    ['footer-aegean-near', near()],
  ]) {
    writeFileSync(resolve(outDir, `${name}.svg`), body);
    console.log(name, `${(body.length / 1024).toFixed(1)} KB`);
  }
}
