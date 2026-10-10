// Far layer of the Olympus footer: the summit crown, its scree skirt and its cloud bands.
// node scripts/illustrations/olympus-far.mjs   -> src/assets/illustrations/footer-olympus-far.svg
//
// Left to right the skyline names real ground: Skolio (broad), Skala, the teeth of Kakoskala,
// Mytikas (the highest, a spire), the deep notch of the Louki couloir, Stefani (the curved wall
// called the Throne of Zeus), the Plateau of the Muses, Profitis Ilias and Toumba.
// Light comes from the left: every summit throws a shadow face to its right (light-blue wash,
// striated from the summit down), and snow lies in the gullies as bare paper.
import { rng, n, P, mix, smooth, rock, zig, along, sheet } from './olympus-lib.mjs';

const r = rng(2918);
const S = sheet('0 0 1600 420', 2);

/* ---------- clouds: long banks with a flat foot, a softly swelling back and thin tails ---------- */
// [x0, x1, y of the foot, height]
function band([x0, x1, y, t], inner = 1) {
  const len = x1 - x0;
  const steps = Math.max(6, Math.round(len / 24));
  const swells = len / (120 + r() * 70);
  const phase = r() * 6.28;
  const back = (u) => {
    const env = Math.min(1, Math.sin(Math.PI * u) * 2.2) ** 0.8;
    return t * env * (0.6 + 0.4 * Math.sin(u * swells * 6.28 + phase));
  };
  const foot = (u) => t * 0.14 * Math.min(1, Math.sin(Math.PI * u) * 2.2) * (1 + 0.6 * Math.sin(u * swells * 3.3 + phase));
  const top = [];
  const bot = [];
  for (let i = 1; i < steps; i++) {
    const u = i / steps;
    top.push([x0 + len * u, y - back(u)]);
    bot.push([x0 + len * u, y + foot(u)]);
  }
  S.paper(smooth([[x0, y], ...top, [x1, y], ...bot.reverse()], true));
  for (let i = 0; i < inner; i++) {
    const a = 0.08 + r() * 0.3;
    const b = Math.min(0.94, a + 0.3 + r() * 0.3);
    const h = 0.34 + (i % 2) * 0.3;
    const pts = [];
    for (let j = 0; j <= 6; j++) {
      const u = a + ((b - a) * j) / 6;
      pts.push([x0 + len * u, y - back(u) * h]);
    }
    S.line(smooth(pts));
  }
}

/* ---------- banner cloud streaming from the summits, behind the rock ---------- */
band([668, 1030, 54, 22], 1);
band([860, 1216, 70, 15], 1);
band([1030, 1290, 82, 10], 0);
band([232, 440, 88, 13], 0);
band([136, 326, 101, 10], 0);

/* ---------- the skyline ---------- */
// P: summit with a spur. N: notch where a gully starts. T: the high end of Stefani.
const SKY = [
  [-40, 240], [40, 232], [110, 214], [165, 206],
  [208, 184, 'P'], [238, 196, 'N'], [272, 172], [302, 158],
  [334, 138, 'P'], [362, 154, 'N'], [394, 136], [424, 122],
  [448, 106, 'P'], [474, 122, 'N'], [496, 100], [516, 80], [532, 66],
  [552, 50, 'P'], [578, 48], [600, 58], [622, 82, 'N'], [640, 62],
  [652, 46, 'P'], [664, 52], [676, 68, 'N'], [688, 48],
  [696, 34, 'P'], [704, 40], [711, 36], [720, 52, 'N'], [728, 32], [736, 18], [743, 20],
  [752, 4, 'P'], [759, 10], [765, 8], [772, 26], [780, 32], [788, 56], [798, 82, 'N'],
  [808, 72], [816, 54], [824, 48], [832, 30],
  [842, 18, 'T'], [858, 15], [876, 18], [894, 26], [910, 38], [924, 54], [934, 72], [941, 92], [946, 114, 'N'],
  [972, 120], [1002, 116], [1032, 122], [1054, 110], [1074, 98],
  [1094, 91, 'P'], [1114, 93], [1134, 101], [1158, 119, 'N'], [1178, 108],
  [1198, 101, 'P'], [1220, 109], [1242, 127, 'N'], [1272, 133], [1302, 147],
  [1328, 143, 'P'], [1358, 165, 'N'], [1392, 171],
  [1418, 167, 'P'], [1448, 191, 'N'], [1492, 201], [1542, 217], [1592, 227], [1640, 237],
];
const skyline = rock(SKY, r, 1.1);
S.mask(`${skyline}L1640 422L-40 422Z`);

/* ---------- shadow faces ---------- */
// Each summit stands in front of the one to its left. Its spur falls straight to a foot; the
// flank of the next summit runs on down from the notch to the same foot, and the face between
// them is in shadow.
const FOOT = {
  208: [215, 222], 334: [341, 188], 448: [455, 160],
  552: [563, 162], 652: [658, 130], 696: [701, 86], 752: [763, 204],
  1094: [1103, 168], 1198: [1205, 160], 1328: [1334, 192], 1418: [1424, 214],
};
const lines = [];
const snow = [];
for (let i = 0; i < SKY.length; i++) {
  if (SKY[i][2] !== 'P') continue;
  let j = i + 1;
  while (SKY[j][2] !== 'N') j++;
  const peak = SKY[i];
  const notch = SKY[j];
  const foot = FOOT[peak[0]];
  const tall = foot[1] - peak[1];
  const spur = zig(peak, foot, r, tall > 80 ? 4.5 : 2.5, 30);
  const gully = zig(notch, foot, r, tall > 80 ? 3 : 1.5, 34);
  const right = [...SKY.slice(i, j + 1).map(([x, y]) => [x, y]), ...gully.slice(1)];
  S.wash(`M${[...right, ...spur.slice(1, -1).reverse()].map(P).join('L')}Z`);
  lines.push(rock(spur, r, 0.8));
  lines.push(rock(gully, r, 0.8));
  // striations: a fan from the summit, between spur and gully
  const width = notch[0] - peak[0];
  const count = Math.max(1, Math.round(width / 15));
  for (let k = 1; k <= count; k++) {
    const u = k / (count + 1);
    const a = 0.2 + r() * 0.1;
    const b = 0.58 + r() * 0.22;
    const pts = [];
    for (let s = a; s <= b + 0.001; s += (b - a) / 3) pts.push(mix(along(spur, s), along(right, s), u));
    lines.push(smooth(pts));
  }
  // snow lying against the gully: a paper tongue on the wash
  if (tall > 70) {
    const a = 0.08;
    const b = 0.66 + r() * 0.2;
    const wide = Math.min(7.5, width * 0.15);
    const dx = foot[0] - notch[0];
    const dy = foot[1] - notch[1];
    const len = Math.hypot(dx, dy);
    const up = [dy / len, -dx / len]; // towards the shadow face
    const edge = [];
    const back = [];
    for (let s = 0; s <= 1.001; s += 0.2) {
      const p = along(gully, a + (b - a) * s);
      const w = wide * Math.sin(Math.PI * (s * 0.85 + 0.1)) * (0.8 + r() * 0.4);
      edge.push([p[0] - Math.abs(up[0]) * w - 1, p[1] - Math.abs(up[1]) * w * 0.4]);
      back.push([p[0] + 0.6, p[1] + 0.4]);
    }
    snow.push(smooth([...edge, ...back.reverse()], true));
  }
}

/* ---------- Stefani, the Throne of Zeus: a quarter-dome of rock, its strata nested like a shell ---------- */
{
  const t = SKY.findIndex((p) => p[2] === 'T');
  let e = t;
  while (SKY[e][2] !== 'N') e++;
  const crest = SKY.slice(t, e + 1).map(([x, y]) => [x, y]);
  const O = [850, 170];
  const ring = (s, a = 0, b = 1, steps = 6) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const u = a + ((b - a) * i) / steps;
      // the band under the crest is widest in the middle
      const lift = s > 0.8 ? s + (1 - s) * (1 - Math.sin(Math.PI * u) ** 0.6) * 0.9 : s + (r() - 0.5) * 0.03;
      pts.push(mix(O, along(crest, u), lift));
    }
    return pts;
  };
  const under = ring(0.8, 0, 1, 8);
  S.wash(`M${[...crest, ...under.slice(1, -1).reverse()].map(P).join('L')}Z`);
  lines.push(rock(under, r, 0.7));
  lines.push(rock(ring(0.63, 0.05, 0.96), r, 0.9));
  lines.push(rock(ring(0.46, 0.12, 0.9, 5), r, 0.9));
  lines.push(rock(ring(0.3, 0.24, 0.84, 4), r, 0.9));
  // its left arête and right edge
  lines.push(rock([[842, 18], [838, 50], [845, 84], [839, 118], [846, 150], [842, 178]], r, 0.8));
  lines.push(rock([[946, 114], [942, 140], [948, 172]], r, 0.8));
}

// lit faces: strata lines under each left-hand flank, parallel to the skyline
const FLANKS = [
  [474, 552, 3], [622, 652, 1], [720, 752, 2], [1032, 1094, 2], [1158, 1198, 1], [110, 208, 2], [238, 334, 2], [362, 448, 2],
  [1242, 1328, 1],
];
for (const [x0, x1, count] of FLANKS) {
  const run = SKY.filter(([x]) => x >= x0 && x <= x1).map(([x, y]) => [x, y]);
  for (let k = 1; k <= count; k++) {
    const a = 0.16 + r() * 0.12 + k * 0.05;
    const b = 0.9 - k * 0.1 - r() * 0.08;
    const pts = [];
    for (let s = a; s <= b + 0.001; s += (b - a) / 4) {
      const p = along(run, s);
      pts.push([p[0] + k * 4, p[1] + k * 11 + (r() - 0.5) * 1.5]);
    }
    lines.push(rock(pts, r, 0.9));
  }
}

S.line(skyline);
S.line(lines.join(''));
for (const d of snow) S.paper(d);

/* ---------- the scree skirt: long lines flaring out and down from under the crown ---------- */
/** A stretch of a cubic Bézier, from t0 to t1, as its own path. */
function part(p0, p1, p2, p3, t0, t1) {
  const at = (t) => {
    const a = mix(p0, p1, t);
    const b = mix(p1, p2, t);
    const c = mix(p2, p3, t);
    return mix(mix(a, b, t), mix(b, c, t), t);
  };
  const pts = [];
  const steps = Math.max(2, Math.round((t1 - t0) * 8));
  for (let i = 0; i <= steps; i++) pts.push(at(t0 + ((t1 - t0) * i) / steps));
  return smooth(pts);
}
{
  const skirt = [];
  // where each line starts under the crown; unevenly spaced, as a hand would space them
  const tops = [
    [498, 178], [524, 186], [566, 176], [584, 190], [610, 150], [634, 172], [662, 146], [676, 170], [704, 104],
    [722, 150], [742, 178], [768, 216], [782, 196], [806, 150], [826, 190], [850, 184], [864, 196], [892, 186],
    [914, 180], [944, 186], [962, 176], [996, 150], [1016, 168], [1048, 156], [1072, 174],
  ];
  tops.forEach(([x0, y0], k) => {
    const out = x0 - 846;
    const x1 = 846 + out * 1.85 + (r() - 0.5) * 14;
    const y1 = 412 - Math.abs(out) * 0.4;
    const c1 = [x0 + out * 0.04, y0 + (y1 - y0) * 0.45];
    const c2 = [x1 - out * 0.45, y1 - (y1 - y0) * 0.22];
    const a = r() * 0.1;
    const b = 1 - (k % 5 === 3 ? 0.3 + r() * 0.2 : 0);
    if (k % 3 === 1) {
      skirt.push(part([x0, y0], c1, c2, [x1, y1], a, b));
    } else {
      const cut = 0.3 + r() * 0.3;
      skirt.push(part([x0, y0], c1, c2, [x1, y1], a, cut));
      if (cut + 0.12 < b) skirt.push(part([x0, y0], c1, c2, [x1, y1], cut + 0.06 + r() * 0.05, b));
    }
  });
  S.line(skirt.join(''));
}

/* ---------- the forested buttresses, drawn as the Attic ridges are ---------- */
// They cross in front of the skirt and meet in a V over the gorge.
function buttress(pts, offsets) {
  const d = smooth(pts);
  const xs = pts.map((p) => p[0]);
  S.mask(`${d}L${n(pts[pts.length - 1][0])} 422L${n(Math.min(...xs))} 422L${n(pts[0][0])} 422Z`);
  S.line(d);
  for (const [dy, a, b] of offsets) {
    const cut = pts.filter((_, i) => i / (pts.length - 1) >= a && i / (pts.length - 1) <= b);
    if (cut.length < 2) continue;
    S.line(smooth(cut.map(([x, y]) => [x + dy * 0.3, y + dy + (r() - 0.5) * 2])));
  }
}
buttress(
  [[-40, 282], [40, 272], [120, 256], [200, 246], [280, 230], [360, 220], [440, 216], [520, 226], [600, 250], [680, 286], [760, 334], [830, 388], [870, 422]],
  [[13, 0.06, 0.3], [13, 0.38, 0.7], [27, 0.14, 0.56], [42, 0.04, 0.3]],
);
buttress(
  [[790, 422], [840, 380], [900, 336], [970, 290], [1040, 252], [1110, 226], [1180, 212], [1260, 216], [1340, 230], [1420, 246], [1500, 258], [1570, 266], [1640, 274]],
  [[13, 0.3, 0.6], [13, 0.68, 0.94], [27, 0.42, 0.84], [42, 0.66, 1]],
);

/* ---------- cloud bands across the mountain and drifting below ---------- */
band([396, 716, 140, 24], 2);
band([322, 590, 156, 15], 1);
band([806, 1130, 160, 22], 2);
band([940, 1236, 174, 13], 0);
band([590, 900, 236, 18], 1);

band([36, 330, 236, 17], 1);
band([150, 452, 250, 12], 0);
band([1196, 1486, 214, 17], 1);
band([1300, 1592, 230, 12], 0);

/* ---------- two eagles ---------- */
S.line(
  [[366, 44, 9], [392, 58, 6.5]]
    .map(([x, y, w]) => `M${n(x - w)} ${n(y - w * 0.35)}Q${n(x - w * 0.45)} ${n(y - w * 0.75)} ${n(x)} ${n(y)}Q${n(x + w * 0.45)} ${n(y - w * 0.75)} ${n(x + w)} ${n(y - w * 0.35)}`)
    .join(''),
);

S.write('footer-olympus-far.svg');
