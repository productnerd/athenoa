// Generates the six symbols of the symbols-b set: spring-cypress, tripod, butterfly, orphic-egg,
// cicada and wheat. One stroke weight (2.5) for the whole family, about 20 units of air all round.
//   node scripts/illustrations/symbols-b-gen.mjs                 writes into src/assets/illustrations
//   node scripts/illustrations/symbols-b-gen.mjs --dir <dir>     writes somewhere else (for trying things out)
//   node scripts/illustrations/symbols-b-gen.mjs --only wheat,tripod
//
// Two things the drawings are built around:
// - Nothing is filled with paper to hide what is behind it (the one exception is the white cypress).
//   Lines are cut where another shape covers them instead, so no flat patch shows on grained paper
//   or before the strokes have drawn themselves.
// - The order of the paths is the order they draw in: the subject first, left and right halves
//   alternating, small things (vapour, stars, scales) last.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  P,
  PAPER,
  SLIM,
  along,
  circle,
  deg,
  ellipse,
  ellipsePts,
  inside,
  leaf,
  lengths,
  mirrorD,
  n1,
  offset,
  path,
  resample,
  rng,
  sample,
  spline,
  svg,
  visibleRuns,
  wavy,
  xAtY,
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

const flip = (pts, cx) => pts.map(([x, y]) => [2 * cx - x, y]);
// a path and its mirror image, one after the other
const pair = (d, cx) => path(d) + path(mirrorD(d, cx));
// the stretches of a line that are not covered, as path data
const cut = (pts, hidden, { per = 12, keep = 3, min = 0 } = {}) =>
  visibleRuns(sample(pts, per), hidden, keep)
    .filter((run) => lengths(run).at(-1) > min)
    .map((run) => spline(run))
    .join('');
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/* ---------------------------------------------------------------- cicada */
// The tettix of the Phaedrus and of Attica, seen from above with its wings folded back along the
// body as on the gems and the gold hair-cicadas: a broad head with the eyes at its corners, the
// shield of the thorax, the long glass forewings lying over a short ringed abdomen that shows
// through them, the hindwings as a shorter lobe inside each.
function cicada() {
  const cx = 150;
  const two = (d) => pair(d, cx);

  /* head and thorax */
  // the head is a short broad band; the eyes bulge from its corners, half hidden behind it
  const headR = [
    [150, 29.6],
    [161.6, 32.4],
    [169, 38.4],
    [179.6, 41.4],
    [185, 60],
    [172, 61],
    [150, 61.4],
  ];
  const headPts = [...headR, ...flip(headR, cx).reverse().slice(1, -1)];
  const headPoly = [...sample(headR, 10), ...flip(sample(headR, 10), cx).reverse()];
  const inHead = (q) => inside(q, headPoly);
  const browR = headR.slice(0, 4);
  const brow = spline([...flip(browR, cx).reverse(), ...browR.slice(1)]);
  const cheek = `M${P(...headR[3])}L${P(...headR[4])}`;
  const neck = spline([...flip(headR.slice(4), cx), ...headR.slice(4, 6).reverse()]);
  const eyePts = ellipsePts(188.6, 49.4, 12.4, 12.8, 8, 64);
  const eye = visibleRuns([...eyePts, eyePts[0]], inHead, 3)
    .map((run) => spline(run))
    .join('');
  const glint = `M194 42.6Q198 49 195 56`;
  const thoraxR = [
    [185, 60],
    [193.6, 67],
    [197.8, 78],
    [196.4, 89],
    [190.6, 102],
    [182, 117],
    [171, 130],
    [160, 137.4],
    [150, 140],
  ];
  const thoraxDense = sample(thoraxR, 12);
  const thoraxSide = spline(thoraxR);
  const feeler = `M171.6 39.2Q174.4 31.6 181 25.4`;
  const cw = xAtY(thoraxDense, 79.4) - cx - 0.4;
  const collarY = (x) => 79.4 + 7 * (1 - ((x - cx) / cw) ** 2);
  const collar = `M${P(cx - cw, 79.4)}Q${P(cx, 93.4)} ${P(cx + cw, 79.4)}`;
  const markMid = `M142.4 ${n1(collarY(142.4))}C142.4 97 145.6 105 150 108C154.4 105 157.6 97 157.6 ${n1(collarY(157.6))}`;
  const markSide = `M173.6 ${n1(collarY(173.6))}C173 100 167.6 112 158.6 118.6`;
  const ocelli = circle(150, 42, 1.1) + circle(143.4, 48.6, 1.1) + circle(156.6, 48.6, 1.1);

  /* forewing: from the shoulder back past the end of the body, widest beyond the middle */
  const outer = [
    [196.4, 89],
    [207.6, 111],
    [219.6, 144],
    [227.4, 184],
    [229.6, 224],
    [227, 261],
    [219, 286],
    [210.4, 297],
    [200.6, 299.6],
  ];
  const inner = [
    [152.4, 142.6],
    [163.6, 178],
    [175.6, 218],
    [184, 255],
    [188.6, 277],
    [193.2, 292],
    [200.6, 299.6],
  ];
  const foreD = spline([...outer, ...inner.slice(0, -1).reverse()]);
  const O = resample(sample(outer, 10), 101);
  const I = resample(sample(inner, 10), 101);
  // a point of the wing: t from root to tip, s from the inner edge (0) to the fore edge (1)
  const W = (t, s) => lerp(I[Math.round(t * 100)], O[Math.round(t * 100)], s);
  const vein = (...ts) => spline(ts.map(([t, s]) => W(t, s)));
  const node = [
    [0.6, 1],
    [0.63, 0.74],
    [0.585, 0.47],
    [0.645, 0.21],
    [0.6, 0],
  ];
  const veins =
    // the second line of the fore edge, running into it at the node
    vein([0.05, 0.6], [0.2, 0.8], [0.4, 0.85], [0.53, 0.9], node[0]) +
    // one long vein from the root, forking on its way to the cross line
    vein([0.08, 0.5], [0.24, 0.6], [0.44, 0.7], node[1]) +
    vein([0.3, 0.63], [0.45, 0.52], node[2]);
  const crossLine = `M${node.map(([t, s]) => P(...W(t, s))).join('L')}`;
  const tips =
    vein(node[1], [0.76, 0.8], [0.88, 1]) + vein(node[2], [0.78, 0.5], [0.97, 0.62]) + vein(node[3], [0.76, 0.2], [0.89, 0]);

  /* abdomen: short and broad, seen through the wings */
  const bellyR = [
    [178.4, 122],
    [184.6, 142],
    [183.6, 166],
    [176.6, 190],
    [165, 208],
    [157, 216],
    [150, 219],
  ];
  const bellyDense = sample(bellyR, 12);
  const belly = spline([...bellyR, ...flip(bellyR, cx).reverse().slice(1)]);
  const rings = [153, 168, 182.4, 195.6, 207].map((y, i) => {
    const x = xAtY(bellyDense, y);
    return path(`M${P(2 * cx - x, y)}Q${P(cx, y + (7.4 - i) * 2)} ${P(x, y)}`);
  });

  /* hindwing: the shorter lobe that shows between the forewing and the end of the body */
  const hind = spline([
    [xAtY(bellyDense, 204.6), 204.6],
    [163.4, 226],
    [164.6, 248],
    [171.4, 264],
    [179.6, 270.6],
    [186.8, 268.6],
  ]);

  return svg(
    300,
    320,
    SW,
    path(brow) +
      two(cheek) +
      path(neck) +
      two(eye) +
      two(thoraxSide) +
      two(foreD) +
      path(belly) +
      two(hind) +
      path(collar) +
      rings.join('') +
      path(markMid) +
      two(markSide) +
      two(veins) +
      two(crossLine) +
      two(tips) +
      two(glint) +
      two(feeler) +
      ocelli,
  );
}

/* ---------------------------------------------------------------- tripod */
// The tripod of Apollo at Delphi, flat and frontal as on the coins of Kroton. The round lebes is
// whole and in front: the two outer legs come out from behind its flanks, the middle one from
// under its base, each on a lion's paw (the outer two turned outward). Three ring handles stand on
// the lip, a short sprig of laurel either side of the legs, the breath of the oracle rising.
function tripod() {
  const cx = 150;
  const two = (d) => pair(d, cx);
  const lipTop = 118.6;
  const lipBottom = 127.4;
  const base = 340;

  // lebes: a deep round pot, a little wider below the lip than at it
  const bowlR = [
    [226, lipBottom],
    [230.4, 139],
    [231, 152],
    [226, 171],
    [212, 190],
    [191, 203],
    [167, 208.4],
    [150, 209.4],
  ];
  const bowlDense = sample(bowlR, 14);
  const bowl = spline([...bowlR, ...flip(bowlR, cx).reverse().slice(1)]);
  const lip = `M72.4 ${lipTop}H227.6a4.4 4.4 0 0 1 0 ${n1(lipBottom - lipTop)}H72.4a4.4 4.4 0 0 1 0 -${n1(lipBottom - lipTop)}Z`;
  // a second line inside the first, as on the shell of the lyre: the thickness of the bronze
  const wall = offset(sample([...flip(bowlR, cx), ...[...bowlR].reverse().slice(1)], 8), 8.4);
  const inner = spline(
    visibleRuns(wall, ([, y]) => y < lipBottom + 0.01, 1)[0].filter((_, i, all) => i % 4 === 0 || i === all.length - 1),
  );

  // the bowl's height at x, for where the middle leg comes out from under it
  const bowlY = (x) => {
    const ax = cx + Math.abs(x - cx);
    for (let i = bowlDense.length - 1; i > 0; i--) {
      const a = bowlDense[i];
      const b = bowlDense[i - 1];
      if ((a[0] - ax) * (b[0] - ax) <= 0) return a[1] + ((b[1] - a[1]) * (ax - a[0])) / (b[0] - a[0] || 1);
    }
    return lipBottom;
  };
  const ankle = 318;
  const pad = base - 4.2;
  const toe = (w) => `a${n1(w / 2)} 4.2 0 0 0 ${n1(w)} 0`;
  // right outer leg and its paw, turned outward: one line from the bowl down the inner edge,
  // round the heel, along the toes and back up the outer edge
  const xt = 219;
  const xb = 227;
  const edge = (side, y) => {
    // x of the leg's inner (-1) or outer (1) edge at height y: the leg narrows towards the ankle
    const t = (y - 170) / (ankle - 170);
    return xt + (xb - xt) * t + side * (7.8 - 1.4 * t);
  };
  const meet = (side) => {
    // walk up the edge until it disappears behind the bowl
    let y = ankle;
    while (y > lipBottom && (y > 210 || edge(side, y) > xAtY(bowlDense, y))) y -= 0.25;
    return [edge(side, y), y];
  };
  const tw = 7.7;
  const outerLeg =
    `M${P(...meet(-1))}L${P(edge(-1, ankle), ankle)}` +
    `C${P(xb - 6, ankle + 6)} ${P(xb - 10.6, ankle + 6.6)} ${P(xb - 10.8, ankle + 12)}L${P(xb - 10.8, pad)}` + // the heel
    toe(tw).repeat(4) +
    `L${P(xb - 10.8 + 4 * tw, ankle + 13)}C${P(xb + 19, ankle + 6.4)} ${P(xb + 8.6, ankle + 7)} ${P(edge(1, ankle), ankle)}` + // the instep
    `L${P(...meet(1))}`;
  const outerToes = [1, 2, 3].map((i) => `M${P(xb - 10.8 + i * tw, pad)}l${n1(-0.4 + i * 0.5)} -6`).join('');

  // middle leg, its paw seen from the front
  const mh = (y) => 7.6 - (1.4 * (y - 210)) / (ankle - 210);
  const mw = 7.8;
  const midLeg =
    `M${P(cx - mh(210), bowlY(cx - mh(210)))}L${P(cx - mh(ankle), ankle)}` +
    `C${P(cx - 6, ankle + 6.4)} ${P(cx - 15, ankle + 6)} ${P(cx - 2 * mw, ankle + 13)}L${P(cx - 2 * mw, pad)}` +
    toe(mw).repeat(4) +
    `L${P(cx + 2 * mw, ankle + 13)}C${P(cx + 15, ankle + 6)} ${P(cx + 6, ankle + 6.4)} ${P(cx + mh(ankle), ankle)}` +
    `L${P(cx + mh(210), bowlY(cx + mh(210)))}`;
  const midToes = [-1, 0, 1].map((i) => `M${P(cx + i * mw, pad)}l${n1(i * 0.5)} -6`).join('');

  // the stay: a slim band from leg to leg
  const stayY = 264;
  const stay = [stayY, stayY + 6.6].map((y) => `M${P(cx + mh(y), y)}H${n1(edge(-1, y))}`).join('');

  // ring handles: three hoops standing in the lip
  const ringR = 14.6;
  const sunk = 3.4;
  const chord = Math.sqrt(ringR ** 2 - (ringR - sunk) ** 2);
  const rings = [cx, cx - 48, cx + 48].map((x) => path(`M${P(x - chord, lipTop)}A${ringR} ${ringR} 0 1 1 ${P(x + chord, lipTop)}`));

  // laurel: a short sprig either side of the legs
  const rand = rng(7);
  const stemPts = [
    [259, 337],
    [264, 306],
    [266, 274],
    [264, 244],
    [258.4, 220],
  ];
  const stemDense = sample(stemPts, 14);
  const stemLens = lengths(stemDense);
  const leaves = [];
  const nodes = [0.1, 0.3, 0.5, 0.69, 0.86];
  nodes.forEach((f, i) => {
    const size = 1 - 0.26 * (i / (nodes.length - 1)) ** 1.3;
    for (const side of [1, -1]) {
      const b = along(stemDense, f + side * 0.014, stemLens);
      const spread = (40 + rand() * 6) * deg;
      const lf = leaf(b.x, b.y, b.ang + side * spread, (22.6 + rand() * 2.4) * size, 5.4 * (0.8 + 0.2 * size), -side * 0.07, 0.7, SLIM);
      leaves.push(lf.outline + lf.rib);
    }
  });
  const end = along(stemDense, 1, stemLens);
  const last = leaf(end.x, end.y, end.ang - 2 * deg, 19, 4.4, -0.04, 0.7, SLIM);
  leaves.push(last.outline + last.rib);

  // vapour: one thread of two lines rising above the handles
  const vapour =
    path(spline(wavy([144.6, 84], [144.6, 31], 1.7, 5.4, 0, 12))) + path(spline(wavy([155.8, 79], [155.8, 21.6], 1.84, 5.4, 0.45, 12)));

  return svg(
    300,
    360,
    SW,
    path(lip) +
      path(bowl) +
      path(inner) +
      two(outerLeg) +
      path(midLeg) +
      two(stay) +
      rings.join('') +
      two(outerToes) +
      path(midToes) +
      two(spline(stemPts)) +
      leaves.map(two).join('') +
      vapour,
  );
}

/* ------------------------------------------------------------- orphic egg */
// The egg from which Phanes breaks, one serpent wound about it. The egg stands upright; the
// serpent climbs it in four passes across the front, each a shallow arc that reaches the outline
// and turns behind it: the edge on the outside of the turn sweeps past the outline and hooks the
// way the body goes on (up at the right, down at the left). Tail at the foot, head laid near the top.
function orphicEgg() {
  const cx = 140;
  const yc = 198;
  const W = 106;
  const aTop = 176;
  const aBot = 120;
  const R = (y) => {
    const t = y < yc ? (yc - y) / aTop : (y - yc) / aBot;
    return t >= 1 ? 0 : W * Math.sqrt(1 - t * t);
  };
  const eggDense = Array.from({ length: 361 }, (_, i) => {
    const f = (i / 360) * Math.PI * 2;
    const c = Math.cos(f);
    return [cx + W * Math.sin(f), yc - (c > 0 ? aTop : aBot) * c];
  });
  const outsideEgg = ([x, y]) => Math.abs(x - cx) > R(y);
  // a point of the outline at height y on one side, pushed out by `out`
  const rim = (side, y, out = 0) => {
    const dx = (R(y + 0.5) - R(y - 0.5)) * side;
    const len = Math.hypot(dx, 1);
    return [cx + side * R(y) + (side * out) / len, y - (dx * side * out) / len];
  };

  const mids = [290, 226, 162, 98]; // height of each pass where it crosses the middle
  const halves = [13.6, 15.4, 16.4, 16]; // half the thickness of the body on each pass
  const rise = 16;
  const sag = 7;
  const squeeze = 0.8;
  const bulge = 8.4;
  const past = 12;
  const step = 8.6;
  const hiddenRim = [];
  const serpent = [];
  const scaleLines = [];

  mids.forEach((yMid, k) => {
    const isTail = k === 0;
    const isHead = k === 3;
    const a0 = isTail ? -52 : -108;
    const a1 = isHead ? 16 : 108;
    const raw = [];
    for (let a = a0; a <= a1 + 0.001; a += 1) {
      const y = yMid - (rise * a) / 90 + sag * (Math.cos(Math.max(-90, Math.min(90, a)) * deg) - 1);
      raw.push([cx + (R(y) * Math.sin(a * squeeze * deg)) / Math.sin(90 * squeeze * deg), y]);
    }
    const n = 160;
    const mid = resample(raw, n + 1);
    const lens = lengths(mid);
    const total = lens[n];
    // half-width along the pass: drawn in a little where it meets the outline, the tail running
    // out to a point, the neck narrowing before the head
    const half = (t) => {
      const x = mid[Math.round(t * n)][0];
      const edge = 1 - 0.14 * Math.min(1, Math.abs(x - cx) / R(mid[Math.round(t * n)][1])) ** 4;
      if (isTail) return halves[k] * edge * Math.min(1, (t / 0.7) ** 0.75);
      if (isHead) return halves[k] * edge - 2.4 * Math.max(0, (t - 0.6) / 0.4) ** 1.4;
      return halves[k] * edge;
    };
    // band coordinates: u along the body (in units of length), v from -1 (lower edge) to 1 (upper)
    const B = (u, v) => {
      const q = along(mid, u / total, lens);
      const w = half(u / total) * v;
      return [q.x + Math.sin(q.ang) * w, q.y - Math.cos(q.ang) * w];
    };
    const edgeLine = (v) => Array.from({ length: n + 1 }, (_, i) => B((i / n) * total, v));
    const inner = (line) => visibleRuns(line, outsideEgg, 1)[0];
    const upper = inner(edgeLine(1));
    const lower = inner(edgeLine(-1));
    const thin = (pts, every = 6) => pts.filter((_, i) => i % every === 0 || i === pts.length - 1);
    // the hook where the body turns behind the egg: from the point where an edge leaves the
    // outline, out by `bulge` and back onto the outline beyond the other edge
    const hook = (side, from, other) => {
      const dir = side > 0 ? -1 : 1; // the body goes on upward at the right, downward at the left
      const D = Math.abs(from[1] - other[1]) + past;
      hiddenRim.push({ side, y0: Math.min(from[1], from[1] + dir * D), y1: Math.max(from[1], from[1] + dir * D) });
      return [
        [0.3, 0.86],
        [0.58, 1],
        [0.84, 0.52],
        [1, 0],
      ].map(([f, o]) => rim(side, from[1] + dir * f * D, bulge * o));
    };
    let upperPts = thin(upper);
    let lowerPts = thin(lower);
    if (!isHead) lowerPts = [...lowerPts, ...hook(1, lower.at(-1), upper.at(-1))];
    if (!isTail) upperPts = [...hook(-1, upper[0], lower[0]).reverse(), ...upperPts];

    let face = '';
    if (isTail) {
      // one line round the tip of the tail
      serpent.push(path(spline([...upperPts.reverse(), ...lowerPts.slice(1)])));
    } else if (isHead) {
      // the head from above: long and flat, a little broader than the neck, blunt at the snout
      const end = along(mid, 1, lens);
      const c = Math.cos(end.ang);
      const sn = Math.sin(end.ang);
      const loc = (u, v) => [end.x + u * c - v * sn, end.y + u * sn + v * c];
      const hn = half(1);
      const side = [
        [9, hn + 0.6],
        [20, 15.6],
        [32, 15.4],
        [43, 10.6],
        [50.6, 4.6],
      ];
      const head = [...side.map(([u, v]) => loc(u, -v)), loc(52.6, 0), ...side.reverse().map(([u, v]) => loc(u, v))];
      serpent.push(path(spline([...upperPts, ...head, ...lowerPts.reverse()])));
      const e1 = loc(29, -9.4);
      const e2 = loc(29, 9.4);
      const t0 = loc(52.6, 0);
      const t1 = loc(61, 0.2);
      face =
        path(`M${P(...t0)}L${P(...t1)}M${P(...loc(67.6, -4.6))}Q${P(...loc(63.6, -1.4))} ${P(...t1)}Q${P(...loc(63.8, 1.8))} ${P(...loc(68, 4.6))}`) +
        circle(e1[0], e1[1], 2.2) +
        circle(e2[0], e2[1], 2.2);
    } else {
      serpent.push(path(spline(upperPts)), path(spline(lowerPts)));
    }

    // scales: at each station two arches across the body, every other station half a step out of
    // line, each arch opening towards the head. They are strung on one line (it runs back along
    // the lower edge between stations), so they draw along the serpent in turn.
    const okAt = (u) => {
      if (u < 0 || u > total) return false;
      const far = [B(u, 1), B(u, -1), B(Math.max(0, u - step), 1), B(Math.max(0, u - step), -1)];
      return far.every(([x, y]) => Math.abs(x - cx) < R(y) - 3.2);
    };
    const arch = (u, va, vb) => {
      // from (u, va) to (u, vb), its crown one step back towards the tail
      const A = B(u, va);
      const Bq = B(u, vb);
      const back = along(mid, u / total, lens).ang + Math.PI;
      const kx = Math.cos(back) * step * 1.3;
      const ky = Math.sin(back) * step * 1.3;
      return `C${P(A[0] + kx, A[1] + ky)} ${P(Bq[0] + kx, Bq[1] + ky)} ${P(...Bq)}`;
    };
    const quarter = (u, va, vEdge, reverse) => {
      // half an arch: from (u, va) back to the edge one step towards the tail
      const A = B(u, va);
      const E = B(u - step, vEdge);
      const C = B(u - step, va);
      return reverse ? `Q${P(...C)} ${P(...A)}` : `Q${P(...C)} ${P(...E)}`;
    };
    let u = isTail ? total * 0.34 : step * 1.5;
    while (!okAt(u) && u < total) u += 1;
    const uMax = isHead ? total - 3 : total;
    let d = '';
    for (let j = 0; u <= uMax && okAt(u); j++, u += step) {
      const narrow = half(u / total) < 9.6; // near the tip of the tail: one arch across
      if (j % 2 === 0) {
        d += `${d ? 'L' : 'M'}${P(...B(u, -1))}`;
        d += narrow ? arch(u, -1, 1) : arch(u, -1, 0) + arch(u, 0, 1);
      } else if (narrow) {
        d += `M${P(...B(u, -1))}` + arch(u, -1, 1);
      } else {
        // down from the upper edge, across the middle, back to the lower edge
        d += quarter(u, 0.5, 1, true) + arch(u, 0.5, -0.5) + quarter(u, -0.5, -1, false);
        // along the lower edge to the next station
        for (let w = u - step + 2; w < u + step - 0.5; w += 2) d += `L${P(...B(w, -1))}`;
      }
    }
    scaleLines.push(path(d) + face);
  });

  const egg = visibleRuns(
    eggDense,
    ([x, y]) => hiddenRim.some((h) => (x - cx) * h.side > 0 && y > h.y0 && y < h.y1),
    6,
  ).map((run) => path(spline(run)));

  return svg(280, 340, SW, egg.join('') + serpent.join('') + scaleLines.join(''));
}

/* ------------------------------------------------------------------ write */
const drawings = { cicada, tripod, 'orphic-egg': orphicEgg };
mkdirSync(outDir, { recursive: true });
for (const [name, draw] of Object.entries(drawings)) {
  if (only && !only.split(',').includes(name)) continue;
  writeFileSync(resolve(outDir, `${name}.svg`), draw());
  console.log(`${name}.svg`);
}
