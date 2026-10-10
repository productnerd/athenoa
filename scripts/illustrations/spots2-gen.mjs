// Generates the seven small illustrations: lyre, olive-branch, laurel, temple and the three
// membership emblems (icon-spirit, icon-community, icon-contribution).
//   node scripts/illustrations/spots2-gen.mjs            writes into src/assets/illustrations
//   node scripts/illustrations/spots2-gen.mjs <dir>      writes somewhere else (for trying things out)
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { P, SLIM, along, circle, ellipse, inside, leaf, n1, path, ribbon, rng, sample, spline, svg, visibleRuns } from './spots2-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.argv[2] ?? resolve(here, '../../src/assets/illustrations'));
const deg = Math.PI / 180;

/* ------------------------------------------------------------------ lyre */
// The chelys of Orpheus: horn arms, a yoke, seven strings, a tortoise shell covered in scales.
// Nothing is filled: the arms end on the shell and break where they pass behind the yoke.
function lyre() {
  const W = 300;
  const flip = (pts) => pts.map(([x, y]) => [W - x, y]);

  // Sound box: a rounded shell, a little broader at the shoulders.
  const egg = (a, b, cy, taper, e = 2.3, n = 20) =>
    Array.from({ length: n }, (_, i) => {
      const th = (i / n) * Math.PI * 2;
      const c = Math.cos(th);
      const s = Math.sin(th);
      const ux = Math.sign(c) * Math.abs(c) ** (2 / e);
      const uy = Math.sign(s) * Math.abs(s) ** (2 / e);
      return [150 + a * ux * (1 - taper * uy), cy + b * uy];
    });
  const shellPts = egg(76, 68, 266, 0.07);
  const shellD = spline(shellPts, { closed: true });
  const shellPoly = sample(shellPts, 8, true);
  const fieldD = spline(egg(64.5, 38.5, 286, 0.07), { closed: true });

  // Yoke with a round finial at each end.
  const yokeTop = 80.5;
  const yokeBottom = 90;
  const yoke =
    path(`M44.1 ${yokeTop}H255.9M44.1 ${yokeBottom}H255.9`) + circle(39.5, 85.25, 6.6) + circle(260.5, 85.25, 6.6);

  // Arms rise from behind the shell, bow outward, come in to the yoke and flick out at the tips.
  const armLine = [
    [121, 250],
    [99, 214],
    [73, 178],
    [55, 138],
    [56, 102],
    [68, 74],
    [72, 50],
    [61, 27],
  ];
  const { L, R, dense } = ribbon(armLine, (t) => 4.2 + 12.5 * (1 - t) ** 0.85, 3);
  const end = dense[dense.length - 1];
  const before = dense[dense.length - 3];
  const h = Math.atan2(end[1] - before[1], end[0] - before[0]);
  const tip = [end[0] + Math.cos(h) * 3, end[1] + Math.sin(h) * 3];
  const armPts = [...L.slice(0, -1), tip, ...R.slice(0, -1).reverse()];
  const covered = (p) => inside(p, shellPoly) || (p[1] > yokeTop && p[1] < yokeBottom);
  const arm = (pts) => path(visibleRuns(pts, covered).map((run) => spline(run)).join(''));
  const arms = arm(armPts) + arm(flip(armPts));

  // Scales, cut to the inner field.
  const r = 11;
  let rows = '';
  for (let k = 0; k < 8; k++) {
    const y = 240.5 + k * r;
    const count = k % 2 ? 7 : 6;
    const x0 = 150 - r * count;
    rows += path(`M${P(x0, y)}` + `a${n1(r)} ${n1(r)} 0 0 0 ${n1(2 * r)} 0`.repeat(count));
  }
  const scales =
    `<clipPath id="lyre-field"><path d="${fieldD}"/></clipPath>` +
    `<g clip-path="url(#lyre-field)">${rows}</g>` +
    path(fieldD);

  // Bridge and seven strings. The strings pass over the yoke and stop on the bridge.
  const bridge = `<rect x="121" y="228.5" width="58" height="8" rx="4"/>`;
  let strings = '';
  for (let i = 0; i < 7; i++) {
    const top = 112.5 + i * 12.5;
    const bottom = 128.4 + i * 7.2;
    strings += path(`M${P(top, yokeTop)}L${P(bottom, 228.5)}`);
  }

  return svg(300, 360, 2.5, arms + yoke + path(shellD) + scales + bridge + strings);
}

/* ---------------------------------------------------------- olive branch */
function oliveBranch() {
  const rand = rng(31);
  const stemPts = [
    [10, 107],
    [62, 100],
    [124, 84],
    [192, 74],
    [258, 75],
    [318, 67],
    [366, 51],
  ];
  const dense = sample(stemPts, 14);
  let leaves = '';
  let fruit = '';

  // Olives hang under the branch on short stalks, where a lower leaf would otherwise be.
  const hang = (f, dx, drop, tilt) => {
    const b = along(dense, f);
    const ex = b.x + dx;
    const ey = b.y + drop;
    fruit += path(`M${P(b.x, b.y)}Q${P(b.x + dx * 0.1, b.y + drop * 0.55)} ${P(ex, ey)}`);
    const a = (90 + tilt) * deg;
    fruit += ellipse(ex + Math.cos(a) * 10.4, ey + Math.sin(a) * 10.4, 10.8, 7.8, 90 + tilt);
  };
  const nodes = [0.115, 0.235, 0.355, 0.475, 0.595, 0.715, 0.825, 0.92];
  const fruited = { 1: [[0.03, 3, 11, -9]], 3: [[0.028, -1, 10, 5], [0.076, 3, 15, -12]], 5: [[0.03, 2, 11, -7]] };
  nodes.forEach((f, i) => {
    const size = 1 - 0.4 * (i / (nodes.length - 1)) ** 1.5;
    for (const side of [-1, 1]) {
      if (side === 1 && fruited[i]) {
        for (const [df, dx, drop, tilt] of fruited[i]) hang(f + df, dx, drop, tilt);
        continue;
      }
      // a lower leaf just before fruit is shorter and turns further down, out of the way
      const beforeFruit = side === 1 && fruited[i + 1];
      const b = along(dense, f + side * 0.009);
      const spread = (beforeFruit ? 46 + rand() * 6 : 33 + rand() * 15) * deg;
      const len = (beforeFruit ? 41 + rand() * 4 : 46 + rand() * 11) * size;
      const lf = leaf(b.x, b.y, b.ang + side * spread, len, 7 * (0.72 + 0.28 * size), -side * (0.04 + rand() * 0.06), 0.74, SLIM);
      leaves += path(lf.outline + lf.rib);
    }
  });
  const end = along(dense, 1);
  const last = leaf(end.x, end.y, end.ang - 4 * deg, 27, 4.8, 0.05, 0.74, SLIM);
  leaves += path(last.outline + last.rib);

  return svg(400, 160, 2.5, path(spline(stemPts)) + leaves + fruit);
}

/* ---------------------------------------------------------------- laurel */
// Two sprays crossed at the foot, open at the top. No leaf touches another and none is filled,
// so the wreath can sit over an edge or on any ground.
function laurel() {
  const rand = rng(8);
  const cx = 150;
  const cy = 147;
  const R = 100;
  const half = (mirror) => {
    const X = (x) => (mirror ? 300 - x : x);
    const A = (a) => (mirror ? Math.PI - a : a);
    const at = (th, rad = R) => [cx + rad * Math.cos(th * deg), cy + rad * Math.sin(th * deg)];

    // Stem: from a tail past the bottom, up the side, stopping short of the top.
    const stem = [
      [163, cy + R + 20],
      [153.5, cy + R + 10],
      [141, cy + R + 2.8],
    ];
    for (let th = 103; th <= 244; th += 7.05) stem.push(at(th));
    let out;
    if (!mirror) {
      out = path(spline(stem));
    } else {
      // The right stem passes under the left one where they cross, so it breaks there.
      const pts = stem.map(([x, y]) => [X(x), y]);
      const fine = sample(pts, 8);
      const k = fine.findIndex((p) => p[0] >= 150);
      const cross = fine[k];
      const far = (p) => Math.hypot(p[0] - cross[0], p[1] - cross[1]) >= 3.8;
      const stop = fine.findLastIndex((p, i) => i < k && far(p));
      const start = fine.findIndex((p, i) => i > k && far(p));
      const tail = fine.slice(0, stop + 1).filter((_, i, a) => i === 0 || i === a.length - 1 || i % 3 === 0);
      const rest = [fine[start], ...fine.filter((_, i) => i > start + 3 && i % 8 === 0)];
      out = path(spline(tail) + spline(rest));
    }

    // Leaves alternate outside and inside, from the foot to the tip.
    const list = [];
    for (let k = 0; k < 9; k++) {
      list.push({ th: 108 + k * 15.3, side: -1 });
      list.push({ th: 116 + k * 15.3, side: 1 });
    }
    list.sort((a, b) => a.th - b.th);
    for (const { th, side } of list) {
      const [x, y] = at(th);
      const grow = 1 - 0.22 * ((th - 108) / 136) ** 2;
      const lean = (side < 0 ? 42 : 39) + (rand() - 0.5) * 6;
      const len = (side < 0 ? 35.5 : 31) * grow + (rand() - 0.5) * 2.2;
      const ang = (th + 90) * deg + side * lean * deg;
      const lf = leaf(X(x), y, A(ang), len, 7.3 * grow, (mirror ? -1 : 1) * side * -0.05, 0.74, SLIM);
      out += path(lf.outline + lf.rib);
    }
    const tipLeaf = at(244);
    const t = leaf(X(tipLeaf[0]), tipLeaf[1], A((244 + 86) * deg), 25, 6, 0, 0.74, SLIM);
    out += path(t.outline + t.rib);
    return out;
  };
  return svg(300, 300, 2.5, half(false) + half(true));
}

/* ---------------------------------------------------------------- temple */
function temple() {
  const rand = rng(5);
  const j = (a = 0.5) => (rand() - 0.5) * 2 * a;
  const oy = 7; // whole drawing shifted down so it sits in the middle of the box
  const Y = (y) => y + oy;
  // A straight line the way a hand rules it: very slightly bowed.
  const rule = (x1, y1, x2, y2, wob = 0.5) =>
    path(`M${P(x1, Y(y1))}Q${P((x1 + x2) / 2 + j(wob), Y((y1 + y2) / 2) + j(wob))} ${P(x2, Y(y2))}`);
  let out = '';

  // Pediment with a round shield in the tympanum and a bud on the apex.
  out += path(`M${P(36, Y(84))}L${P(200, Y(30))}L${P(364, Y(84))}`);
  out += path(`M${P(78, Y(77.5))}L${P(200, Y(37.6))}L${P(322, Y(77.5))}Z`);
  out += circle(200, Y(62.5), 8.2);
  out += path(
    `M${P(200, Y(30))}C${P(193.5, Y(24))} ${P(195, Y(17))} ${P(200, Y(12.5))}C${P(205, Y(17))} ${P(206.5, Y(24))} ${P(200, Y(30))}Z`,
  );

  // Cornice, frieze with triglyphs, architrave.
  out += `<rect x="36" y="${n1(Y(84))}" width="328" height="6.5" rx="1.6"/>`;
  out += path(`M${P(47.5, Y(90.5))}L${P(47.5, Y(118))}L${P(352.5, Y(118))}L${P(352.5, Y(90.5))}`);
  out += rule(47.5, 105, 352.5, 105, 0.3);
  const centres = [0, 1, 2, 3, 4, 5].map((i) => 64 + i * 54.4);
  const glyphs = [];
  centres.forEach((c, i) => {
    glyphs.push(c);
    if (i < 5) glyphs.push(c + 27.2);
  });
  let marks = '';
  for (const g of glyphs) {
    for (const dx of [-2.8, 2.8]) marks += `M${P(g + dx, Y(94.2))}L${P(g + dx + j(0.3), Y(101.3))}`;
  }
  out += path(marks);

  // Six fluted columns with cushion capitals.
  for (const c of centres) {
    const wb = 12.6; // half width at the foot
    const wt = 10.2; // half width under the capital
    const top = 133;
    const foot = 238;
    out += path(`M${P(c - 16.5, Y(118))}L${P(c - 16.5, Y(124.5))}L${P(c + 16.5, Y(124.5))}L${P(c + 16.5, Y(118))}`);
    out += path(`M${P(c - 15, Y(124.5))}Q${P(c - 13.5, Y(131.5))} ${P(c - wt, Y(top))}L${P(c + wt, Y(top))}Q${P(c + 13.5, Y(131.5))} ${P(c + 15, Y(124.5))}`);
    let shaft = '';
    for (const s of [-1, 1]) {
      shaft += `M${P(c + s * wt, Y(top))}Q${P(c + s * ((wb + wt) / 2 + 0.9), Y(190))} ${P(c + s * wb, Y(foot))}`;
    }
    for (const f of [-0.5, 0, 0.5]) {
      shaft += `M${P(c + f * wt + j(0.25), Y(top + 5 + j(1)))}Q${P(c + f * ((wb + wt) / 2 + 0.6), Y(190))} ${P(c + f * wb + j(0.25), Y(foot - 4.5 + j(1)))}`;
    }
    out += path(shaft);
  }

  // Three steps.
  [
    [44, 238],
    [34, 249.5],
    [24, 261],
  ].forEach(([x, y]) => {
    out += path(`M${P(x, Y(y + 11.5))}L${P(x, Y(y))}L${P(400 - x, Y(y))}L${P(400 - x, Y(y + 11.5))}`);
  });
  out += rule(24, 272.5, 376, 272.5, 0.3);

  return svg(400, 300, 2.5, out);
}

/* ---------------------------------------------------------- three emblems */
const ICON_STROKE = 3.4;

// The Living Spirit: a torch, its flame, and breath rising on either side.
function iconSpirit() {
  let out = '';
  // breath
  const wave = (x, y, n, dir) => {
    let d = `M${P(x, y)}`;
    for (let i = 0; i < n; i++) {
      const s = (i % 2 ? -1 : 1) * dir;
      d += `q${n1(s * 7.5)} -8.5 0 -17`;
    }
    return path(d);
  };
  out += wave(38, 99, 4, -1) + wave(21, 86, 2, -1);
  out += wave(122, 99, 4, 1) + wave(139, 86, 2, 1);
  // flame
  out += path('M64.5 90C53 79 53.5 60 64.5 48C73 38.5 82.5 31 85.5 13C91 32 106.5 45 106.5 66C106.5 77 102.5 85 95.5 90');
  out += path('M73.5 90C67.5 82 69.5 71.5 76 64.5C80.5 59.5 83 54.5 83 47.5C89.5 56.5 94.5 64.5 93.8 75C93.4 81.5 91 86.5 87.5 90');
  // bowl and handle
  out += `<rect x="57.5" y="90" width="45" height="8" rx="4"/>`;
  out += path('M64 98L77 146.5Q80 150.5 83 146.5L96 98');
  out += path('M67.4 111Q80 115 92.6 111');
  out += path('M70.8 123.5Q80 127 89.2 123.5');
  return svg(160, 160, ICON_STROKE, out);
}

// Our Community: six figures in a ring around a small fire in its bowl.
function iconCommunity() {
  let out = '';
  const c = 80;
  const rx = 15.8; // shoulders, across
  const ry = 12.6; // shoulders, towards the head
  const head = 8.2;
  for (let i = 0; i < 6; i++) {
    const turn = -90 + i * 60;
    const th = turn * deg;
    const rad = [Math.cos(th), Math.sin(th)];
    const tan = [-rad[1], rad[0]];
    const at = (u, v) => [c + rad[0] * (34 + v) + tan[0] * u, c + rad[1] * (34 + v) + tan[1] * u];
    const dip = 9 * deg;
    const s = at(-rx * Math.cos(dip), -ry * Math.sin(dip));
    const e = at(rx * Math.cos(dip), -ry * Math.sin(dip));
    out += path(`M${P(...s)}A${rx} ${ry} ${n1(turn + 90)} 1 1 ${P(...e)}`);
    out += circle(...at(0, ry + 3.2 + head), head);
  }
  out += path('M80.5 92.5C74.3 92.5 70.3 88.2 70.3 83C70.3 73.3 82 71.1 80.2 57.2C86.7 64.6 90.6 73.1 90.6 82.1C90.6 88 86.7 92.5 80.5 92.5Z');
  out += path('M65.1 93.9Q80 105 94.9 93.9');
  return svg(160, 160, ICON_STROKE, out);
}

// Your Contribution: an open hand offering a sprig.
function iconContribution() {
  let out = '';
  // sprig, standing in the palm
  const stemPts = [
    [103, 113.6],
    [101.5, 92],
    [103, 70],
    [101, 48],
  ];
  const dense = sample(stemPts, 10);
  out += path(spline(stemPts));
  [0.34, 0.56, 0.78].forEach((f, i) => {
    for (const side of [-1, 1]) {
      const b = along(dense, f + side * 0.02);
      const lf = leaf(b.x, b.y, b.ang + side * (44 - i * 2) * deg, 25.5 - i * 2.5, 5.8 - i * 0.4, -side * 0.08, 0.74, SLIM);
      out += path(lf.outline);
    }
  });
  const top = leaf(101, 48, -92 * deg, 24, 5.2, 0, 0.74, SLIM);
  out += path(top.outline);
  // hand, palm up, thumb nearest
  out += path(
    'M24 108C38 106 49 101.5 60 99C70 96.5 79 91.5 87.5 91C93.5 90.7 95 96.5 89.5 98.5C82.5 101 76.5 102.5 72 106.5' +
      'C84 113.5 104 114.5 120 110.5C130 108 137.5 102 142.5 96.5C146 92.8 151 97 148 101.5' +
      'C140.5 113.5 124.5 126 104 131C80 137 48 135 24 131',
  );
  // cuff
  out += `<rect x="13" y="102.5" width="11" height="34" rx="4.2"/>`;
  return svg(160, 160, ICON_STROKE, out);
}

const drawings = {
  lyre,
  'olive-branch': oliveBranch,
  laurel,
  temple,
  'icon-spirit': iconSpirit,
  'icon-community': iconCommunity,
  'icon-contribution': iconContribution,
};

mkdirSync(outDir, { recursive: true });
for (const [name, draw] of Object.entries(drawings)) {
  const text = draw();
  writeFileSync(resolve(outDir, `${name}.svg`), text);
  console.log(`${name}.svg  ${(text.length / 1024).toFixed(1)} KB`);
}
