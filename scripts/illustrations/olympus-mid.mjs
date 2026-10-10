// Middle layer of the Olympus footer: the forested shoulders and the Enipeas gorge.
// node scripts/illustrations/olympus-mid.mjs   -> src/assets/illustrations/footer-olympus-mid.svg
//
// Three pairs of ridges come in from left and right and lock into one another over the gorge.
// They are drawn as the Attic hills are (a crest and a few slope lines), and carry their forest
// as ranks of small tiered pines standing on the crests, in loose companies with bare ground
// between. At the head of the gorge the stream falls over a lip of rock and runs out between
// the walls: long parallel lines on a light-blue wash.
import { rng, n, P, lerp, smooth, rock, curve, sheet } from './olympus-lib.mjs';

const r = rng(1701);
const S = sheet('0 0 1600 300', 2.2);
const j = (a) => (r() - 0.5) * 2 * a;
const asc = (pts) => (pts[0][0] > pts[pts.length - 1][0] ? pts.slice().reverse() : pts);

/** A ridge: closed and filled so it hides what is behind. Returns its crest path for stroking. */
function ridge(crest, cliff, side) {
  const d = smooth(crest) + (cliff ? rock([crest[crest.length - 1], ...cliff], r, 1.2, false) : '');
  S.mask(`${d}L${side === 'left' ? -40 : 1640} 302Z`);
  return d;
}

/**
 * A small black pine seen across the valley, built as the near ones are: a straight trunk, bare
 * below, and a crown of level tiers, each lapping over the one above. Old ones are taller and
 * bare for half their height. Returns its trunk and its tiers from the top down, so that a
 * company can lay all the trunks first and then each level of tiers in turn.
 */
function pine(x, y, h, old = false) {
  const lean = j(h * 0.04);
  const at = (t) => [x + lean * t, y - h * t];
  const bare = old ? 0.5 + r() * 0.05 : 0.3 + r() * 0.06;
  const count = h < 26 ? 2 : 3;
  const wide = h * (old ? 0.5 : 0.44) * (0.92 + r() * 0.16);
  const step = (1 - bare) / (count + 0.35);
  const dome = (cx, cy, w, hh) =>
    `M${n(cx - w / 2)} ${n(cy)}C${n(cx - w / 2)} ${n(cy - hh * 1.33)} ${n(cx + w / 2)} ${n(cy - hh * 1.33)} ${n(cx + w / 2)} ${n(cy)}Q${n(cx)} ${n(cy - hh * 0.2)} ${n(cx - w / 2)} ${n(cy)}Z`;
  const tiers = [];
  for (let k = count - 1; k >= 0; k--) {
    // widest one tier up from the bottom, as the near crowns are
    const f = old ? [0.72, 1, 0.86][k] : [0.9, 1, 0.7][k];
    const p = at(bare + step * (k + 0.9));
    tiers.push(dome(p[0] + j(wide * 0.05), p[1] + step * h * 0.9, wide * (count === 2 ? [1, 0.74][k] : f), step * h * 1.35));
  }
  return [`M${P(at(0))}L${P(at(bare + step))}`, tiers];
}

/**
 * A company of pines along a crest from x0 to x1. h: height of a grown tree here.
 * They stand shoulder to shoulder without crossing, so one path holds all the trunks and one
 * more holds each level of tiers, the top ones first.
 */
function company(ctrl, x0, x1, h, o = {}) {
  const y = curve(asc(ctrl));
  const trunks = [];
  const levels = [[], [], []];
  let x = x0 + h * 0.25;
  const swell = r() * 6.28;
  while (x < x1 - h * 0.25) {
    const u = (x - x0) / (x1 - x0);
    // lower at both ends of the company, and rolling a little along it
    const size = h * (0.8 + 0.2 * Math.sin(Math.PI * u) ** 0.5) * (0.9 + 0.12 * Math.sin(u * 9 + swell) + r() * 0.12);
    const old = size > h * 0.94 && r() < 0.22;
    const tall = old ? size * 1.26 : size;
    const [trunk, tiers] = pine(x, y(x) + 1.5 + (o.drop ?? 0), tall, old);
    trunks.push(trunk);
    tiers.forEach((d, k) => levels[k + (3 - tiers.length)].push(d));
    x += tall * (old ? 0.5 : 0.46) * (1 + r() * 0.14) + (r() < 0.14 ? size * 0.36 : 0);
  }
  S.line(trunks.join(''));
  for (const level of levels) if (level.length) S.paper(level.join(''));
}

/** Slope lines under a crest, as on the Attic hills: a stretch of the crest, moved down. */
function slope(ctrl, spans) {
  const y = curve(asc(ctrl));
  let d = '';
  for (const [x0, x1, dy] of spans) {
    const pts = [];
    for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 5) pts.push([x, y(x) + dy + j(2.2)]);
    d += smooth(pts);
  }
  S.line(d);
}
/** A lone pine or two out on a slope. [x, dy below the crest, height] */
function loners(ctrl, list) {
  const y = curve(asc(ctrl));
  const trees = list.map(([x, dy, h]) => pine(x, y(x) + dy, h));
  S.line(trees.map((t) => t[0]).join(''));
  for (let k = 0; k < 3; k++) {
    const d = trees.map((t) => t[1][k + t[1].length - 3] ?? '').join('');
    if (d) S.paper(d);
  }
}

/* ---------- the far pair: they meet in a notch at the head of the gorge ---------- */
const NOTCH = [846, 122];
const BL0 = [[-40, 82], [50, 70], [150, 54], [250, 62], [340, 46], [440, 56], [530, 70], [610, 78], [690, 90], [760, 102], [812, 112], NOTCH];
const BR0 = [[1640, 104], [1560, 90], [1470, 72], [1380, 82], [1290, 62], [1200, 70], [1110, 84], [1030, 92], [960, 102], [905, 111], [868, 117], NOTCH];
S.mask(`${smooth(BL0)}L846 302L-40 302Z`);
S.mask(`${smooth(BR0)}L846 302L1640 302Z`);
S.line(smooth(BL0));
S.line(smooth(BR0));
company(BL0, -30, 100, 25);
company(BL0, 150, 420, 27);
company(BL0, 500, 650, 24);
company(BL0, 706, 800, 21);
slope(BL0, [[60, 230, 28], [390, 560, 26], [620, 740, 22]]);
company(BR0, 892, 1010, 21);
company(BR0, 1070, 1260, 25);
company(BR0, 1320, 1500, 27);
company(BR0, 1560, 1640, 25);
slope(BR0, [[960, 1120, 22], [1230, 1400, 28], [1480, 1630, 28]]);

/* ---------- the gorge: a cleft in shadow, the fall and the stream left as bare paper ---------- */
const RIM_L = [[836, 124], [822, 129], [808, 137], [797, 143]];
const RIM_R = [[857, 124], [870, 131], [886, 141], [897, 152]];
S.wash(`M${[...RIM_L, [756, 302], [940, 302], ...RIM_R.slice().reverse()].map(P).join('L')}Z`);
S.line(rock(RIM_L, r, 0.9) + rock(RIM_R, r, 0.9));
{
  // the fall: a ribbon from the lip, a little wider where it lands
  const lip = [[838, 127], [844, 124], [850, 124], [856, 127]];
  const foot = [[834, 196], [843, 199], [853, 199], [862, 196]];
  S.mask(`M${P(lip[0])}L${P(lip[3])}C858 150 863 176 ${P(foot[3])}Q848 203 ${P(foot[0])}C833 176 836 150 ${P(lip[0])}Z`);
  S.line(
    lip
      .map((a, i) => {
        const b = foot[i];
        return `M${P(a)}C${n(a[0] + (i - 1.5) * 0.4)} ${n(a[1] + 24)} ${n(b[0] - (i - 1.5) * 1.2)} ${n(b[1] - 30)} ${P(b)}`;
      })
      .join(''),
  );
  // the stream: out of the pool and down the floor of the gorge towards us, widening as it comes
  const mid = [[848, 200], [843, 214], [853, 230], [845, 250], [849, 276], [846, 302]];
  const half = [9, 9, 12, 17, 23, 28];
  const bank = (s) => mid.map(([x, y], i) => [x + s * half[i], y]);
  S.mask(`${smooth(bank(-1))}L${P(bank(1)[5])}${smooth(bank(1).reverse()).replace(/^M[^C]+/, '')}Z`);
  S.line(smooth(bank(-1)) + smooth(bank(1)));
  S.line(
    smooth(mid.slice(1).map(([x, y], i) => [x - half[i + 1] * 0.36, y + 2])) +
      smooth(mid.slice(2).map(([x, y], i) => [x + half[i + 2] * 0.3, y - 3])),
  );
  // rings where the fall lands
  S.line('M830 203Q848 196 866 203');
}

/* ---------- the middle pair: their ends are the rock walls of the gorge ---------- */
const L1 = [[-40, 118], [70, 106], [180, 114], [290, 96], [390, 106], [480, 118], [570, 126], [650, 132], [720, 136], [768, 138], [796, 142]];
const R1 = [[1640, 136], [1540, 124], [1430, 132], [1320, 114], [1210, 122], [1110, 132], [1030, 140], [970, 144], [936, 146], [912, 148], [898, 152]];
const L1cliff = [[804, 160], [798, 182], [806, 204], [800, 224], [790, 246], [772, 270], [762, 302]];
const R1cliff = [[892, 170], [899, 192], [891, 214], [897, 232], [908, 252], [924, 274], [932, 302]];
S.line(ridge(L1, L1cliff, 'left'));
// falling strokes on the two walls
S.line('M788 156q-2 12 1 24M777 152q-1 9 0 16M791 192q2 12 -1 24M780 198q-1 8 1 14M784 230q-2 8 -6 16');
company(L1, -30, 150, 34);
company(L1, 250, 470, 36);
company(L1, 560, 760, 32);
slope(L1, [[110, 300, 34], [430, 610, 30]]);
loners(L1, [[196, 20, 27], [216, 24, 24], [520, 20, 26]]);
S.line(ridge(R1, R1cliff, 'right'));
S.line('M906 166q2 12 -1 24M917 162q1 9 0 16M904 202q-2 12 1 24M915 208q1 8 -1 14M911 238q2 8 6 16');
company(R1, 934, 1100, 32);
company(R1, 1190, 1400, 36);
company(R1, 1480, 1640, 34);
slope(R1, [[1010, 1180, 28], [1290, 1470, 34]]);
loners(R1, [[1134, 20, 26], [1154, 24, 24], [1440, 18, 27]]);

/* ---------- the near pair ---------- */
const L2 = [[-40, 190], [80, 178], [200, 188], [320, 176], [430, 190], [530, 202], [620, 212], [690, 220], [734, 226]];
const R2 = [[1640, 200], [1520, 188], [1400, 198], [1280, 186], [1170, 198], [1080, 210], [1010, 220], [972, 228], [956, 234]];
S.line(ridge(L2, [[744, 248], [738, 302]], 'left'));
company(L2, 396, 520, 40);
slope(L2, [[40, 200, 26], [250, 400, 30], [540, 660, 22]]);
S.line(ridge(R2, [[948, 256], [952, 302]], 'right'));
company(R2, 1064, 1180, 40);
slope(R2, [[1010, 1120, 22], [1250, 1420, 30], [1470, 1620, 26]]);

S.write('footer-olympus-mid.svg');
