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
  S.paper(`${smooth([...L, [tip[0], tip[1] - 2], ...R.reverse()])}${o.open ? '' : 'Z'}`);
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

/**
 * A pine.
 * tiers: [t, side, reach, w, h, {rise, tilt, bare, inner}] from the lowest up; side -1 left, 1 right.
 *        inner: [w, h] a second, smaller pad nearer the trunk and a little higher.
 * limbs: [t, side, out, up, thick, [w, h, opts] | null] heavy limbs that leave the trunk and turn upward.
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
  for (const [t, side, out, up, thick, crown, o = {}] of limbs) {
    const p = c(t);
    const from = [p[0] + side * w(t) * 0.1, p[1] + thick * 0.3];
    const tip = [p[0] + side * out, p[1] - up];
    const lc = qbez(from, [p[0] + side * out * (o.belly ?? 0.92), p[1] - up * (o.knee ?? 0.08)], tip);
    trunk(lc, (u) => lerp(thick, 2.6, u ** 0.9), { steps: 8 });
    if (o.bark !== false) bark(lc, (u) => lerp(thick, 2.6, u ** 0.9), Math.hypot(out, up), 0.25, 0.7, 12);
    for (const [u, s2, reach, pw, ph, po = {}] of o.tiers ?? []) {
      const q = lc(u);
      const end = [q[0] + s2 * reach, q[1] - (po.rise ?? reach * 0.25)];
      twigs += `M${P(q)}Q${P([q[0] + s2 * reach * 0.6, q[1]])} ${P(end)}`;
      pads.push([end[0] - s2 * pw * 0.28, end[1] + ph * 0.14, pw, ph, { tilt: -s2 * (3 + r() * 4), ...po }]);
    }
    if (crown) pads.push([tip[0] + (crown[2]?.dx ?? 0), tip[1] + crown[1] * 0.4, crown[0], crown[1], { tilt: j(3), ...(crown[2] ?? {}) }]);
    else twigs += `M${P(lc(0.7))}l${n(side * 9)} ${n(-7)}M${P(lc(0.86))}l${n(-side * 6)} ${n(-8)}`;
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
 */
function blackPine(x, H, age, o = {}) {
  const kind = {
    old: { from: 0.52, count: 6, span: H * 0.25, f: (u) => 0.62 + 0.38 * Math.sin(Math.PI * (0.12 + 0.76 * u)), top: [H * 0.37, 31], W: H * 0.062 },
    grown: { from: 0.4, count: 6, span: H * 0.27, f: (u) => 1 - 0.5 * u, top: [H * 0.24, 27], W: H * 0.058 },
    young: { from: 0.2, count: 6, span: H * 0.29, f: (u) => 1 - 0.6 * u, top: [H * 0.2, 21], W: H * 0.062 },
  }[age];
  const count = o.count ?? kind.count;
  const from = o.from ?? kind.from;
  const span = o.span ?? kind.span;
  let side = o.first ?? (r() < 0.5 ? -1 : 1);
  const tiers = [];
  for (let i = 0; i < count; i++) {
    const u = count > 1 ? i / (count - 1) : 0;
    const t = from + (0.9 - from) * (i / count) ** 0.94 + j(0.008);
    const reach = span * kind.f(u) * (0.92 + r() * 0.16);
    const pw = reach * 1.08 + 12;
    const ph = Math.max(14, Math.min(25, pw * 0.3));
    const opts = {};
    if (age === 'old' && i === 0) Object.assign(opts, { rise: -reach * 0.1, bare: 9 });
    if (age !== 'young' && reach > 50) opts.inner = [pw * 0.56, ph * 0.86];
    tiers.push([t, side, reach, pw, ph, opts]);
    side = -side;
  }
  const stubs = age === 'young' ? [] : [[from * 0.62 + j(0.03), side, 9 + r() * 4], [from * 0.84 + j(0.03), -side, 8 + r() * 5]];
  return pine({
    x, y: G(x), H, W: o.W ?? kind.W, lean: o.lean ?? j(5), sway: o.sway ?? j(3), bend: o.bend ?? 0,
    barkTo: age === 'young' ? 0.18 : from - 0.03,
    tiers, stubs,
    top: [o.top?.[0] ?? kind.top[0], o.top?.[1] ?? kind.top[1], { dx: j(3), ...(o.top?.[2] ?? {}) }],
    ...o.spec,
  });
}

/* ---------- rocks ---------- */
/** A block of limestone: lit top and left, a shadow face on the right (light-blue wash), a crack or two. */
function boulder(x, y, wide, tall, o = {}) {
  const lean = o.lean ?? 0;
  const a = [x - wide * 0.5, y + 8];
  const b = [x - wide * (0.42 + r() * 0.06) + lean, y - tall * (0.5 + r() * 0.15)];
  const c = [x - wide * (0.14 + r() * 0.1) + lean, y - tall * (0.92 + r() * 0.08)];
  const e = [x + wide * (0.16 + r() * 0.1) + lean, y - tall * (0.82 + r() * 0.12)];
  const f = [x + wide * (0.4 + r() * 0.06), y - tall * (0.38 + r() * 0.16)];
  const g = [x + wide * 0.5, y + 8];
  const k = [x + wide * (0.14 + r() * 0.08), y + 8]; // foot of the edge between the two faces
  const m = [(e[0] + k[0]) / 2 + j(2) - 2, (e[1] + k[1]) / 2];
  S.paper(`${rock([a, b, c, e, f, g], r, 1.4)}Z`);
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
  return { top: [(c[0] + e[0]) / 2, (c[1] + e[1]) / 2], c, e };
}
/** Roots clamped over a rock: tapering fingers from the foot of a trunk. */
function roots(foot, wide, list) {
  for (const [dx, dy, thick, curl = 0] of list) {
    const side = Math.sign(dx) || 1;
    const from = [foot[0] + side * wide * 0.2, foot[1] - 5];
    const to = [foot[0] + dx, foot[1] + dy];
    const mid = [lerp(from[0], to[0], 0.55) + side * curl, lerp(from[1], to[1], 0.3)];
    const a = [from[0] + side * thick, from[1] - thick * 0.2];
    const b = [from[0] - side * thick * 0.3, from[1] + thick * 0.9];
    S.paper(`M${P(a)}Q${P([mid[0] + side * thick * 0.5, mid[1] - thick * 0.6])} ${P(to)}Q${P([mid[0] - side * thick * 0.3, mid[1] + thick * 0.5])} ${P(b)}Z`);
  }
}

/* ---------- low juniper and grass: ink, as the bushes of the Attic footer are ---------- */
function juniper(x, wide, tall) {
  const y = ground(x) + 3;
  const count = Math.max(3, Math.round(wide / 12));
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    pts.push([x - wide / 2 + wide * u + (i && i < count ? j(2) : 0), y - tall * Math.sin(Math.PI * u) ** 0.55 * (0.82 + r() * 0.2) * (i && i < count ? 1 : 0)]);
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

// --- a test pair while the hand is being found ---
pine({
  x: 330, y: G(330), H: 286, W: 17, lean: 6, sway: -3,
  barkTo: 0.5,
  stubs: [[0.3, -1, 12], [0.38, 1, 9]],
  tiers: [
    [0.5, 1, 46, 56, 20],
    [0.58, -1, 58, 66, 22],
    [0.67, 1, 60, 72, 24],
    [0.75, -1, 56, 74, 25],
    [0.84, 1, 44, 70, 25],
  ],
  top: [112, 34, { dx: -4 }],
});
boulder(600, ground(600), 96, 40);
pine({
  x: 604, y: ground(604) - 34, H: 176, W: 25, lean: 10, bend: 44, tip: 5,
  barkTo: 0.55,
  tiers: [
    [0.45, -1, 30, 48, 20, { rise: 10 }],
    [0.55, 1, 62, 70, 24, { rise: 14 }],
    [0.7, 1, 74, 78, 25, { rise: 10 }],
    [0.78, -1, 34, 54, 22, { rise: 12 }],
  ],
  top: [92, 31, { dx: 14, tilt: 4 }],
});
roots([604, ground(604) - 34], 25, [[-34, 26, 6, -4], [30, 30, 6, 4], [-8, 30, 4.5]]);
pine({
  x: 190, y: G(190), H: 150, W: 10, lean: -3,
  barkTo: 0.3,
  tiers: [
    [0.22, -1, 34, 44, 16],
    [0.32, 1, 36, 46, 17],
    [0.43, -1, 32, 42, 16],
    [0.54, 1, 30, 40, 16],
    [0.65, -1, 24, 36, 15],
    [0.76, 1, 20, 32, 15],
  ],
  top: [34, 22, {}],
});

/* ---------- the ground ---------- */
{
  const pts = [];
  for (let x = -20; x <= 1620; x += 20) pts.push([x, ground(x)]);
  S.ink(`${smooth(pts)}L1620 364L-20 364Z`);
}
juniper(250, 70, 13);
juniper(700, 54, 11);
grass(420);
grass(520);

S.write('footer-olympus-near.svg');
