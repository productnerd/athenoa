// athena.svg: bust of Athena under an arch of radiating wavy light.
// node scripts/illustrations/spots1-athena.mjs
//
// No fills anywhere: whatever sits behind something else (hair behind the face, scales behind
// the hair, light behind the figure) is cut away geometrically, so the drawing works on any ground.
import {
  TAU,
  shape,
  shapeD,
  shapePts,
  mirrorShape,
  symmetric,
  mirrorPts,
  resample,
  smooth,
  spline,
  polygon,
  blocker,
  visible,
  path,
  writeSvg,
  prng,
  add,
  sub,
  mul,
  lerp,
  norm,
  perp,
  dist,
  xy,
  fmt,
} from './spots1-lib.mjs';

const W = 600;
const H = 760;
const CX = 300;
const DY = 52; // the whole figure sits this far down the sheet, leaving room for the light above
const R = (dx, y) => [CX + dx, y + DY];
const rand = prng(7);
const deg = (a) => (a * Math.PI) / 180;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// =====================================================================================
// Helmet (Corinthian, pushed back on the head, so its face opening sits above the brow)
// =====================================================================================
const dome = [R(54, 136), R(94, 178), R(94, 228)];
const cheek = [R(94, 244), R(90, 257), R(83, 266)];
// silhouette only, used to hide what is behind the helmet
const helmetHalf = shape(R(0, 136), dome, cheek, [R(60, 273), R(30, 271.5), R(0, 267)]);
const helmetPoly = polygon(shapePts(symmetric(helmetHalf, CX)));
// the drawn outline: the two cheek pieces part in an arch over the brow, the nose guard hangs between them
const helmetDrawn = symmetric(
  shape(
    R(0, 136),
    dome,
    cheek,
    [R(64, 273), R(42, 273.5), R(28, 264)],
    [R(20, 258.5), R(13, 251), R(6.5, 247)],
    [R(6.5, 252), R(4.5, 259), R(0, 259)],
  ),
  CX,
);
const eyeHole = shape(R(17, 229), [R(26, 215), R(47, 212), R(58, 223)], [R(50, 235), R(29, 238), R(17, 229)]);

// ---------- crest: a crescent of bristles standing on the dome ----------
const DOME = R(0, 230);
const domePts = shapePts(shape(R(0, 136), dome), 60);
const domeR = (a) => {
  // radius of the dome at an angle measured from straight up
  const abs = Math.abs(a);
  let best = domePts[0];
  let bestD = Infinity;
  for (const p of domePts) {
    const d = Math.abs(Math.atan2(p[0] - DOME[0], DOME[1] - p[1]) - abs);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return dist(best, DOME);
};
const polar = (a, r) => [DOME[0] + Math.sin(a) * r, DOME[1] - Math.cos(a) * r];
const CREST_A = deg(61);
const HOLD = 7;
const PLUME = 56;
const crestIn = (a) => domeR(a) + HOLD;
const crestOut = (a) => crestIn(a) + PLUME * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(a) / CREST_A, 2.3)), 0.72);
const crestOuterPts = [];
const crestInnerPts = [];
for (let i = 0; i <= 120; i++) {
  const a = -CREST_A + (2 * CREST_A * i) / 120;
  crestOuterPts.push(polar(a, crestOut(a)));
  crestInnerPts.push(polar(a, crestIn(a)));
}
const crestPoly = polygon([...crestOuterPts, polar(CREST_A, domeR(CREST_A)), polar(-CREST_A, domeR(CREST_A))]);
const crestLines = [];
{
  const n = 31;
  for (let i = 0; i < n; i++) {
    const a = -CREST_A + (2 * CREST_A * (i + 0.5)) / n;
    const r0 = crestIn(a);
    const r1 = crestOut(a);
    if (r1 - r0 < 13) continue;
    crestLines.push(`M${xy(polar(a, r0))}L${xy(polar(a, r1))}`);
  }
}

// =====================================================================================
// Face
// =====================================================================================
const faceHalf = shape(
  R(0, 236),
  [R(40, 236), R(68, 262), R(68, 302)],
  [R(68, 348), R(55, 382), R(32, 399)],
  [R(22, 406.5), R(11, 410), R(0, 410)],
);
const face = symmetric(faceHalf, CX);
const facePoly = polygon(shapePts(face));

const brow = shape(R(53, 292), [R(45, 281), R(25, 278), R(13, 287)], [R(9, 290.5), R(8, 300), R(8, 322)]);
const lidUp = shape(R(15, 309), [R(23, 295.5), R(46, 293.5), R(61, 305)]);
const lidLo = shape(R(15, 309), [R(26, 317.5), R(46, 316.5), R(57, 304)]);
const noseBase = shape(R(-12, 344), [R(-12, 351), R(-6, 355.5), R(0, 355.5)], [R(6, 355.5), R(12, 351), R(12, 344)]);
const mouth = shape(R(-17, 373.5), [R(-9, 377), R(-4, 373.5), R(0, 375.5)], [R(4, 373.5), R(9, 377), R(17, 373.5)]);
const lip = shape(R(-8, 384), [R(-3, 387), R(3, 387), R(8, 384)]);
const iris = (side) => {
  const c = R(side * 37, 302.4);
  const r = 7.6;
  const p = (a) => [c[0] + Math.cos(deg(a)) * r, c[1] + Math.sin(deg(a)) * r];
  return `M${xy(p(-38))}A${r} ${r} 0 1 1 ${xy(p(218))}`;
};

// =====================================================================================
// Hair: one long wavy tress a side, falling from the helmet over the shoulder to a point
// =====================================================================================
const STRANDS = 6;
const STRAND_GAP = 10.4;
const spineKeys = [
  [57.5, 236],
  [57.5, 290],
  [59, 350],
  [62, 400],
  [66, 445],
  [76, 490],
  [88, 535],
  [95, 580],
  [99, 625],
].map(([dx, y]) => R(dx, y));
const spinePts = resample(spline(spineKeys, 30), 1.5);
const TRESS_END = 376; // length of the tress down its spine
const TAPER_FROM = 236;
const hairPoint = (i, s) => {
  // i: strand 0 (next to the neck) .. STRANDS - 1 (outside); s: distance down the spine
  const k = Math.max(0, Math.min(spinePts.length - 2, Math.floor(s / 1.5)));
  const a = spinePts[k];
  const b = spinePts[k + 1];
  const t = norm(sub(b, a));
  const inward = perp(t); // travelling down the right side, the normal points towards the neck
  const base = lerp(a, b, s / 1.5 - k);
  const wave = 3.5 * clamp01((s - 30) / 110) * Math.sin((TAU * s) / 58 + 0.6);
  const taper = 1 - Math.pow(clamp01((s - TAPER_FROM) / (TRESS_END - TAPER_FROM)), 1.7);
  const off = (i - (STRANDS - 1) / 2) * STRAND_GAP * taper + wave;
  return add(base, mul(inward, -off));
};
const STRAND_END = [TRESS_END, 300, 318, 310, 292, TRESS_END];
const strand = (i) => {
  const pts = [];
  for (let s = 0; s < STRAND_END[i]; s += 1.5) pts.push(hairPoint(i, s));
  pts.push(hairPoint(i, STRAND_END[i]));
  return pts;
};
const hairRight = Array.from({ length: STRANDS }, (_, i) => strand(i));
const hairLeft = hairRight.map((l) => mirrorPts(l, CX));
const tressPoly = (lines) => polygon([...lines[0], ...[...lines[STRANDS - 1]].reverse()]);
const hairPolys = [tressPoly(hairRight), tressPoly(hairLeft)];

// =====================================================================================
// Aegis: a collar of scales that grow towards a scalloped hem
// =====================================================================================
const NECK = R(0, 418);
const A_MAX = deg(64);
const N_SCALE = 12;
const D_A = (2 * A_MAX) / N_SCALE;
const R_NECK = 62;
const R_BAND = 72;
const rows = [104];
const ROWS = 9;
for (let k = 0; k < ROWS; k++) rows.push(rows[k] * 1.105);
const fan = (a, r) => [NECK[0] + Math.sin(a) * r, NECK[1] + Math.cos(a) * r];
const fanArc = (r, a0 = -A_MAX, a1 = A_MAX, n = 80) => {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push(fan(a0 + ((a1 - a0) * i) / n, r));
  return pts;
};
// one scale: half an ellipse from (r0, a0) to (r0, a1), bulging out to r1
const scale = (r0, r1, a0, a1, t0 = 0, t1 = Math.PI) => {
  const s = fan(a0, r0);
  const e = fan(a1, r0);
  const m = lerp(s, e, 0.5);
  const u = mul(sub(e, s), 0.5);
  const v = sub(fan((a0 + a1) / 2, r1), m);
  const pts = [];
  for (let i = 0; i <= 20; i++) {
    const t = t0 + ((t1 - t0) * i) / 20;
    pts.push(add(m, add(mul(u, -Math.cos(t)), mul(v, Math.sin(t)))));
  }
  // the same curve as an SVG arc, used when nothing overlaps it
  const whole = t0 === 0 && t1 === Math.PI;
  const rot = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
  const sweep = u[0] * v[1] - u[1] * v[0] > 0 ? 0 : 1;
  const arc = whole ? `M${xy(s)}A${fmt(Math.hypot(...u))} ${fmt(Math.hypot(...v))} ${fmt(rot)} 0 ${sweep} ${xy(e)}` : null;
  return { pts, arc };
};
const scales = [];
const hemPts = [];
for (let k = 0; k < ROWS; k++) {
  const r0 = rows[k];
  const r1 = rows[k + 1];
  if (k % 2 === 0) {
    for (let j = 0; j < N_SCALE; j++) {
      const sc = scale(r0, r1, -A_MAX + j * D_A, -A_MAX + (j + 1) * D_A);
      scales.push(sc);
      if (k === ROWS - 1) hemPts.push(...sc.pts);
    }
  } else {
    for (let j = 0; j <= N_SCALE; j++) {
      const a0 = -A_MAX + (j - 0.5) * D_A;
      scales.push(scale(r0, r1, a0, a0 + D_A, j === 0 ? Math.PI / 2 : 0, j === N_SCALE ? Math.PI / 2 : Math.PI));
    }
  }
}
const R_TIP = rows[ROWS - 1];
const collarPoly = polygon([...hemPts, fan(A_MAX, R_NECK), ...fanArc(R_NECK).reverse()]);
const neckPoly = polygon([R(-62, 380), R(62, 380), R(62, 470), R(-62, 470)]);

// =====================================================================================
// Light: wavy rays in an arch behind the head, kept clear of the figure
// =====================================================================================
const ORIGIN = R(0, 318);
const OVAL = { c: R(0, 328), rx: 286, ry: 348 };
const ovalReach = (d) => {
  const ox = (ORIGIN[0] - OVAL.c[0]) / OVAL.rx;
  const oy = (ORIGIN[1] - OVAL.c[1]) / OVAL.ry;
  const dx = d[0] / OVAL.rx;
  const dy = d[1] / OVAL.ry;
  const a = dx * dx + dy * dy;
  const b = 2 * (ox * dx + oy * dy);
  const c = ox * ox + oy * oy - 1;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
};
const figure = blocker([crestPoly, helmetPoly, facePoly, collarPoly, neckPoly, ...hairPolys], 13);
const rays = [];
{
  const half = 44;
  const ends = [0.03, 0.36, 0.13, 0.46]; // how much of each ray is left undrawn at its far end
  for (let i = 0; i < half; i++) {
    const a = ((i + (i ? (rand() - 0.5) * 0.3 : 0)) * Math.PI) / half;
    const d = [Math.sin(a), -Math.cos(a)];
    const nrm = perp(d);
    const foot = 1 - 0.3 * clamp01((a - deg(96)) / deg(34)); // the arch draws in where it meets the shoulders
    const reach = ovalReach(d) * foot;
    const phase = 1.1 + (rand() - 0.5) * 0.5;
    const gain = 0.9 + rand() * 0.25;
    const pts = [];
    for (let r = 60; r <= reach; r += 1.5) {
      const amp = gain * (2.4 + 4.2 * clamp01((r - 90) / 210));
      const off = amp * Math.sin((TAU * r) / 62 + phase);
      pts.push([ORIGIN[0] + d[0] * r + nrm[0] * off, ORIGIN[1] + d[1] * r + nrm[1] * off]);
    }
    const runs = visible(pts, figure);
    const run = runs[runs.length - 1];
    if (!run || run[run.length - 1] !== pts[pts.length - 1]) continue;
    const keep = 1 - ends[i % ends.length] - (rand() - 0.5) * 0.08;
    const cutAt = Math.max(2, Math.round(run.length * keep));
    const shown = run.slice(0, cutAt);
    if (dist(shown[0], shown[shown.length - 1]) < 26) continue;
    const kept = resample(shown, 12.5);
    rays.push(smooth(kept));
    if (i) rays.push(smooth(mirrorPts(kept, CX)));
  }
}

// =====================================================================================
// Assemble
// =====================================================================================
const both = (s) => [shapeD(s), shapeD(mirrorShape(s, CX))];
// hair is tucked behind the helmet and the face; a strand that would graze the cheek is held back a little
const underHelmet = blocker([helmetPoly]);
const behindFace = blocker([facePoly], 4.5);
const hiddenByHead = (p) => underHelmet(p) || behindFace(p);
const hiddenByHair = blocker(hairPolys);
const cut = (pts, hidden, step) => visible(pts, hidden).map((run) => smooth(resample(run, step)));

const head = [
  shapeD(helmetDrawn, true),
  ...both(eyeHole).map((d) => d + 'Z'),
  ...cut(shapePts(face), blocker([helmetPoly]), 9),
  ...both(brow),
  ...both(lidUp),
  ...both(lidLo),
  iris(1),
  iris(-1),
  shapeD(noseBase),
  shapeD(mouth),
  shapeD(lip),
];
const pupils = [1, -1].map((s) => `<circle cx="${fmt(CX + s * 37)}" cy="${fmt(302.6 + DY)}" r="1.1"/>`);

const crest = [smooth(resample(crestOuterPts, 14)), smooth(resample(crestInnerPts, 14)), crestLines.join('')];

const hair = [];
for (const side of [hairRight, hairLeft]) for (const l of side) hair.push(...cut(l, hiddenByHead, 11));

const collar = [];
collar.push(...cut(fanArc(R_NECK), hiddenByHair, 12));
collar.push(...cut(fanArc(R_BAND), hiddenByHair, 12));
collar.push(...cut(fanArc(rows[0]), hiddenByHair, 14));
for (const side of [-1, 1]) {
  const edge = [];
  for (let r = R_NECK; r < R_TIP; r += 1.5) edge.push(fan(side * A_MAX, r));
  edge.push(fan(side * A_MAX, R_TIP));
  collar.push(...cut(edge, hiddenByHair, 60));
}
for (const sc of scales) {
  const runs = visible(sc.pts, hiddenByHair);
  if (sc.arc && runs.length === 1 && runs[0].length === sc.pts.length) collar.push(sc.arc);
  else
    for (const run of runs) {
      if (dist(run[0], run[run.length - 1]) < 6) continue; // no stubs peeping out from under the hair
      collar.push(smooth(resample(run, Math.max(4, dist(sc.pts[0], sc.pts[20]) / 4))));
    }
}

const group = (items) => `<g>${items.map((d) => (d.startsWith('<') ? d : path(d))).join('')}</g>`;
writeSvg('athena', W, H, 2.6, group([...head, ...pupils]) + group(crest) + group(hair) + group(collar) + group(rays));
