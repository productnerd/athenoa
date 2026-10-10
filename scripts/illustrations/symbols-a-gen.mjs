// Generates the symbols-a set: tetractys, monad, bow-lyre, cave-sun, ladder, torch.
//   node scripts/illustrations/symbols-a-gen.mjs [--dir outDir] [--only a,b]
// One stroke weight (SW) for the whole family; every drawing is checked by eye afterwards with
//   node scripts/illustrations/symbols-a-sheet.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEEP, PAPER, TAU, P, arc, band, circle, distTo, dot, ellipse, inside, line, n1, path, poly, sample,
  spline, svg, thin, visibleRuns, wash, wavy,
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

// ---------------------------------------------------------------------------------------------
// Tetractys: ten points in rows of one, two, three and four, an exact equilateral lattice.
// Each point is itself a small monad (the point within the circle).
function tetractys() {
  const cx = 160;
  const d = 60;
  const step = (d * Math.sqrt(3)) / 2;
  const top = 37;
  const at = (r, i) => [cx + (i - r / 2) * d, top + r * step];
  const out = [];
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i <= r; i++) {
      out.push(circle(...at(r, i), 13.6));
      out.push(dot(...at(r, i), 5.3));
    }
  }
  // "The fount and root of ever-flowing nature": the rows return below as water, four crests
  // under the four points, then three, two, one.
  const base = top + 3 * step;
  const amp = 4.2;
  for (let k = 0; k < 4; k++) {
    const m = 4 - k;
    const y = base + 43 + k * 17.5;
    const x0 = cx - m * (d / 2);
    const pts = [];
    const n = m * 8;
    // a crest under each point of the row it mirrors; the ends run out in a quarter wave
    for (let i = -2; i <= n + 2; i++) {
      const x = x0 + (i * d) / 8;
      pts.push([x, y + Math.cos(((x - x0) / d) * TAU) * amp]);
    }
    out.push(path(spline(pts)));
  }
  return svg(320, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// Monad: the point within the circle, and round it the well-rounded sphere, "equally balanced in
// every direction from the centre", going out from the One to the Many.
function monad() {
  const c = 160;
  const out = [];
  out.push(dot(c, c, 5.8));
  out.push(circle(c, c, 25));
  out.push(circle(c, c, 52));
  // The One and the Many: each circle further out is broken three times finer than the last,
  // until the outermost is a ring of points.
  [[79, 6, 15.5], [104, 18, 12]].forEach(([r, parts, gapLen], k) => {
    const gap = gapLen / r;
    for (let i = 0; i < parts; i++) {
      const a0 = (i / parts) * TAU - Math.PI / 2 + gap / 2 + (k ? 0 : Math.PI / parts);
      out.push(path(arc(c, c, r, a0, a0 + TAU / parts - gap)));
    }
  });
  for (let i = 0; i < 54; i++) {
    const a = (i / 54) * TAU - Math.PI / 2;
    out.push(dot(c + Math.cos(a) * 128, c + Math.sin(a) * 128, 1.7));
  }
  return svg(320, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// Bow and lyre (Heraclitus B51, the back-turning harmony). The lyre opens upward, the bow turns
// its back up beneath it, and the lyre stands on the grip where the arrow would lie: one set of
// strings upright, the other taut across the foot. The arms of the lyre and the limbs of the bow
// are the same double curve.
function bowLyre() {
  const X = 180;
  const out = [];
  const mirror = (pts) => pts.map(([x, y]) => [2 * X - x, y]);

  // Bow, strung: two swelling limbs, a set-back grip, tips turned back.
  const stringY = 293;
  const gripY = 253;
  const half = [
    [X, gripY], [X + 18, gripY - 0.6], [X + 40, gripY - 8.5], [X + 62, gripY - 21.5], [X + 84, gripY - 28],
    [X + 104, gripY - 21], [X + 119, gripY - 4], [X + 130, gripY + 17], [X + 138, gripY + 32],
    [X + 145, gripY + 40], [X + 154, gripY + 38],
  ];
  const stave = [...mirror(half).reverse().slice(0, -1), ...half];
  const bow = band(stave, (t) => 3.4 + 6.2 * Math.sin(Math.PI * t) ** 0.6, { per: 6, every: 3 });
  out.push(path(bow.d, PAPER));
  [-10.5, -3.5, 3.5, 10.5].forEach((dx) => out.push(line([X + dx, gripY - 4.3], [X + dx, gripY + 4.3])));
  out.push(line([X - 140.5, stringY], [X + 140.5, stringY]));

  // Lyre arms (horns), behind shell and crossbar.
  const cy = 197; // shell centre
  const barY = 66;
  const armR = [
    [X + 30, cy - 24], [X + 52, cy - 43], [X + 69, cy - 64], [X + 77, cy - 88], [X + 74, cy - 110],
    [X + 65, barY + 4], [X + 59, barY - 12], [X + 59, barY - 25], [X + 65, barY - 36], [X + 74, barY - 44],
  ];
  const armW = (t) => (t < 0.74 ? 10 - 2.6 * t : Math.max(0, 8.1 * (1 - (t - 0.74) / 0.26)));
  [armR, mirror(armR)].forEach((pts) => out.push(path(band(pts, armW, { per: 6, every: 3 }).d, PAPER)));

  // Shell.
  const shell = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU;
    const co = Math.cos(a);
    const si = Math.sin(a);
    const e = 2 / 2.5;
    shell.push([X + Math.sign(co) * Math.abs(co) ** e * 55, cy + Math.sign(si) * Math.abs(si) ** e * 45]);
  }
  out.push(path(spline(thin(shell, 2), { closed: true }), PAPER));
  // Scutes of the tortoise shell inside an oval.
  const oc = [X, cy + 8];
  const orx = 39;
  const ory = 27;
  out.push(ellipse(oc[0], oc[1], orx, ory));
  const inOval = ([x, y], m = 0) => ((x - oc[0]) / (orx - m)) ** 2 + ((y - oc[1]) / (ory - m)) ** 2 < 1;
  const sr = 9.2;
  for (let row = 0; row < 8; row++) {
    const y = oc[1] - ory - 2 + row * sr * 0.98;
    for (let col = -4; col <= 4; col++) {
      const x = X + col * sr * 2 + (row % 2 ? sr : 0);
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const a = Math.PI - (i / 14) * Math.PI;
        pts.push([x + Math.cos(a) * sr, y + Math.sin(a) * sr]);
      }
      visibleRuns(pts, (p) => !inOval(p, 0.4), 4).forEach((run) => out.push(path(spline(thin(run, 3)))));
    }
  }

  // Seven strings.
  const bridgeY = cy - 28;
  for (let i = -3; i <= 3; i++) out.push(line([X + i * 11.5, barY + 4], [X + i * 6.8, bridgeY - 3]));
  // Crossbar and bridge.
  const bar = (x0, x1, y, h) =>
    `<rect x="${n1(x0)}" y="${n1(y - h / 2)}" width="${n1(x1 - x0)}" height="${n1(h)}" rx="${n1(h / 2)}" fill="${PAPER}"/>`;
  out.push(bar(X - 88, X + 88, barY, 7.4));
  out.push(circle(X - 93.5, barY, 5.6, PAPER));
  out.push(circle(X + 93.5, barY, 5.6, PAPER));
  out.push(bar(X - 28, X + 28, bridgeY, 6.4));
  return svg(360, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// Plato's cave in section: the dark chamber under strata of rock with its small fire, the steep
// way up cut in steps, and the sun beyond the mouth. The sun is drawn as the point within the
// circle.
function caveSun() {
  const out = [];
  const lipU = [236, 151];
  const lipL = [257, 173];

  // Ground line: the hill over the cave, then the mouth, then the open ground under the sun.
  const hillPts = [[26, 170], [52, 147], [86, 116], [122, 98], [158, 99], [192, 112], [217, 131], lipU];
  const hill = sample(hillPts, 10);
  const groundR = sample([lipL, [280, 174], [306, 171], [330, 169]], 8);

  // The cave: the roof runs down the passage and opens into the chamber, then the back wall and
  // floor, then the stair back up to the mouth.
  const floorY = 269;
  const footX = 149;
  // Roof: scallops of rock, cusps hanging down, three over the chamber and three down the passage.
  const cusps = [lipU, [212, 169], [187, 191], [160, 211], [127, 205], [94, 207], [64, 221]];
  const bulge = [8, 9, 10, 15, 15, 13];
  const roof = [cusps[0]];
  let roofD = `M${P(...cusps[0])}`;
  for (let i = 0; i < cusps.length - 1; i++) {
    const p = cusps[i];
    const q = cusps[i + 1];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const c = [(p[0] + q[0]) / 2 - ((q[1] - p[1]) / len) * bulge[i] * 2, (p[1] + q[1]) / 2 + ((q[0] - p[0]) / len) * bulge[i] * 2];
    roofD += `Q${P(...c)} ${P(...q)}`;
    for (let j = 1; j <= 8; j++) {
      const t = j / 8;
      roof.push([
        (1 - t) ** 2 * p[0] + 2 * t * (1 - t) * c[0] + t * t * q[0],
        (1 - t) ** 2 * p[1] + 2 * t * (1 - t) * c[1] + t * t * q[1],
      ]);
    }
  }
  const last = cusps[cusps.length - 1];
  const backPts = [last, [53, 238], [51, 255], [60, 267], [81, floorY + 2.5], [113, floorY + 3], [footX, floorY]];
  const back = sample(backPts, 6);
  const stair = [[footX, floorY]];
  for (let i = 0; i < 8; i++) {
    const [x, y] = stair[stair.length - 1];
    stair.push([x, y - 12], [x + 13.5, y - 12]);
  }
  const caveD = `${roofD}${spline(backPts).replace(/^M[^C]*/, '')}${poly(stair).replace('M', 'L')}`;
  const cave = [...roof, ...back.slice(1), ...stair.slice(1)];
  const denseCave = [];
  cave.forEach((p, i) => {
    const q = cave[(i + 1) % cave.length];
    const n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 3));
    for (let j = 0; j < n; j++) denseCave.push([p[0] + ((q[0] - p[0]) * j) / n, p[1] + ((q[1] - p[1]) * j) / n]);
  });
  const nearCave = (p, m) => inside(p, denseCave) || distTo(p, denseCave, true) < m;

  // Strata: the ground line repeated downward, flattening as it goes, cut where the cave is.
  const guide = sample([...hillPts.slice(0, -1), [240, 152], [262, 168], [284, 173], [308, 171], [330, 169]], 10);
  const yOn = (lineP) => (x) => {
    for (let i = 1; i < lineP.length; i++) {
      if (x <= lineP[i][0]) {
        const a = lineP[i - 1];
        const b2 = lineP[i];
        const t = (x - a[0]) / (b2[0] - a[0] || 1);
        return a[1] + (b2[1] - a[1]) * Math.max(0, Math.min(1, t));
      }
    }
    return lineP[lineP.length - 1][1];
  };
  const guideY = yOn(guide);
  const mean = 160;
  let depth = 0;
  const K = 9;
  for (let k = 1; k <= K; k++) {
    depth += 13.7 + k * 0.3;
    const flat = Math.min(0.9, k * 0.1);
    // the block of earth rounds off toward the bottom
    const round = Math.max(0, k - 4) ** 1.9 * 3.2;
    const x0 = 27 + round + (k % 2 ? 0 : 7);
    const x1 = 329 - round - (k % 3 === 1 ? 8 : 0);
    const pts = [];
    for (let x = x0; x <= x1; x += 3) {
      const t = guideY(x);
      const wob = Math.sin(x / 36 + k * 1.7) * (0.4 + k * 0.16);
      pts.push([x, t + depth - (t - mean) * flat + wob]);
    }
    visibleRuns(pts, (p) => nearCave(p, 8), 50).forEach((run) => out.push(path(spline(thin(run, 5)))));
  }

  // The dark of the cave.
  out.push(wash(`${caveD}Q${P(lipU[0] + 4, lipL[1] - 3)} ${P(...lipU)}Z`, DEEP, true));
  out.push(path(caveD));
  out.push(path(spline(thin(hill, 5))));
  out.push(path(spline(thin(groundR, 4))));
  // The fire inside: the lesser light.
  const f = [101, floorY + 2.5];
  const fl = (pts) => pts.map(([x, y]) => P(f[0] + x, f[1] + y));
  const o = fl([[0, -1.5], [-11, -2], [-12, -14], [-5, -22], [-2, -25.5], [0, -30], [0.5, -34], [8, -27], [12.5, -17], [11, -9], [10, -4], [6, -1.5]]);
  out.push(path(`M${o[0]}C${o[1]} ${o[2]} ${o[3]}C${o[4]} ${o[5]} ${o[6]}C${o[7]} ${o[8]} ${o[9]}C${o[10]} ${o[11]} ${o[0]}Z`, PAPER));
  const q = fl([[0.5, -6], [-4.5, -7], [-4, -13], [1, -17.5], [4.5, -13], [5, -7]]);
  out.push(path(`M${q[0]}C${q[1]} ${q[2]} ${q[3]}C${q[4]} ${q[5]} ${q[0]}Z`));

  // The sun.
  const sun = [280, 82];
  out.push(dot(...sun, 4.6));
  out.push(circle(...sun, 17));
  const hillY = yOn([...hill, ...groundR]);
  const n = 16;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2;
    const r0 = 27;
    const long = i % 2 === 0;
    const r1 = long ? 57 : 47;
    const p0 = [sun[0] + Math.cos(a) * r0, sun[1] + Math.sin(a) * r0];
    const p1 = [sun[0] + Math.cos(a) * r1, sun[1] + Math.sin(a) * r1];
    if (p1[1] > hillY(p1[0]) - 9) continue;
    out.push(ray(p0, p1, long ? 1.5 : 1, 2.2));
  }
  return svg(360, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// The ascent of the Symposium: six rungs (one body, all bodies, souls, practices, learnings, the
// one learning of Beauty) and, beyond the last, the star.
function ladder() {
  const X = 130;
  const out = [];
  const yTop = 114;
  const yBot = 320;
  const halfAt = (y) => 22.5 + ((y - yTop) / (yBot - yTop)) * 21.5;

  // Bands of cloud behind the ladder: two rows of scales (the scales of the aegis and of the
  // lyre's shell) over one flowing line.
  const scale = (x, y, r) => `M${P(x - r, y)}C${P(x - r, y - r * 1.34)} ${P(x + r, y - r * 1.34)} ${P(x + r, y)}`;
  const cloudBand = (y, r, count) => {
    const cx = X;
    let d = '';
    for (let i = 0; i < count - 1; i++) d += scale(cx + (i - (count - 2) / 2) * r * 2, y - r * 0.98, r);
    for (let i = 0; i < count; i++) d += scale(cx + (i - (count - 1) / 2) * r * 2, y, r);
    out.push(path(d));
    const half = count * r + 12;
    const pts = [];
    const n = Math.round((half * 2) / 5);
    for (let j = 0; j <= n; j++) {
      const x = cx - half + (half * 2 * j) / n;
      pts.push([x, y + 8.5 + Math.sin((x - cx) / (r * 0.64)) * 2.4]);
    }
    out.push(path(spline(pts)));
  };
  cloudBand(264, 10.5, 9);
  cloudBand(188, 9.5, 7);

  // Ground.
  out.push(path(spline(wavy([40, yBot + 4], [220, yBot + 4], { waves: 3, amp: 2.4, phase: 1, per: 8 }))));
  out.push(path(spline(wavy([70, yBot + 15], [190, yBot + 15], { waves: 2, amp: 2, phase: 3, per: 8 }))));

  // The ladder hides what is behind it.
  const quad = [[X - halfAt(yTop) - 4, yTop - 2], [X + halfAt(yTop) + 4, yTop - 2], [X + halfAt(yBot) + 4.5, yBot + 2], [X - halfAt(yBot) - 4.5, yBot + 2]];
  out.push(wash(`${poly(quad)}Z`, PAPER));
  const rungs = [293.5, 257.5, 225, 196, 170, 147.5];
  rungs.forEach((y, i) => {
    const h = halfAt(y);
    const t = 5.6 - i * 0.28;
    out.push(`<rect x="${n1(X - h)}" y="${n1(y - t / 2)}" width="${n1(h * 2)}" height="${n1(t)}" fill="${PAPER}"/>`);
  });
  [-1, 1].forEach((sd) => {
    const w0 = 3.1;
    const w1 = 4;
    const top = X + sd * halfAt(yTop);
    const bot = X + sd * halfAt(yBot);
    out.push(
      path(
        `M${P(top - w0, yTop + 2)}Q${P(top - w0, yTop - w0)} ${P(top, yTop - w0)}Q${P(top + w0, yTop - w0)} ${P(top + w0, yTop + 2)}L${P(bot + w1, yBot)}L${P(bot - w1, yBot)}Z`,
        PAPER,
      ),
    );
  });

  // The star.
  const sc = [X, 59];
  const star = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU - Math.PI / 2;
    const r = i % 2 ? 7.6 : i % 4 === 0 ? 37 : 19;
    star.push([sc[0] + Math.cos(a) * r, sc[1] + Math.sin(a) * r]);
  }
  out.push(path(`${poly(star)}Z`));
  [[-58, -22], [52, -30], [70, 14], [-44, 30]].forEach(([dx, dy]) => out.push(dot(sc[0] + dx, sc[1] + dy, 1.5)));
  return svg(260, 360, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// A torch of the mysteries: the long bound bundle of Eleusis, held upright, the flame in flowing
// lines that leave one source and close on one point.
function torch() {
  const X = 110;
  const out = [];
  const yTop = 166;
  const yBot = 340;
  const halfAt = (y) => 18.5 - ((y - yTop) / (yBot - yTop)) * 8;

  // Flame: one tongue drawn by hand, and two more inside it, each smaller and leaning its own way.
  const H = 148;
  const left = [[-16, 0], [-30, -12], [-44, -31], [-51.5, -53], [-51, -74], [-43, -94], [-30, -111], [-16, -126], [-5, -138], [0, -H]];
  const right = [[0, -H], [11, -135], [23, -118], [31, -99], [35.5, -79], [38.5, -60], [42.5, -44], [43, -29], [35, -13], [16, 0]];
  const base = [X, yTop + 2];
  [[1, 1, 0], [0.63, 0.77, -5], [0.3, 0.5, 4.5]].forEach(([sx, sy, lean]) => {
    const place = ([dx, dy]) => [base[0] + dx * sx + lean * (dy / H) ** 2, base[1] + dy * sy];
    out.push(path(`${spline(left.map(place))}${spline(right.map(place), { cont: true })}`));
  });

  // Shaft: a bundle of rods narrowing to the foot.
  out.push(
    path(
      `M${P(X - halfAt(yTop), yTop)}L${P(X - halfAt(yBot), yBot - 4)}Q${P(X, yBot + 7)} ${P(X + halfAt(yBot), yBot - 4)}L${P(X + halfAt(yTop), yTop)}Z`,
      PAPER,
    ),
  );
  const ties = [yTop + 3, 206, 244, 281, 316];
  [-0.34, 0.34].forEach((k) => out.push(line([X + k * halfAt(yTop), yTop], [X + k * halfAt(316), 316])));
  // Bindings.
  ties.forEach((y, i) => {
    const h = halfAt(y) + 3.6;
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
