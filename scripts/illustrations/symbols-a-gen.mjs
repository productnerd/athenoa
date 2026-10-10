// Generates the symbols-a set: tetractys, monad, bow-lyre, cave-sun, ladder, torch.
//   node scripts/illustrations/symbols-a-gen.mjs [--dir outDir] [--only a,b]
// One stroke weight (SW) for the whole family; every drawing is checked by eye afterwards with
//   node scripts/illustrations/symbols-a-sheet.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEEP, PAPER, TAU, P, band, circle, dot, inside, line, n1, path, sample, spline, svg, thin, visibleRuns, wash,
} from './symbols-a-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const outDir = resolve(opt('dir', resolve(here, '../../src/assets/illustrations')));
const only = opt('only');

const SW = 2.5;

// A wavy ray along a straight line: whole or half waves, so it starts and ends on the axis.
function ray(a, b, waves, amp) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const n = Math.round(waves * 8);
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const o = Math.sin(t * waves * TAU) * amp * (0.7 + 0.3 * t);
    pts.push([a[0] + dx * t - (dy / len) * o, a[1] + dy * t + (dx / len) * o]);
  }
  return path(spline(pts));
}

// The sun of the set: the point within the circle, and sixteen wavy rays, long and short in turn.
// `hide` drops a ray whose end it covers.
function sun([cx, cy], { ring = 17, point = 4.6, r0 = 27, long = 57, short = 47, amp = 2.2, hide } = {}) {
  const out = [dot(cx, cy, point), circle(cx, cy, ring)];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU - Math.PI / 2;
    const isLong = i % 2 === 0;
    const r1 = isLong ? long : short;
    const p1 = [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1];
    if (hide && hide(p1)) continue;
    out.push(ray([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], p1, isLong ? 1.5 : 1, amp));
  }
  return out.join('');
}

// Points along a circular arc from p to q that bulges by `sag` to the left of the direction p→q
// (on screen: above, when going left to right with a negative sag... see callers).
function bump(p, q, sag, n = 10) {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  const c = Math.hypot(dx, dy);
  const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const nx = dy / c;
  const ny = -dx / c;
  // quadratic through p, the apex and q
  const apex = [m[0] + nx * sag, m[1] + ny * sag];
  const ctrl = [2 * apex[0] - m[0], 2 * apex[1] - m[1]];
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([
      (1 - t) ** 2 * p[0] + 2 * t * (1 - t) * ctrl[0] + t * t * q[0],
      (1 - t) ** 2 * p[1] + 2 * t * (1 - t) * ctrl[1] + t * t * q[1],
    ]);
  }
  return pts;
}

// Points of a curve given at equal steps of its own length.
function byLength(dense, n) {
  const acc = [0];
  for (let i = 1; i < dense.length; i++) acc.push(acc[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = acc[acc.length - 1];
  const out = [];
  let j = 1;
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * total;
    while (j < dense.length - 1 && acc[j] < s) j++;
    const t = (s - acc[j - 1]) / (acc[j] - acc[j - 1] || 1);
    out.push([dense[j - 1][0] + (dense[j][0] - dense[j - 1][0]) * t, dense[j - 1][1] + (dense[j][1] - dense[j - 1][1]) * t]);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Tetractys: ten points in rows of one, two, three and four, an exact equilateral lattice and
// nothing else. Each point is itself a small monad (the point within the circle).
function tetractys() {
  const cx = 160;
  const d = 78;
  const step = (d * Math.sqrt(3)) / 2;
  const top = (320 - 3 * step) / 2;
  const out = [];
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i <= r; i++) {
      const p = [cx + (i - r / 2) * d, top + r * step];
      out.push(circle(...p, 17));
      out.push(dot(...p, 7.8));
    }
  }
  return svg(320, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// Monad: the point within the circle, the well-rounded sphere "equally balanced in every
// direction from the centre"; from it the light goes out, and at the rim stand the Many.
function monad() {
  const c = 160;
  const out = [];
  const v = process.env.MONAD ?? 'a';
  out.push(dot(c, c, 8.2));
  out.push(circle(c, c, 40));
  if (v === 'b') out.push(circle(c, c, 52));
  const n = 24;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2;
    const isLong = i % 2 === 0;
    const r0 = v === 'b' ? 67 : 58;
    const r1 = isLong ? 114 : 99;
    out.push(ray([c + Math.cos(a) * r0, c + Math.sin(a) * r0], [c + Math.cos(a) * r1, c + Math.sin(a) * r1], 1, isLong ? 2.7 : 2.2));
  }
  // The Many: a beaded rim, two points to a ray. Tiny stroked circles, so that where the page
  // draws the strokes in they arrive last, after the rays have reached them.
  for (let i = 0; i < 48; i++) {
    const a = ((i + 0.5) / 48) * TAU - Math.PI / 2;
    out.push(circle(c + Math.cos(a) * 132, c + Math.sin(a) * 132, 1));
  }
  return svg(320, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// Bow and lyre (Heraclitus B51, the back-turning harmony). They stand side by side as equals:
// the strung bow upright with its string taut in open air, the lyre beside it with its seven
// strings parallel to that one. The limb of the bow and the arm of the lyre are the same double
// curve, and they turn their backs to each other.
function bowLyre() {
  const out = [];
  const top = 27;
  const bottom = 293;
  const mid = (top + bottom) / 2;

  // --- Bow -------------------------------------------------------------------------------
  const sx = 43; // the string
  const reach = (bottom - top) / 2; // from the grip to the end of a tip
  // One limb from the grip outward: [distance from the string, distance from the grip].
  const limb = [
    [45, 0], [45.5, 9], [48.5, 22], [55, 38], [62.5, 55], [66.5, 72], [64, 89], [54.5, 103], [39, 113],
    [22, 119.5], [8, 123], [1.5, 126], [0, 129.5], [3.5, 133],
  ].map(([o, v]) => [o, (v / 133) * reach]);
  const nockAt = limb[limb.length - 3];
  const stave = [
    ...limb.slice(1).reverse().map(([o, v]) => [sx + o, mid - v]),
    ...limb.map(([o, v]) => [sx + o, mid + v]),
  ];
  const dense = sample(stave, 8);
  // thick in the hand, fine at the tips
  const bow = band(dense, (t) => 3.8 + 7.4 * Math.sin(Math.PI * t) ** 0.55, { per: 1, every: 4 });
  out.push(path(bow.d, PAPER));
  // the binding of the grip
  const edgeAt = (edge, y) => edge.reduce((best, p) => (Math.abs(p[1] - y) < Math.abs(best[1] - y) ? p : best));
  [-12, -4, 4, 12].forEach((dy) => out.push(line(edgeAt(bow.L, mid + dy), edgeAt(bow.R, mid + dy))));
  // the string, looped over each nock
  const nock = [sx + nockAt[0], nockAt[1]];
  out.push(line([sx + 0.4, mid - nock[1] + 4], [sx + 0.4, mid + nock[1] - 4]));
  out.push(circle(nock[0] - 0.6, mid - nock[1] + 0.5, 3.7, PAPER));
  out.push(circle(nock[0] - 0.6, mid + nock[1] - 0.5, 3.7, PAPER));

  // --- Lyre ------------------------------------------------------------------------------
  const X = 229;
  const mirror = (pts) => pts.map(([x, y]) => [2 * X - x, y]);
  const barY = 68;
  const shellTop = 207;
  const shellH = bottom - shellTop;
  const cy = shellTop + shellH / 2;

  // Arms (horns), behind shell and crossbar: out from the shell, in to the bar, and a tip turned back.
  const armL = [
    [X - 26, cy + 4], [X - 40, cy - 22], [X - 56, cy - 48], [X - 71, cy - 76], [X - 80, cy - 104],
    [X - 80, cy - 130], [X - 73, cy - 152], [X - 65, barY + 8], [X - 60, barY - 8], [X - 60.5, barY - 22],
    [X - 66, barY - 33], [X - 75, top + 1],
  ];
  const armW = (t) => (t < 0.8 ? 10.5 - 3.6 * t : Math.max(0, 7.6 * (1 - (t - 0.8) / 0.2) ** 0.8));
  [armL, mirror(armL)].forEach((pts) => out.push(path(band(sample(pts, 8), armW, { per: 1, every: 4 }).d, PAPER)));

  // Shell: a plain rounded box.
  const shell = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU;
    const co = Math.cos(a);
    const si = Math.sin(a);
    const e = 2 / 2.6;
    shell.push([X + Math.sign(co) * Math.abs(co) ** e * 55, cy + Math.sign(si) * Math.abs(si) ** e * (shellH / 2)]);
  }
  out.push(path(spline(thin(shell, 2), { closed: true }), PAPER));

  // Seven strings, well apart.
  const bridgeY = shellTop + 27;
  for (let i = -3; i <= 3; i++) out.push(line([X + i * 12, barY + 4], [X + i * 10.4, bridgeY - 3]));
  // Crossbar and bridge.
  const bar = (x0, x1, y, h) =>
    `<rect x="${n1(x0)}" y="${n1(y - h / 2)}" width="${n1(x1 - x0)}" height="${n1(h)}" rx="${n1(h / 2)}" fill="${PAPER}"/>`;
  out.push(bar(X - 86, X + 86, barY, 7.6));
  out.push(circle(X - 91.5, barY, 5.6, PAPER));
  out.push(circle(X + 91.5, barY, 5.6, PAPER));
  out.push(bar(X - 39, X + 39, bridgeY, 6.6));

  // The scutes of the tortoise: three, two, one, hanging below the bridge.
  const r = 12.6;
  const scale = (x, y) => `M${P(x - r, y)}C${P(x - r, y + r * 1.36)} ${P(x + r, y + r * 1.36)} ${P(x + r, y)}`;
  let scutes = '';
  [[-2, 0, 2], [-1, 1], [0]].forEach((row, k) => row.forEach((c) => (scutes += scale(X + c * r, bridgeY + 10.5 + k * r * 1.02))));
  out.push(path(scutes));
  return svg(360, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// Plato's cave seen from outside: a hill in rings of rock that close in on the dark mouth, the
// rough way that issues from it and climbs over the shoulder of the hill, and the sun beyond.
function caveSun() {
  const out = [];
  const base = 263;
  const N = 60;

  // The mouth: an arch.
  const mx = 136;
  const mw = 27;
  const mh = 66;
  const archAt = (t, inset = 0) => {
    const a = Math.PI * t;
    return [mx - Math.cos(a) * Math.abs(Math.cos(a)) ** -0.22 * (mw - inset), base - Math.sin(a) ** 0.86 * (mh - inset)];
  };
  const mouth = [];
  for (let i = 0; i <= N; i++) mouth.push(archAt(i / N));

  // The hill, from its left foot over the crest to its right foot.
  const crest = [124, 101];
  const left = sample([[27, base], [30, 222], [46, 176], [79, 132], crest], 12);
  const right = sample([crest, [169, 105], [207, 125], [238, 150], [264, 171], [291, 198], [316, 231], [333, base]], 12);
  const hill = [...byLength(left, N / 2), ...byLength(right, N / 2).slice(1)];

  // The way out: it leaves the threshold, comes forward and round, and winds up the flank of the
  // hill to its shoulder, narrowing as it goes.
  const wayPts = [
    [mx, base], [mx + 2, base + 10], [mx + 11, base + 21], [mx + 30, base + 28], [mx + 55, base + 27.5], [mx + 77, base + 19],
    [mx + 93, base + 4], [mx + 102.5, base - 14], [mx + 105, base - 32], [mx + 101, base - 49], [mx + 100, base - 64],
    [mx + 106.5, base - 77], [mx + 118, base - 87],
  ];
  const way = band(wayPts, (t) => (t < 0.22 ? 14 + (t / 0.22) * 5 : 19 - ((t - 0.22) / 0.78) ** 0.8 * 14), { per: 8, every: 4 });
  const covered = (p) => inside(p, way.outline) || (inside(p, mouth) && p[1] < base);

  // Rings of rock between mouth and hill, each a little nearer the hill's own shape.
  const K = 6;
  for (let k = 1; k <= K; k++) {
    const pts = mouth.map((m, i) => {
      const t = i / N;
      const u = (k / K) ** 0.94 + (k < K ? 0.012 * Math.sin(t * 9 + k * 2.1) : 0);
      return [m[0] + (hill[i][0] - m[0]) * u, m[1] + (hill[i][1] - m[1]) * u];
    });
    visibleRuns(pts, covered, 10).forEach((run) => out.push(path(spline(thin(run, 4)))));
  }
  // The plain the hill stands on.
  const plain = [];
  for (let x = 20; x <= 340; x += 4) plain.push([x, base]);
  visibleRuns(plain, covered, 6).forEach((run) => out.push(path(spline(thin(run, 4)))));

  // The dark: the same arch again and again, close together, down to a single line.
  if (process.env.CAVE !== 'hatch') out.push(wash(`${spline(thin(mouth, 4))}Z`, DEEP, true));
  if (process.env.CAVE !== 'wash') {
    const gap = 4.7;
    let dark = '';
    for (let j = 1; j * gap < mw - 2; j++) {
      const pts = [];
      for (let i = 0; i <= N; i++) pts.push(archAt(i / N, j * gap));
      dark += spline(thin(pts, 4));
    }
    dark += `M${P(mx, base)}L${P(mx, base - mh + mw + 2)}`;
    out.push(path(dark));
  }
  out.push(path(spline(thin(mouth, 4))));
  out.push(path(spline(thin(way.L, 4))));
  out.push(path(spline(thin(way.R, 4))));

  // The sun.
  out.push(sun([279, 84]));
  return svg(360, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// The ascent of the Symposium: six rungs (one body, all bodies, souls, practices, learnings, the
// one learning of Beauty) and, beyond the last, the sun of the set.
function ladder() {
  const X = 130;
  const out = [];
  const yTop = 144;
  const yBot = 322;
  const halfAt = (y) => 22 + ((y - yTop) / (yBot - yTop)) * 19;
  const railAt = (y) => 5.4 + ((y - yTop) / (yBot - yTop)) * 1.8;
  const groundAt = (x) => yBot + 2.5 - Math.cos(((x - X) / 62) * TAU) * 2.2;
  // what the ladder covers, with a little air round it
  const behind = ([x, y]) => y > yTop - 12 && Math.abs(x - X) < halfAt(Math.min(yBot, Math.max(yTop, y))) + railAt(y) / 2 + 6.5;

  // Bands of cloud that the ladder climbs through: scallops above, a shallower swell below.
  const cloud = (cx, cy, W, tops, bots) => {
    const arch = (f, h) => cy - h * (1 - f * f);
    let d = '';
    const add = (pts) => visibleRuns(pts, behind, 5).forEach((run) => (d += spline(thin(run, 3))));
    for (let i = 0; i < tops.length - 1; i++) {
      const p = [cx + tops[i] * W, arch(tops[i], 5)];
      const q = [cx + tops[i + 1] * W, arch(tops[i + 1], 5)];
      add(bump(p, q, Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.44));
    }
    for (let i = 0; i < bots.length - 1; i++) {
      const p = [cx + bots[i] * W, arch(bots[i], -5)];
      const q = [cx + bots[i + 1] * W, arch(bots[i + 1], -5)];
      add(bump(p, q, Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.2));
    }
    out.push(path(d));
  };
  cloud(X, 271, 97, [-1, -0.6, -0.1, 0.42, 0.74, 1], [1, 0.52, -0.02, -0.5, -1]);
  cloud(X, 206, 78, [-1, -0.7, -0.16, 0.3, 0.7, 1], [1, 0.46, -0.06, -0.54, -1]);

  // Ground: both feet stand on it alike.
  const ground = (x0, x1, dy) => {
    const pts = [];
    for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 36) pts.push([x, groundAt(x) + dy]);
    return path(spline(thin(pts, 2)));
  };
  out.push(ground(X - 92, X + 92, 0));
  out.push(ground(X - 54, X + 54, 10.5));

  // Rungs: single lines. Rails: double, rounded at the top and planted on the ground line.
  const gaps = [26, 33.5, 30, 27, 24, 21.5];
  let y = yBot;
  gaps.forEach((g) => {
    y -= g;
    const h = halfAt(y) - railAt(y) / 2;
    out.push(line([X - h, y], [X + h, y]));
  });
  [-1, 1].forEach((sd) => {
    const w0 = railAt(yTop) / 2;
    const w1 = railAt(yBot) / 2;
    const topX = X + sd * halfAt(yTop);
    const botX = X + sd * halfAt(yBot);
    const a = [botX - w1, groundAt(botX - w1)];
    const b = [botX + w1, groundAt(botX + w1)];
    out.push(
      path(
        `M${P(...a)}L${P(topX - w0, yTop + 2)}Q${P(topX - w0, yTop - w0 - 1)} ${P(topX, yTop - w0 - 1)}Q${P(topX + w0, yTop - w0 - 1)} ${P(topX + w0, yTop + 2)}L${P(...b)}`,
      ),
    );
  });

  // Beauty itself.
  out.push(sun([X, 79], { ring: 16, point: 4.6, r0: 25.5, long: 54, short: 44.5 }));
  return svg(260, 360, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// A torch of the mysteries: the long bound bundle of Eleusis, upright, and a flame combed into
// flowing lines that leave the head together and gather to one point.
function torch() {
  const X = 110;
  const out = [];
  const yTop = 142;
  const yBot = 338;
  const halfAt = (y) => 15.5 - ((y - yTop) / (yBot - yTop)) * 8.3;

  // Flame. s runs from the head (0) to the tip (1); every line in it keeps its share of the width
  // and sways with the rest.
  const H = 118;
  const cPts = sample([[0, 0], [2, 12], [3, 25], [0.5, 40], [-5, 56], [-7, 70], [-4.5, 82], [1.5, 92], [9, 100]], 10);
  const centre = (s) => {
    const v = s * 100;
    for (let i = 1; i < cPts.length; i++) {
      if (cPts[i][1] >= v) {
        const t = (v - cPts[i - 1][1]) / (cPts[i][1] - cPts[i - 1][1] || 1);
        return cPts[i - 1][0] + (cPts[i][0] - cPts[i - 1][0]) * t;
      }
    }
    return cPts[cPts.length - 1][0];
  };
  const wide = (s) => 14 * (1 - s) ** 2 + 168 * s * (1 - s) ** 1.6;
  const strand = (u, s0, s1) => {
    const pts = [];
    const n = Math.round((s1 - s0) * 34);
    for (let i = 0; i <= n; i++) {
      const s = s0 + (i / n) * (s1 - s0);
      pts.push([X + centre(s) + u * wide(s), yTop + 1 - s * H]);
    }
    return pts;
  };
  const l = strand(-1, 0, 1);
  const r = strand(1, 0, 1);
  out.push(path(`${spline(thin(l, 3))}${spline(thin(r.reverse(), 3), { cont: true })}`));
  [[-0.6, 0.07, 0.8], [-0.2, 0.12, 0.66], [0.2, 0.05, 0.73], [0.6, 0.1, 0.6]].forEach(([u, s0, s1]) => out.push(path(spline(thin(strand(u, s0, s1), 3)))));

  // Shaft: a bundle of rods narrowing to the foot.
  out.push(
    path(
      `M${P(X - halfAt(yTop), yTop)}L${P(X - halfAt(yBot), yBot - 4)}Q${P(X, yBot + 6)} ${P(X + halfAt(yBot), yBot - 4)}L${P(X + halfAt(yTop), yTop)}Z`,
      PAPER,
    ),
  );
  const ties = [yTop + 3, 186, 228, 268, 305];
  [-0.32, 0.32].forEach((k) => out.push(line([X + k * halfAt(yTop), yTop], [X + k * halfAt(305), 305])));
  // Bindings.
  ties.forEach((y, i) => {
    const h = halfAt(y) + (i === 0 ? 4.4 : 3.4);
    const t = i === 0 ? 8.4 : 6.8;
    out.push(`<rect x="${n1(X - h)}" y="${n1(y - t / 2)}" width="${n1(h * 2)}" height="${n1(t)}" rx="${n1(t / 2)}" fill="${PAPER}"/>`);
  });
  return svg(220, 360, SW, out.join(''));
}

const all = { tetractys, monad, 'bow-lyre': bowLyre, 'cave-sun': caveSun, ladder, torch };
mkdirSync(outDir, { recursive: true });
for (const [name, draw] of Object.entries(all)) {
  if (only && !only.split(',').includes(name)) continue;
  const file = resolve(outDir, `${name}.svg`);
  writeFileSync(file, draw());
  console.log(file);
}
