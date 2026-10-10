// Near layer of the Olympus footer: the mountain pines, the rocks at their feet and the ink ground.
// node scripts/illustrations/olympus-near.mjs   -> src/assets/illustrations/footer-olympus-near.svg
//
// Two species, as on the mountain. The black pine (Pinus nigra) of the forest belt: a tall straight
// trunk, bare below, then tiers of level branches each carrying a flat pad of needles, and in old
// trees a broad table of a crown. Higher up the Bosnian pine, the robolo (Pinus heldreichii): short,
// thick and armoured in plates, limbs lifted like a candelabrum, the top often dead and bleached,
// the whole tree leaning away from the wind with its roots clamped over the limestone.
// Every tree is set out by hand below (tiers, lean, crown); the seeded jitter only loosens the line.
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
  const lobes = o.lobes ?? Math.max(3, Math.round(w / 21) + 2);
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
 * tiers: [t, side, reach, w, h, {rise, tilt, bare, inner}] from the lowest up; side -1 left, 1 right.
 *        inner: [w, h] a second, smaller pad nearer the trunk and a little higher.
 * limbs: [t, [[dx, dy], ...], thick, [w, h, opts] | null] heavy limbs, drawn through points given from where
 *        they leave the trunk. With no pad the limb is a dead snag.
 * top:   [w, h, {dx, tilt, skew}] the crowning pad, or null for a dead tip.
 * stubs: [t, side, len] snags on the bare trunk.
 */
function pine(spec) {
  const { H, W, tiers = [], limbs = [], top, stubs = [], barkTo = 0.5, barkFrom = 0.03, shoulders = [] } = spec;
  const c = spine(spec);
  const w = widthAt(spec);
  const pads = [];
  let twigs = '';
  // limbs go on first, so the trunk overlaps where they leave it
  for (const [t, rel, thick, crown] of limbs) {
    const p = c(t);
    const pts = rel.map(([dx, dy]) => [p[0] + dx, p[1] + dy]);
    const lc = through(pts);
    const lw = (u) => lerp(thick, crown ? 3.6 : 2, u ** 0.8);
    trunk(lc, lw, { steps: 8 });
    const tip = pts[pts.length - 1];
    if (crown) {
      bark(lc, lw, Math.hypot(tip[0] - p[0], tip[1] - p[1]) * 1.2, 0.3, 0.75, 13);
      pads.push([tip[0] + (crown[2]?.dx ?? 0), tip[1] + crown[1] * 0.4, crown[0], crown[1], { tilt: j(3), ...(crown[2] ?? {}) }]);
    } else {
      // a bleached snag: one short fork near its end
      const q = lc(0.62);
      const side = Math.sign(tip[0] - p[0]) || 1;
      twigs += `M${P(q)}q${n(side * 3)} ${n(-7)} ${n(side * 1)} ${n(-13)}`;
    }
  }
  trunk(c, w);
  bark(c, w, H, barkFrom, barkTo, W > 18 ? 15 : 13);
  for (const [t, side, len] of stubs) {
    const p = c(t);
    const from = [p[0] + side * (w(t) / 2 - 0.5), p[1]];
    twigs += `M${P(from)}Q${P([from[0] + side * len * 0.6, from[1] - len * 0.1])} ${P([from[0] + side * len, from[1] - len * (0.3 + r() * 0.2)])}`;
  }
  const front = [];
  for (const [t, side, reach, pw, ph, o = {}] of tiers) {
    const p = c(t);
    const from = [p[0] + side * (w(t) / 2 - 0.6), p[1]];
    const rise = o.rise ?? reach * 0.12;
    const end = [from[0] + side * reach, from[1] - rise];
    // the branch leaves level, sags a little under its own weight and lifts at the tip
    twigs += `M${P(from)}Q${P([from[0] + side * reach * 0.55, from[1] + reach * 0.05 - rise * 0.2])} ${P(end)}`;
    if (o.inner) {
      const [iw, ih] = o.inner;
      front.push([from[0] + side * (reach * 0.36 + iw * 0.08), from[1] - rise * 0.3 - ph * 0.5, iw, ih, { tilt: -side * (1 + r() * 3), rows: 1 }]);
    }
    front.push([end[0] - side * pw * (o.inset ?? 0.3), end[1] + ph * 0.12, pw, ph, { tilt: o.tilt ?? -side * (2 + r() * 4), skew: o.skew ?? side * 0.25, ...o }]);
    if (o.bare) twigs += `M${P(end)}l${n(side * o.bare)} ${n(-o.bare * 0.5)}`;
  }
  if (twigs) S.line(twigs);
  for (const p of pads) pad(...p);
  for (const p of front) pad(...p);
  const tip = c(1);
  for (const [dx, dy, sw, sh, o = {}] of shoulders) pad(tip[0] + dx, tip[1] + dy, sw, sh, { tilt: j(3), ...o });
  if (top) {
    const [tw, th, o = {}] = top;
    pad(tip[0] + (o.dx ?? 0), tip[1] + th * 0.42, tw, th, { tilt: o.tilt ?? j(2), ...o });
  } else {
    // a dead, bleached tip: two bare twigs
    const q = c(0.9);
    S.line(`M${P(q)}l${n(8 + r() * 3)} ${n(-9)}M${P(c(0.8))}l${n(-9 - r() * 3)} ${n(-8)}`);
  }
  return { c, w };
}

/**
 * Black pine, tiers set out by rule and loosened by the seeded jitter.
 * age: 'old' (bare below, crown widest high up, a broad table on top), 'grown' (ovoid), 'young' (a narrow cone).
 * The tiers stand closer than a pad is deep, so the crown reads as stacked plates and the trunk
 * only shows in the gaps.
 */
function blackPine(x, H, age, o = {}) {
  const kind = {
    old: { from: 0.55, to: 0.88, count: 6, wide: H * 0.34, f: (u) => 0.66 + 0.34 * Math.sin(Math.PI * (0.1 + 0.7 * u)), deep: 25, top: [H * 0.42, 33], W: H * 0.072 },
    grown: { from: 0.36, to: 0.9, count: 7, wide: H * 0.37, f: (u) => (u === 0 ? 0.84 : 1 - 0.46 * u ** 1.3), deep: 23, top: [H * 0.24, 27], W: H * 0.068 },
    young: { from: 0.22, to: 0.9, count: 6, wide: H * 0.47, f: (u) => (u === 0 ? 0.88 : 1 - 0.5 * u), deep: 18, top: [H * 0.25, 21], W: H * 0.078 },
  }[age];
  const count = o.count ?? kind.count;
  const from = o.from ?? kind.from;
  const wide = o.wide ?? kind.wide;
  let side = o.first ?? (r() < 0.5 ? -1 : 1);
  const tiers = [];
  for (let i = 0; i < count; i++) {
    const u = count > 1 ? i / (count - 1) : 0;
    const t = from + (kind.to - from) * u + j(0.006);
    const pw = wide * kind.f(u) * (0.93 + r() * 0.14);
    const ph = Math.max(15, Math.min(kind.deep, pw * 0.3)) + j(1);
    const reach = pw * (age === 'young' ? 0.58 : 0.64 + r() * 0.1);
    const opts = {};
    if (age === 'old' && i === 0) Object.assign(opts, { rise: -reach * 0.08 });
    tiers.push([t, side, reach, pw, ph, opts]);
    side = -side;
  }
  // one low branch left over from when the tree was younger, and a couple of snags
  const low = [];
  const stubs = [];
  if (age === 'old') {
    low.push([from - 0.1 + j(0.015), side, 30 + r() * 8, 46, 17, { rise: -2, bare: 8 }]);
    stubs.push([from - 0.2 + j(0.03), -side, 10 + r() * 4], [from - 0.3 + j(0.03), side, 8 + r() * 4]);
  } else if (age === 'grown') {
    stubs.push([from - 0.1 + j(0.02), side, 10 + r() * 4], [from - 0.18 + j(0.02), -side, 8 + r() * 4]);
  }
  return pine({
    x, y: G(x), H, W: o.W ?? kind.W, lean: o.lean ?? j(5), sway: o.sway ?? j(3), bend: o.bend ?? 0,
    barkTo: age === 'young' ? 0.16 : from - 0.04,
    tiers: [...low, ...tiers], stubs,
    top: [o.top?.[0] ?? kind.top[0], o.top?.[1] ?? kind.top[1], { dx: j(3), ...(o.top?.[2] ?? {}) }],
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
blackPine(488, 118, 'young', { first: -1 });
blackPine(-2, 250, 'old', { first: 1, lean: 4 });
blackPine(112, 136, 'young', { first: 1 });
blackPine(214, 222, 'grown', { first: -1, lean: -4 });
blackPine(350, 274, 'old', { first: 1, lean: 5, sway: -3 });
blackPine(590, 240, 'grown', { first: 1, lean: -5 });

robolo({
  x: 704, rockW: 130, rockH: 40, rockDx: 12,
  H: 150, W: 27, tip: 5, lean: 6, bend: 32, flare: 3,
  barkTo: 0.5,
  limbs: [
    [0.5, [[-4, 2], [-18, -4], [-32, -14]], 7, null],
    [0.44, [[4, 3], [30, -2], [54, -14], [66, -34]], 13, [82, 30, { dx: 6 }]],
  ],
  tiers: [[0.72, -1, 20, 58, 25, { rise: 8 }], [0.76, 1, 44, 70, 27, { rise: 8 }]],
  top: [88, 32, { dx: 8, tilt: 5, skew: 0.4 }],
});

// ---- right of the gorge ----
blackPine(1340, 206, 'grown', { first: 1, lean: 4 });
robolo({
  x: 1016, rockW: 146, rockH: 46, rockDx: 10,
  H: 176, W: 30, tip: 5.5, lean: 3, bend: 20, flare: 3,
  barkTo: 0.42,
  limbs: [
    [0.3, [[4, 2], [24, -6], [42, -20]], 8, null],
    [0.42, [[-4, 3], [-22, -7], [-36, -24], [-40, -46]], 14, [80, 31, { dx: -8 }]],
    [0.56, [[4, 3], [28, -6], [48, -22], [54, -40]], 12, [78, 30, { dx: 6 }]],
  ],
  tiers: [[0.78, -1, 22, 60, 25, { rise: 8 }]],
  top: [92, 33, { dx: 8, tilt: 3 }],
});
blackPine(1132, 128, 'young', { first: -1 });
blackPine(1232, 270, 'old', { first: -1, lean: -4, sway: 3 });
pine({
  x: 1450, y: G(1450), H: 176, W: 16, lean: 6, bend: 48, tip: 3.6,
  barkTo: 0.42,
  stubs: [[0.3, -1, 10]],
  tiers: [
    [0.48, 1, 50, 66, 21, { rise: 2 }],
    [0.58, -1, 22, 44, 18],
    [0.66, 1, 60, 82, 23, { rise: 4 }],
    [0.78, 1, 52, 76, 23, { rise: 5 }],
    [0.84, -1, 20, 42, 18],
  ],
  top: [88, 27, { dx: 16, tilt: 6, skew: 0.5 }],
});
blackPine(1590, 248, 'old', { first: -1, lean: -3 });

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
