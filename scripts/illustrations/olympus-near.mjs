// Near layer of the Olympus footer: the mountain pines, the rocks at their feet and the ink ground.
// node scripts/illustrations/olympus-near.mjs   -> src/assets/illustrations/footer-olympus-near.svg
//
// Two species, as on the mountain. The black pine (Pinus nigra) of the forest belt: a tall straight
// trunk in plated bark, bare below with the stubs of dead branches, and a deep crown of level
// tiers, each a flat cloud of needles lapping over the one above; old trees carry a broad table.
// Higher up the Bosnian pine, the robolo (Pinus heldreichii): short, thick and armoured, heavy
// limbs lifting a wide dome, a bleached snag or a dead tip, the whole tree leaning away from the
// wind with its roots clamped over the limestone.
// The crowns are drawn as the umbrella pines of the Attic footer are (big lobes outside, rows of
// small scallops inside) so the two forests are by one hand; what differs is the build of the tree.
// Every tree is set out by hand below; the seeded jitter only loosens the line.
import { rng, n, P, lerp, smooth, rock, sheet } from './olympus-lib.mjs';

const r = rng(2917);
const S = sheet('0 0 1600 360', 2.6);
const j = (a) => (r() - 0.5) * 2 * a;
const rot = ([x, y], deg, [ox, oy]) => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c];
};
/** A round scallop from a to b, bulging outward on a clockwise outline (the hand of the Attic pines). */
const arc = (a, b, k = 0.56) => {
  const rad = Math.hypot(b[0] - a[0], b[1] - a[1]) * k;
  return `A${n(rad)} ${n(rad)} 0 0 1 ${P(b)}`;
};

/* ---------- the ground: where the ink begins ---------- */
const ground = (x) => 303 + 3.2 * Math.sin(x / 131 + 0.6) + 1.8 * Math.sin(x / 47 + 2.1) + 1.1 * Math.sin(x / 19);

/* ---------- a pad of needles: a flat cloud, scalloped above, with a row of small scallops inside ---------- */
// cx, cy: middle of the underside. tilt in degrees, positive lowers the right end.
function pad(cx, cy, w, h, o = {}) {
  const lobes = o.lobes ?? Math.max(3, Math.round(w / 30) + 1);
  const tilt = o.tilt ?? 0;
  const skew = o.skew ?? 0; // moves the crest of the pad sideways, -1..1
  const T = (p) => rot(p, tilt, [cx, cy]);
  const at = (th, a, hh) => {
    const c = Math.cos(th);
    const s = Math.sin(th);
    return [cx + a * Math.sign(c) * Math.abs(c) ** 0.7 + skew * hh * 0.5 * s, cy - hh * s ** 0.62];
  };
  const a = w / 2;
  // outline: scallops over the top, from the left corner to the right
  const v = [];
  for (let i = 0; i <= lobes; i++) {
    const u = i === 0 ? 0 : i === lobes ? 1 : (i + j(0.14)) / lobes;
    v.push(T(at(Math.PI * (1 - u), a * 0.92, h * 0.86)));
  }
  let d = `M${P(v[0])}`;
  for (let i = 0; i < lobes; i++) d += arc(v[i], v[i + 1], 0.54 + r() * 0.07);
  // underside: two or three shallow scallops coming back
  const under = o.under ?? (w > 70 ? 3 : 2);
  let prev = v[lobes];
  for (let i = 1; i <= under; i++) {
    const u = i / under;
    const p = i === under ? v[0] : T([cx + a * 0.92 * (1 - 2 * u) + j(w * 0.03), cy - h * 0.1 + j(1)]);
    d += arc(prev, p, 0.78 + r() * 0.12);
    prev = p;
  }
  S.paper(`${d}Z`);
  // inner rows of small scallops, following the top
  const rows = o.rows ?? (h >= 30 ? 2 : 1);
  for (let k = 1; k <= rows; k++) {
    const inset = k * Math.min(9, h * 0.3);
    const ia = a * 0.92 - inset * 1.35;
    const ih = h * 0.86 - inset;
    if (ia < 7 || ih < 4.5) break;
    const th0 = Math.PI * (k === 1 ? 0.9 : 0.8);
    const count = Math.max(2, Math.round((ia * 2 * (k === 1 ? 1.15 : 0.9)) / 10.5));
    const pts = [];
    for (let i = 0; i <= count; i++) pts.push(T(at(th0 + (Math.PI - 2 * th0) * (i / count), ia, ih)));
    let di = '';
    for (let i = 0; i < count; i++) {
      // each stroke starts a hair away from the last, as a pen lifted and set down again
      const from = [pts[i][0] + j(0.5), pts[i][1] + j(0.5)];
      di += `M${P(from)}${arc(from, pts[i + 1], 0.58)}`;
    }
    S.line(di);
  }
}

/* ---------- trunks ---------- */
/** Centreline of a trunk: t = 0 at the foot, 1 at the tip. lean and bend are in units at the tip. */
const spine = ({ x, y, H, lean = 0, bend = 0, sway = 0 }) => (t) => [
  x + lean * t + bend * t * t + sway * Math.sin(t * Math.PI * 1.15),
  y - H * t,
];
const widthAt = ({ W, tip = 3.2, flare = W * 0.45 }) => (t) => tip + (W - tip) * (1 - t) ** 1.2 + flare * (1 - t) ** 12;
function edges(c, w, t0 = 0, t1 = 1, steps = 12) {
  const L = [];
  const R = [];
  for (let i = 0; i <= steps; i++) {
    const t = lerp(t0, t1, i / steps);
    const p = c(t);
    const a = c(Math.max(0, t - 0.02));
    const b = c(Math.min(1, t + 0.02));
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const half = w(t) / 2;
    L.push([p[0] - nx * half + j(0.35), p[1] - ny * half]);
    R.push([p[0] + nx * half + j(0.35), p[1] + ny * half]);
  }
  return [L, R];
}
function trunk(c, w, o = {}) {
  const [L, R] = edges(c, w, 0, 1, o.steps ?? 12);
  const tip = c(1);
  S.paper(`${smooth([...L, [tip[0], tip[1] - 2], ...R.reverse()])}${o.closed ? 'Z' : ''}`);
}
/** Plated bark: joints running in from either side in turn, so the plates sit staggered like armour. */
function bark(c, w, H, t0, t1, step = 13) {
  let d = '';
  const count = Math.floor(((t1 - t0) * H) / step);
  for (let i = 0; i <= count; i++) {
    const t = t0 + ((i + j(0.22)) * step) / H;
    if (t > t1) break;
    const p = c(t);
    const wide = w(t);
    if (wide < 7) break;
    const side = i % 2 ? 1 : -1;
    const from = [p[0] + side * (wide / 2 - 0.4), p[1] - 2.5];
    const to = [p[0] - side * wide * (0.06 + r() * 0.1), p[1] + 2 + j(1)];
    d += `M${P(from)}Q${P([p[0] + side * wide * 0.12, p[1] - 3])} ${P(to)}`;
    // on a thick trunk the joint turns down the middle and closes the plate
    if (wide > 15 && r() > 0.3) d += `L${P([to[0] + side * 1.2, to[1] + step * (0.45 + r() * 0.25)])}`;
  }
  if (d) S.line(d);
}

/** Quadratic curve from a to b by way of c, as a centreline. */
const qbez = (a, c, b) => (t) => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];

/** A centreline through the given points (Catmull-Rom). */
const through = (pts) => (t) => {
  const m = pts.length - 1;
  const f = Math.min(m - 1e-6, Math.max(0, t * m));
  const i = Math.floor(f);
  const u = f - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(m, i + 2)];
  const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
};

/**
 * A pine.
 * decks:  [t, dx, w, h, opts] the tiers of the crown, lowest first: flat clouds centred near the
 *         trunk at height t. They are drawn from the top down, so each laps over the one above.
 * top:    [w, h, {dx, tilt, skew}] the crowning cloud, or null for a dead tip.
 * clouds: [dx, dy, w, h, opts] clouds placed from the tip of the trunk, in drawing order (back first).
 * limbs:  [t, [[dx, dy], ...], thick, dead] heavy limbs through points given from where they leave
 *         the trunk; dead ones are bare snags.
 * boughs: [t, side, reach, w, h, opts] a single low bough on a thin branch, carrying its own cloud.
 * stubs:  [t, side, len] the stubs of dead branches on the bare trunk.
 */
function pine(spec) {
  const { H, W, decks = [], limbs = [], clouds = [], boughs = [], top, stubs = [], barkTo = 0.5, barkFrom = 0.03 } = spec;
  const c = spine(spec);
  const w = widthAt(spec);
  let twigs = '';
  // limbs go on first, so the trunk overlaps where they leave it
  for (const [t, rel, thick, dead] of limbs) {
    const p = c(t);
    const pts = rel.map(([dx, dy]) => [p[0] + dx, p[1] + dy]);
    const lc = through(pts);
    const lw = (u) => lerp(thick, dead ? 2 : 4.5, u ** 0.8);
    trunk(lc, lw, { steps: 8 });
    const tip = pts[pts.length - 1];
    if (dead) {
      // a bleached snag: one short fork near its end
      const q = lc(0.62);
      const side = Math.sign(tip[0] - p[0]) || 1;
      twigs += `M${P(q)}q${n(side * 3)} ${n(-7)} ${n(side * 1)} ${n(-13)}`;
    } else {
      bark(lc, lw, Math.hypot(tip[0] - p[0], tip[1] - p[1]) * 1.2, 0.25, 0.7, 13);
    }
  }
  trunk(c, w);
  bark(c, w, H, barkFrom, barkTo, W > 18 ? 15 : 13);
  for (const [t, side, len] of stubs) {
    const p = c(t);
    const from = [p[0] + side * (w(t) / 2 - 0.5), p[1]];
    twigs += `M${P(from)}Q${P([from[0] + side * len * 0.6, from[1] - len * 0.1])} ${P([from[0] + side * len, from[1] - len * (0.3 + r() * 0.2)])}`;
  }
  const low = [];
  for (const [t, side, reach, pw, ph, o = {}] of boughs) {
    const p = c(t);
    const from = [p[0] + side * (w(t) / 2 - 0.6), p[1]];
    const rise = o.rise ?? reach * 0.12;
    const end = [from[0] + side * reach, from[1] - rise];
    // the branch leaves level, sags a little under its own weight and lifts at the tip
    twigs += `M${P(from)}Q${P([from[0] + side * reach * 0.55, from[1] + reach * 0.05 - rise * 0.2])} ${P(end)}`;
    low.push([end[0] - side * pw * 0.3, end[1] + ph * 0.14, pw, ph, { tilt: -side * (2 + r() * 4), skew: side * 0.25, ...o }]);
  }
  if (twigs) S.line(twigs);
  const tip = c(1);
  if (top) {
    const [tw, th, o = {}] = top;
    pad(tip[0] + (o.dx ?? 0), tip[1] + th * 0.42, tw, th, { tilt: o.tilt ?? j(2), ...o });
  } else if (spec.deadTip) {
    // a dead, bleached tip standing clear of the crown, with one bare twig
    S.line(`M${P(c(0.95))}l${n(7 + r() * 3)} ${n(-8)}`);
  }
  for (const [t, dx, pw, ph, o = {}] of decks.slice().reverse()) {
    const p = c(t);
    pad(p[0] + dx, p[1] + ph * 0.3, pw, ph, { tilt: j(2.5), ...o });
  }
  for (const [dx, dy, cw, ch, o = {}] of clouds) pad(tip[0] + dx, tip[1] + dy, cw, ch, { tilt: j(2.5), ...o });
  for (const p of low) pad(...p);
  return { c, w };
}

/**
 * Black pine, its tiers set out by rule and loosened by the seeded jitter.
 * age: 'old' (bare for half its height, the crown widening upward to a dome), 'table' (older
 * still: a flat table on top), 'grown' (a full ovoid crown), 'young' (a blunt cone near the ground).
 * widths: each tier as a fraction of the widest, lowest first.
 */
function blackPine(x, H, age, o = {}) {
  const kind = {
    old: { bare: 0.55, to: 0.89, widths: [0.58, 0.8, 0.96, 1, 0.84], wide: H * 0.5, deep: 30, cap: [0.56, 31], W: H * 0.076 },
    table: { bare: 0.58, to: 0.87, widths: [0.46, 0.66, 0.86, 1], wide: H * 0.54, deep: 30, cap: [0.82, 30], W: H * 0.08 },
    grown: { bare: 0.44, to: 0.89, widths: [0.8, 1, 0.97, 0.86, 0.7], wide: H * 0.47, deep: 29, cap: [0.46, 28], W: H * 0.072 },
    young: { bare: 0.24, to: 0.84, widths: [1, 0.9, 0.76, 0.6], wide: H * 0.52, deep: 22, cap: [0.4, 22], W: H * 0.08 },
  }[age];
  const widths = o.widths ?? kind.widths;
  const wide = o.wide ?? kind.wide;
  let side = o.first ?? (r() < 0.5 ? -1 : 1);
  const decks = widths.map((f, i) => {
    const t = kind.bare + ((kind.to - kind.bare) * i) / (widths.length - 1) + j(0.006);
    const pw = wide * f * (0.95 + r() * 0.1);
    const ph = Math.min(kind.deep, pw * 0.44) * (0.94 + r() * 0.12);
    const dx = side * pw * (0.04 + r() * 0.06);
    side = -side;
    return [t, dx, pw, ph, { rows: 1 }];
  });
  // the stubs of dead branches below the crown
  const stubs = age === 'young' ? [] : [[kind.bare - 0.07 + j(0.02), side, 10 + r() * 4], [kind.bare - 0.17 + j(0.02), -side, 8 + r() * 4], [kind.bare - 0.3 + j(0.03), side, 7 + r() * 3]];
  return pine({
    x, y: G(x), H, W: o.W ?? kind.W, lean: o.lean ?? j(5), sway: o.sway ?? j(3), bend: o.bend ?? 0,
    barkTo: age === 'young' ? 0.18 : kind.bare - 0.03,
    decks, stubs,
    top: [wide * kind.cap[0], kind.cap[1], { dx: j(3), rows: 2 }],
    ...o.spec,
  });
}

/* ---------- rocks ---------- */
/** A block of limestone: lit top and left, a shadow face on the right (light-blue wash), a crack or two. */
function boulder(x, y, wide, tall, o = {}) {
  const lean = o.lean ?? 0;
  const a = [x - wide * 0.5, y + 8];
  const b = [x - wide * (0.4 + r() * 0.06) + lean, y - tall * (0.42 + r() * 0.2)];
  const c = [x - wide * (o.flat ? 0.3 : 0.14 + r() * 0.1) + lean, y - tall * (0.92 + r() * 0.08)];
  const e = [x + wide * (o.flat ? 0.24 : 0.16 + r() * 0.1) + lean, y - tall * (o.flat ? 0.92 : 0.82 + r() * 0.12)];
  const f = [x + wide * (0.4 + r() * 0.06), y - tall * (0.38 + r() * 0.16)];
  const g = [x + wide * 0.5, y + 8];
  const k = [x + wide * (0.14 + r() * 0.08), y + 8]; // foot of the edge between the two faces
  const m = [(e[0] + k[0]) / 2 + j(2) - 2, (e[1] + k[1]) / 2];
  // a step in the top edge, so the block is not a box
  const step = [lerp(c[0], e[0], 0.42 + r() * 0.2), lerp(c[1], e[1], 0.5) + (o.flat ? 2.5 : 1.5) * (r() < 0.5 ? -1 : 1)];
  S.paper(`${rock([a, b, c, step, e, f, g], r, 1.4)}Z`);
  S.wash(`M${[e, f, g, k, m].map(P).join('L')}Z`);
  let d = rock([e, m, k], r, 1) + rock([e, f, g], r, 1.4);
  // strata on the lit face, parallel to its top edge
  const cracks = o.cracks ?? (wide > 60 ? 2 : 1);
  for (let i = 1; i <= cracks; i++) {
    const u = i / (cracks + 1);
    const p0 = [lerp(b[0], a[0], u * 0.7) + 3, lerp(b[1], a[1], u * 0.7) + 2];
    const p1 = [lerp(c[0], m[0], u) - 6 - r() * wide * 0.12, lerp(c[1], m[1], u) + 2];
    d += rock([[lerp(p0[0], p1[0], 0.12 + r() * 0.2), lerp(p0[1], p1[1], 0.15)], [lerp(p0[0], p1[0], 0.6), lerp(p0[1], p1[1], 0.6) + j(1.5)], p1], r, 0.8);
  }
  S.line(d);
  return { a, b, c, e, f, g, k, m };
}
/** Roots clamped over a rock: thick fingers from the foot of a trunk, each drawn through the given points. */
function roots(W, list) {
  for (const pts of list) trunk(through(pts), (u) => lerp(W * 0.46, 2.6, u ** 0.7), { steps: 8 });
}

/* ---------- low juniper and grass: ink, as the bushes of the Attic footer are ---------- */
function juniper(x, wide, tall) {
  const y = ground(x) + 3;
  const count = Math.max(3, Math.round(wide / 12));
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    const inner = i > 0 && i < count;
    pts.push([x - wide / 2 + wide * u + (inner ? j(2) : 0), y - (inner ? tall * Math.sin(Math.PI * u) ** 0.55 * (0.82 + r() * 0.2) : 0)]);
  }
  let d = `M${P(pts[0])}`;
  for (let i = 0; i < count; i++) d += arc(pts[i], pts[i + 1], 0.6);
  // juniper is prickly: a few short shoots stand out of the cushion
  for (let i = 1; i < count; i += 2) {
    const p = pts[i];
    const out = ((p[0] - x) / wide) * 5;
    d += `M${n(p[0])} ${n(p[1] - 1)}l${n(out + j(1))} ${n(-6 - r() * 2)}`;
  }
  S.ink(`${d}Z`);
}
function grass(x) {
  const y = ground(x) + 2;
  S.line(`M${n(x - 4)} ${n(y - 9 - r() * 3)}Q${n(x - 2)} ${n(y - 4)} ${n(x - 0.5)} ${n(y)}M${n(x + 0.5)} ${n(y - 13 - r() * 3)}L${n(x + 0.5)} ${n(y)}M${n(x + 5)} ${n(y - 9 - r() * 3)}Q${n(x + 3)} ${n(y - 4)} ${n(x + 1.5)} ${n(y)}`);
}

/* ================= the stand, far trees first ================= */
const G = (x) => ground(x) + 8;

/**
 * Robolo standing on a block of limestone, its roots running along the top of the rock and down
 * over its edges. Everything about the tree is given by hand.
 */
function robolo({ x, rockW, rockH, rockDx = 0, ...spec }) {
  const gy = ground(x);
  const b = boulder(x + rockDx, gy, rockW, rockH, { cracks: 0, flat: true });
  // stand the tree on the top edge of the rock, at x
  const u = Math.max(0.15, Math.min(0.85, (x - b.c[0]) / (b.e[0] - b.c[0])));
  const foot = [x, lerp(b.c[1], b.e[1], u) + 4];
  pine({ x, y: foot[1], ...spec });
  const W = spec.W;
  // three roots come over the edge and down the lit face, like fingers
  roots(W * 0.8, [
    [[foot[0] - W * 0.26, foot[1] - 7], [foot[0] - W * 0.66, foot[1] + 9], [foot[0] - W * 0.92, foot[1] + 21], [foot[0] - W * 1.3, foot[1] + 29]],
    [[foot[0] + W * 0.26, foot[1] - 7], [foot[0] + W * 0.6, foot[1] + 7], [foot[0] + W * 0.95, foot[1] + 16]],
    [[foot[0] - 1, foot[1] - 5], [foot[0] + 1.5, foot[1] + 10], [foot[0] - 2, foot[1] + 23]],
  ]);
}

// ---- left of the gorge ----
blackPine(236, 190, 'grown', { first: 1, lean: 3 });
blackPine(456, 128, 'young', { first: -1 });
blackPine(4, 252, 'old', { first: 1, lean: 4 });
blackPine(134, 216, 'grown', { first: -1, lean: -4 });
blackPine(330, 276, 'table', { first: 1, lean: 5, sway: -3 });
blackPine(574, 240, 'old', { first: 1, lean: -5 });

robolo({
  x: 704, rockW: 130, rockH: 40, rockDx: 12,
  H: 150, W: 27, tip: 6, lean: 6, bend: 30, flare: 3,
  barkTo: 0.5,
  limbs: [
    [0.34, [[-4, 2], [-18, -5], [-32, -16]], 7, true],
    [0.5, [[-3, 3], [-18, -14], [-30, -34], [-34, -50]], 11, false],
    [0.46, [[4, 3], [26, -8], [46, -28], [56, -56]], 12, false],
  ],
  top: null,
  clouds: [
    [8, 10, 120, 46, { rows: 2 }],
    [-44, 33, 80, 31],
    [48, 31, 88, 33],
  ],
});

// ---- right of the gorge ----
robolo({
  x: 1016, rockW: 146, rockH: 46, rockDx: 10,
  H: 184, W: 30, tip: 3, lean: 3, bend: 20, flare: 3,
  barkTo: 0.4,
  limbs: [
    [0.3, [[4, 2], [24, -6], [42, -20]], 8, true],
    [0.42, [[-4, 3], [-22, -10], [-36, -30], [-40, -52]], 13, false],
    [0.5, [[4, 3], [26, -8], [44, -26], [50, -46]], 12, false],
  ],
  top: null,
  deadTip: true,
  clouds: [
    [-8, 58, 124, 46, { rows: 2 }],
    [-56, 81, 84, 32],
    [38, 75, 88, 33],
  ],
});
blackPine(1146, 132, 'young', { first: -1 });
blackPine(1372, 204, 'grown', { first: -1, lean: 3 });
blackPine(1264, 270, 'old', { first: -1, lean: -4, sway: 3 });
// a black pine the wind has pushed over: the tiers trail to leeward
pine({
  x: 1466, y: G(1466), H: 186, W: 16, lean: 6, bend: 46, tip: 3.6,
  barkTo: 0.48,
  stubs: [[0.3, -1, 10], [0.42, -1, 8]],
  decks: [
    [0.56, 16, 70, 24, { tilt: 5, skew: 0.3, rows: 1 }],
    [0.67, 20, 94, 27, { tilt: 5, skew: 0.3, rows: 1 }],
    [0.78, 20, 100, 28, { tilt: 4, skew: 0.3, rows: 1 }],
    [0.88, 16, 82, 27, { tilt: 4, skew: 0.3, rows: 1 }],
  ],
  top: [58, 26, { dx: 12, tilt: 5, skew: 0.5, rows: 1 }],
});
blackPine(1596, 246, 'table', { first: 1, lean: -3 });

/* ---------- loose rocks ---------- */
boulder(826, ground(826), 58, 22);
boulder(872, ground(872), 40, 14);
boulder(300, ground(300), 46, 17);
boulder(1300, ground(1300), 52, 19);
boulder(60, ground(60), 44, 16);
boulder(1520, ground(1520), 40, 15);

/* ---------- the ground ---------- */
{
  const pts = [];
  for (let x = -20; x <= 1620; x += 20) pts.push([x, ground(x)]);
  S.ink(`${smooth(pts)}L1620 364L-20 364Z`);
}
for (const [x, wide, tall] of [
  [36, 60, 11], [186, 74, 13], [428, 56, 11], [520, 44, 9], [776, 62, 12], [906, 50, 10], [1090, 58, 11], [1184, 46, 10],
  [1400, 70, 13], [1548, 44, 9],
]) juniper(x, wide, tall);
for (const x of [96, 330, 612, 752, 942, 1160, 1290, 1436, 1502]) grass(x);

S.write('footer-olympus-near.svg');
