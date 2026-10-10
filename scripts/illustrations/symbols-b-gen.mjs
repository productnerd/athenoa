// Generates the six symbols of the symbols-b set: spring-cypress, tripod, butterfly, orphic-egg,
// cicada and wheat. One stroke weight (2.5) for the whole family.
//   node scripts/illustrations/symbols-b-gen.mjs                 writes into src/assets/illustrations
//   node scripts/illustrations/symbols-b-gen.mjs --dir <dir>     writes somewhere else (for trying things out)
//   node scripts/illustrations/symbols-b-gen.mjs --only wheat,tripod
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LIGHT,
  P,
  SLIM,
  along,
  circle,
  deg,
  ellipse,
  group,
  inside,
  leaf,
  lengths,
  mirror,
  n1,
  offset,
  path,
  poly,
  resample,
  ribbon,
  rng,
  sample,
  spline,
  svg,
  visibleRuns,
  wavy,
} from './symbols-b-lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const outDir = resolve(opt('dir', resolve(here, '../../src/assets/illustrations')));
const only = opt('only');
const SW = 2.5;

/* ----------------------------------------------------------------- wheat */
// One bearded ear, the thing shown in silence at Eleusis. The grains overlap upward like scales,
// each with its awn; the awns fan out as long near-parallel lines.
function wheat() {
  const rand = rng(4);
  const axis = [
    [89, 354],
    [92, 326],
    [96, 296],
    [100, 262],
    [100, 184],
    [100, 106],
  ];
  const per = 16;
  const dense = sample(axis, per);
  const lens = lengths(dense);
  const earFrom = lens[3 * per] / lens[lens.length - 1];
  const GRAIN = [0.3, 1.04, 0.76, 0.9];

  const N = 14;
  let awns = '';
  const grains = [];
  for (let i = 0; i < N; i++) {
    const side = i % 2 ? 1 : -1;
    const u = i / (N - 1);
    const b = along(dense, earFrom + (1 - earFrom) * ((i + 0.1) / (N + 0.75)), lens);
    const dir = b.ang + side * (27 - 5 * u) * deg;
    const len = 35 - 8 * u;
    const g = leaf(b.x, b.y, dir, len, 11.4 - 3 * u, side * 0.06, 0.6, GRAIN);
    grains.push(path(g.outline, true));
    // awn: leaves the tip in the direction of the grain, then straightens a little
    const L = 118 - 42 * u + (rand() - 0.5) * 9;
    const endDir = b.ang + side * (22 - 11 * u + (rand() - 0.5) * 1.6) * deg;
    const c = [g.tip[0] + Math.cos(dir) * L * 0.4, g.tip[1] + Math.sin(dir) * L * 0.4];
    const e = [g.tip[0] + Math.cos(endDir) * L, g.tip[1] + Math.sin(endDir) * L];
    awns += `M${P(...g.tip)}Q${P(...c)} ${P(...e)}`;
  }
  // the grain that closes the ear, and its awn straight on
  const top = along(dense, 1, lens);
  const tg = leaf(top.x, top.y + 5, top.ang, 27, 7.6, 0, 0.6, GRAIN);
  awns += `M${P(...tg.tip)}Q${P(tg.tip[0] + 1.6, tg.tip[1] - 34)} ${P(tg.tip[0] - 1, tg.tip[1] - 66)}`;
  const ear = path(tg.outline, true) + grains.reverse().join('');

  // two blades on the straw
  const blade = (pts, width, ribTo = 0.62) => {
    const { L, R, dense: mid } = ribbon(pts, (t) => width * Math.sin(Math.PI * t ** 0.5) ** 1.15, 6);
    const rib = mid.slice(Math.round(mid.length * 0.12), Math.round(mid.length * ribTo));
    return (
      path(spline([...L, ...R.reverse().slice(1)], { closed: true }), true) +
      path(spline(rib.filter((_, i) => i % 4 === 0 || i === rib.length - 1)))
    );
  };
  const right = blade(
    [
      [94.4, 310],
      [105, 286],
      [124, 268],
      [146, 262],
      [164, 272],
      [174, 291],
    ],
    10,
  );
  const left = blade(
    [
      [91.4, 334],
      [82, 312],
      [66, 297],
      [47, 291],
      [30, 296],
    ],
    9,
    0.6,
  );

  const straw = path(spline(axis.slice(0, 4)));
  return svg(200, 360, SW, path(awns) + straw + left + right + ear);
}

/* ---------------------------------------------------------------- tripod */
// The tripod of Apollo at Delphi, flat and frontal as on the coins of Kroton: three stout legs on
// lion paws, all seen full height with the deep lebes hung behind them, three ring handles
// standing on the rim, arched stays between the legs. Laurel either side, the breath of the
// oracle rising.
function tripod() {
  const cx = 150;
  const rimTop = 147;
  const rimBottom = 155;
  const pawY = 315;

  // vapour: three threads rising out of the bowl between the handles
  const vapour =
    path(spline(wavy([150, 103], [150, 14], 2.6, 5.8, 0, 12))) +
    path(spline(wavy([124, 141], [120, 46], 2.7, 5.4, Math.PI, 12))) +
    path(spline(wavy([176, 141], [180, 46], 2.7, 5.4, 0, 12)));

  // ring handles standing on the rim
  const ringY = rimTop - 17.4;
  const rings = [97, cx, 203].map((x) => circle(x, ringY, 17, true) + circle(x, ringY, 10)).join('');

  // lebes: a deep round bowl, a band under the rim with a row of tongues hanging from it
  const bandY = 167;
  const tongues = (x0, n) => `M${P(x0, bandY)}` + 'a5.2 6.6 0 0 0 10.4 0'.repeat(n);
  const bowl =
    path(`M94 ${rimBottom}C94 203 118 234 ${cx} 234C182 234 206 203 206 ${rimBottom}Z`, true) +
    path(`M95 ${bandY}H205`) +
    path(tongues(100.6, 4) + tongues(157.8, 4));
  const rim = `<rect x="78" y="${rimTop}" width="144" height="${n1(rimBottom - rimTop)}" rx="2.6" fill="var(--paper, #f2e9d3)"/>`;

  // stays: an arched band between each pair of legs, running into them
  const arch = (x0, x1, y, rise) => {
    const m = (x0 + x1) / 2;
    return `M${P(x0, y)}C${P(x0, y - rise * 0.72)} ${P(m - (x1 - x0) * 0.27, y - rise)} ${P(m, y - rise)}S${P(x1, y - rise * 0.72)} ${P(x1, y)}`;
  };
  const stays = path(arch(86, 148, 300, 46));

  // a leg narrows a little towards the ankle and runs straight into a lion paw seen from the
  // front; `lean` pushes the paw a little to one side
  const leg = (xt, xb, lean) => {
    const y = pawY;
    const c = xb + lean * 3;
    const l = c - 14.4;
    const r = c + 14.4;
    const tw = (r - l) / 3;
    const yt = y + 19;
    let d = `M${P(xt - 7.6, rimBottom)}L${P(xb - 6, y)}C${P(xb - 6, y + 6)} ${P(l, y + 4)} ${P(l, y + 12.6)}L${P(l, yt)}`;
    for (let i = 0; i < 3; i++) d += `a${n1(tw / 2)} 3.8 0 0 0 ${n1(tw)} 0`;
    d += `L${P(r, y + 12.6)}C${P(r, y + 4)} ${P(xb + 6, y + 6)} ${P(xb + 6, y)}L${P(xt + 7.6, rimBottom)}`;
    const toes = `M${P(l + tw, yt)}q0.7 -4 -0.5 -7.4M${P(l + 2 * tw, yt)}q-0.7 -4 0.5 -7.4`;
    return path(d, true) + path(toes);
  };
  const sideLeg = leg(94, 82, -1);
  const midLeg = leg(cx, cx, 0);

  // laurel either side, leaning in towards the handles
  const sprig = () => {
    const rand = rng(5);
    const stemPts = [
      [43, 350],
      [29, 310],
      [21, 264],
      [22, 216],
      [31, 174],
      [44, 142],
    ];
    const dense = sample(stemPts, 14);
    const lens = lengths(dense);
    let out = path(spline(stemPts));
    const nodes = [0.13, 0.27, 0.41, 0.55, 0.68, 0.8, 0.91];
    nodes.forEach((f, i) => {
      const size = 1 - 0.32 * (i / (nodes.length - 1)) ** 1.4;
      for (const side of [-1, 1]) {
        const b = along(dense, f + side * 0.012, lens);
        const spread = (38 + rand() * 9) * deg;
        const lf = leaf(b.x, b.y, b.ang + side * spread, (25 + rand() * 4) * size, 5.8 * (0.75 + 0.25 * size), -side * 0.07, 0.72, SLIM);
        out += path(lf.outline + lf.rib);
      }
    });
    const end = along(dense, 1, lens);
    const last = leaf(end.x, end.y, end.ang + 3 * deg, 20, 4.4, 0.04, 0.72, SLIM);
    return out + path(last.outline + last.rib);
  };
  const laurel = sprig();

  return svg(
    300,
    360,
    SW,
    vapour + laurel + mirror(laurel, cx) + stays + mirror(stays, cx) + bowl + rings + rim + sideLeg + mirror(sideLeg, cx) + midLeg,
  );
}

/* -------------------------------------------------------------- butterfly */
// Psyche: soul and butterfly are one word. Seen from above, wings open, the two sides the same.
// Scales along the margins, an eye on each wing, veins running from the root to the scales.
function butterfly() {
  const cx = 160;
  // a round arch from a to b, standing `h` high on the side given by the sign of h
  const scallop = (a, b, h) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    const k = (h * 4) / 3;
    const nx = (dy / len) * k;
    const ny = (-dx / len) * k;
    const e = 0.08;
    return `C${P(a[0] + dx * e + nx, a[1] + dy * e + ny)} ${P(b[0] - dx * e + nx, b[1] - dy * e + ny)} ${P(...b)}`;
  };
  const row = (pts, h) => `M${P(...pts[0])}` + pts.slice(1).map((p, i) => scallop(pts[i], p, h)).join('');
  const eye = (x, y, r) => circle(x, y, r, true) + circle(x, y, r * 0.55) + circle(x, y, 1.1);
  // a vein from a to b, bowed sideways by `bend`, broken where it would run under the eye
  const vein = (a, b, bend, halo) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const m = [(a[0] + b[0]) / 2 - ((b[1] - a[1]) / d) * bend, (a[1] + b[1]) / 2 + ((b[0] - a[0]) / d) * bend];
    const fine = sample([a, m, b], 24);
    return visibleRuns(fine, (q) => Math.hypot(q[0] - halo[0], q[1] - halo[1]) < halo[2], 4)
      .filter((run) => lengths(run).at(-1) > 9)
      .map((run) => spline(run))
      .join('');
  };
  const between = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  // the inner row of scales: n arches on a line `inset` inside the edge, half a step out of line
  // with the row on the edge, running out past both ends so the wing's outline cuts them off.
  // `crests` are the tops of the arches, where the veins end.
  const innerRow = (edge, n, inset, h) => {
    const q = resample(offset(edge, -inset), 2 * n + 1);
    const before = [2 * q[0][0] - q[1][0], 2 * q[0][1] - q[1][1]];
    const after = [2 * q[2 * n][0] - q[2 * n - 1][0], 2 * q[2 * n][1] - q[2 * n - 1][1]];
    const cusps = q.filter((_, i) => i % 2 === 1);
    const crests = q.filter((_, i) => i % 2 === 0).map(([x, y, ang]) => [x - Math.sin(ang) * h, y + Math.cos(ang) * h]);
    return { crests, d: row([before, ...cusps, after], -h) };
  };

  /* forewing: a smooth edge with two rows of scales standing on it */
  const forePts = [
    [166, 97],
    [193, 65],
    [238, 40],
    [281, 28],
    [301, 34],
    [305, 63],
    [297, 100],
    [279, 133],
    [247, 138],
    [206, 127],
    [166, 114],
  ];
  const foreD = spline(forePts, { closed: true });
  const foreEdge = sample(forePts, 12, true).slice(4 * 12 - 2, 7 * 12 + 3);
  const nF = 6;
  const f1 = resample(foreEdge, nF + 1);
  const f2 = innerRow(foreEdge, nF, 9.4, 8.6);
  const fEye = [260, 80, 13.6];
  const fHalo = [fEye[0], fEye[1], fEye[2] + 4.6];
  const fRoot = [170, 106];
  const fA = [213, 79];
  const fB = [209, 107];
  const fCell = `M${P(...fRoot)}Q${P(190, 85)} ${P(...fA)}Q${P(215, 93)} ${P(...fB)}Q${P(190, 109)} ${P(...fRoot)}`;
  const fVeins =
    vein(fA, f2.crests[1], -5, fHalo) +
    vein(between(fA, fB, 0.25), f2.crests[2], -2, fHalo) +
    vein(between(fA, fB, 0.5), f2.crests[3], 0, fHalo) +
    vein(between(fA, fB, 0.75), f2.crests[4], 2, fHalo) +
    vein(fB, f2.crests[5], 3, fHalo) +
    vein([196, 115], f2.crests[6], 3, fHalo);
  const fore =
    path(foreD, true) +
    group(path(row(f1, -8.6) + f2.d), { 'clip-path': 'url(#butterfly-fore)' }) +
    path(fCell + fVeins) +
    eye(...fEye);

  /* hindwing: a scalloped edge, a second row of scales inside it */
  const hindEdge = sample(
    [
      [270, 147],
      [284, 176],
      [277, 210],
      [254, 238],
      [222, 250],
      [194, 242],
      [176, 216],
    ],
    12,
  );
  const nH = 6;
  const h1 = resample(hindEdge, nH + 1);
  const h2 = innerRow(hindEdge, nH, 11.6, 9.8);
  const hindD =
    `M166 108C196 121 240 131 ${P(...h1[0])}` +
    h1.slice(1).map((p, i) => scallop(h1[i], p, -6.2)).join('') +
    `C170 196 167 160 166 126Z`;
  const hEye = [231, 194, 13.6];
  const hHalo = [hEye[0], hEye[1], hEye[2] + 4.6];
  const hRoot = [170, 119];
  const hA = [214, 150];
  const hB = [196, 164];
  const hCell = `M${P(...hRoot)}Q${P(196, 128)} ${P(...hA)}Q${P(207, 160)} ${P(...hB)}Q${P(178, 142)} ${P(...hRoot)}`;
  const hVeins =
    vein(hA, h2.crests[1], -4, hHalo) +
    vein(between(hA, hB, 0.3), h2.crests[2], -2, hHalo) +
    vein(between(hA, hB, 0.65), h2.crests[3], 0, hHalo) +
    vein(hB, h2.crests[4], 2, hHalo) +
    vein([178, 150], h2.crests[5], 3, hHalo);
  const hind =
    path(hindD, true) +
    group(path(h2.d), { 'clip-path': 'url(#butterfly-hind)' }) +
    path(hCell + hVeins) +
    eye(...hEye);

  /* body */
  const antenna = path(`M157.2 76C151 58 137 41 121 32`) + ellipse(117.4, 30, 4.6, 2.7, 28, true);
  const abdomen =
    path(`M152.6 120C151.4 150 154 184 157.4 202C158.2 206.4 161.8 206.4 162.6 202C166 184 168.6 150 167.4 120Z`, true) +
    path(
      [136, 150, 164, 177, 189]
        .map((y, i) => {
          const w = 7.2 - i * 0.95;
          return `M${P(cx - w, y)}Q${P(cx, y + 3.4)} ${P(cx + w, y)}`;
        })
        .join(''),
    );
  const body = abdomen + ellipse(cx, 104.5, 9.2, 17.5, 0, true) + circle(cx, 81.5, 7, true);

  const clip =
    `<clipPath id="butterfly-fore"><path d="${foreD}"/></clipPath>` +
    `<clipPath id="butterfly-hind"><path d="${hindD}"/></clipPath>`;
  const wings = hind + fore;
  return svg(320, 280, SW, clip + wings + mirror(wings, cx) + antenna + mirror(antenna, cx) + body);
}

/* ------------------------------------------------------------- orphic egg */
// The egg from which Phanes breaks, the serpent wound about it. The egg stands upright; the
// serpent climbs it in four passes across the front, tail at the foot, head laid near the top.
function orphicEgg() {
  const cx = 140;
  const yc = 200;
  const W = 93;
  const aTop = 164;
  const aBot = 112;
  const R = (y) => {
    const t = y < yc ? (yc - y) / aTop : (y - yc) / aBot;
    return t >= 1 ? 0 : W * Math.sqrt(1 - t * t);
  };
  const eggPts = Array.from({ length: 48 }, (_, i) => {
    const f = (i / 48) * Math.PI * 2;
    const c = Math.cos(f);
    return [cx + W * Math.sin(f), yc - (c > 0 ? aTop : aBot) * c];
  });
  const egg = path(spline(eggPts, { closed: true }), true);

  // the climb: degrees round the egg against height
  const th0 = -62;
  const th1 = 1086;
  const y0 = 286;
  const pitch = 61;
  const yAt = (th) => y0 - (pitch * (th - th0)) / 360;
  const squeeze = 0.8;
  const at = (th, k) => {
    const a = th - 360 * k;
    const y = yAt(th);
    return [cx + (R(y) * Math.sin(a * squeeze * deg)) / Math.sin(90 * squeeze * deg), y];
  };
  const thick = 12.2;

  let out = '';
  for (let k = 0; k < 4; k++) {
    const from = Math.max(th0, 360 * k - 90);
    const to = Math.min(th1, 360 * k + 90);
    const raw = [];
    for (let th = from; th <= to + 0.001; th += (to - from) / 60) raw.push(at(th, k));
    const mid = resample(raw, 70);
    const lens = lengths(mid);
    const total = lens[lens.length - 1];
    const isTail = k === 0;
    const isHead = k === 3;
    // half-width along the pass: the tail runs out to a point, the neck draws in before the head
    const half = (t) => {
      if (isTail) return thick * Math.min(1, 0.07 + 0.93 * (t / 0.62) ** 0.8);
      if (isHead) return thick - 2.2 * Math.max(0, (t - 0.45) / 0.55) ** 1.2;
      return thick;
    };
    const up = offset(mid, half);
    const down = offset(mid, (t) => -half(t));
    const cap = (p, ang, r, a0, a1) =>
      Array.from({ length: 7 }, (_, i) => {
        const a = ang + (a0 + ((a1 - a0) * (i + 1)) / 8) * deg;
        return [p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r];
      });
    const first = mid[0];
    const last = mid[mid.length - 1];
    const endAng = last[2];
    let nose = [];
    let face = '';
    if (isHead) {
      const c = Math.cos(endAng);
      const s = Math.sin(endAng);
      const loc = (u, v) => [last[0] + u * c - v * s, last[1] + u * s + v * c];
      const rn = half(1);
      const side = [
        [7, rn + 1.6],
        [16, 14.2],
        [26, 13.4],
        [35, 8.6],
        [40.5, 3.4],
      ];
      nose = [...side.map(([u, v]) => loc(u, -v)), loc(42, 0), ...side.reverse().map(([u, v]) => loc(u, v))];
      const e1 = loc(23.5, -6.6);
      const e2 = loc(23.5, 6.6);
      const t0 = loc(42, 0);
      const t1 = loc(50, 0.4);
      const t2 = loc(56.5, -4.2);
      const t3 = loc(56.8, 4.6);
      face =
        circle(e1[0], e1[1], 2.3) +
        circle(e2[0], e2[1], 2.3) +
        path(`M${P(...t0)}L${P(...t1)}M${P(...t2)}Q${P(...loc(52.4, -1.2))} ${P(...t1)}Q${P(...loc(52.6, 1.8))} ${P(...t3)}`);
    } else {
      nose = cap(last, endAng, half(1), -90, 90);
    }
    const tailEnd = isTail ? [] : cap(first, first[2], half(0), 90, 270);
    const outline = spline([...up, ...nose, ...down.reverse(), ...tailEnd], { closed: true, k: 0.9 });

    // scales: columns of arches across the body, each opening towards the head
    const du = 7.6;
    const sw = 12.2;
    let scales = '';
    const pt = (u, v) => {
      const q = along(mid, u / total, lens);
      return [q.x + Math.sin(q.ang) * -v, q.y + Math.cos(q.ang) * v];
    };
    const uEnd = isHead ? total + 4 : total + thick;
    for (let j = 0, u = isTail ? 16 : -thick * 0.2; u < uEnd; j++, u += du) {
      const shift = j % 2 ? sw / 2 : 0;
      for (let v = -sw * 2 + shift; v < sw * 1.5; v += sw) {
        if (Math.min(Math.abs(v), Math.abs(v + sw)) > thick) continue;
        const a = pt(Math.min(u, total), v);
        const b = pt(Math.min(u, total), v + sw);
        const ext = Math.max(0, u - total);
        const q = along(mid, 1, lens);
        const sh = [Math.cos(q.ang) * ext, Math.sin(q.ang) * ext];
        const A = [a[0] + sh[0], a[1] + sh[1]];
        const B = [b[0] + sh[0], b[1] + sh[1]];
        const back = along(mid, Math.max(0, Math.min(u, total)) / total, lens).ang + Math.PI;
        const kx = Math.cos(back) * 8.4;
        const ky = Math.sin(back) * 8.4;
        scales += `M${P(...A)}C${P(A[0] + kx, A[1] + ky)} ${P(B[0] + kx, B[1] + ky)} ${P(...B)}`;
      }
    }
    const id = `orphic-egg-pass-${k}`;
    out +=
      `<clipPath id="${id}"><path d="${outline}"/></clipPath>` +
      path(outline, true, true) +
      group(path(scales), { 'clip-path': `url(#${id})` }) +
      path(outline) +
      face;
  }
  return svg(280, 340, SW, egg + out);
}

/* ---------------------------------------------------------------- cicada */
// The tettix of the Phaedrus and of Attica, seen from above: the head as broad as the body with
// the eyes at its corners, the shield of the thorax, a ringed abdomen, and long glass wings whose
// veins run out to a seam just inside the edge. The wings stand half open so both pairs show.
function cicada() {
  const cx = 150;
  // wing-space to page-space for the right wing: u runs down the wing, v out towards its fore edge
  const frame = (bx, by, tilt) => {
    const ax = Math.sin(tilt * deg);
    const ay = Math.cos(tilt * deg);
    return (u, v) => [bx + u * ax + v * ay, by + u * ay - v * ax];
  };
  const outside = (shape) => (q) => !inside(q, shape);
  const cut = (pts, shape, per = 12) =>
    visibleRuns(sample(pts, per), outside(shape), 3)
      .map((run) => spline(run))
      .join('');

  /* forewing: longer than the body, widest past the middle */
  const L = 210;
  const F = frame(184, 104, 27);
  const f = (u, v) => F(u * L, v);
  const foreLocal = [
    [0, 0],
    [0.1, 10],
    [0.35, 20],
    [0.6, 24],
    [0.82, 21],
    [0.95, 12],
    [1, 0],
    [0.96, -12],
    [0.84, -24],
    [0.64, -32],
    [0.42, -31],
    [0.2, -21],
    [0.07, -9],
  ].map(([u, v]) => f(u, v));
  const foreD = spline(foreLocal, { closed: true });
  const forePoly = sample(foreLocal, 12, true);
  const seamAll = offset([...forePoly, forePoly[0]], -6.6);
  // the cross veins: a zigzag from the node on the fore edge to the hind edge
  const n0 = forePoly[3 * 12 - 1];
  const n5 = forePoly[9 * 12];
  const node = [n0, f(0.635, 12.5), f(0.585, 1), f(0.64, -10.5), f(0.6, -21.5), n5];
  // the seam runs just inside the edge from one end of the zigzag round the tip to the other
  const seam = seamAll.slice(3 * 12 + 2, 9 * 12 - 2).filter((_, i) => i % 3 === 0);
  const fore =
    path(foreD, true) +
    path(spline([n0, ...seam, n5])) +
    path(poly(node)) +
    // the long veins from the root to the zigzag
    path(spline([f(0.08, 3.4), f(0.34, 9.6), node[1]])) +
    path(spline([f(0.08, -1.6), f(0.32, -4), node[2]])) +
    path(spline([f(0.1, -7.4), f(0.26, -14), f(0.45, -14.6), node[3]])) +
    path(spline([f(0.27, -14.2), f(0.43, -23.2), node[4]])) +
    // the veins of the tip, from the zigzag out to the seam
    path(
      cut([node[1], f(0.82, 13.4), f(1.03, 14)], seamAll) +
        cut([node[2], f(0.82, 3.6), f(1.06, 1.5)], seamAll) +
        cut([node[3], f(0.81, -7.6), f(1.04, -9)], seamAll) +
        cut([node[4], f(0.79, -18), f(0.99, -22)], seamAll),
    );

  /* hindwing: shorter, tucked under the forewing beside the abdomen */
  const Lh = 124;
  const H = frame(177, 134, 9);
  const h = (u, v) => H(u * Lh, v);
  const hindLocal = [
    [0, 0],
    [0.1, 10],
    [0.4, 24],
    [0.7, 28],
    [0.92, 17],
    [1, 0],
    [0.93, -10],
    [0.7, -16],
    [0.4, -15],
    [0.1, -7],
  ].map(([u, v]) => h(u, v));
  const hindPoly = sample(hindLocal, 12, true);
  const hSeamAll = offset([...hindPoly, hindPoly[0]], -6.2);
  const hind =
    path(spline(hindLocal, { closed: true }), true) +
    path(spline(hSeamAll.slice(2 * 12, 8 * 12 + 4).filter((_, i) => i % 3 === 0))) +
    path(cut([h(0.08, 0), h(0.5, -1), h(1.05, -3)], hSeamAll) + cut([h(0.3, 1), h(0.6, 9), h(1.02, 13)], hSeamAll));

  /* body */
  const sideL = sample(
    [
      [119.6, 148],
      [117.4, 167],
      [120, 191],
      [128.6, 216],
      [139.6, 236],
      [150, 248],
    ],
    14,
  );
  const xAt = (y) => {
    let i = 1;
    while (i < sideL.length - 1 && sideL[i][1] < y) i++;
    const a = sideL[i - 1];
    const b = sideL[i];
    return a[0] + ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1] || 1);
  };
  const sideR = sideL.map(([x, y]) => [2 * cx - x, y]).reverse();
  const abdomen =
    path(spline([...sideL.filter((_, i) => i % 7 === 0), ...sideR.filter((_, i) => i % 7 === 0).slice(1)]), true) +
    path(
      [166, 181, 195.6, 209.4, 222, 233.4]
        .map((y, i) => {
          const x = xAt(y);
          const sag = 7.6 - i * 0.8;
          return `M${P(x, y)}Q${P(cx, y + sag * 2)} ${P(2 * cx - x, y)}`;
        })
        .join(''),
    );
  // the big shield of the thorax with its three marks hanging from the front
  const meso =
    path(`M106 96.6C103 116 111 138 123 147.6Q150 155 177 147.6C189 138 197 116 194 96.6Z`, true) +
    path(
      `M141.6 97.4C141.8 110 145 119.6 150 123C155 119.6 158.2 110 158.4 97.4` +
        `M123.4 97.4C124 114 130.6 127.4 140.4 133.4M176.6 97.4C176 114 169.4 127.4 159.6 133.4`,
    );
  // the head, as wide as the thorax, the eyes bulging at its corners
  const eyes =
    ellipse(112, 63.4, 10.4, 12, 0, true) +
    ellipse(188, 63.4, 10.4, 12, 0, true) +
    path(`M107.4 56.6Q104.6 63 107.6 70.4M192.6 56.6Q195.4 63 192.4 70.4`);
  const head =
    path(`M118.6 73C117 64 117.6 56.4 120 52C130 50.4 135 48.6 138 46C143 42.2 157 42.2 162 46C165 48.6 170 50.4 180 52C182.4 56.4 183 64 181.4 73Z`, true);
  const ocelli = circle(143.6, 63.4, 1.5) + circle(156.4, 63.4, 1.5) + circle(150, 57.6, 1.5);
  const feelers = path(`M130 50Q126.6 41 120.4 35.6M170 50Q173.4 41 179.6 35.6`);
  const pro =
    path(`M113 70.4C126 66.6 174 66.6 187 70.4L194.8 91C195.8 95 194.4 97.6 190.6 97.6L109.4 97.6C105.6 97.6 104.2 95 105.2 91Z`, true) +
    path(`M108.4 88.4Q150 93.2 191.6 88.4`);

  const wings = hind + fore;
  return svg(
    300,
    320,
    SW,
    group(wings + mirror(wings, cx) + abdomen + meso + feelers + eyes + head + ocelli + pro, { transform: 'translate(0 -5)' }),
  );
}

/* -------------------------------------------------------- spring, cypress */
// From the gold tablets: by the house of Hades a spring, and standing beside it a white cypress.
// The tree is left bare, it is white; the water of Memory comes out of the rock at its foot and
// gathers in rings. A few stars for "child of Earth and starry Heaven".
function springCypress() {
  // the cypress: a tall spindle, widest low down, drawn by its outline only
  const cypress =
    path(
      spline(
        [
          [111, 13],
          [118, 42],
          [126, 82],
          [134, 126],
          [139, 170],
          [140, 208],
          [135, 238],
          [125, 256],
          [111, 262],
          [97, 256],
          [87, 238],
          [82, 208],
          [82, 170],
          [86, 126],
          [93, 82],
          [102, 42],
        ],
        { closed: true },
      ),
      true,
    ) + path(`M105.4 261.4L104.6 283M116.6 261.4L117.6 283`);
  const ground = path(`M22 285.4C48 281.6 78 283 102.4 282.6M119.8 282.6C130 281.8 139 282.4 147 284`);

  // the rock: a crag behind with a cleft in it, two boulders in front, the water coming down
  // between them
  const crag = path(
    spline(
      [
        [155, 290],
        [153, 266],
        [160, 244],
        [172, 229],
        [178, 210],
        [193, 197],
        [212, 194],
        [226, 203],
        [233, 219],
        [249, 228],
        [259, 247],
        [264, 268],
        [266, 290],
      ],
      { k: 0.72 },
    ),
    true,
  );
  const creases = path(`M178 210Q186 216 187 228M233 219Q227 224 227 235M249 228Q244 240 247 252M166 250Q170 243 176 241`);
  const cleft = path(`M193 262C192 244 197 231 205 228C213 231 218 244 217 262`);
  const boulderL = path(
    spline(
      [
        [146, 291],
        [146, 274],
        [155, 262],
        [171, 259],
        [184, 266],
        [190, 280],
        [191, 291],
      ],
      { k: 0.8 },
    ),
    true,
  );
  const boulderR = path(
    spline(
      [
        [219, 291],
        [220, 277],
        [228, 265],
        [243, 262],
        [256, 269],
        [263, 281],
        [265, 291],
      ],
      { k: 0.8 },
    ),
    true,
  );
  const water = path(
    spline([
      [198.6, 246],
      [198.4, 264],
      [195.4, 282],
      [194, 300],
    ]) +
      spline([
        [205, 240],
        [205.4, 262],
        [204.4, 282],
        [205, 303],
      ]) +
      spline([
        [211.4, 246],
        [212, 264],
        [213.6, 282],
        [216, 300],
      ]),
  );

  // the pool: rings round the place where the water lands
  const px = 205;
  const py = 320;
  const arc = (rx, ry, a0, a1) => {
    const p = (a) => [px + rx * Math.cos(a * deg), py + ry * Math.sin(a * deg)];
    return `M${P(...p(a0))}A${n1(rx)} ${n1(ry)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${P(...p(a1))}`;
  };
  const pool = path(
    arc(18, 5.2, -200, 150) +
      arc(41, 11.4, 6, 170) +
      arc(41, 11.4, 200, 252) +
      arc(41, 11.4, 290, 342) +
      arc(65, 17.6, -6, 112) +
      arc(65, 17.6, 132, 196) +
      arc(88, 24, 24, 84) +
      arc(88, 24, 100, 166),
  );

  const star = (x, y, r) => {
    const k = 0.13 * r;
    return `M${P(x, y - r)}Q${P(x + k, y - k)} ${P(x + r, y)}Q${P(x + k, y + k)} ${P(x, y + r)}Q${P(x - k, y + k)} ${P(x - r, y)}Q${P(x - k, y - k)} ${P(x, y - r)}Z`;
  };
  const stars = path(star(204, 60, 10.5) + star(252, 128, 7) + star(44, 100, 8) + star(178, 146, 5));

  return svg(300, 360, SW, stars + ground + cypress + crag + creases + cleft + water + boulderL + boulderR + pool);
}

/* ------------------------------------------------------------------ write */
const drawings = { 'spring-cypress': springCypress, tripod, butterfly, 'orphic-egg': orphicEgg, cicada, wheat };
mkdirSync(outDir, { recursive: true });
for (const [name, draw] of Object.entries(drawings)) {
  if (only && !only.split(',').includes(name)) continue;
  writeFileSync(resolve(outDir, `${name}.svg`), draw());
  console.log(`${name}.svg`);
}
