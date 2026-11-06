// Generates the three layers of the island footer scene (Nostos pages): a Cycladic village.
//   footer-island-far.svg   sky: the sun (.sky-day), the night sky (.sky-night: moon and stars), streaks of
//                           cloud, far islands on the horizon
//   footer-island-mid.svg   the island: whitewashed houses stepping up the hill, stepped lanes, a chapel with
//                           a blue dome and a bell gable, a windmill on the ridge (its sails are the group
//                           .isl-sails, which turns on a click: Footer.astro), calm water on both sides
//   footer-island-near.svg  the harbour: calm water, two caïques at their moorings, the quay at the foot
// node scripts/illustrations/island-gen.mjs
// Look at the result with: node scripts/illustrations/aegean-render.mjs scene island [blue]
//
// Footer.astro stacks the layers in a 1600 x 525 box, by their feet: far (420 tall) sits 21 units from the
// top, mid (440 tall, taller than the other scenes' 300 so the hill and its windmill have room) 70.8,
// near (360) 165. So scene y = far y + 21 = mid y + 70.8 = near y + 165.
// The far layer owns the horizon (far y 306, scene 327); the sea of the mid layer starts 4 units lower
// (mid y 260). Parallax lifts the far layer a little against the mid one and lowers the near one, which
// only widens the strips of water between them.
// Narrow screens see only the middle of the scene (x 500 to 1100): the windmill, the chapel, the heart of
// the village, the sun and the larger caïque all live there.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/assets/illustrations');
const PAPER = 'var(--paper, #f2e9d3)';
const LIGHT = 'var(--blue-light, #b3c0f3)';
const TAU = Math.PI * 2;
const SUN_X = 1036;
const OFF = 70.8; // mid y = scene y - OFF

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
// a sum of slow sines: the swell of a water line
const swell = (base, parts) => (x) => base + parts.reduce((s, [a, l, p]) => s + a * Math.sin((TAU * x) / l + p), 0);

const svg = (h, sw, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 ${h}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
const path = (d, attrs = '') => `<path ${attrs ? attrs + ' ' : ''}d="${d}"/>`;
const paperFill = (d) => path(d, `fill="${PAPER}" stroke="none"`);
const papered = (d) => path(d, `fill="${PAPER}"`);
const wash = (d, nodraw = true) => path(d, `fill="${LIGHT}" stroke="none"${nodraw ? ' data-nodraw=""' : ''}`);
const ink = (d) => path(d, 'fill="currentColor" stroke="none" data-nodraw=""');
// a small rectangle with rounded corners, as path data (windows, doors)
const box = (x, y, w, h, r = 0.8) =>
  `M${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}H${f(x + r)}Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}Z`;
// an opening with a round head (doors, the bell's arch)
const arched = (x, y, w, h) => `M${f(x)} ${f(y + h)}V${f(y + w / 2)}A${f(w / 2)} ${f(w / 2)} 0 0 1 ${f(x + w)} ${f(y + w / 2)}V${f(y + h)}Z`;

// ====================================================================================
// FAR: sky, sun, night sky, streaks of cloud, far islands.  Horizon at y 306.
// ====================================================================================
function far() {
  const H = 306;
  const BOTTOM = 422;
  const rnd = prng(23);
  const out = [];

  // --- the sun, high on the right of the windmill: a disc in a ring of short wavy rays, long and short
  // in turn. By night it sinks behind the island (--set, in these units).
  {
    const [cx, cy] = [SUN_X, 92];
    let rays = '';
    const n = 16;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + 0.1 + (rnd() - 0.5) * 0.05;
      const r0 = 31 + rnd() * 1.2;
      const r1 = r0 + (k % 2 ? 7 : 13) + rnd() * 1.4;
      const at = (r, side) => [cx + r * Math.cos(a) - side * Math.sin(a), cy + r * Math.sin(a) + side * Math.cos(a)];
      const sway = k % 2 ? 0.8 : 1.25;
      rays += smooth([at(r0, 0), at(r0 + (r1 - r0) * 0.36, sway), at(r0 + (r1 - r0) * 0.7, -sway * 0.8), at(r1, 0.2)]);
    }
    out.push(`<g class="sky-day" style="--set:190px"><circle cx="${cx}" cy="${cy}" r="23.5"/>${path(rays)}</g>`);
  }

  // --- the night sky: a crescent moon on the left of the windmill, stars about it. Hidden by day
  // (Footer.astro); each star is numbered (--n) so they come out one after another.
  {
    const [mx, my, r] = [700, 66, 21];
    const at = (deg, rr = r) => [mx + rr * Math.cos((deg * Math.PI) / 180), my + rr * Math.sin((deg * Math.PI) / 180)];
    const a = at(-78);
    const b = at(38);
    const moon = `M${xy(a)}A${r} ${r} 0 1 0 ${xy(b)}A${f(r * 0.94)} ${f(r * 0.94)} 0 0 1 ${xy(a)}Z`;
    const star4 = (x, y, s) => {
      const p = (dx, dy) => xy([x + dx * s, y + dy * s]);
      return `M${p(0.2, -11)}Q${p(1.1, -2.4)} ${p(7.6, 0.4)}Q${p(1.2, 1.8)} ${p(-0.4, 11)}Q${p(-1.4, 2.2)} ${p(-7.8, -0.2)}Q${p(-1.2, -1.8)} ${p(0.2, -11)}Z`;
    };
    const stars = [
      ['dot', 556, 36, 2.2],
      ['star', 604, 122, 0.92],
      ['dot', 790, 28, 2],
      ['star', 968, 34, 1],
      ['dot', 1150, 58, 2.2],
      ['star', 1296, 30, 0.86],
      ['dot', 1466, 96, 2],
      ['star', 372, 70, 0.9],
      ['dot', 196, 36, 2.1],
    ];
    const g = stars.map(([kind, x, y, s], n) => {
      const shape =
        kind === 'dot'
          ? `<circle data-nodraw="" cx="${x}" cy="${y}" r="${s}" fill="currentColor" stroke="none"/>`
          : path(star4(x, y, s), 'data-nodraw=""');
      return `<g class="sky-star" style="--n:${n}">${shape}</g>`;
    });
    out.push(
      `<g class="sky-night" display="none"><g class="sky-moon" style="--rise:110px">${path(moon, 'data-nodraw=""')}</g>${g.join('')}</g>`,
    );
  }

  // --- streaks of cloud blown long by the meltemi: thin level strokes, two or three together
  const streak = (x0, x1, y, lift = 0) =>
    smooth([
      [x0, y],
      [x0 + (x1 - x0) * 0.3, y - 1.2 - lift],
      [x0 + (x1 - x0) * 0.68, y - 0.4 - lift],
      [x1, y + 0.8],
    ]);
  out.push(
    path(
      streak(40, 318, 168) +
        streak(140, 262, 180, 0.4) +
        streak(330, 420, 158) +
        streak(1180, 1500, 126) +
        streak(1276, 1420, 138, 0.6) +
        streak(1414, 1566, 114) +
        streak(452, 606, 192) +
        streak(506, 570, 202),
    ),
  );

  // --- the far sea: paper from the horizon down
  out.push(paperFill(`M-40 ${H}H1640V${BOTTOM}H-40Z`));

  // --- far islands standing on the horizon: the nearer ones carry a light wash, the farthest is bare paper
  const island = (pts, contours, washed = true) => {
    const top = pts.map(([x, h]) => [x, H - h]);
    const h = lookup(pts);
    const d = smooth(top);
    const closed = `${d}V${H}H${f(top[0][0])}Z`;
    out.push(paperFill(closed));
    if (washed) out.push(wash(closed));
    out.push(path(d));
    for (const [x0, x1, k] of contours) {
      out.push(path(smooth(sample((x) => H - h(x) * k + Math.sin(x / 29) * 0.8, x0, x1, 32))));
    }
  };
  // left: a high far island on bare paper, its far end hidden behind the near island
  island(
    [[30, 0], [58, 14], [94, 31], [134, 46], [174, 56], [214, 60], [254, 56], [292, 48], [330, 40], [370, 30]],
    [
      [140, 250, 0.8],
      [196, 300, 0.66],
    ],
    false,
  );
  // left: a long low island in front of it, running off the edge
  island(
    [[-40, 22], [-6, 27], [32, 30], [72, 29], [110, 24], [148, 16], [184, 8], [212, 2.5], [232, 0]],
    [[-20, 150, 0.56]],
  );
  // the horizon, drawn across the feet of the islands
  out.push(path(smooth(sample((x) => H + Math.sin(x / 190) * 0.35, -40, 1640, 210))));

  return svg(420, 2, out.join(''));
}

// ====================================================================================
// MID: the island and the water on both sides of it.  Its sea starts at y 260 (scene 330.8).
// The hill rises from the shore on the left to a shoulder (the chapel) and a ridge (the windmill),
// then falls away to the right. The village climbs it from the waterfront.
// Its outlines are written in scene units and moved up by OFF.
// ====================================================================================
function mid() {
  const SEA = 260;
  const rnd = prng(47);
  const out = [];
  const up = (pts) => pts.map(([x, y]) => [x, y - OFF]);

  // the skyline of the island, from its left shore to its right shore
  const sky = up([[236, 338], [248, 331], [272, 325], [304, 321.5], [340, 312], [378, 299], [416, 286], [454, 274], [492, 263], [528, 255], [562, 251], [596, 250.5], [628, 247], [658, 238], [686, 225], [714, 211], [746, 199], [778, 191], [804, 188.6], [826, 184], [850, 179], [874, 176.8], [898, 178], [924, 181], [952, 186], [982, 193], [1012, 200], [1044, 207], [1076, 213], [1108, 218], [1138, 221], [1166, 222.5], [1196, 221], [1228, 216.5], [1262, 211], [1298, 206], [1334, 202.5], [1370, 201], [1404, 202], [1436, 205], [1468, 209.5], [1500, 214], [1534, 217.5], [1570, 219], [1610, 219.5], [1650, 219]]);
  // its foot, where it meets the water: the harbour front bows forward under the village
  const shore = up([[236, 338], [270, 344], [326, 354], [388, 364], [450, 373], [520, 380.5], [610, 385.5], [710, 388.5], [810, 390], [910, 390], [1010, 389], [1100, 386.5], [1190, 383], [1280, 380], [1370, 378], [1460, 377], [1560, 377.5], [1650, 378]]);
  const skyY = lookup(sky);
  const shoreY = lookup(shore);
  const onIsland = (x) => x > 236;
  const MILL = { x: 874, base: skyY(874) + 1.5 };
  const CHAPEL = { x: 554, base: skyY(586) + 1 };

  // --- the sea: paper down to the bottom
  out.push(paperFill(`M-40 ${SEA}H1640V442H-40Z`));

  // --- calm water: long level strokes with gaps, swelling a little, further apart as they come nearer
  {
    let y = SEA + 5.5;
    let row = 0;
    while (y < 436) {
      const yy = y;
      const ph = rnd() * TAU;
      const amp = 0.5 + row * 0.12;
      const fn = (x) => yy + Math.sin(x / (80 + row * 9) + ph) * amp;
      const ok = (x, py) => !onIsland(x - 14) || !onIsland(x + 14) || py > shoreY(x) + 12;
      out.push(
        path(
          broken(fn, -40, 1640, rnd, {
            len: [80 + row * 12, 240 + row * 22],
            gap: [30 + row * 3, 90 + row * 10],
            step: 54,
            ok,
            min: 22,
            lead: -rnd() * 140,
          }),
        ),
      );
      y += 7.2 + row * 1.25;
      row++;
    }
  }

  // --- the island: a strip of light blue under its shore, like a second printing a little off register,
  // then the land itself in paper, outlined
  {
    const low = shore.map(([x, y]) => [x + 2, y + 6.5]).reverse();
    out.push(wash(`${smooth(shore)}${smooth(low, { cont: true })}Z`));
  }
  out.push(paperFill(`${smooth(sky)}${smooth([...shore].reverse(), { cont: true })}Z`));
  out.push(path(smooth(sky)));
  out.push(path(smooth(shore)));
  // rocks off the end of the island
  const skerry = (x, y, w, h, lean = 0) =>
    papered(smooth([[x - w / 2, y], [x - w * 0.36 + lean, y - h * 0.7], [x - w * 0.02 + lean, y - h], [x + w * 0.32 + lean, y - h * 0.66], [x + w / 2, y]])) +
    path(smooth([[x - w / 2 - 5, y + 0.4], [x, y + 1.1], [x + w / 2 + 6, y + 0.3]]));
  out.push(skerry(214, 339.5 - OFF, 16, 8, -1) + skerry(192, 340.5 - OFF, 9, 4.2) + skerry(170, 340 - OFF, 6, 2.6));

  // terraces of dry-stone walls on the bare flanks, following the slope, broken here and there
  {
    const line = (d, x0, x1, lead) =>
      broken((x) => skyY(x) + d + Math.sin(x / 41 + d) * 1.1 + Math.sin(x / 117 + d * 1.6) * 1.5, x0, x1, rnd, {
        len: [70, 170],
        gap: [14, 36],
        step: 30,
        min: 26,
        lead,
        ok: (x, y) => y < shoreY(x) - 7,
      });
    out.push(path(line(11, 262, 470, 0) + line(24, 300, 452, 30) + line(38, 350, 430, 10)));
    out.push(path(line(12, 1176, 1640, 10) + line(30, 1220, 1640, 40) + line(52, 1290, 1640, 0)));
    // dry-stone walls: rows of small stones, running down the hill to the right
    const wall = (fn, x0, x1) => {
      let d = '';
      let run = [];
      const flush = () => {
        if (run.length > 2) d += `M${xy(run[0])}${scallops(run, 0.6)}`;
        run = [];
      };
      for (let x = x0; x < x1; x += 5.5 + rnd() * 2.5) {
        if (rnd() < 0.03) flush();
        const y = fn(x);
        if (y < shoreY(x) - 8) run.push([x, y + (rnd() - 0.5) * 0.8]);
        else flush();
      }
      flush();
      return d;
    };
    out.push(
      path(
        wall((x) => skyY(x) + 20 + (x - 1300) * 0.11 + Math.sin(x / 60) * 2, 1250, 1600) +
          wall((x) => skyY(x) + 64 + (x - 1360) * 0.07 + Math.sin(x / 70) * 2, 1330, 1640) +
          wall((x) => skyY(x) + 104 + Math.sin(x / 55) * 2.5, 1420, 1640) +
          wall((x) => skyY(x) + 30 + Math.sin(x / 50) * 1.5, 280, 420),
      ),
    );
    // shrubs of the bare hillside, low and round
    const shrub = (x, y, w) =>
      papered(`M${xy([x - w / 2, y])}${scallops([[x - w / 2, y], [x - w * 0.18, y - w * 0.42], [x + w * 0.2, y - w * 0.46], [x + w / 2, y]], 0.66)}Z`);
    out.push(
      [[1214, 18, 13], [1322, 38, 11], [1452, 30, 14], [1544, 58, 12], [1396, 84, 13], [1590, 96, 11], [1488, 130, 12], [330, 20, 11], [1260, 70, 10]]
        .map(([x, d, w]) => shrub(x, skyY(x) + d, w))
        .join(''),
    );
    // the bare top of the hill about the windmill
    out.push(path(line(14, 770, 846, 0) + line(15, 916, 1000, 0) + line(29, 800, 860, 0) + line(30, 904, 972, 0)));
  }

  // --- cypresses behind the chapel, rising over the shoulder of the hill
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
  out.push(cypress(658, CHAPEL.base - 1, 58, 15) + cypress(675, CHAPEL.base - 4, 40, 12));

  // --- the chapel on the shoulder: a whitewashed nave, a drum and a blue dome with its cross, and a bell
  // gable at the west end with one bell in its arch
  {
    const { x, base } = CHAPEL;
    const w = 74;
    const h = 29;
    const top = base - h;
    // the bell gable, standing on the roof at the left end
    const gx = x + 3;
    const gw = 22;
    const gt = top - 25;
    out.push(papered(worn([[gx, top + 1], [gx, gt + 4, 2], [gx + gw * 0.5, gt - 1.5, 3], [gx + gw, gt + 4, 2], [gx + gw, top + 1]], 2)));
    out.push(path(arched(gx + 6.4, gt + 6, 9.2, 12.5)));
    // the bell, hanging in the arch
    const bx = gx + gw / 2;
    out.push(ink(`M${f(bx)} ${f(gt + 9.8)}C${f(bx - 2.4)} ${f(gt + 10.2)} ${f(bx - 2.6)} ${f(gt + 13)} ${f(bx - 3.3)} ${f(gt + 15.6)}H${f(bx + 3.3)}C${f(bx + 2.6)} ${f(gt + 13)} ${f(bx + 2.4)} ${f(gt + 10.2)} ${f(bx)} ${f(gt + 9.8)}Z`));
    out.push(path(`M${f(bx)} ${f(gt - 1.5)}V${f(gt - 9.5)}M${f(bx - 3)} ${f(gt - 6.6)}H${f(bx + 3)}`));
    // the nave
    out.push(papered(worn([[x, base], [x, top, 1.6], [x + w, top, 1.6], [x + w, base]], 1.6)));
    // the drum and the dome
    const dc = x + 48;
    const dw = 31;
    const dt = top - 8.5;
    out.push(papered(poly([[dc - dw / 2, top], [dc - dw / 2, dt], [dc + dw / 2, dt], [dc + dw / 2, top]], true)));
    const dr = dw / 2 + 0.8;
    const dome = `M${f(dc - dr)} ${f(dt)}C${f(dc - dr)} ${f(dt - dr * 1.2)} ${f(dc + dr)} ${f(dt - dr * 1.2)} ${f(dc + dr)} ${f(dt)}Z`;
    out.push(path(dome, `fill="${LIGHT}"`));
    out.push(path(`M${f(dc)} ${f(dt - dr * 0.9)}V${f(dt - dr * 0.9 - 10)}M${f(dc - 3.4)} ${f(dt - dr * 0.9 - 6.6)}H${f(dc + 3.4)}`));
    // its door and a small window
    out.push(ink(arched(dc - 4.2, base - 14.5, 8.4, 14.5)));
    out.push(ink(arched(x + 14, top + 7.5, 4.6, 8.5)));
    // a low courtyard wall with a rounded top beside it
    out.push(papered(`M${f(x + w)} ${f(base)}V${f(base - 6.5)}Q${f(x + w + 10)} ${f(base - 8.5)} ${f(x + w + 20)} ${f(base - 6.2)}V${f(base)}`));
  }

  // --- the windmill on the ridge: a round tower, a pointed thatched cap, eight spars each with its sail.
  // The sails are the group .isl-sails, and the click turns them about the hub (its transform-origin).
  {
    const { x: cx, base } = MILL;
    const hT = 54;
    const top = base - hT;
    out.push(papered(worn([[cx - 17.5, base + 1], [cx - 14, top, 1.2], [cx + 14, top, 1.2], [cx + 17.5, base + 1]], 1.4)));
    out.push(ink(arched(cx - 4.4, base - 14.5, 8.8, 15)));
    out.push(ink(box(cx + 6.4, top + 26, 4.2, 5.6)));
    const cap = [[cx - 16.4, top + 0.4], [cx - 10, top - 10], [cx - 1.6, top - 17.5], [cx + 1.8, top - 17.6], [cx + 10.4, top - 9.6], [cx + 16.4, top + 0.4]];
    out.push(papered(smooth(cap) + 'Z'));
    out.push(path(`M${f(cx + 0.2)} ${f(top - 17.6)}V${f(top - 22)}`));
    const hub = [cx - 1, top - 5];
    const R = 40;
    let spars = '';
    let cloths = '';
    const n = 8;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + 0.21 + (rnd() - 0.5) * 0.04;
      const u = [Math.cos(a), Math.sin(a)];
      const v = [-u[1], u[0]]; // the side the cloth is set to
      const at = (along, side = 0) => [hub[0] + u[0] * along + v[0] * side, hub[1] + u[1] * along + v[1] * side];
      spars += `M${xy(at(4))}L${xy(at(R))}`;
      cloths += papered(poly([at(10), at(R - 2), at(R * 0.8, 10 + rnd() * 1.2)], true));
    }
    out.push(
      `<g class="isl-sails" style="transform-origin:${f(hub[0])}px ${f(hub[1])}px">` +
        cloths +
        path(spars) +
        `<circle cx="${f(hub[0])}" cy="${f(hub[1])}" r="3.6" fill="${PAPER}"/>` +
        `</g>`,
    );
  }

  // --- stepped lanes: climbing between the houses, a short stroke for every step
  const lanes = [
    up([[628, 385], [622, 362], [636, 338], [632, 312], [616, 288], [600, 270]]),
    up([[1006, 389], [1014, 364], [996, 340], [978, 316], [960, 292], [948, 274]]),
  ];
  const laneAt = lanes.map((pts) => lookup([...pts].map(([x, y]) => [y, x]).sort((a, b) => a[0] - b[0])));
  const laneSpan = lanes.map((pts) => [Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))]);
  {
    let d = '';
    lanes.forEach((_, i) => {
      const [y0, y1] = laneSpan[i];
      for (let y = y1 - 4; y > y0 + 1; y -= 6.2 + rnd() * 1.2) {
        const x = laneAt[i](y);
        const half = 4 + rnd() * 1.4;
        d += `M${xy([x - half, y + (rnd() - 0.5) * 0.6])}L${xy([x + half, y + (rnd() - 0.5) * 0.6])}`;
      }
    });
    out.push(path(d));
  }

  // --- the village: rows of whitewashed houses that follow the shore and step up the hill. The rows
  // highest up are drawn first, so each row in front hides the feet of the one behind it.
  {
    const ROW = 19.5;
    const dense = (cx) => Math.exp(-Math.pow(Math.abs((cx - 836) / 370), 3));
    const blocked = (x0, x1, top, base) => {
      // the chapel and its yard, the windmill and the bare ridge under it
      if (x1 > CHAPEL.x - 8 && x0 < CHAPEL.x + 100 && top < CHAPEL.base + 5) return true;
      if (x1 > MILL.x - 54 && x0 < MILL.x + 54 && top < MILL.base + 36) return true;
      // the lanes
      for (let i = 0; i < lanes.length; i++) {
        const [y0, y1] = laneSpan[i];
        for (const y of [top, (top + base) / 2, base]) {
          if (y < y0 - 2 || y > y1 + 2) continue;
          const lx = laneAt[i](Math.max(y0, Math.min(y1, y)));
          if (lx > x0 - 7.5 && lx < x1 + 7.5) return true;
        }
      }
      return false;
    };
    let windows = '';
    for (let k = 10; k >= 0; k--) {
      let x = 320 + (k % 2) * 17 + rnd() * 22;
      while (x < 1420) {
        const w = 26 + rnd() * 30 + (k < 2 ? 8 : 0);
        const cx = x + w / 2;
        const base = shoreY(cx) - 8.5 - k * ROW + (rnd() - 0.5) * 3.4;
        let h = 17 + rnd() * 10;
        if (rnd() < 0.18) h += 9;
        const top = base - h;
        const inLand = base > Math.max(skyY(x), skyY(x + w), skyY(cx)) + 6;
        if (inLand && rnd() < dense(cx) && !blocked(x, x + w, top, base)) {
          const j = () => (rnd() - 0.5) * 1.4;
          const kind = rnd();
          // the roof: flat, a barrel vault, a room set back on the roof, or a chimney
          let outline;
          if (kind < 0.15 && w < 44) {
            const s = Math.min(7, w * 0.2);
            outline = `M${xy([x, base])}V${f(top + 0.6)}C${f(x + w * 0.1)} ${f(top - s * 1.25)} ${f(x + w * 0.9)} ${f(top - s * 1.25)} ${f(x + w)} ${f(top + 0.6)}V${f(base)}Z`;
          } else {
            outline = worn([[x + j(), base], [x + j(), top + j(), 1.4], [x + w + j(), top + j(), 1.4], [x + w + j(), base]], 1.4);
          }
          out.push(papered(outline));
          if (kind >= 0.15 && kind < 0.36 && w > 32) {
            const rw = w * (0.36 + rnd() * 0.16);
            const rx = rnd() < 0.5 ? x + 2.5 : x + w - rw - 2.5;
            const rh = 8 + rnd() * 4;
            out.push(papered(worn([[rx, top + 0.5], [rx, top - rh, 1.2], [rx + rw, top - rh, 1.2], [rx + rw, top + 0.5]], 1.2, { closed: false })));
            windows += box(rx + rw * 0.5 - 2, top - rh + 3.2, 4, 5);
          } else if (kind >= 0.36 && kind < 0.5) {
            const chx = rnd() < 0.5 ? x + 4 + rnd() * 4 : x + w - 10 - rnd() * 4;
            out.push(papered(`M${f(chx)} ${f(top + 0.5)}V${f(top - 6.5)}H${f(chx + 6)}V${f(top + 0.5)}M${f(chx - 1.4)} ${f(top - 6.5)}H${f(chx + 7.4)}`));
          }
          // windows in the upper half of the wall, a door at the foot of the lower rows
          const nw = w < 34 ? 1 : w < 48 ? 2 : 3;
          const used = [];
          for (let i = 0; i < nw; i++) {
            if (i > 0 && rnd() < 0.3) continue;
            const wx = x + (w * (i + 0.5)) / nw - 2.1 + (rnd() - 0.5) * 3;
            used.push(wx);
            windows += box(wx, top + 5.2 + rnd() * 1.6, 4.2, 5.6);
          }
          if (k <= 1 || (h > 28 && rnd() < 0.6)) {
            let dx = x + 5 + rnd() * (w - 16);
            if (used.some((wx) => Math.abs(wx - dx) < 5)) dx = Math.min(x + w - 9, dx + 7);
            windows += arched(dx, base - 10, 5.6, 10);
          }
        }
        x += w + (rnd() < 0.42 ? -4 + rnd() * 4 : 3 + rnd() * 15);
      }
    }
    out.push(ink(windows));
  }

  // --- the harbour front: a stone quay along the foot of the village, its joints marked here and there
  {
    const x0 = 380;
    const x1 = 1330;
    const edge = (x) => shoreY(x) - 8.5;
    out.push(paperFill(`${smooth(sample(edge, x0, x1, 40))}${smooth(sample(shoreY, x0, x1, 40).reverse(), { cont: true })}Z`));
    out.push(path(smooth(sample(edge, x0, x1, 40))));
    let d = '';
    for (let x = x0 + 14 + rnd() * 20; x < x1 - 10; x += 22 + rnd() * 34) d += `M${xy([x, edge(x) + 1.6])}L${xy([x + 0.6, shoreY(x) - 1.6])}`;
    out.push(path(d));
    out.push(path(smooth(shore.filter(([x]) => x > x0 - 30 && x < x1 + 30))));
  }

  return svg(440, 2.2, out.join(''));
}

// ====================================================================================
// NEAR: the harbour.  Its water starts at y 234 (scene 399), the quay's whitewashed kerb at 293, and the
// ground of the quay runs from 301 to the foot, in the ink colour: Footer.astro continues it in the band
// that carries the copyright line (--footer-ground on .footer--island), so the two must stay the same.
// ====================================================================================
// A caïque in profile, stern at 0, bow at L to the right (flip for the other way), waterline at y 0.
function caique(pl, { L = 150, cabin = true, mast = true } = {}) {
  const t = place(pl);
  const hs = L * 0.118;
  const hm = L * 0.094;
  const hb = L * 0.172;
  const sheer = [[0, -hs], [L * 0.14, -hs + L * 0.014], [L * 0.36, -hm - 0.4], [L * 0.58, -hm], [L * 0.78, -hm - L * 0.018], [L * 0.92, -hb + L * 0.034], [L, -hb]];
  const bow = [[L, -hb], [L * 0.985, -hb * 0.6], [L * 0.955, -hb * 0.24], [L * 0.905, 0]];
  const stern = [[L * 0.075, 0], [L * 0.022, -hs * 0.36], [0, -hs]];
  const hull = `${smooth(sheer.map(t))}${smooth(bow.map(t), { cont: true })}L${xy(t([L * 0.075, 0]))}${smooth(stern.map(t), { cont: true })}Z`;
  const sheerY = lookup(sheer);
  // the band of colour under the gunwale, and the line under it
  const bw = L * 0.032;
  const bandLo = sheer.map(([x, y]) => [x, y + bw - (x > L * 0.9 ? (x - L * 0.9) * 0.06 : 0)]);
  const band = `${smooth(sheer.map(t))}${smooth([...bandLo].reverse().map(t), { cont: true })}Z`;
  let d = '';
  let over = '';
  // the stem post, rising above the bow
  d += smooth([[L - 1.4, -hb + 2], [L + 1, -hb - L * 0.03], [L + 4, -hb - L * 0.062]].map(t));
  // the rudder at the stern
  d += smooth([[L * 0.03, -L * 0.04], [-L * 0.03, -L * 0.03], [-L * 0.036, L * 0.024]].map(t));
  // a plank seam along the hull
  d += smooth(sheer.slice(1, -1).map(([x, y]) => [x, (y + bw) * 0.45]).map(t));
  const mx = L * 0.6;
  const mTop = -hm - L * 0.34;
  let rig = mast ? poly([[mx, -hm], [mx + 0.8, mTop]].map(t)) : '';
  if (cabin) {
    const c0 = L * 0.15;
    const c1 = L * 0.38;
    const ch = L * 0.1;
    over += papered(poly([[c0, sheerY(c0) + 1], [c0 + 1.2, sheerY(c0) - ch], [c1 - 0.6, sheerY(c1) - ch - 1.2], [c1, sheerY(c1) + 1]].map(t), true));
    over += path(poly([[c0 - 2.6, sheerY(c0) - ch], [c1 + 2.4, sheerY(c1) - ch - 1.2]].map(t)));
    over += ink(poly([[c0 + 5, sheerY(c0) - ch + 4.4], [c0 + 15, sheerY(c0) - ch + 4.2], [c0 + 15, sheerY(c0) - ch + 10], [c0 + 5, sheerY(c0) - ch + 10.2]].map(t), true));
    over += ink(poly([[c0 + 20, sheerY(c0) - ch + 4.6], [c1 - 5, sheerY(c1) - ch + 3.6], [c1 - 5, sheerY(c1) - ch + 9.4], [c0 + 20, sheerY(c0) - ch + 10.4]].map(t), true));
  }
  if (mast) {
    // the stay from the masthead to the stem, and a pennant at the masthead
    rig += poly([[mx + 0.8, mTop + 1], [L + 3.6, -hb - L * 0.058]].map(t));
    over += papered(poly([[mx + 0.8, mTop], [mx + 15, mTop + 2.6], [mx + 0.8, mTop + 5.4]].map(t), true));
  } else {
    // a lantern on a short post, for fishing at night
    rig += poly([[L * 0.7, -hm - 1], [L * 0.7, -hm - L * 0.13]].map(t));
    over += papered(poly([[L * 0.7 - 3, -hm - L * 0.13], [L * 0.7 - 3.6, -hm - L * 0.13 - 7], [L * 0.7 + 3.6, -hm - L * 0.13 - 7], [L * 0.7 + 3, -hm - L * 0.13]].map(t), true));
  }
  return path(rig) + papered(hull) + wash(band) + path(smooth(bandLo.map(t))) + path(d) + over;
}
// its reflection: short wavering strokes under the hull, shorter as they go down
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

function near() {
  const rnd = prng(71);
  const out = [];
  const TOP = 234;
  const KERB = 293;
  const FACE = 301;
  const BOTTOM = 362;
  const boats = [
    { x: 560, y: 272, L: 214, flip: false, cabin: true },
    { x: 1150, y: 264, L: 136, flip: true, cabin: true, mast: false },
  ];
  const span = (b) => (b.flip ? [b.x - b.L - 10, b.x + 10] : [b.x - 10, b.x + b.L + 10]);

  // --- the harbour water: paper down to the foot
  out.push(paperFill(`M-40 ${TOP}H1640V${BOTTOM}H-40Z`));
  // calm parallel lines, swelling a little, kept clear of the boats and their reflections
  {
    let y = TOP + 5;
    let row = 0;
    while (y < KERB - 4) {
      const fn = swell(y, [
        [1.2, 260 + row * 30, rnd() * TAU],
        [0.6, 610, rnd() * TAU],
      ]);
      const ok = (x, py) =>
        boats.every((b) => {
          const [a, c] = span(b);
          return x < a - 4 || x > c + 4 || py < b.y - b.L * 0.16 || py > b.y + 23;
        });
      out.push(path(broken(fn, -40, 1640, rnd, { len: [140, 340], gap: [30, 90], step: 40, ok, min: 26, lead: -rnd() * 160 })));
      y += 9.2 + row * 0.7;
      row++;
    }
  }
  // --- the caïques and their reflections
  for (const b of boats) {
    const [a, c] = span(b);
    out.push(path(reflection(a + 10, c - 10, b.y, rnd)));
    out.push(caique({ x: b.x, y: b.y, flip: b.flip }, b));
  }

  // --- the quay: a whitewashed kerb, then the ground of the quay in the ink colour, the joint of a course
  // of long slabs under the kerb picked out in light blue (the copyright line sits lower, on plain ground)
  {
    const kerb = swell(KERB, [
      [0.5, 230, 1.1],
      [0.3, 97, 0.2],
    ]);
    const face = (x) => FACE + Math.sin(x / 150) * 0.4;
    out.push(papered(`${smooth(sample(kerb, -40, 1640, 40))}V${FACE + 2}H-40Z`));
    let joints = '';
    for (let x = -20 + rnd() * 30; x < 1640; x += 52 + rnd() * 60) joints += `M${xy([x, kerb(x) + 1.8])}L${xy([x - 0.5, face(x) - 1.6])}`;
    out.push(path(joints));
    out.push(path(`${smooth(sample(face, -40, 1640, 80))}V${BOTTOM}H-40Z`, 'fill="currentColor"'));
    const course = (x) => FACE + 14 + Math.sin(x / 97) * 0.9;
    out.push(path(broken(course, -40, 1640, rnd, { len: [200, 420], gap: [24, 70], step: 40, min: 40, lead: -60 }), `stroke="${LIGHT}"`));
  }

  // --- bollards on the quay and the ropes that hold the boats, stern and bow
  {
    const bollard = (x) =>
      papered(
        `M${f(x - 4.6)} ${f(FACE + 6)}V${f(FACE - 3)}C${f(x - 4.6)} ${f(FACE - 5.2)} ${f(x - 7.6)} ${f(FACE - 5.4)} ${f(x - 7.6)} ${f(FACE - 8)}C${f(x - 7.6)} ${f(FACE - 11.4)} ${f(x + 7.6)} ${f(FACE - 11.4)} ${f(x + 7.6)} ${f(FACE - 8)}C${f(x + 7.6)} ${f(FACE - 5.4)} ${f(x + 4.6)} ${f(FACE - 5.2)} ${f(x + 4.6)} ${f(FACE - 3)}V${f(FACE + 6)}`,
      );
    const rope = (from, to) => smooth([from, [from[0] * 0.45 + to[0] * 0.55, (from[1] + to[1]) / 2 + 6], to]);
    const [b1, b2] = boats;
    const p1 = [b1.x + 4, b1.y - b1.L * 0.09];
    const p2 = [b2.x - 4, b2.y - b2.L * 0.09];
    out.push(path(rope(p1, [540, FACE - 8]) + rope(p2, [1184, FACE - 8])));
    out.push(bollard(540) + bollard(1184) + bollard(286) + bollard(1420));
  }

  return svg(360, 2.6, out.join(''));
}

for (const [name, body] of [
  ['footer-island-far', far()],
  ['footer-island-mid', mid()],
  ['footer-island-near', near()],
]) {
  writeFileSync(resolve(outDir, `${name}.svg`), body);
  console.log(name, `${(body.length / 1024).toFixed(1)} KB`);
}
