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
 * A small mountain pine seen across the valley: one outline of two or three stacked pads, each
 * overhanging the one below, on a stub of trunk. Old ones stand on a longer trunk with a flat top.
 */
function pine(x, y, h, old = false) {
  const lean = j(h * 0.03);
  const tiers = h < 19 ? 2 : 3;
  const foot = old ? 0.4 : 0.15;
  const wide = h * (old ? 0.33 : 0.27) * (0.92 + r() * 0.16);
  const step = (1 - foot) / (tiers + 0.25);
  const L = [];
  for (let k = 0; k < tiers; k++) {
    const a = wide * (1 - (old ? 0.3 : 0.25) * k);
    L.push([a, foot + step * k]);
  }
  const X = (dx, up) => `${n(x + dx + lean * up)} ${n(y - h * up)}`;
  // up the left side
  let d = `M${X(-L[0][0], L[0][1])}`;
  for (let k = 0; k < tiers; k++) {
    const [a, b] = L[k];
    if (k < tiers - 1) {
      const [a2, b2] = L[k + 1];
      d += `Q${X(-a * 0.96, b2)} ${X(-a2 * 0.4, b2 + step * 0.12)}L${X(-a2, b2)}`;
    } else {
      d += `C${X(-a * 1.05, 1.04)} ${X(a * 1.05, 1.04)} ${X(a, b)}`;
    }
  }
  // and down the right
  for (let k = tiers - 2; k >= 0; k--) {
    const [a, b] = L[k];
    const [a2, b2] = L[k + 1];
    d += `L${X(a2 * 0.4, b2 + step * 0.12)}Q${X(a * 0.96, b2)} ${X(a, b)}`;
  }
  d += `Q${X(0, L[0][1] + step * 0.3)} ${X(-L[0][0], L[0][1])}Z`;
  // trunk
  d += `M${X(0, L[0][1] + step * 0.14)}L${n(x)} ${n(y)}`;
  return d;
}

/**
 * A company of pines along a crest from x0 to x1. h: height of a grown tree here.
 * Neighbours overlap, so they are written to two paths in turn and the later hides the earlier.
 */
function company(ctrl, x0, x1, h, o = {}) {
  const y = curve(asc(ctrl));
  const a = [];
  const b = [];
  let x = x0 + h * 0.2;
  let i = 0;
  let swell = r() * 6.28;
  while (x < x1 - h * 0.2) {
    const u = (x - x0) / (x1 - x0);
    // lower at both ends of the company, and rolling a little along it
    const size = h * (0.72 + 0.28 * Math.sin(Math.PI * u) ** 0.5) * (0.84 + 0.2 * Math.sin(u * 9 + swell) + r() * 0.14);
    const old = size > h * 0.92 && r() < 0.3;
    (i % 2 ? b : a).push(pine(x, y(x) + 1.5 + (o.drop ?? 0), old ? size * 1.22 : size, old));
    x += size * (0.4 + r() * 0.16) + (r() < 0.12 ? size * 0.4 : 0);
    i++;
  }
  // two paths per company, or the later trees of one would not hide the earlier of the other
  if (a.length) S.paper(a.join(''));
  if (b.length) S.paper(b.join(''));
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
  S.paper(list.map(([x, dy, h]) => pine(x, y(x) + dy, h, h > 30)).join(''));
}

/* ---------- the far pair: they cross over the head of the gorge ---------- */
const BL0 = [[-40, 62], [50, 50], [150, 34], [250, 44], [340, 28], [440, 44], [530, 68], [610, 80], [690, 100], [760, 120], [812, 138], [846, 154], [864, 180], [872, 232], [876, 302]];
const BR0 = [[1640, 98], [1560, 84], [1470, 66], [1380, 78], [1290, 58], [1200, 68], [1110, 88], [1030, 100], [960, 116], [905, 132], [868, 146], [846, 162], [836, 192], [832, 250], [830, 302]];
S.line(ridge(BL0, null, 'left'));
company(BL0, -30, 96, 17);
company(BL0, 140, 420, 18);
company(BL0, 500, 640, 16);
company(BL0, 700, 790, 15);
slope(BL0, [[60, 230, 30], [390, 560, 28], [640, 760, 24]]);
S.line(ridge(BR0, null, 'right'));
company(BR0, 900, 1010, 15);
company(BR0, 1070, 1260, 17);
company(BR0, 1310, 1500, 18);
company(BR0, 1560, 1640, 17);
slope(BR0, [[960, 1120, 24], [1230, 1400, 30], [1480, 1630, 30]]);

/* ---------- the waterfall: long parallel lines from the lip, a light-blue ribbon, rings where it lands ---------- */
{
  const lip = [[838, 160], [847, 156], [856, 157], [864, 161]];
  const foot = [[829, 232], [843, 236], [858, 236], [873, 232]];
  S.wash(`M${P(lip[0])}L${P(lip[3])}C${n(865)} 190 ${n(871)} 212 ${P(foot[3])}Q850 242 ${P(foot[0])}C${n(832)} 212 ${n(837)} 190 ${P(lip[0])}Z`);
  S.line(
    lip
      .map((a, i) => {
        const b = foot[i];
        return `M${P(a)}C${n(a[0] + (i - 1.5) * 0.6)} ${n(a[1] + 26)} ${n(b[0] - (i - 1.5) * 2)} ${n(b[1] - 30)} ${P(b)}`;
      })
      .join(''),
  );
  S.line('M822 240Q850 228 880 240M814 249Q850 235 888 249');
}

/* ---------- the middle pair: their ends are the rock walls of the gorge ---------- */
const L1 = [[-40, 122], [70, 110], [180, 118], [290, 100], [390, 112], [480, 128], [570, 138], [650, 146], [720, 152], [768, 158], [792, 166]];
const R1 = [[1640, 140], [1540, 128], [1430, 136], [1320, 118], [1210, 128], [1110, 142], [1030, 152], [970, 158], [936, 162], [912, 166], [898, 172]];
const L1cliff = [[800, 186], [793, 208], [802, 230], [796, 258], [801, 302]];
const R1cliff = [[892, 190], [899, 212], [890, 236], [896, 262], [891, 302]];
S.line(ridge(L1, L1cliff, 'left'));
// the lit wall: a few falling strokes
S.line('M786 180q-2 12 1 24M776 176q-1 9 0 16M790 216q2 14 -1 28M779 222q-1 8 1 14M786 262q1 12 -1 24');
company(L1, -30, 150, 24);
company(L1, 250, 470, 25);
company(L1, 560, 742, 22);
slope(L1, [[110, 300, 36], [430, 610, 32]]);
loners(L1, [[196, 18, 20], [214, 22, 17], [520, 20, 19]]);
ridge(R1, R1cliff, 'right');
// the wall in shadow
S.wash(`M${[[898, 172], ...R1cliff, [930, 302], [926, 250], [932, 206], [924, 176]].map(P).join('L')}Z`);
S.line(smooth(R1) + rock([[898, 172], ...R1cliff], r, 1.2, false));
S.line('M906 188q2 12 -1 24M916 184q1 9 0 16M904 224q-2 14 1 28M915 230q1 8 -1 14M906 268q-1 12 1 22');
company(R1, 950, 1100, 22);
company(R1, 1190, 1400, 25);
company(R1, 1480, 1640, 24);
slope(R1, [[1010, 1180, 30], [1290, 1470, 36]]);
loners(R1, [[1132, 18, 19], [1150, 22, 17], [1440, 16, 20]]);

/* ---------- the stream on the floor of the gorge ---------- */
S.wash('M836 246C830 262 842 276 836 302L872 302C874 280 862 264 866 246Z');
S.line(
  smooth([[840, 250], [836, 264], [843, 280], [838, 302]]) +
    smooth([[850, 252], [848, 266], [856, 282], [853, 302]]) +
    smooth([[861, 250], [860, 264], [868, 280], [867, 302]]),
);

/* ---------- the near pair ---------- */
const L2 = [[-40, 190], [80, 178], [200, 188], [320, 176], [430, 192], [530, 206], [620, 220], [690, 234], [730, 246]];
const R2 = [[1640, 200], [1520, 188], [1400, 198], [1280, 186], [1170, 200], [1080, 216], [1010, 230], [972, 242], [958, 252]];
S.line(ridge(L2, [[738, 268], [732, 302]], 'left') );
company(L2, -30, 250, 32);
company(L2, 360, 560, 30);
company(L2, 610, 700, 24);
slope(L2, [[60, 240, 30], [330, 500, 30]]);
S.line(ridge(R2, [[952, 272], [956, 302]], 'right'));
company(R2, 1000, 1110, 26);
company(R2, 1180, 1420, 32);
company(R2, 1500, 1640, 30);
slope(R2, [[1100, 1260, 30], [1380, 1560, 30]]);

S.write('footer-olympus-mid.svg');
