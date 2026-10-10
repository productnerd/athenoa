// Middle layer of the Olympus footer: the forested shoulders and the Enipeas gorge.
// node scripts/illustrations/olympus-mid.mjs   -> src/assets/illustrations/footer-olympus-mid.svg
//
// Three pairs of ridges come in from left and right and lock into one another over the gorge.
// Their forest is drawn as the canopy looks from across a valley: ranks of scallops along the
// crest (pines), with fir spires standing out of them. A waterfall drops at the head of the
// gorge and the stream runs down between the rock walls.
import { rng, n, P, smooth, rock, curve, sheet } from './olympus-lib.mjs';

const r = rng(1700);
const S = sheet('0 0 1600 300', 2.2);

const asc = (pts) => (pts[0][0] > pts[pts.length - 1][0] ? pts.slice().reverse() : pts);

/** A ridge: closed and filled so it hides what is behind. Returns its crest path for stroking. */
function ridge(crest, cliff, side) {
  const d = smooth(crest) + (cliff ? rock([crest[crest.length - 1], ...cliff], r, 1.2, false) : '');
  S.mask(`${d}L${side === 'left' ? -40 : 1640} 302Z`);
  return d;
}

/**
 * Forest along a crest between x0 and x1: a serried rank of conifer spires on the skyline,
 * then ranks of canopy scallops stepping down the slope.
 * w: width of one crown. lower: stretches [from, to] of the second and third scallop rank.
 */
function forest(ctrl, x0, x1, w, lower = []) {
  const y = curve(asc(ctrl));
  // uneven steps along the crest
  const xs = [x0];
  while (xs[xs.length - 1] < x1) xs.push(xs[xs.length - 1] + w * (0.78 + r() * 0.5));
  // the spires, in clumps of uneven height
  let spires = '';
  let count = 0;
  let tall = 1;
  for (let i = 0; i < xs.length - 1; i++) {
    if (i % 5 === 0) tall = 0.75 + r() * 0.6;
    if (r() < 0.24) continue;
    const x = (xs[i] + xs[i + 1]) / 2 + (r() - 0.5) * 2;
    const fw = w * (0.4 + r() * 0.12);
    const h = w * (1.5 + r() * 1.1) * tall;
    const base = y(x) + w * 0.35;
    spires += `M${n(x - fw)} ${n(base)}Q${n(x - fw * 0.9)} ${n(base - h * 0.5)} ${n(x + (r() - 0.5))} ${n(base - h)}Q${n(x + fw * 0.9)} ${n(base - h * 0.5)} ${n(x + fw)} ${n(base)}`;
    if (++count % 8 === 0) {
      S.paper(spires);
      spires = '';
    }
  }
  if (spires) S.paper(spires);
  // the canopy under them: closed below so it hides the feet of the spires
  const arc = (a, b, dy) => {
    const rad = (b - a) * (0.54 + r() * 0.08);
    return `A${n(rad)} ${n(rad)} 0 0 1 ${n(b)} ${n(y(b) + dy)}`;
  };
  const drop = w * 0.42;
  let top = `M${n(xs[0])} ${n(y(xs[0]) + drop)}`;
  for (let i = 1; i < xs.length; i++) top += arc(xs[i - 1], xs[i], drop);
  const end = xs[xs.length - 1];
  S.mask(`${top}L${n(end)} ${n(y(end) + w * 1.6)}L${n(xs[0])} ${n(y(xs[0]) + w * 1.6)}Z`);
  S.line(top);
  // lower ranks, each bump sitting under the join of two above
  const mids = xs.slice(1).map((x, i) => (x + xs[i]) / 2);
  lower.forEach((spans, k) => {
    const grid = k % 2 === 0 ? mids : xs;
    const dy = drop + (k + 1) * w * 0.56;
    let d = '';
    for (const [a, b] of spans) {
      let on = false;
      for (let i = 1; i < grid.length; i++) {
        if (grid[i - 1] < a || grid[i] > b) {
          on = false;
          continue;
        }
        if (!on) d += `M${n(grid[i - 1])} ${n(y(grid[i - 1]) + dy)}`;
        d += arc(grid[i - 1], grid[i], dy);
        on = true;
      }
    }
    if (d) S.line(d);
  });
}

/** Slope lines under a crest, as on the Attic hills: a stretch of the crest, moved down. */
function slope(ctrl, spans) {
  const y = curve(asc(ctrl));
  for (const [x0, x1, dy] of spans) {
    const pts = [];
    for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 5) pts.push([x, y(x) + dy + (r() - 0.5) * 2.5]);
    S.line(smooth(pts));
  }
}
/** The bare part of a crest, from x0 to x1. */
function bare(ctrl, x0, x1) {
  const y = curve(asc(ctrl));
  const pts = [];
  for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 4) pts.push([x, y(x)]);
  S.line(smooth(pts));
}
/** Rock wall: short strokes falling beside a cliff edge. */
function wall(marks) {
  S.line(marks.map(([x, y, len]) => `M${n(x)} ${n(y)}q${n((r() - 0.5) * 3)} ${n(len / 2)} ${n((r() - 0.5) * 2)} ${n(len)}`).join(''));
}

/* ---------- the far pair: they cross over the head of the gorge ---------- */
const BL0 = [[-40, 66], [50, 56], [150, 38], [250, 48], [340, 30], [440, 48], [530, 74], [610, 82], [690, 100], [760, 118], [812, 134], [846, 150], [866, 176], [878, 230], [882, 302]];
const BR0 = [[1640, 84], [1560, 70], [1470, 54], [1380, 66], [1290, 48], [1200, 60], [1110, 82], [1030, 94], [960, 110], [905, 126], [868, 140], [846, 158], [834, 190], [828, 250], [826, 302]];
ridge(BL0, null, 'left');
bare(BL0, 790, 882);
forest(BL0.slice(0, 11), -40, 790, 10, [[[-40, 120], [170, 420], [470, 640], [690, 780]], [[-40, 60], [210, 330], [520, 600]]]);
slope(BL0.slice(0, 11), [[90, 250, 36], [380, 520, 32], [600, 730, 28]]);
ridge(BR0, null, 'right');
bare(BR0, 826, 914);
forest(BR0.slice(0, 11), 914, 1640, 10, [[[930, 1080], [1150, 1330], [1400, 1640]], [[1000, 1060], [1210, 1300], [1470, 1600]]]);
slope(BR0.slice(0, 11), [[980, 1130, 28], [1250, 1420, 34], [1480, 1620, 36]]);

/* ---------- the waterfall: long parallel lines from the notch, and its pool ---------- */
S.line(
  [[841, 160, 224, -3], [845.5, 156, 230, -1.5], [850, 155, 232, 0], [854.5, 156, 230, 1.5], [859, 160, 225, 3]]
    .map(([x, y0, y1, out]) => `M${n(x)} ${n(y0)}C${n(x)} ${n(y0 + 22)} ${n(x + out * 0.3)} ${n(y1 - 24)} ${n(x + out)} ${n(y1)}`)
    .join('') + 'M832 236Q850 227 868 236M838 243Q850 237 862 243',
);

/* ---------- the middle pair: their ends are the rock walls of the gorge ---------- */
const L1 = [[-40, 116], [70, 106], [180, 114], [290, 98], [390, 112], [480, 128], [570, 140], [650, 150], [730, 160], [780, 166], [802, 172]];
const R1 = [[1640, 126], [1540, 116], [1430, 124], [1320, 108], [1210, 122], [1110, 138], [1030, 150], [960, 160], [926, 166], [902, 170], [888, 176]];
const L1cliff = [[808, 190], [801, 210], [810, 232], [804, 258], [809, 302]];
const R1cliff = [[883, 194], [890, 214], [881, 238], [887, 262], [882, 302]];
ridge(L1, L1cliff, 'left');
S.wash(`M${[[802, 172], ...L1cliff, [782, 302], [786, 256], [779, 214], [787, 178]].map(P).join('L')}Z`);
bare(L1, 752, 802);
S.line(rock([[802, 172], ...L1cliff], r, 1.2));
forest(L1, -40, 752, 13, [[[-40, 150], [230, 470], [540, 720]], [[40, 120], [300, 400], [590, 680]]]);
slope(L1, [[150, 300, 42], [440, 600, 38]]);
wall([[795, 186, 22], [788, 192, 14], [794, 220, 26], [786, 226, 12], [797, 262, 24]]);
ridge(R1, R1cliff, 'right');
bare(R1, 888, 940);
S.line(rock([[888, 176], ...R1cliff], r, 1.2));
forest(R1, 940, 1640, 13, [[[950, 1130], [1200, 1400], [1470, 1640]], [[1010, 1090], [1250, 1350], [1520, 1600]]]);
slope(R1, [[1040, 1180, 36], [1300, 1460, 42]]);
wall([[896, 192, 20], [904, 196, 12], [898, 224, 24], [906, 230, 10], [895, 264, 20]]);

/* ---------- the stream on the floor of the gorge ---------- */
S.line(
  smooth([[842, 246], [837, 260], [845, 276], [839, 290], [841, 302]]) +
    smooth([[851, 248], [848, 262], [857, 278], [852, 292], [855, 302]]) +
    smooth([[860, 246], [859, 260], [868, 276], [865, 292], [869, 302]]),
);

/* ---------- the near pair ---------- */
const L2 = [[-40, 176], [80, 168], [200, 180], [320, 170], [430, 190], [530, 206], [620, 222], [690, 238], [734, 252]];
const R2 = [[1640, 186], [1520, 176], [1400, 188], [1280, 178], [1170, 196], [1080, 214], [1000, 230], [960, 242], [946, 254]];
ridge(L2, [[742, 272], [736, 302]], 'left');
bare(L2, 684, 734);
S.line(rock([[734, 252], [742, 272], [736, 302]], r, 1.2));
forest(L2, -40, 684, 17, [[[-40, 180], [260, 480], [540, 660]], [[30, 130], [320, 420]]]);
ridge(R2, [[940, 274], [944, 302]], 'right');
bare(R2, 946, 1004);
S.line(rock([[946, 254], [940, 274], [944, 302]], r, 1.2));
forest(R2, 1004, 1640, 17, [[[1010, 1200], [1270, 1480], [1540, 1640]], [[1080, 1170], [1330, 1430]]]);

S.write('footer-olympus-mid.svg');
