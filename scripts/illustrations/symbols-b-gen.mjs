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
    [89, 353],
    [93, 310],
    [98, 264],
    [100, 224],
    [100, 166],
    [100, 110],
  ];
  const per = 16;
  const dense = sample(axis, per);
  const lens = lengths(dense);
  const earFrom = lens[3 * per] / lens[lens.length - 1];
  const GRAIN = [0.3, 1.04, 0.76, 0.9];

  const N = 10;
  let awns = '';
  const grains = [];
  for (let i = 0; i < N; i++) {
    const side = i % 2 ? 1 : -1;
    const u = i / (N - 1);
    const b = along(dense, earFrom + (1 - earFrom) * ((i + 0.1) / (N + 0.75)), lens);
    const dir = b.ang + side * (27 - 4 * u) * deg;
    const len = 36 - 7 * u;
    const g = leaf(b.x, b.y, dir, len, 11.6 - 2.6 * u, side * 0.06, 0.6, GRAIN);
    grains.push(path(g.outline, true));
    // awn: leaves the tip in the direction of the grain, then straightens a little
    const L = 128 - 50 * u + (rand() - 0.5) * 9;
    const endDir = b.ang + side * (22.5 - 11 * u + (rand() - 0.5) * 1.6) * deg;
    const c = [g.tip[0] + Math.cos(dir) * L * 0.4, g.tip[1] + Math.sin(dir) * L * 0.4];
    const e = [g.tip[0] + Math.cos(endDir) * L, g.tip[1] + Math.sin(endDir) * L];
    awns += `M${P(...g.tip)}Q${P(...c)} ${P(...e)}`;
  }
  // the grain that closes the ear, and its awn straight on
  const top = along(dense, 1, lens);
  const tg = leaf(top.x, top.y + 5, top.ang, 29, 8.2, 0, 0.6, GRAIN);
  awns += `M${P(...tg.tip)}Q${P(tg.tip[0] + 1.6, tg.tip[1] - 34)} ${P(tg.tip[0] - 1, tg.tip[1] - 67)}`;
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
      [94.6, 300],
      [106, 270],
      [126, 244],
      [150, 232],
      [170, 239],
      [181, 257],
    ],
    11,
  );
  const left = blade(
    [
      [91.4, 328],
      [82, 300],
      [66, 278],
      [46, 266],
      [28, 268],
    ],
    10,
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
  const rimTop = 143;
  const rimBottom = 150.6;
  const pawY = 316;

  // vapour: three threads rising out of the bowl between the handles
  const vapour =
    path(spline(wavy([150, 100], [150, 15], 2.5, 5.6, 0, 12))) +
    path(spline(wavy([125.5, 137], [122, 44], 2.6, 5.2, Math.PI, 12))) +
    path(spline(wavy([174.5, 137], [178, 44], 2.6, 5.2, 0, 12)));

  // ring handles
  const ringY = rimTop - 16;
  const rings = [101, cx, 199].map((x) => circle(x, ringY, 15.4, true) + circle(x, ringY, 9.2)).join('');

  // lebes: a deep bowl, a band under the rim with a row of tongues hanging from it
  const bandY = 161.5;
  const tongues = (x0) => `M${P(x0, bandY)}` + 'a5.1 6.2 0 0 0 10.2 0'.repeat(4);
  const bowl =
    path(`M103 ${rimBottom}C103 190 123 213 ${cx} 213C177 213 197 190 197 ${rimBottom}Z`, true) +
    path(`M103 ${bandY}H197`) +
    path(tongues(102.2) + tongues(157));
  const rim = `<rect x="82" y="${rimTop}" width="136" height="${n1(rimBottom - rimTop)}" rx="2.4" fill="var(--paper, #f2e9d3)"/>`;

  // stays: an arched band between each pair of legs, running into them
  const arch = (x0, x1, y, rise) => {
    const m = (x0 + x1) / 2;
    return `M${P(x0, y)}C${P(x0, y - rise * 0.72)} ${P(m - (x1 - x0) * 0.27, y - rise)} ${P(m, y - rise)}S${P(x1, y - rise * 0.72)} ${P(x1, y)}`;
  };
  const stays = path(arch(89, 149, 284, 37) + arch(93.6, 145, 291, 37.5));

  // a leg narrows a little towards the ankle and runs straight into a lion paw seen from the
  // front; `lean` pushes the paw a little to one side
  const leg = (xt, xb, lean) => {
    const y = pawY;
    const c = xb + lean * 2.6;
    const l = c - 12.6;
    const r = c + 12.6;
    const tw = (r - l) / 3;
    const yt = y + 16.4;
    let d = `M${P(xt - 6.6, rimBottom)}L${P(xb - 5.4, y)}C${P(xb - 5.4, y + 5)} ${P(l, y + 3.4)} ${P(l, y + 11)}L${P(l, yt)}`;
    for (let i = 0; i < 3; i++) d += `a${n1(tw / 2)} 3.4 0 0 0 ${n1(tw)} 0`;
    d += `L${P(r, y + 11)}C${P(r, y + 3.4)} ${P(xb + 5.4, y + 5)} ${P(xb + 5.4, y)}L${P(xt + 6.6, rimBottom)}`;
    const toes = `M${P(l + tw, yt)}q0.6 -3.4 -0.4 -6.2M${P(l + 2 * tw, yt)}q-0.6 -3.4 0.4 -6.2`;
    return path(d, true) + path(toes);
  };
  const sideLeg = leg(96, 87, -1);
  const midLeg = leg(cx, cx, 0);

  // laurel either side
  const sprig = () => {
    const rand = rng(5);
    const stemPts = [
      [45, 346],
      [31, 308],
      [23, 264],
      [25, 218],
      [37, 178],
    ];
    const dense = sample(stemPts, 14);
    const lens = lengths(dense);
    let out = path(spline(stemPts));
    const nodes = [0.15, 0.31, 0.47, 0.63, 0.78, 0.91];
    nodes.forEach((f, i) => {
      const size = 1 - 0.3 * (i / (nodes.length - 1)) ** 1.4;
      for (const side of [-1, 1]) {
        const b = along(dense, f + side * 0.014, lens);
        const spread = (38 + rand() * 9) * deg;
        const lf = leaf(b.x, b.y, b.ang + side * spread, (26 + rand() * 4) * size, 5.8 * (0.75 + 0.25 * size), -side * 0.07, 0.72, SLIM);
        out += path(lf.outline + lf.rib);
      }
    });
    const end = along(dense, 1, lens);
    const last = leaf(end.x, end.y, end.ang + 3 * deg, 21, 4.5, 0.04, 0.72, SLIM);
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
  const eye = (x, y, r) => circle(x, y, r, true) + circle(x, y, r * 0.56) + circle(x, y, 1.1);
  const veins = (root, targets, starts, halo) =>
    targets
      .map((t, i) => {
        const d = Math.hypot(t[0] - root[0], t[1] - root[1]);
        const a = [root[0] + ((t[0] - root[0]) * starts[i]) / d, root[1] + ((t[1] - root[1]) * starts[i]) / d];
        const bend = t[2] ?? 0;
        const m = [(a[0] + t[0]) / 2 - ((t[1] - a[1]) / d) * bend, (a[1] + t[1]) / 2 + ((t[0] - a[0]) / d) * bend];
        const fine = sample([a, m, [t[0], t[1]]], 24);
        return visibleRuns(fine, (q) => Math.hypot(q[0] - halo[0], q[1] - halo[1]) < halo[2], 4)
          .map((run) => spline(run))
          .join('');
      })
      .join('');

  /* hindwing: scalloped edge, a second row of scales inside it */
  const hindEdge = sample(
    [
      [270, 148],
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
  const hOuter = resample(hindEdge, nH + 1);
  const hInnerLine = offset(hindEdge, -12.5);
  const hInner = resample(hInnerLine, 2 * nH + 1).filter((_, i) => i % 2 === 1);
  const hindD =
    `M166 108C196 121 240 131 ${P(...hOuter[0])}` +
    hOuter.slice(1).map((p, i) => scallop(hOuter[i], p, -6.4)).join('') +
    `C170 196 167 160 166 126Z`;
  const hEye = [231, 191, 15];
  const hind =
    path(hindD, true) +
    path(row(hInner, -10.6)) +
    path(
      veins(
        [168, 116],
        [
          [...hInner[0], -5],
          [...hInner[1], -3],
          [...hInner[3], 3],
          [...hInner[4], 4],
        ],
        [26, 20, 20, 26],
        [hEye[0], hEye[1], hEye[2] + 4.5],
      ),
    ) +
    eye(...hEye);

  /* forewing: smooth edge, a row of scales standing against it */
  const forePts = [
    [165, 96],
    [194, 65],
    [240, 40],
    [284, 29],
    [302, 38],
    [304, 68],
    [293, 106],
    [274, 136],
    [243, 139],
    [205, 128],
    [166, 114],
  ];
  const foreD = spline(forePts, { closed: true });
  const foreEdge = sample(forePts, 12, true).slice(4 * 12 - 3, 7 * 12 + 5);
  const nF = 6;
  const fInnerLine = offset(foreEdge, -11.5);
  const fInner = resample(fInnerLine, nF + 1);
  const fEye = [257, 76, 14.5];
  const fore =
    path(foreD, true) +
    path(row(fInner, -9.6)) +
    path(
      veins(
        [168, 105],
        [
          [...fInner[1], -4],
          [...fInner[2], -2],
          [...fInner[3], 1],
          [...fInner[4], 3],
          [...fInner[5], 4],
        ],
        [34, 24, 30, 22, 30],
        [fEye[0], fEye[1], fEye[2] + 4.5],
      ),
    ) +
    eye(...fEye);

  /* body */
  const antenna =
    path(`M157.2 76C151 58 137 41 121 32`) + ellipse(117.4, 30, 4.6, 2.7, 28, true);
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

  const wings = hind + fore;
  return svg(320, 280, SW, wings + mirror(wings, cx) + antenna + mirror(antenna, cx) + body);
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
  const inPoly = (poly) => (q) => !inside(q, poly);
  const cut = (pts, poly, per = 12) =>
    visibleRuns(sample(pts, per), inPoly(poly), 3)
      .map((run) => spline(run))
      .join('');

  /* forewing */
  const L = 194;
  const F = frame(187, 103, 20.5);
  const foreLocal = [
    [0, 0],
    [0.08, 9],
    [0.3, 17.5],
    [0.55, 22.5],
    [0.78, 22],
    [0.93, 14],
    [1, 1],
    [0.955, -12],
    [0.8, -22.5],
    [0.58, -27.5],
    [0.34, -24],
    [0.14, -14],
  ].map(([u, v]) => F(u * L, v));
  const foreD = spline(foreLocal, { closed: true });
  const forePoly = sample(foreLocal, 12, true);
  const seamAll = offset([...forePoly, forePoly[0]], -6.4);
  // the seam runs from the node on the fore edge, round the tip, to the node on the hind edge
  const seam = seamAll.slice(3 * 12 + 2, 9 * 12 - 1);
  const node = [F(0.565 * L, 22.6), F(0.615 * L, 9.5), F(0.56 * L, -2.5), F(0.61 * L, -14), F(0.565 * L, -27.6)];
  const nodal = poly(node);
  const long =
    path(spline([F(0.035 * L, 3), F(0.3 * L, 10.5), node[1]])) +
    path(spline([F(0.035 * L, -3.4), F(0.3 * L, -12.5), node[3]])) +
    path(spline([F(0.26 * L, -10.6), F(0.42 * L, -5), node[2]]));
  const apical = path(
    cut([node[1], F(0.8 * L, 12), F(1.02 * L, 14)], seamAll) +
      cut([node[2], F(0.8 * L, -1), F(1.05 * L, -1.5)], seamAll) +
      cut([node[3], F(0.78 * L, -13), F(1.0 * L, -19)], seamAll),
  );
  const fore = path(foreD, true) + path(spline(seam.filter((_, i) => i % 3 === 0))) + path(nodal) + long + apical;

  /* hindwing */
  const Lh = 122;
  const H = frame(176, 130, 15);
  const hindLocal = [
    [0, 0],
    [0.1, 8],
    [0.4, 16],
    [0.7, 17],
    [0.93, 10],
    [1, 0],
    [0.93, -9.5],
    [0.7, -14.5],
    [0.4, -14],
    [0.1, -7],
  ].map(([u, v]) => H(u * Lh, v));
  const hindPoly = sample(hindLocal, 12, true);
  const hSeamAll = offset([...hindPoly, hindPoly[0]], -6);
  const hind =
    path(spline(hindLocal, { closed: true }), true) +
    path(spline(hSeamAll.slice(3 * 12, 8 * 12 + 4).filter((_, i) => i % 3 === 0))) +
    path(cut([H(0.06 * Lh, 0), H(0.5 * Lh, 1.5), H(1.05 * Lh, 1)], hSeamAll));

  /* body */
  const sideL = sample(
    [
      [122.5, 141],
      [119, 162],
      [121.5, 188],
      [130.5, 215],
      [141, 236],
      [150, 250],
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
      [160, 176, 192, 207, 221, 234]
        .map((y, i) => {
          const x = xAt(y);
          const sag = 7.5 - i * 0.7;
          return `M${P(x, y)}Q${P(cx, y + sag * 2)} ${P(2 * cx - x, y)}`;
        })
        .join(''),
    );
  const meso =
    path(`M107 93C103 112 111 136 123 144Q150 153 177 144C189 136 197 112 193 93Z`, true) +
    path(`M131.5 100C132.5 114 138 124 145.6 127.4M168.5 100C167.5 114 162 124 154.4 127.4`) +
    path(`M142 133.4Q150 139.6 158 133.4M143.4 144.6Q150 139.2 156.6 144.6`);
  const head = path(`M111 68C108 52 127 39.6 150 39.6C173 39.6 192 52 189 68Z`, true);
  const eyes = circle(107.6, 60.4, 10.2, true) + circle(192.4, 60.4, 10.2, true);
  const ocelli = circle(144.2, 57.6, 1.5) + circle(155.8, 57.6, 1.5) + circle(150, 50.4, 1.5);
  const feelers = path(`M134.6 43.4Q131 35 125.6 29.6M165.4 43.4Q169 35 174.4 29.6`);
  const pro =
    path(`M110.5 67.4C122 63.4 178 63.4 189.5 67.4L196.4 90.6C197.6 96.4 102.4 96.4 103.6 90.6Z`, true) +
    path(`M118 86.4Q150 91.6 182 86.4`);

  const wings = hind + fore;
  return svg(300, 320, SW, wings + mirror(wings, cx) + abdomen + meso + feelers + head + eyes + ocelli + pro);
}

/* -------------------------------------------------------- spring, cypress */
// From the gold tablets: by the house of Hades a spring, and standing beside it a white cypress.
// The tree is left bare, it is white; the water of Memory comes out of the rock at its foot and
// gathers in rings. A few stars for "child of Earth and starry Heaven".
function springCypress() {
  const cypress =
    path(
      spline(
        [
          [114, 15],
          [122, 46],
          [131, 88],
          [139, 132],
          [144, 174],
          [144, 212],
          [138, 240],
          [127, 256],
          [113, 261],
          [99, 256],
          [88, 240],
          [82, 212],
          [81, 174],
          [86, 132],
          [94, 88],
          [104, 46],
        ],
        { closed: true },
      ),
      true,
    ) + path(`M107.4 260.4L106.4 281M118.6 260.4L119.6 281`);
  const ground = path(`M26 284C52 280 80 282 104 281.4M122 281.4C132 280.6 140 281.4 148 283`);

  // rocks: the big one behind, two smaller in front with the water coming down between them
  const rockA = path(
    spline([
      [158, 286],
      [156, 258],
      [165, 232],
      [183, 213],
      [207, 205],
      [231, 211],
      [248, 229],
      [259, 253],
      [265, 286],
    ]),
    true,
  );
  const creases = path(`M186 226Q198 220 212 222M226 226Q238 234 243 248M170 246Q174 236 181 231`);
  const mouth = path(`M190 258C190 246 196 239 203 239C210 239 216 246 216 258`);
  const rockB = path(
    spline([
      [147, 288],
      [148, 268],
      [160, 256],
      [176, 257],
      [186, 270],
      [189, 288],
    ]),
    true,
  );
  const rockC = path(
    spline([
      [217, 289],
      [218, 270],
      [229, 258],
      [246, 259],
      [257, 272],
      [262, 289],
    ]),
    true,
  );
  const water = path(
    spline([
      [196.5, 250],
      [196, 266],
      [192, 282],
      [190.5, 298],
    ]) +
      spline([
        [203, 247],
        [203.4, 266],
        [201, 284],
        [201.6, 300],
      ]) +
      spline([
        [209.5, 250],
        [210.6, 266],
        [210, 282],
        [212.6, 298],
      ]),
  );

  // the pool: rings round the place where the water lands
  const px = 200;
  const py = 318;
  const arc = (rx, ry, a0, a1) => {
    const p = (a) => [px + rx * Math.cos(a * deg), py + ry * Math.sin(a * deg)];
    return `M${P(...p(a0))}A${n1(rx)} ${n1(ry)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${P(...p(a1))}`;
  };
  const pool = path(
    arc(19, 5.4, -200, 150) +
      arc(43, 11.6, 8, 172) +
      arc(43, 11.6, 196, 338) +
      arc(69, 18.2, -4, 118) +
      arc(69, 18.2, 136, 196) +
      arc(96, 25, 22, 86) +
      arc(96, 25, 100, 168),
  );

  const star = (x, y, s) => {
    const k = 0.13 * s;
    return `M${P(x, y - s)}Q${P(x + k, y - k)} ${P(x + s, y)}Q${P(x + k, y + k)} ${P(x, y + s)}Q${P(x - k, y + k)} ${P(x - s, y)}Q${P(x - k, y - k)} ${P(x, y - s)}Z`;
  };
  const stars = path(star(206, 58, 10.5) + star(254, 124, 7) + star(48, 96, 8) + star(176, 142, 5));

  return svg(300, 360, SW, stars + ground + cypress + rockA + creases + mouth + water + rockB + rockC + pool);
}

/* ------------------------------------------------------------------ write */
const drawings = { 'spring-cypress': springCypress, tripod, butterfly, 'orphic-egg': orphicEgg, cicada, wheat };
mkdirSync(outDir, { recursive: true });
for (const [name, draw] of Object.entries(drawings)) {
  if (only && !only.split(',').includes(name)) continue;
  writeFileSync(resolve(outDir, `${name}.svg`), draw());
  console.log(`${name}.svg`);
}
