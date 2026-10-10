// Generates the symbols-a set: tetractys, monad, bow-lyre, cave-sun, ladder, torch.
//   node scripts/illustrations/symbols-a-gen.mjs [--dir outDir] [--only a,b]
// One stroke weight (SW) for the whole family; every drawing is checked by eye afterwards with
//   node scripts/illustrations/symbols-a-sheet.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEEP, INK, PAPER, TAU, P, along, arc, circle, distTo, dot, ellipse, inside, line, n1, path, poly,
  band, ribbon, rng, sample, spline, svg, thin, visibleRuns, wash, wavy,
} from './symbols-a-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const outDir = resolve(opt('dir', resolve(here, '../../src/assets/illustrations')));
const only = opt('only');
const V = opt('v', '');

const SW = 2.5;

// ---------------------------------------------------------------------------------------------
// Tetractys: ten points in rows of one, two, three and four, an exact equilateral lattice.
// Each point is itself a small monad (the point within the circle).
function tetractys() {
  const cx = 160;
  const d = 64;
  const step = (d * Math.sqrt(3)) / 2;
  const top = V === 'b' || V === 'c' ? 62 : 38;
  const at = (r, i) => [cx + (i - r / 2) * d, top + r * step];
  const out = [];
  const R = 14.5;
  if (V === 'b' || V === 'c') {
    // fine lines joining neighbours, stopping short of each point
    const link = (p, q) => {
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const u = [(q[0] - p[0]) / len, (q[1] - p[1]) / len];
      const g = R + 5.5;
      out.push(line([p[0] + u[0] * g, p[1] + u[1] * g], [q[0] - u[0] * g, q[1] - u[1] * g]));
    };
    for (let r = 0; r < 4; r++) {
      for (let i = 0; i <= r; i++) {
        if (i < r) link(at(r, i), at(r, i + 1));
        if (r < 3 && (V === 'b' || i === 0 || i === r || true)) {
          if (V === 'b' || i === 0) link(at(r, i), at(r + 1, i));
          if (V === 'b' || i === r) link(at(r, i), at(r + 1, i + 1));
        }
      }
    }
  }
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i <= r; i++) {
      out.push(circle(...at(r, i), R));
      out.push(dot(...at(r, i), 5.6));
    }
  }
  if (V === 'b' || V === 'c') return svg(320, 320, SW, out.join(''));
  // "The fount and root of ever-flowing nature": the four rows return below as four waves.
  const base = top + 3 * step;
  const rand = rng(7);
  const halves = [128, 101, 73, 44];
  halves.forEach((half, k) => {
    const y = base + 44 + k * 19.5;
    const lean = (rand() - 0.5) * 8;
    const pts = wavy([cx - half + lean, y], [cx + half + lean, y + (rand() - 0.5) * 2], {
      waves: (2 * half) / 62,
      amp: 4.8 - k * 0.25,
      phase: Math.PI + k * 1.3 + rand() * 0.5,
      per: 6,
    });
    out.push(path(spline(pts)));
  });
  return svg(320, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// Monad: the point within the circle, and the Many held inside the one well-rounded sphere,
// "equally balanced in every direction from the centre".
function monad() {
  const c = 160;
  const out = [];
  out.push(dot(c, c, 5.5));
  out.push(circle(c, c, 25));
  const n = V === 'b' ? 24 : 28;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2;
    const r0 = V === 'b' ? 44 : 41;
    const r1 = i % 2 ? 90 : 108;
    const p0 = [c + Math.cos(a) * r0, c + Math.sin(a) * r0];
    const p1 = [c + Math.cos(a) * r1, c + Math.sin(a) * r1];
    out.push(path(spline(wavy(p0, p1, { waves: i % 2 ? 1.5 : 2, amp: V === 'b' ? 3.4 : 3, phase: 0, per: 8 }))));
  }
  out.push(circle(c, c, 126));
  return svg(320, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// Bow and lyre (Heraclitus B51, the back-turning harmony). The lyre opens upward, the bow turns
// its back up beneath it, and the lyre stands on the grip where the arrow would lie: one set of
// strings upright, the other taut across the foot.
function bowLyre() {
  const X = 180;
  const out = [];
  const mirror = (pts) => pts.map(([x, y]) => [2 * X - x, y]);

  // Bow, strung: two swelling limbs, a set-back grip, tips turned back.
  const stringY = 290;
  const gripY = 247;
  const half = [
    [X, gripY], [X + 16, gripY - 1.5], [X + 36, gripY - 11], [X + 58, gripY - 23], [X + 82, gripY - 27],
    [X + 104, gripY - 19], [X + 121, gripY - 1], [X + 133, gripY + 21], [X + 141, gripY + 36],
    [X + 148, gripY + 43], [X + 157, gripY + 41],
  ];
  const stave = [...mirror(half).reverse().slice(0, -1), ...half];
  const bow = band(stave, (t) => 3.4 + 6 * Math.sin(Math.PI * t) ** 0.6, { per: 6, every: 3 });
  out.push(path(bow.d, PAPER));
  [-10.5, -3.5, 3.5, 10.5].forEach((dx) => out.push(line([X + dx, gripY - 4.2], [X + dx, gripY + 4.2])));
  out.push(line([X - 143.5, stringY], [X + 143.5, stringY]));

  // Lyre arms (horns), behind shell and crossbar.
  const cy = 187; // shell centre
  const barY = 70;
  const armR = [
    [X + 28, cy - 30], [X + 45, cy - 45], [X + 56, cy - 63], [X + 59, cy - 82], [X + 54, barY + 16],
    [X + 49, barY], [X + 46, barY - 15], [X + 49, barY - 28], [X + 56, barY - 39], [X + 63, barY - 46],
  ];
  const armW = (t) => (t < 0.72 ? 9.2 - 2.4 * t : Math.max(0, 7.5 * (1 - (t - 0.72) / 0.28)));
  [armR, mirror(armR)].forEach((pts) => out.push(path(band(pts, armW, { per: 6, every: 3 }).d, PAPER)));

  // Shell.
  const shell = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * TAU;
    const co = Math.cos(a);
    const si = Math.sin(a);
    const e = 2 / 2.5;
    shell.push([X + Math.sign(co) * Math.abs(co) ** e * 52, cy + Math.sign(si) * Math.abs(si) ** e * 45]);
  }
  out.push(path(spline(thin(shell, 2), { closed: true }), PAPER));
  // Scutes of the tortoise shell inside an oval.
  const oc = [X, cy + 8];
  const orx = 37;
  const ory = 26.5;
  out.push(ellipse(oc[0], oc[1], orx, ory));
  const inOval = ([x, y], m = 0) => ((x - oc[0]) / (orx - m)) ** 2 + ((y - oc[1]) / (ory - m)) ** 2 < 1;
  const sr = 8.4;
  for (let row = 0; row < 8; row++) {
    const y = oc[1] - ory - 2 + row * sr * 0.98;
    for (let col = -4; col <= 4; col++) {
      const x = X + col * sr * 2 + (row % 2 ? sr : 0);
      const pts = [];
      for (let i = 0; i <= 14; i++) {
        const a = Math.PI - (i / 14) * Math.PI;
        pts.push([x + Math.cos(a) * sr, y + Math.sin(a) * sr]);
      }
      visibleRuns(pts, (p) => !inOval(p, 0.4), 3.5).forEach((run) => out.push(path(spline(thin(run, 3)))));
    }
  }

  // Seven strings.
  const bridgeY = cy - 28;
  for (let i = -3; i <= 3; i++) out.push(line([X + i * 10, barY + 4], [X + i * 6.2, bridgeY - 3]));
  // Crossbar and bridge.
  const bar = (x0, x1, y, h) =>
    `<rect x="${n1(x0)}" y="${n1(y - h / 2)}" width="${n1(x1 - x0)}" height="${n1(h)}" rx="${n1(h / 2)}" fill="${PAPER}"/>`;
  out.push(bar(X - 72, X + 72, barY, 7.2));
  out.push(circle(X - 77, barY, 5.5, PAPER));
  out.push(circle(X + 77, barY, 5.5, PAPER));
  out.push(bar(X - 25, X + 25, bridgeY, 6.2));
  return svg(360, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// Plato's cave in section: the dark chamber under strata of rock with its small fire, the steep
// way up cut in steps, and the sun beyond the mouth. The sun is drawn as the point within the
// circle.
function caveSun() {
  const out = [];
  const lipU = [239, 150];
  const lipL = [258, 172];

  // Ground line: the hill over the cave, then the mouth, then the open ground under the sun.
  const hill = sample([[14, 152], [40, 130], [74, 100], [112, 84], [150, 87], [188, 101], [214, 121], [230, 138], lipU], 10);
  const groundR = sample([lipL, [280, 172], [306, 168], [330, 165], [348, 166]], 8);

  // The cave: a roof of hanging scallops down the passage and over the chamber, the back wall
  // and floor, then the stair back up to the mouth.
  const cusps = [lipU, [214, 168], [188, 190], [161, 211], [127, 205], [93, 207], [63, 221]];
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
  const back = sample([cusps[cusps.length - 1], [52, 238], [50, 255], [59, 267], [80, 272], [112, 272.5], [150, 268]], 6);
  const stair = [[150, 268]];
  for (let i = 0; i < 8; i++) {
    const [x, y] = stair[stair.length - 1];
    stair.push([x, y - 12], [x + 13.5, y - 12]);
  }
  const caveD = `${roofD}${spline(thin(back, 3)).replace(/^M[^C]*/, '')}${poly(stair).replace('M', 'L')}`;
  const cave = [...roof, ...back.slice(1), ...stair.slice(1)];
  const denseCave = [];
  cave.forEach((p, i) => {
    const q = cave[(i + 1) % cave.length];
    const n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 3));
    for (let j = 0; j < n; j++) denseCave.push([p[0] + ((q[0] - p[0]) * j) / n, p[1] + ((q[1] - p[1]) * j) / n]);
  });
  const nearCave = (p, m) => inside(p, denseCave) || distTo(p, denseCave, true) < m;

  // Strata: the ground line repeated downward, flattening as it goes, cut where the cave is.
  const guide = sample(
    [[14, 152], [40, 130], [74, 100], [112, 84], [150, 87], [188, 101], [220, 123], [246, 148], [268, 164],
      [290, 169], [318, 167], [348, 166]],
    10,
  );
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
  const rand = rng(23);
  const mean = 152;
  let depth = 0;
  for (let k = 1; k <= 10; k++) {
    depth += 14.6 + k * 0.5;
    const flat = Math.min(0.88, k * 0.09);
    // the block of earth rounds off toward the bottom
    const round = Math.max(0, k - 5) ** 1.8 * 4;
    const x0 = 16 + round + rand() * 12;
    const x1 = 346 - round - rand() * 12;
    const pts = [];
    for (let x = x0; x <= x1; x += 3) {
      const t = guideY(x);
      const wob = Math.sin(x / 33 + k * 1.7) * (0.5 + k * 0.2);
      pts.push([x, t + depth - (t - mean) * flat + wob]);
    }
    visibleRuns(pts, (p) => nearCave(p, 5.5), 26).forEach((run) => out.push(path(spline(thin(run, 5)))));
  }

  // The dark of the cave.
  out.push(wash(`${caveD}Z`, DEEP));
  out.push(path(caveD));
  out.push(path(spline(thin(hill, 5))));
  out.push(path(spline(thin(groundR, 4))));
  // The fire inside: the lesser light.
  const f = [100, 272];
  const fl = (pts) => pts.map(([x, y]) => P(f[0] + x, f[1] + y));
  const o = fl([[0, -1.5], [-11, -2], [-12, -14], [-5, -22], [-2, -25.5], [0, -30], [0.5, -34], [8, -27], [12.5, -17], [11, -9], [10, -4], [6, -1.5]]);
  out.push(path(`M${o[0]}C${o[1]} ${o[2]} ${o[3]}C${o[4]} ${o[5]} ${o[6]}C${o[7]} ${o[8]} ${o[9]}C${o[10]} ${o[11]} ${o[0]}Z`, PAPER));
  const q = fl([[0.5, -6], [-4.5, -7], [-4, -13], [1, -17.5], [4.5, -13], [5, -7]]);
  out.push(path(`M${q[0]}C${q[1]} ${q[2]} ${q[3]}C${q[4]} ${q[5]} ${q[0]}Z`));

  // The sun.
  const sun = [296, 74];
  out.push(dot(...sun, 4.2));
  out.push(circle(...sun, 17));
  const hillY = yOn([...hill, ...groundR]);
  const n = 20;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU - Math.PI / 2;
    const r0 = 27;
    const r1 = i % 2 ? 42 : 55;
    const p0 = [sun[0] + Math.cos(a) * r0, sun[1] + Math.sin(a) * r0];
    const p1 = [sun[0] + Math.cos(a) * r1, sun[1] + Math.sin(a) * r1];
    const ray = wavy(p0, p1, { waves: 1, amp: i % 2 ? 1.6 : 2.4, phase: i % 2 ? 0 : Math.PI, per: 12 });
    visibleRuns(ray, (p) => p[1] > hillY(p[0]) - 8, 5).forEach((run) => out.push(path(spline(thin(run, 2)))));
  }
  return svg(360, 320, SW, out.join(''));
}

// ---------------------------------------------------------------------------------------------
// The ascent of the Symposium: six rungs (one body, all bodies, souls, practices, learnings, the
// one learning of Beauty) and, beyond the last, the star.
function ladder() {
  const X = 130;
  const out = [];
  const yTop = 116;
  const yBot = 334;
  const halfAt = (y) => 22.5 + ((y - yTop) / (yBot - yTop)) * 21.5;

  // Bands of cloud behind the ladder: a scalloped crest over flowing lines.
  const cloud = (x0, x1, y, radii, tails) => {
    const total = radii.reduce((a, r) => a + r * 2, 0);
    const k = (x1 - x0) / total;
    let x = x0;
    let d = `M${P(x0, y)}`;
    radii.forEach((r, i) => {
      const w = r * 2 * k;
      const h = r * k * (1.05 + (i % 2) * 0.12);
      d += `C${P(x + w * 0.02, y - h * 1.3)} ${P(x + w * 0.98, y - h * 1.3)} ${P(x + w, y)}`;
      x += w;
    });
    out.push(path(d));
    tails.forEach(([a, b2, dy, ph]) => {
      out.push(path(spline(wavy([a, y + dy], [b2, y + dy], { waves: (b2 - a) / 46, amp: 2.6, phase: ph, per: 8 }))));
    });
  };
  cloud(22, 122, 268, [13, 17, 12, 9], [[14, 130, 9, 0], [34, 120, 19, 2]]);
  cloud(140, 236, 262, [10, 14, 16, 11], [[130, 244, 9, 1], [146, 222, 19, 3]]);
  cloud(52, 122, 186, [9, 12, 8], [[44, 128, 8, 2], [62, 118, 17, 0]]);
  cloud(140, 214, 180, [8, 12, 10], [[134, 222, 8, 3], [148, 206, 17, 1]]);

  // Ground.
  out.push(path(spline(wavy([40, 338], [220, 338], { waves: 3, amp: 2.4, phase: 1, per: 8 }))));
  out.push(path(spline(wavy([70, 349], [190, 349], { waves: 2, amp: 2, phase: 3, per: 8 }))));

  // The ladder hides what is behind it.
  const quad = [[X - halfAt(yTop) - 4, yTop - 2], [X + halfAt(yTop) + 4, yTop - 2], [X + halfAt(yBot) + 4.5, yBot + 2], [X - halfAt(yBot) - 4.5, yBot + 2]];
  out.push(wash(`${poly(quad)}Z`, PAPER));
  const rungs = [306, 268, 233.5, 202.5, 175, 151];
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
  const sc = [X, 56];
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
// A torch of the mysteries: the long bound bundle of Eleusis, the flame in flowing lines.
function torch() {
  const X = 110;
  const out = [];
  const yTop = 158;
  const yBot = 342;
  const halfAt = (y) => 14.5 - ((y - yTop) / (yBot - yTop)) * 7.5;

  // Flame: tongues one inside the other, swaying on one spine.
  const spine = sample([[X, yTop - 2], [X - 3, 138], [X - 5, 116], [X - 2, 94], [X + 5, 74], [X + 8, 56], [X + 4, 40], [X - 3, 28]], 12);
  const prof = sample([[0, 0.4], [0.14, 0.8], [0.32, 1], [0.5, 0.86], [0.68, 0.56], [0.84, 0.27], [1, 0]], 12);
  const f = (t) => {
    for (let i = 1; i < prof.length; i++) {
      if (t <= prof[i][0]) {
        const a = prof[i - 1];
        const b2 = prof[i];
        return a[1] + ((b2[1] - a[1]) * (t - a[0])) / (b2[0] - a[0] || 1);
      }
    }
    return 0;
  };
  const W = 34;
  [[1, 1, 0], [0.74, 0.83, -3], [0.48, 0.64, 3], [0.22, 0.43, -2]].forEach(([sc, T, lean]) => {
    const L = [];
    const R = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const q = along(spine, u * T);
      const w = W * sc * f(u);
      const sway = lean * u * u;
      L.push([q.x + Math.sin(q.ang) * w + sway, q.y - Math.cos(q.ang) * w]);
      R.push([q.x - Math.sin(q.ang) * w + sway, q.y + Math.cos(q.ang) * w]);
    }
    out.push(path(`${spline(thin(L, 4))}${spline(thin(R.reverse(), 4), { cont: true })}`));
  });
  if (V === 'r') {
    const c = [X, 100];
    for (let i = 0; i < 9; i++) {
      const a = (-168 + i * 19.5) * (Math.PI / 180);
      const r0 = 50 + Math.abs(Math.sin(a)) * 28;
      const r1 = r0 + (i % 2 ? 12 : 22);
      out.push(path(spline(wavy([c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0], [c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1], { waves: 1, amp: 2, phase: i % 2 ? 0 : Math.PI, per: 10 }))));
    }
  }

  // Shaft: a bundle of rods narrowing to the foot.
  out.push(
    path(
      `M${P(X - halfAt(yTop), yTop)}L${P(X - halfAt(yBot), yBot - 4)}Q${P(X, yBot + 6)} ${P(X + halfAt(yBot), yBot - 4)}L${P(X + halfAt(yTop), yTop)}Z`,
      PAPER,
    ),
  );
  const ties = [yTop + 3, 198, 238, 277, 314];
  [-0.34, 0.34].forEach((k) => out.push(line([X + k * halfAt(yTop), yTop], [X + k * halfAt(314), 314])));
  // Bindings.
  ties.forEach((y, i) => {
    const h = halfAt(y) + 3.2;
    const t = i === 0 ? 7.6 : 6.4;
    out.push(`<rect x="${n1(X - h)}" y="${n1(y - t / 2)}" width="${n1(h * 2)}" height="${n1(t)}" rx="${n1(t / 2)}" fill="${PAPER}"/>`);
  });
  return svg(220, 360, SW, out.join(''));
}

const all = { tetractys, monad, 'bow-lyre': bowLyre, 'cave-sun': caveSun, ladder, torch };
mkdirSync(outDir, { recursive: true });
for (const [name, draw] of Object.entries(all)) {
  if (only && !only.split(',').includes(name)) continue;
  const file = resolve(outDir, `${name}${V ? `-${V}` : ''}.svg`);
  writeFileSync(file, draw());
  console.log(file);
}
