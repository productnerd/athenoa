// owl.svg: Athena's little owl, frontal, on an olive sprig (after the Athenian tetradrachm).
// node scripts/illustrations/spots1-owl.mjs
import {
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
  add,
  sub,
  mul,
  lerp,
  norm,
  perp,
  xy,
  fmt,
} from './spots1-lib.mjs';

const W = 240;
const H = 280;
const CX = 120;
const deg = (a) => (a * Math.PI) / 180;
const R = (dx, y) => [CX + dx, y];

// ---------- body: a round head on a stocky body ----------
const bodyHalf = shape(
  R(0, 16),
  [R(40, 16), R(72, 40), R(72, 72)],
  [R(72, 92), R(64, 106), R(56, 114)],
  [R(68, 132), R(72, 164), R(62, 190)],
  [R(53, 212), R(30, 224), R(0, 224)],
);
const body = symmetric(bodyHalf, CX);
const bodyPts = shapePts(body, 40);
const bodyPoly = polygon(bodyPts);
const rightSide = shapePts(bodyHalf, 60); // for looking up the outline's x at a given y
const outlineX = (y) => {
  let best = 0;
  let bestD = Infinity;
  for (const p of rightSide) {
    if (p[1] < 114) continue;
    const d = Math.abs(p[1] - y);
    if (d < bestD) {
      bestD = d;
      best = p[0];
    }
  }
  return best;
};

// ---------- face ----------
const EYE = R(28, 70);
const eyeR = 23;
const irisR = 10.5;
const browR = 29;
const circle = (c, r) => `<circle cx="${fmt(c[0])}" cy="${fmt(c[1])}" r="${fmt(r)}"/>`;
const arcPts = (c, r, a0, a1, n = 40) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = deg(a0 + ((a1 - a0) * i) / n);
    pts.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]);
  }
  return pts;
};
// the brow sweeps from the middle, over the eye and down its outer side
const browStart = 180 + (Math.acos(28 / browR) * 180) / Math.PI;
const browPts = arcPts(EYE, browR, browStart, 392);
const beak = shape(R(-7, 90), [R(-3, 85.5), R(3, 85.5), R(7, 90)], [R(6, 98), R(3, 103), R(0, 106.5)], [R(-3, 103), R(-6, 98), R(-7, 90)]);

// ---------- wings: folded, with long feathers ----------
const wingEdge = shapePts(shape(R(56, 114), [R(40, 133), R(33, 178), R(43, 213)]), 80);
const wingX = (y) => {
  let best = wingEdge[0][0];
  let bestD = Infinity;
  for (const p of wingEdge) {
    const d = Math.abs(p[1] - y);
    if (d < bestD) {
      bestD = d;
      best = p[0];
    }
  }
  return best;
};
const feathers = [1, 2].map((k) => {
  const pts = [];
  for (let y = 130 + k * 3; y <= 199 - k * 2; y += 1.5) {
    const x0 = wingX(y);
    pts.push([x0 + ((outlineX(y) - x0) * k) / 3, y]);
  }
  return pts;
});

// ---------- breast: rows of small feather scales between the wings ----------
const SCALE_W = 15;
const SCALE_H = 8.6;
const scales = [];
[4, 3, 4, 3, 4, 3, 2, 1].forEach((count, k) => {
  const y = 128 + k * SCALE_H;
  const half = SCALE_W / 2;
  for (let j = 0; j < count; j++) {
    const cx = (j - (count - 1) / 2) * SCALE_W;
    scales.push(`M${xy(R(cx - half, y))}A${fmt(half)} ${fmt(SCALE_H)} 0 0 0 ${xy(R(cx + half, y))}`);
  }
});

// ---------- feet and the olive sprig they hold ----------
const TOE = 6.6;
const toeLines = [];
const toeArcs = [];
const toePolys = [];
for (const side of [-1, 1]) {
  const x0 = side * 21 - 1.5 * TOE;
  for (let i = 0; i <= 3; i++) {
    const x = x0 + i * TOE;
    const line = [];
    for (let y = 214; y <= 238; y += 1) line.push(R(x, y));
    toeLines.push(line);
  }
  for (let i = 0; i < 3; i++) {
    const x = x0 + i * TOE;
    toeArcs.push(`M${xy(R(x, 238))}A${TOE / 2} ${TOE / 2} 0 0 0 ${xy(R(x + TOE, 238))}`);
  }
  toePolys.push(polygon([R(x0, 214), R(x0 + 3 * TOE, 214), R(x0 + 3 * TOE, 239.5), R(x0, 239.5)]));
}
const branchPts = spline(
  [
    [38, 242],
    [70, 236.5],
    [120, 234],
    [170, 234],
    [206, 229],
  ],
  30,
);
const leaf = (base, angle, len, width = 7.6) => {
  const d = [Math.cos(deg(angle)), Math.sin(deg(angle))];
  const tip = add(base, mul(d, len));
  const mid = lerp(base, tip, 0.48);
  const n = perp(d);
  return `M${xy(base)}Q${xy(add(mid, mul(n, width)))} ${xy(tip)}Q${xy(add(mid, mul(n, -width)))} ${xy(base)}Z`;
};
const leaves = [
  leaf([38, 242], 168, 27),
  leaf([50, 239.5], 222, 28),
  leaf([56, 239], 118, 26),
  leaf([76, 235.8], 236, 24),
  leaf([206, 229], -22, 27),
  leaf([194, 231], -58, 28),
  leaf([186, 232.6], 42, 26),
  leaf([166, 234], -62, 23),
];
const olives = [
  `M${xy([176, 234])}L${xy([175, 240])}`,
  `<ellipse cx="174.4" cy="246.6" rx="4.6" ry="6.2" transform="rotate(8 174.4 246.6)"/>`,
  `M${xy([70, 236.5])}L${xy([71.5, 242.5])}`,
  `<ellipse cx="72.4" cy="249" rx="4.6" ry="6.2" transform="rotate(-8 72.4 249)"/>`,
];

// ---------- assemble ----------
const hiddenByBody = blocker([bodyPoly]);
const hiddenByToes = blocker(toePolys);
const cut = (pts, hidden, step) => visible(pts, hidden).map((run) => smooth(resample(run, step)));
const el = (d) => (d.startsWith('<') ? d : path(d));

const parts = [
  shapeD(body, true),
  circle(EYE, eyeR),
  circle([2 * CX - EYE[0], EYE[1]], eyeR),
  circle(EYE, irisR),
  circle([2 * CX - EYE[0], EYE[1]], irisR),
  circle(EYE, 1),
  circle([2 * CX - EYE[0], EYE[1]], 1),
  smooth(resample(browPts, 9)),
  smooth(resample(mirrorPts(browPts, CX), 9)),
  shapeD(beak, true),
  smooth(resample(wingEdge, 12)),
  smooth(resample(mirrorPts(wingEdge, CX), 12)),
  ...feathers.flatMap((f) => [smooth(resample(f, 12)), smooth(resample(mirrorPts(f, CX), 12))]),
  scales.join(''),
  ...toeLines.flatMap((l) => cut(l, hiddenByBody, 30)),
  toeArcs.join(''),
  ...cut(branchPts, hiddenByToes, 16),
  ...leaves,
  ...olives,
];
writeSvg('owl', W, H, 2.5, parts.map(el).join(''));
