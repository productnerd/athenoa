// Far layer of the Olympus footer: the summit crown, its scree and its cloud bands.
// node scripts/illustrations/olympus-far.mjs   -> src/assets/illustrations/footer-olympus-far.svg
//
// Left to right the skyline names real ground: Skolio (broad), Skala, the teeth of Kakoskala,
// Mytikas (the highest, a spire), the deep notch of the Louki couloir, Stefani (the curved wall
// called the Throne of Zeus), the Plateau of the Muses, Profitis Ilias and Toumba.
// Light comes from the left. From every summit an arête runs down and outward, and the face on
// its right is in shadow (light-blue wash, hatched down the fall line) as far as the gully that
// drops from the next notch. Snow lies in the gullies as bare paper. Below the walls the scree
// runs out in long lines, and two bare shoulders, drawn as the Attic ridges are, close the foot.
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
band([690, 1040, 70, 22], 1);
band([880, 1230, 88, 15], 1);
band([1050, 1310, 102, 10], 0);
band([212, 430, 96, 13], 0);
band([116, 306, 110, 10], 0);

/* ---------- the skyline ---------- */
// P: summit. N: notch where a gully starts. T: the high end of Stefani.
const SKY = [
  [-40, 210], [40, 206], [110, 200], [165, 198],
  [208, 184, 'P'], [238, 198, 'N'], [272, 184], [302, 170],
  [334, 152, 'P'], [362, 168, 'N'], [394, 150], [424, 136],
  [448, 122, 'P'], [474, 138, 'N'], [496, 116], [516, 96], [532, 82],
  [552, 66, 'P'], [578, 65], [600, 75], [622, 99, 'N'], [640, 79],
  [652, 63, 'P'], [664, 69], [676, 85, 'N'], [688, 65],
  [696, 51, 'P'], [704, 57], [711, 53], [720, 69, 'N'], [728, 49], [736, 35], [743, 37],
  [752, 21, 'P'], [759, 27], [765, 25], [772, 43], [780, 49], [788, 73], [798, 99, 'N'],
  [808, 89], [816, 71], [824, 65], [832, 47],
  [842, 35, 'T'], [851, 30], [859, 34], [869, 31], [879, 38], [891, 40], [901, 51], [912, 55], [922, 69], [930, 76], [936, 91], [942, 108], [946, 131, 'N'],
  [972, 137], [1002, 133], [1032, 139], [1054, 127], [1074, 115],
  [1094, 108, 'P'], [1114, 110], [1134, 118], [1158, 136, 'N'], [1178, 125],
  [1198, 118, 'P'], [1220, 126], [1242, 144, 'N'], [1272, 150], [1302, 164],
  [1328, 160, 'P'], [1358, 182, 'N'], [1392, 188],
  [1418, 184, 'P'], [1448, 208, 'N'], [1492, 212], [1542, 217], [1592, 219], [1640, 223],
];
const skyline = rock(SKY, r, 1.1);
S.mask(`${skyline}L1640 422L-40 422Z`);

/* ---------- arêtes, shadow faces, snow ---------- */
// For each summit (by its x): the foot of its arête and the foot of the gully from the notch
// to its right. Both lean away from the middle of the massif, so each shadow face is a leaning
// strip that keeps its width, not a pennant.
const FEET = {
  208: [[190, 230], [226, 236]],
  334: [[310, 212], [346, 220]],
  448: [[420, 192], [454, 202]],
  552: [[516, 186], [598, 206]],
  652: [[634, 158], [664, 176]],
  696: [[686, 138], [714, 158]],
  752: [[746, 200], [804, 226]],
  1094: [[1122, 184], [1186, 196]],
  1198: [[1226, 186], [1270, 198]],
  1328: [[1350, 212], [1384, 220]],
  1418: [[1440, 232], [1472, 238]],
};
const lines = [];
const snow = [];
const feet = []; // where the scree lines start
for (let i = 0; i < SKY.length; i++) {
  if (SKY[i][2] !== 'P') continue;
  let j = i + 1;
  while (SKY[j][2] !== 'N') j++;
  const peak = SKY[i];
  const notch = SKY[j];
  const [A, G] = FEET[peak[0]];
  const tall = A[1] - peak[1];
  const spur = zig(peak, A, r, tall > 80 ? 4.5 : 2.5, 30);
  const gully = zig(notch, G, r, tall > 80 ? 3 : 1.5, 34);
  const right = [...SKY.slice(i, j + 1).map(([x, y]) => [x, y]), ...gully.slice(1)];
  // the foot of the face is ragged: it ends where the scree begins
  const base = [mix(G, A, 0.34), mix(G, A, 0.67)].map(([x, y], k) => [x, y + (k ? -4 : 5)]);
  S.wash(`M${[...right, ...base, ...spur.slice(1).reverse()].map(P).join('L')}Z`);
  lines.push(rock(spur, r, 0.8));
  lines.push(rock(gully, r, 0.8));
  feet.push(A, G);
  // hatching: a fan from the summit, between arête and gully, down the fall line
  const width = notch[0] - peak[0];
  const count = Math.max(1, Math.round(width / 15));
  for (let k = 1; k <= count; k++) {
    const u = k / (count + 1);
    const a = 0.2 + r() * 0.1;
    const b = 0.6 + r() * 0.24;
    const pts = [];
    for (let s = a; s <= b + 0.001; s += (b - a) / 3) pts.push(mix(along(spur, s), along(right, s), u));
    lines.push(smooth(pts));
  }
  // snow lying in the gully: a paper tongue on the wash
  if (tall > 60) {
    const a = 0.06;
    const b = 0.7 + r() * 0.2;
    const wide = Math.min(11, width * 0.2);
    const edge = [];
    const back = [];
    for (let s = 0; s <= 1.001; s += 0.2) {
      const p = along(gully, a + (b - a) * s);
      const w = wide * Math.sin(Math.PI * (s * 0.72 + 0.26)) * (0.8 + r() * 0.4);
      edge.push([p[0] - w - 1.4, p[1] - w * 0.2]);
      back.push([p[0] - 1, p[1]]);
    }
    snow.push(smooth([...edge, ...back.reverse()], true));
  }
}

/* ---------- Stefani, the Throne of Zeus: a curved wall of rock, its strata nested like a shell ---------- */
{
  const t = SKY.findIndex((p) => p[2] === 'T');
  let e = t;
  while (SKY[e][2] !== 'N') e++;
  const crest = SKY.slice(t, e + 1).map(([x, y]) => [x, y]);
  const O = [850, 190];
  const ring = (s, a = 0, b = 1, steps = 6) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const u = a + ((b - a) * i) / steps;
      pts.push(mix(O, along(crest, u), s + (r() - 0.5) * 0.03));
    }
    return pts;
  };
  // the hollow of the throne: its left side, under the arête, is in shadow
  const arete = [[842, 35], [838, 68], [845, 102], [839, 136], [846, 168], [842, 198]];
  const edge = [[888, 196], [893, 160], [888, 124], [876, 90], [860, 60]];
  S.wash(`M${[...arete, ...edge].map(P).join('L')}Z`);
  lines.push(rock(ring(0.8, 0.04, 0.97, 8), r, 0.8));
  lines.push(rock(ring(0.61, 0.08, 0.95), r, 0.9));
  lines.push(rock(ring(0.43, 0.14, 0.9, 5), r, 0.9));
  lines.push(rock(ring(0.26, 0.24, 0.84, 4), r, 0.9));
  lines.push(rock(arete, r, 0.8));
  lines.push(rock([[946, 131], [942, 158], [949, 192]], r, 0.8));
  feet.push([842, 198], [949, 192], [896, 198]);
}

// lit faces: strata lines under each left-hand flank, parallel to the skyline
const FLANKS = [
  [474, 552, 3], [622, 652, 1], [720, 752, 2], [1032, 1094, 2], [1158, 1198, 1], [40, 208, 1], [238, 334, 2], [362, 448, 2],
  [1242, 1328, 1], [1448, 1640, 1],
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
// snow has no outline of its own: it is the paper showing, against the line of its gully
for (const d of snow) S.mask(d);

/* ---------- the scree: long lines running on from the foot of every arête and gully ---------- */
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
  feet
    .slice()
    .sort((a, b) => a[0] - b[0])
    .forEach(([x0, y0], k) => {
      const out = x0 - 846;
      // each line leaves its foot straight down and bends away from the middle as the slope eases
      const x1 = 846 + out * 1.5 + (r() - 0.5) * 12;
      const y1 = 400 - Math.abs(out) * 0.2;
      const c1 = [x0 + out * 0.02, y0 + (y1 - y0) * 0.5];
      const c2 = [x1 - out * 0.3, y1 - (y1 - y0) * 0.25];
      const a = 0.05 + r() * 0.05;
      const cut = 0.34 + r() * 0.2;
      skirt.push(part([x0, y0], c1, c2, [x1, y1], a, k % 3 === 1 ? 0.95 : cut));
      if (k % 3 !== 1) skirt.push(part([x0, y0], c1, c2, [x1, y1], cut + 0.07 + r() * 0.05, 0.95));
    });
  S.line(skirt.join(''));
}

/* ---------- the bare shoulders, drawn as the Attic ridges are ---------- */
// They stand in front of the scree and meet in a V over the head of the gorge. Both keep well
// clear of the first forested ridge of the middle layer, which follows them some 35 units lower.
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
  [[-40, 236], [60, 232], [160, 214], [260, 206], [350, 210], [450, 200], [540, 214], [620, 232], [700, 246], [770, 262], [822, 278], [850, 294], [868, 330], [878, 422]],
  [[12, 0.05, 0.3], [12, 0.4, 0.66], [24, 0.16, 0.5]],
);
buttress(
  [[826, 422], [834, 330], [846, 296], [866, 284], [900, 274], [950, 262], [1020, 248], [1100, 236], [1180, 222], [1270, 214], [1360, 222], [1450, 226], [1550, 246], [1640, 250]],
  [[12, 0.36, 0.6], [12, 0.7, 0.95], [24, 0.46, 0.8]],
);

/* ---------- cloud bands across the mountain and drifting over its shoulders ---------- */
band([390, 716, 156, 24], 2);
band([316, 580, 172, 15], 1);
band([826, 1150, 174, 22], 2);
band([960, 1250, 188, 13], 0);

band([20, 310, 204, 16], 1);
band([140, 430, 218, 11], 0);
band([1216, 1506, 198, 16], 1);
band([1320, 1600, 212, 11], 0);

/* ---------- two eagles ---------- */
S.line(
  [[346, 52, 9], [372, 66, 6.5]]
    .map(([x, y, w]) => `M${n(x - w)} ${n(y - w * 0.35)}Q${n(x - w * 0.45)} ${n(y - w * 0.75)} ${n(x)} ${n(y)}Q${n(x + w * 0.45)} ${n(y - w * 0.75)} ${n(x + w)} ${n(y - w * 0.35)}`)
    .join(''),
);

S.write('footer-olympus-far.svg');
