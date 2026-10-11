// Generates the line art for the home hero (src/components/home/Hero.astro; first built as the
// "Portal B" candidate, src/components/home/hero/PortalB.astro): the original hero picture of
// athenoa.academy redrawn as a night print in the site's manner.
// node scripts/illustrations/portal-b-build.mjs
//
// Layers, far to near. The scene layers share one frame (viewBox 0 0 1000 1000, temple axis at
// x 500, ground at y 946) so they register; the sky layers cover the whole panel.
//   portal-b-sky          stars: dots and four-point sparks            (1600 x 1000, cover)
//   portal-b-milkyway     a drifting band of fine dots                 (1600 x 1000, cover)
//   portal-b-rays         the glow behind Athena: disc and wavy rays   (scene)
//   portal-b-athena       Athena, spear, Nike on her orb               (scene)
//   portal-b-hill         the rise the temple stands on                (scene)
//   portal-b-cella        the dark inside of the temple                (scene)
//   portal-b-light        the lit doorway and its rays                 (scene)
//   portal-b-temple       steps, colonnade, entablature, pediment      (scene)
//   portal-b-flame        brazier and flame                            (scene)
//   portal-b-trees-left   pines and cypresses, lower left corner
//   portal-b-trees-right  pines and cypresses, lower right corner
//   portal-b-ground       the near ground line
// Colours come from the hero through --pb-night, --pb-stone and --pb-light; lines are currentColor.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../src/assets/illustrations');
const NIGHT = 'var(--pb-night, #071260)';
const STONE = 'var(--pb-stone, #0b1c8c)';
const LIGHT = 'var(--pb-light, #b3c0f3)';
const SW = 2.6; // the one stroke weight, in scene units

// ---------- helpers ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const num = (v) => {
  const r = Math.round(v * 10) / 10;
  return String(Object.is(r, -0) ? 0 : r);
};
const pt = ([x, y]) => `${num(x)} ${num(y)}`;
const rad = (deg) => (deg * Math.PI) / 180;
const polar = ([cx, cy], r, deg) => [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
const lerp = (a, b, t) => a + (b - a) * t;
const CX = 500;

/** Smooth curve through points (Catmull-Rom as cubic Béziers). Returns the commands after "M". */
function curve(pts, closed = false) {
  const n = pts.length;
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = '';
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}
const spline = (pts, closed = false) => `M${pt(pts[0])}${curve(pts, closed)}${closed ? 'Z' : ''}`;
const poly = (pts, closed = false) => `M${pts.map(pt).join('L')}${closed ? 'Z' : ''}`;
const rect = (x0, y0, x1, y1) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], true);
const circle = ([x, y], r) =>
  `M${num(x - r)} ${num(y)}a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0Z`;

const path = (d, attrs = '') => `<path d="${d}"${attrs}/>`;
const stone = (d) => path(d, ` fill="${STONE}"`);
const night = (d) => path(d, ` fill="${NIGHT}"`);
/** A shape that only hides or tints what is behind it: no outline. */
const wash = (d, colour, attrs = '') => path(d, ` fill="${colour}" stroke="none"${attrs}`);
/** One element per stroke ("M..."), so every line draws itself instead of all appearing at once. */
const strokes = (d) =>
  d
    .split('M')
    .filter(Boolean)
    .map((part) => path(`M${part}`))
    .join('');
/** Texture that fades in instead of being drawn stroke by stroke. */
const quiet = (d, attrs = '') => path(d, ` data-nodraw=""${attrs}`);

const svg = (w, h, body, attrs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round"${attrs}>${body}</svg>\n`;

function save(name, content) {
  writeFileSync(join(OUT, `portal-b-${name}.svg`), content);
  console.log(`portal-b-${name}.svg  ${(content.length / 1024).toFixed(1)} KB`);
}

/** Spiral winding inwards from radius r0 at angle a0. */
function spiral(c, r0, a0, turns, dir = 1, r1 = 1.5) {
  const pts = [];
  const steps = Math.ceil(turns * 12);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(polar(c, lerp(r0, r1, Math.pow(t, 0.85)), a0 + dir * 360 * turns * t));
  }
  return pts;
}

// ---------- the temple's measures (scene units) ----------
const AX = [150, 290, 430, 570, 710, 850]; // column axes
const T = {
  apex: 394,
  cornice: 495, // top of the horizontal cornice = base of the pediment
  frieze: 511,
  taenia: 555,
  abacus: 593,
  capital: 599,
  shaft: 623,
  base: 893,
  stylobate: 907,
  ground: 946,
};
const PED = { l: 88, r: 912 };
const ENT = { l: 118, r: 882 };
const roofY = (x) => T.apex + (Math.abs(x - CX) * (T.cornice - T.apex)) / (CX - PED.l);
const FLAME = [CX, 848]; // where the light comes from

// =====================================================================================
// Temple
// =====================================================================================
function temple() {
  const rand = rng(21);
  const jit = (a) => (rand() - 0.5) * 2 * a;
  const out = [];

  // --- steps ---
  const stepH = (T.ground - T.stylobate) / 3;
  for (let i = 2; i >= 0; i--) {
    const y0 = T.stylobate + i * stepH;
    const grow = 14 * i;
    out.push(stone(rect(108 - grow, y0, 892 + grow, y0 + stepH + (i === 2 ? 40 : 0))));
  }

  // --- columns ---
  for (const ax of AX) {
    const rLow = 21;
    const rTop = 17.5;
    const rAt = (y) => lerp(rTop, rLow, Math.pow((y - T.shaft) / (T.base - T.shaft), 0.8));
    // shaft with a little entasis
    const mid = (T.shaft + T.base) / 2;
    out.push(
      stone(
        `M${pt([ax - rLow, T.base])}Q${pt([ax - rLow + 0.4, mid])} ${pt([ax - rTop, T.shaft])}L${pt([ax + rTop, T.shaft])}Q${pt([ax + rLow - 0.4, mid])} ${pt([ax + rLow, T.base])}Z`,
      ),
    );
    // fluting
    let flutes = '';
    for (const f of [-0.62, -0.21, 0.21, 0.62]) {
      const y0 = T.shaft + 9 + jit(1.5);
      const y1 = T.base - 6 + jit(1.5);
      flutes += `M${pt([ax + f * rAt(y0), y0])}L${pt([ax + f * rAt(y1), y1])}`;
    }
    out.push(strokes(flutes));
    // base: two tori
    out.push(stone(`M${num(ax - 23)} ${T.base}h46a3.5 3.5 0 0 1 0 7h-46a3.5 3.5 0 0 1 0 -7Z`));
    out.push(stone(`M${num(ax - 26)} ${T.base + 7}h52a3.5 3.5 0 0 1 0 7h-52a3.5 3.5 0 0 1 0 -7Z`));
    // Ionic capital: one line runs from the eye of one volute over the top and into the other
    const vy = 611.5;
    const vr = 12;
    const left = spiral([ax - 26, vy], vr, -90, 1.7, -1, 1.6);
    const right = spiral([ax + 26, vy], vr, -90, 1.7, 1, 1.6);
    out.push(
      wash(
        `${circle([ax - 26, vy], vr)}${circle([ax + 26, vy], vr)}${rect(ax - 26, T.capital, ax + 26, T.shaft + 1)}`,
        STONE,
      ),
    );
    out.push(path(`${spline([...left].reverse())}L${pt(right[0])}${curve(right)}`));
    // echinus between the volutes, and the necking
    out.push(path(`M${num(ax - 13.5)} ${num(vy + 1)}Q${num(ax)} ${num(vy + 9)} ${num(ax + 13.5)} ${num(vy + 1)}`));
    out.push(path(`M${num(ax - rTop - 0.5)} ${T.shaft + 1.5}L${num(ax + rTop + 0.5)} ${T.shaft + 1.5}`));
    // abacus
    out.push(stone(rect(ax - 31, T.abacus, ax + 31, T.capital)));
  }

  // --- entablature ---
  // architrave (two fasciae)
  out.push(stone(rect(ENT.l, T.taenia, ENT.r, T.abacus)));
  out.push(path(`M${ENT.l} ${T.taenia + 19}L${ENT.r} ${T.taenia + 19}`));
  // frieze: the metopes lie back in shadow, the triglyphs stand forward
  out.push(night(rect(ENT.l, T.frieze, ENT.r, T.taenia)));
  let grooves = '';
  for (let i = 0; i <= 10; i++) {
    const tx = 150 + i * 70;
    out.push(stone(rect(tx - 12, T.frieze, tx + 12, T.taenia)));
    grooves += `M${num(tx - 4)} ${T.frieze + 6}L${num(tx - 4)} ${T.taenia}M${num(tx + 4)} ${T.frieze + 6}L${num(tx + 4)} ${T.taenia}`;
  }
  out.push(quiet(grooves));
  // end blocks of the frieze
  out.push(stone(rect(ENT.l, T.frieze, 138, T.taenia)));
  out.push(stone(rect(862, T.frieze, ENT.r, T.taenia)));
  // horizontal cornice
  out.push(stone(poly([[PED.l, T.cornice], [PED.r, T.cornice], [PED.r - 8, T.frieze], [PED.l + 8, T.frieze]], true)));

  // --- pediment ---
  const rise = T.cornice - T.apex;
  const run = CX - PED.l;
  const len = Math.hypot(rise, run);
  const inset = (d) => [
    [PED.l + (d * len) / rise, T.cornice],
    [CX, T.apex + (d * len) / run],
    [PED.r - (d * len) / rise, T.cornice],
  ];
  out.push(stone(poly(inset(0), true)));
  out.push(path(poly(inset(8))));
  out.push(night(poly(inset(19), true)));
  // the name on the tympanum, lettered in the title face
  out.push(
    `<text x="506.5" y="484" text-anchor="middle" font-family="var(--font-title)" font-size="41" letter-spacing="13" fill="currentColor" stroke="none" aria-hidden="true" data-nodraw="">ΑΘΕΝΟΑ</text>`,
  );
  // corner acroteria: a small palmette of three leaves on each end of the roof
  for (const side of [-1, 1]) {
    const x = CX + side * (run - 4);
    const y = T.cornice - 1;
    const leaf = (dx, h) =>
      `M${num(x)} ${num(y)}Q${num(x + side * (dx - 7))} ${num(y - h * 0.6)} ${num(x + side * dx)} ${num(y - h)}Q${num(x + side * (dx + 5))} ${num(y - h * 0.45)} ${num(x)} ${num(y)}`;
    out.push(stone(`${leaf(-13, 15)}Z`));
    out.push(stone(`${leaf(12, 13)}Z`));
    out.push(stone(`${leaf(0, 23)}Z`));
  }

  save('temple', svg(1000, 1000, out.join('')));
}

// =====================================================================================
// Inside the temple: dark cella, lit doorway, rays between the columns
// =====================================================================================
function cella() {
  const out = [];
  out.push(wash(rect(ENT.l + 6, T.abacus - 30, ENT.r - 6, T.stylobate + 14), NIGHT));
  save('cella', svg(1000, 1000, out.join('')));
}

// The building as the light meets it from inside: the outer columns, the entablature, the pediment.
const OUTLINE = [
  [ENT.l, T.stylobate],
  [ENT.l, T.frieze],
  [PED.l, T.cornice],
  [CX, T.apex],
  [PED.r, T.cornice],
  [ENT.r, T.frieze],
  [ENT.r, T.stylobate],
];
// How far it is from the flame to that outline in a given direction
const reach = (deg) => {
  const rad = (deg * Math.PI) / 180;
  const [dx, dy] = [Math.cos(rad), Math.sin(rad)];
  let best = Infinity;
  for (let i = 0; i < OUTLINE.length - 1; i++) {
    const [px, py] = OUTLINE[i];
    const [ex, ey] = [OUTLINE[i + 1][0] - px, OUTLINE[i + 1][1] - py];
    const det = ex * dy - ey * dx;
    if (Math.abs(det) < 1e-9) continue;
    const t = (ex * (py - FLAME[1]) - ey * (px - FLAME[0])) / det;
    const u = (dx * (py - FLAME[1]) - dy * (px - FLAME[0])) / det;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t);
  }
  return best;
};

function light() {
  const out = [];
  // Fine rays fanning out from the flame. They show between the columns, pass behind the stone,
  // and run on a little way past the building into the open, where they fade away instead of
  // ending (client direction, 11 October 2026).
  let rays = '';
  for (let k = 0; k < 13; k++) {
    const a = 3.5 + k * 4.9 + (k % 3) * 0.5;
    const w = k % 2 ? 0.8 : 1.5;
    for (const side of [-1, 1]) {
      const deg = side < 0 ? 180 + a : 360 - a;
      const far = reach(deg) + 66;
      rays += `M${pt(polar(FLAME, 40, deg))}L${pt(polar(FLAME, far, deg - w / 2))}L${pt(polar(FLAME, far, deg + w / 2))}Z`;
    }
  }
  // The fade: a mask in the shape of the building, a little larger and with a soft edge, so each
  // ray is whole where it leaves the stone and gone some fifty units further out. The mask sits on
  // an outer group, so it keeps still while the rays grow out of the doorway.
  const m = 14;
  const soft = [
    [ENT.l - m, 1000],
    [ENT.l - m, T.frieze],
    [PED.l - m, T.cornice - m / 2],
    [CX, T.apex - m],
    [PED.r + m, T.cornice - m / 2],
    [ENT.r + m, T.frieze],
    [ENT.r + m, 1000],
  ];
  out.push(
    `<filter id="pb-soft" filterUnits="userSpaceOnUse" x="0" y="250" width="1000" height="750"><feGaussianBlur stdDeviation="19"/></filter>`,
  );
  out.push(
    `<mask id="pb-fade" maskUnits="userSpaceOnUse" x="0" y="250" width="1000" height="750"><path d="${poly(soft, true)}" fill="#fff" stroke="none" filter="url(#pb-soft)"/></mask>`,
  );
  out.push(`<g mask="url(#pb-fade)"><g class="pb-beams">${wash(rays, LIGHT)}</g></g>`);
  // the doorway itself: an arch of light between the two middle columns
  out.push(wash(`M444 ${T.stylobate + 10}L444 718A56 56 0 0 1 556 718L556 ${T.stylobate + 10}Z`, LIGHT, ' class="pb-door"'));
  save('light', svg(1000, 1000, out.join('')));
}

function flame() {
  const out = [];
  // light spilling down the steps
  let spill = '';
  for (const [a, w] of [
    [90, 3.2],
    [63, 1.7],
    [117, 1.7],
    [40, 1.1],
    [140, 1.1],
  ]) {
    spill += `M${pt(FLAME)}L${pt(polar(FLAME, 260, a - w / 2))}L${pt(polar(FLAME, 260, a + w / 2))}Z`;
  }
  out.push(`<clipPath id="pb-steps"><path d="${rect(60, T.stylobate, 940, T.ground + 70)}"/></clipPath>`);
  out.push(`<g clip-path="url(#pb-steps)" class="pb-spill">${wash(spill, LIGHT)}</g>`);
  // brazier: a shallow bowl on a slender stand
  out.push(night(`M486 ${T.stylobate}L493 897Q498 888 497.5 870L502.5 870Q502 888 507 897L514 ${T.stylobate}Z`));
  out.push(night('M470 848Q474 871 500 871Q526 871 530 848Z'));
  out.push(path('M476 857Q500 863 524 857'));
  out.push(path('M465 848L535 848'));
  // flame
  out.push(
    `<g class="pb-fire">${wash(
      'M500 848C478 837 474 811 487 790C495 778 499 767 496 748C514 765 529 791 525 817C522 835 513 846 500 848Z',
      'currentColor',
    )}${wash('M501 843C489 833 489 817 498 802C507 813 513 831 501 843Z', LIGHT)}</g>`,
  );
  save('flame', svg(1000, 1000, out.join('')));
}

// =====================================================================================
// Athena
// =====================================================================================
const HEAD = [CX, 176]; // centre of the helmet: crest, disc and rays turn about it
const NIKE = 300; // the axis of the Nike and her orb

function athena() {
  const rand = rng(8);
  const jit = (a) => (rand() - 0.5) * 2 * a;
  const out = [];

  // --- spear, behind everything ---
  {
    const sx = (y) => 714 + (480 - y) * 0.035;
    const at = (y, dx = 0) => [sx(y) + dx, y];
    out.push(stone(poly([at(480, -3.6), at(96, -3.2), at(96, 3.2), at(480, 3.6)])));
    out.push(
      stone(
        `M${pt(at(98))}C${pt(at(86, -15))} ${pt(at(52, -13))} ${pt(at(12))}C${pt(at(52, 13))} ${pt(at(86, 15))} ${pt(at(98))}Z`,
      ),
    );
    out.push(path(poly([at(90), at(40)])));
    out.push(stone(poly([at(96, -6.5), at(96, 6.5), at(106, 6.5), at(106, -6.5)], true)));
  }

  // --- the raised arm that holds the spear, and the mantle hanging from it ---
  {
    const hang = [
      [709, 356],
      [703, 382],
      [688, 414],
      [670, 448],
      [660, 484],
    ];
    out.push(stone(`M606 342L${pt(hang[0])}${curve(hang)}L604 484Z`));
    for (const [x0, x1, bend] of [
      [690, 650, 12],
      [669, 637, 9],
      [648, 625, 6],
      [627, 614, 3],
    ]) {
      out.push(path(`M${x0} ${num(356 - (708 - x0) * 0.12)}Q${num(x0 + bend)} 412 ${x1} 478`));
    }
    out.push(
      stone(
        'M590 324C628 322 664 325 692 329C703 330 708 323 709.5 311L714 244L731 244C734 268 737.5 298 738.5 324C739.5 346 730 358 713 358C686 356 648 350 600 345Z',
      ),
    );
    // bracelet
    out.push(strokes('M713.6 256L732.4 256M713.2 262L733 262'));
  }

  // --- hair: parallel waves from under the helmet to behind the shoulders ---
  {
    const TOP = 189;
    const STRANDS = 3;
    const HALF = 23;
    const centre = (f, y) => lerp(lerp(452.5, 440, f), lerp(459, 423, f), Math.pow((y - TOP) / 132, 1.4));
    for (const side of [-1, 1]) {
      const flip = ([x, y]) => [side < 0 ? x : 2 * CX - x, y];
      const edge = (f, pad) => {
        const pts = [];
        for (let i = 0; i <= 6; i++) {
          const y = TOP + (i / 6) * 134;
          pts.push(flip([centre(f, y) + pad, y]));
        }
        return pts;
      };
      const inner = edge(0, 8);
      const outer = edge(1, -7);
      out.push(
        stone(`M${pt(inner[inner.length - 1])}${curve([...inner].reverse())}L${pt(outer[0])}${curve(outer)}`),
      );
      for (let k = STRANDS - 1; k >= 0; k--) {
        const f = k / (STRANDS - 1);
        let d = `M${pt(flip([centre(f, TOP), TOP]))}`;
        for (let i = 0; i < 6; i++) {
          const y0 = TOP + i * HALF;
          const mid = y0 + HALF / 2;
          const amp = lerp(1.6, 4.6, Math.min(1, i / 3)) * (i % 2 ? 1 : -1);
          d += `Q${pt(flip([centre(f, mid) + amp, mid]))} ${pt(flip([centre(f, y0 + HALF), y0 + HALF]))}`;
        }
        out.push(path(d));
      }
    }
  }

  // --- crest: a fan of horsehair set into a ridge ---
  {
    const A0 = 224;
    const A1 = 316;
    const HAIRS = 30;
    const step = (A1 - A0) / HAIRS;
    const R_IN = 82;
    const R_OUT = 134;
    const arc = (r, to, sweep) => `A${r} ${r} 0 0 ${sweep} ${pt(polar(HEAD, r, to))}`;
    out.push(
      stone(`M${pt(polar(HEAD, 70, A0 + 2))}L${pt(polar(HEAD, R_OUT, A0))}${arc(R_OUT, A1, 1)}L${pt(polar(HEAD, 70, A1 - 2))}`),
    );
    let hairs = '';
    for (let i = 1; i < HAIRS; i++) {
      const a = A0 + i * step;
      const from = i % 2 ? R_IN : 98 + jit(3);
      hairs += `M${pt(polar(HEAD, from, a))}L${pt(polar(HEAD, R_OUT - 2, a + jit(0.2)))}`;
    }
    out.push(strokes(hairs));
    out.push(
      stone(`M${pt(polar(HEAD, 73, A0 - 3))}${arc(73, A1 + 3, 1)}L${pt(polar(HEAD, R_IN, A1 + 3))}${arc(R_IN, A0 - 3, 0)}Z`),
    );
  }

  // --- helmet dome ---
  out.push(
    stone(
      spline([
        [432, 186],
        [432.5, 155],
        [450, 126],
        [500, 109],
        [550, 126],
        [567.5, 155],
        [568, 186],
      ]),
    ),
  );

  // --- torso ---
  const sideL = [
    [477, 297],
    [458, 305],
    [428, 313],
    [399, 323],
    [386, 344],
    [379, 384],
    [375, 424],
    [373, 484],
  ];
  const sideR = [
    [523, 297],
    [542, 305],
    [572, 313],
    [601, 323],
    [609, 344],
    [608, 384],
    [607, 424],
    [607, 484],
  ];
  const torsoD = `M${pt(sideL[0])}${curve(sideL)}L${pt(sideR[sideR.length - 1])}${curve([...sideR].reverse())}Z`;
  out.push(`<clipPath id="pb-torso"><path d="${torsoD}"/></clipPath>`);
  out.push(wash(torsoD, STONE));
  out.push(path(spline(sideL)));
  out.push(path(spline(sideR)));

  // --- aegis: scallop scales on arcs about the throat, a double hem, the medallion ---
  {
    const A = [CX, 290];
    const DEPTH = 16;
    const rows = [];
    for (let k = 0; k < 5; k++) {
      const r = 46 + k * DEPTH;
      const count = Math.round((rad(230) * r) / 21);
      const da = 230 / count;
      let d = '';
      for (let i = -1; i <= count; i++) {
        const a = -25 + (i + (k % 2 ? 0.5 : 0)) * da;
        const p0 = polar(A, r, a);
        const p1 = polar(A, r, a + da);
        const chord = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        d += `M${pt(p0)}A${num(chord / 2)} ${num(DEPTH + 1)} ${num(a + da / 2 + 90)} 0 0 ${pt(p1)}`;
      }
      rows.push(quiet(d));
    }
    const hem = (r) => `M${pt(polar(A, r, -30))}A${r} ${r} 0 1 1 ${pt(polar(A, r, 210))}`;
    out.push(`<g clip-path="url(#pb-torso)">${rows.join('')}${path(hem(126))}${path(hem(133))}${path(hem(38))}${path(hem(46))}</g>`);
    // drapery below the hem
    for (const [x, y0] of [
      [391, 378],
      [404, 393],
      [417, 404],
      [583, 404],
      [596, 393],
    ]) {
      out.push(path(`M${x} ${y0}Q${num(x - (x < CX ? 2 : -2))} ${num(y0 + 30)} ${num(x - (x < CX ? 1 : -1))} 476`));
    }
    // medallion
    const M = [CX, 356];
    out.push(stone(circle(M, 18.5)));
    out.push(path(circle(M, 4)));
    let petals = '';
    for (let i = 0; i < 8; i++) {
      const a = i * 45 + 22.5;
      const tip = polar(M, 14, a);
      petals += `M${pt(polar(M, 4.6, a - 30))}Q${pt(polar(M, 11, a - 22))} ${pt(tip)}Q${pt(polar(M, 11, a + 22))} ${pt(polar(M, 4.6, a + 30))}`;
    }
    out.push(quiet(petals));
  }

  // --- neck ---
  out.push(wash('M476 256L474 300Q500 324 526 300L524 256Z', STONE));
  out.push(strokes('M477.5 263Q479 284 474.5 298M522.5 263Q521 284 525.5 298'));

  // --- face ---
  const jaw = [
    [457, 190],
    [457, 214],
    [461.5, 238],
    [476, 261],
    [500, 273.5],
    [524, 261],
    [538.5, 238],
    [543, 214],
    [543, 190],
  ];
  out.push(stone(spline(jaw)));
  FACE(out);

  // --- brow band of the helmet, its peak and volutes ---
  {
    out.push(stone('M446 181Q473 176 500 162Q527 176 554 181Z'));
    const vl = spiral([434, 186], 9.5, -90, 1.5, -1, 1.5);
    const vr = spiral([566, 186], 9.5, -90, 1.5, 1, 1.5);
    out.push(wash(`${circle([434, 186], 9.5)}${circle([566, 186], 9.5)}`, STONE));
    out.push(stone(`M436 180.5L564 180.5L564 191.5L436 191.5Z`));
    out.push(path(spline(vl)));
    out.push(path(spline(vr)));
    let studs = '';
    for (let i = 0; i < 9; i++) studs += circle([452 + i * 12, 186], 1.5);
    out.push(wash(studs, 'currentColor', ' data-nodraw=""'));
  }

  // --- the hand on the spear ---
  out.push(stone('M712 246Q708 232 713 222Q718 215 726 217Q735 219 735 230L733 246Z'));
  out.push(strokes('M714 226Q724 223 734 227M713 233Q724 230 735 234M713 240Q724 237 734 241'));

  // --- her right arm, the orb and the Nike ---
  {
    const x = NIKE;
    const OY = 390;
    // forearm coming out from behind the roof
    out.push(stone(poly([[x + 20, 398], [394, 420], [384, 452], [x + 15, 416]], true)));
    out.push(strokes(`M${x + 30} 402L${x + 26} 419M${x + 36} 404L${x + 32} 421`));
    // cupped hand
    out.push(
      stone(
        `M${x - 23} ${OY}C${x - 23} ${OY + 20} ${x - 12} ${OY + 30} ${x} ${OY + 30}C${x + 12} ${OY + 30} ${x + 24} ${OY + 23} ${x + 26} ${OY + 7}L${x + 19} ${OY + 4}C${x + 17} ${OY + 15} ${x + 10} ${OY + 19} ${x} ${OY + 19}C${x - 9} ${OY + 19} ${x - 16} ${OY + 14} ${x - 17} ${OY}Z`,
      ),
    );
    // orb
    out.push(stone(circle([x, OY], 17)));
    out.push(path(`M${x - 15.6} ${OY - 5}Q${x} ${OY + 3} ${x + 15.6} ${OY - 5}`));
    // wings, raised
    for (const s of [-1, 1]) {
      const X = (dx) => num(x + s * dx);
      out.push(
        stone(
          `M${X(9)} 300C${X(20)} 287 ${X(37)} 268 ${X(50)} 242Q${X(58)} 262 ${X(50)} 276Q${X(56)} 290 ${X(43)} 299Q${X(46)} 312 ${X(31)} 317Q${X(28)} 326 ${X(8)} 326Z`,
        ),
      );
      out.push(strokes(`M${X(14)} 304Q${X(34)} 296 ${X(50)} 276M${X(13)} 311Q${X(30)} 310 ${X(43)} 299M${X(12)} 318Q${X(22)} 319.5 ${X(31)} 317`));
    }
    // robe
    out.push(
      stone(
        `M${x - 11} 299C${x - 12} 308 ${x - 8.5} 314 ${x - 7.5} 318C${x - 11} 338 ${x - 17} 358 ${x - 20} 374Q${x} 381 ${x + 20} 374C${x + 17} 358 ${x + 11} 338 ${x + 7.5} 318C${x + 8.5} 314 ${x + 12} 308 ${x + 11} 299Q${x} 305 ${x - 11} 299Z`,
      ),
    );
    out.push(path(`M${x - 7.5} 318Q${x} 321.5 ${x + 7.5} 318`));
    out.push(strokes(`M${x - 4} 326Q${x - 7} 350 ${x - 10} 376M${x} 327L${x} 378M${x + 4} 326Q${x + 7} 350 ${x + 10} 376`));
    // head, with her hair bound up
    out.push(stone(circle([x, 283], 9)));
    out.push(path(`M${x - 8.4} 280Q${x} 272 ${x + 8.4} 280`));
  }

  save('athena', svg(1000, 1000, out.join('')));
}

/** The features, in the manner of the site's own athena.svg and strictly symmetric: each brow
 *  runs on down its side of the nose, a small cup closes the nose, almond eyes, a level mouth.
 *  Kept to very few lines: the face is small. */
function FACE(out) {
  for (const s of [-1, 1]) {
    const X = (x) => num(CX + s * (x - CX));
    out.push(
      path(
        `M${X(464.5)} 209.4C${X(470.5)} 202 ${X(483.5)} 200 ${X(490.6)} 204.6C${X(494.2)} 207 ${X(495.2)} 211 ${X(495.2)} 216.4L${X(495.2)} 231.5`,
      ),
    );
    out.push(path(`M${X(466.5)} 219Q${X(478)} 209.6 ${X(489.5)} 219Q${X(478)} 225.6 ${X(466.5)} 219Z`));
    out.push(wash(circle([CX + s * (478 - CX), 218], 3.2), 'currentColor', ' data-nodraw=""'));
  }
  out.push(path('M492.6 237C492.6 242 496 245.2 500 245.2C504 245.2 507.4 242 507.4 237'));
  // mouth, level and closed, and the shadow under the lip
  out.push(path('M490 255.2C493.8 256.8 497.4 255 500 256.2C502.6 255 506.2 256.8 510 255.2'));
  out.push(path('M495.2 262Q500 264 504.8 262'));
}

// =====================================================================================
// The glow behind her head: a disc of light and long wavy rays (the hair of the Nymfi label)
// =====================================================================================
function rays() {
  const rand = rng(11);
  const HALF = 24;
  const AMP = 5.6;
  const R0 = 166;
  const PRIMARY = 36;
  // a crown wider than it is tall, so it stays inside the picture: shortest straight up, longest
  // level with her brow, short again at the shoulders, none below them
  const reach = (deg) => {
    const off = Math.abs(((deg - 270 + 540) % 360) - 180); // 0 = straight up
    if (off <= 90) return lerp(254, 312, Math.pow(off / 90, 1.5));
    return lerp(312, R0, Math.min(1, (off - 90) / 16));
  };
  let d = '';
  for (let i = 0; i < PRIMARY * 2; i++) {
    const between = i % 2 === 1;
    const deg = (i / (PRIMARY * 2)) * 360 + (rand() - 0.5) * 0.6;
    const first = between ? 1 + Math.floor(rand() * 2) : 0;
    const end = reach(deg) - (between ? 6 : 0) + (rand() - 0.5) * 16;
    const last = Math.round((end - R0) / HALF);
    if (last - first < 2) continue;
    const dir = [Math.cos(rad(deg)), Math.sin(rad(deg))];
    const nrm = [-dir[1], dir[0]];
    const amp = AMP * (0.85 + rand() * 0.3);
    const node = (n) => [HEAD[0] + dir[0] * (R0 + n * HALF), HEAD[1] + dir[1] * (R0 + n * HALF)];
    const sign = first % 2 === 0 ? 1 : -1;
    const mid = R0 + (first + 0.5) * HALF;
    const ctrl = [HEAD[0] + dir[0] * mid + nrm[0] * amp * 2 * sign, HEAD[1] + dir[1] * mid + nrm[1] * amp * 2 * sign];
    d += `M${pt(node(first))}Q${pt(ctrl)} ${pt(node(first + 1))}`;
    for (let n = first + 2; n <= last; n++) d += `T${pt(node(n))}`;
  }
  const disc = wash(circle(HEAD, 151), LIGHT, ' data-nodraw=""');
  save('rays', svg(1000, 1000, disc + strokes(d)));
}

// =====================================================================================
// Sky
// =====================================================================================
const SKY_W = 1600;
const SKY_H = 1000;
const COVER = ' preserveAspectRatio="xMidYMid slice"';
const dots = (list) => list.map(([x, y]) => `M${num(x)} ${num(y)}h.01`).join('');

function sky() {
  const rand = rng(4);
  const placed = [];
  const place = (count, gap) => {
    const list = [];
    let guard = 0;
    while (list.length < count && guard++ < count * 60) {
      const p = [rand() * SKY_W, rand() * SKY_H];
      if (placed.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < gap)) continue;
      placed.push(p);
      list.push(p);
    }
    return list;
  };
  // four-point sparks first, so they get the room they need
  const spark = ([x, y], r) => {
    const k = r * 0.14;
    return `M${num(x)} ${num(y - r)}Q${num(x + k)} ${num(y - k)} ${num(x + r)} ${num(y)}Q${num(x + k)} ${num(y + k)} ${num(x)} ${num(y + r)}Q${num(x - k)} ${num(y + k)} ${num(x - r)} ${num(y)}Q${num(x - k)} ${num(y - k)} ${num(x)} ${num(y - r)}Z`;
  };
  // Sparks and the larger dots keep out of the sky the title stands in (left on wide screens, top
  // centre on narrow ones): a dot between two words reads as punctuation, in Greek as an ano
  // teleia. The smallest dots may stay: they read as texture.
  const clear = ([x, y]) =>
    !(x > 70 && x < 810 && y > 130 && y < 700) && !(x > 540 && x < 1060 && y > 50 && y < 380);
  // Sparks also keep out of the crown of rays about Athena's head on wide screens, out of the
  // strip the whole picture stands in on narrow ones, and out of the low sky where the trees
  // stand: a star there tangles with the rays, the spear, the Nike, the roof or a tree top.
  const far = ([x, y], [cx, cy], r) => Math.hypot(x - cx, y - cy) > r;
  const open = (p) =>
    clear(p) && far(p, [1150, 300], 280) && !(p[0] > 540 && p[0] < 1060 && p[1] > 380) && p[1] < 700;
  let sparks = '';
  for (const p of place(7, 150).filter(open)) sparks += spark(p, 15);
  for (const p of place(16, 90).filter(open)) sparks += spark(p, 10.5);
  for (const p of place(34, 60).filter(open)) sparks += spark(p, 6.5);
  const big = place(46, 38).filter(clear);
  const mid = place(130, 26).filter(clear);
  const small = place(300, 17);
  const body =
    path(dots(small), ' stroke-width="2.1" opacity=".75"') +
    path(dots(mid), ' stroke-width="3.1"') +
    path(dots(big), ' stroke-width="4.3"') +
    path(sparks, ' fill="currentColor" stroke="none"');
  save('sky', svg(SKY_W, SKY_H, body, COVER));
}

function milkyway() {
  const rand = rng(31);
  const gauss = () => {
    let s = 0;
    for (let i = 0; i < 6; i++) s += rand();
    return (s - 3) / 0.7071;
  };
  // centre line of the band: it rises from the lower left, passes behind the temple and leaves on the right
  const P = [
    [-60, 930],
    [500, 760],
    [1000, 520],
    [1660, 240],
  ];
  const bez = (t) => {
    const u = 1 - t;
    const b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [0, 1].map((k) => b[0] * P[0][k] + b[1] * P[1][k] + b[2] * P[2][k] + b[3] * P[3][k]);
  };
  const tangent = (t) => {
    const a = bez(Math.max(0, t - 0.01));
    const b = bez(Math.min(1, t + 0.01));
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  };
  const scatter = (count, spread) => {
    const list = [];
    while (list.length < count) {
      const t = rand();
      // the band swells and thins along its length, with a darker lane off its centre
      const swell = 0.62 + 0.38 * Math.sin(t * 9.5 + 0.6) * Math.sin(t * 4.1 + 2);
      if (rand() > 0.35 + 0.65 * swell) continue;
      const off = gauss() * spread * (0.7 + 0.5 * swell);
      if (Math.abs(off + 14 + 22 * Math.sin(t * 13)) < 9 && rand() < 0.8) continue;
      const [x, y] = bez(t);
      const [tx, ty] = tangent(t);
      const p = [x - ty * off + gauss() * 4, y + tx * off + gauss() * 4];
      if (p[0] < -10 || p[0] > SKY_W + 10 || p[1] < -10 || p[1] > SKY_H + 10) continue;
      list.push(p);
    }
    return list;
  };
  const body =
    path(dots(scatter(520, 96)), ' stroke-width="1.5" opacity=".5"') +
    path(dots(scatter(1900, 46)), ' stroke-width="1.6" opacity=".65"') +
    path(dots(scatter(820, 36)), ' stroke-width="2.3" opacity=".8"') +
    path(dots(scatter(200, 28)), ' stroke-width="3.1" opacity=".95"');
  save('milkyway', svg(SKY_W, SKY_H, body, COVER));
}

// =====================================================================================
// Ground and trees
// =====================================================================================
function hill() {
  // a long low rise, level under the temple
  const top = [
    [-1500, 993],
    [-1000, 990],
    [-620, 983],
    [-330, 971],
    [-100, 955],
    [60, 946],
    [200, 944],
    [800, 944],
    [940, 946],
    [1100, 955],
    [1330, 971],
    [1620, 983],
    [2000, 990],
  ];
  const yAt = (x) => {
    let i = 0;
    while (i < top.length - 2 && top[i + 1][0] < x) i++;
    const t = (x - top[i][0]) / (top[i + 1][0] - top[i][0]);
    const e = t * t * (3 - 2 * t);
    return lerp(top[i][1], top[i + 1][1], e);
  };
  const out = [];
  out.push(stone(`M${pt(top[0])}${curve(top)}L2000 1200L-1500 1200Z`));
  // contour lines flowing with the rise
  for (const [dy, x0, x1] of [
    [13, -640, 70],
    [26, -420, 250],
    [26, 750, 1420],
    [39, -230, 1230],
  ]) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const x = lerp(x0, x1, i / 10);
      pts.push([x, yAt(x) + dy * (1 - 0.35 * Math.min(1, Math.abs(x - CX) / 1100))]);
    }
    out.push(path(spline(pts)));
  }
  save('hill', svg(1000, 1000, out.join('')));
}

function cypress(x, base, h, w, rand) {
  const lean = (rand() - 0.5) * w * 0.12;
  const out = [];
  out.push(
    night(
      `M${num(x - w * 0.16)} ${num(base + 60)}C${num(x - w * 0.62)} ${num(base - h * 0.16)} ${num(x - w * 0.44 + lean)} ${num(base - h * 0.7)} ${num(x + lean)} ${num(base - h)}C${num(x + w * 0.44 + lean)} ${num(base - h * 0.7)} ${num(x + w * 0.62)} ${num(base - h * 0.16)} ${num(x + w * 0.16)} ${num(base + 60)}Z`,
    ),
  );
  out.push(
    path(
      `M${num(x - w * 0.2)} ${num(base - h * 0.1)}Q${num(x - w * 0.27)} ${num(base - h * 0.46)} ${num(x - w * 0.06 + lean)} ${num(base - h * 0.82)}` +
        `M${num(x + w * 0.03)} ${num(base + 6)}Q${num(x - w * 0.04)} ${num(base - h * 0.4)} ${num(x + w * 0.04 + lean)} ${num(base - h * 0.68)}` +
        `M${num(x + w * 0.22)} ${num(base - h * 0.06)}Q${num(x + w * 0.27)} ${num(base - h * 0.34)} ${num(x + w * 0.15 + lean)} ${num(base - h * 0.56)}`,
    ),
  );
  return out.join('');
}

/** Umbrella pine: a bare trunk, two or three boughs, and a crown of stacked caps. */
function pine(x, base, h, w, rand, lean = 0) {
  const out = [];
  const crownY = base - h * 0.7; // where the boughs part
  const top = [x + lean, crownY];
  const trunkW = Math.max(9, w * 0.068);
  // crown caps: [dx, dy, rx] as shares of w and of the crown height
  const ch = h * 0.36;
  const caps = [
    [0.02, -0.98, 0.2],
    [-0.2, -0.74, 0.21],
    [0.22, -0.72, 0.22],
    [-0.02, -0.5, 0.25],
    [-0.36, -0.36, 0.2],
    [0.38, -0.34, 0.2],
    [-0.17, -0.14, 0.23],
    [0.17, -0.12, 0.24],
  ].map(([dx, dy, rx]) => ({
    cx: top[0] + dx * w + (rand() - 0.5) * w * 0.03,
    cy: crownY - h * 0.02 + dy * ch + ch * 0.28,
    rx: rx * w,
  }));
  // boughs
  const low = caps.slice(-4);
  let boughs = '';
  for (const c of [low[0], low[1]]) {
    const from = [lerp(x, top[0], 0.78), lerp(base, crownY, 0.78)];
    boughs += `M${pt(from)}Q${pt([lerp(from[0], c.cx, 0.35), c.cy + 30])} ${pt([c.cx, c.cy])}`;
  }
  out.push(path(boughs));
  // trunk
  out.push(
    night(
      `M${num(x - trunkW / 2)} ${num(base + 60)}Q${num(x - trunkW * 0.4 + lean * 0.2)} ${num(lerp(base, crownY, 0.5))} ${num(top[0] - trunkW * 0.3)} ${num(crownY - ch * 0.2)}L${num(top[0] + trunkW * 0.3)} ${num(crownY - ch * 0.2)}Q${num(x + trunkW * 0.4 + lean * 0.2)} ${num(lerp(base, crownY, 0.5))} ${num(x + trunkW / 2)} ${num(base + 60)}Z`,
    ),
  );
  for (const { cx, cy, rx } of caps) {
    const ry = rx * 0.78;
    out.push(
      night(
        `M${num(cx - rx)} ${num(cy)}A${num(rx)} ${num(ry)} 0 0 1 ${num(cx + rx)} ${num(cy)}Q${num(cx)} ${num(cy + ry * 0.34)} ${num(cx - rx)} ${num(cy)}Z`,
      ),
    );
    out.push(
      path(
        `M${num(cx - rx * 0.6)} ${num(cy - ry * 0.12)}A${num(rx * 0.6)} ${num(ry * 0.56)} 0 0 1 ${num(cx + rx * 0.6)} ${num(cy - ry * 0.12)}`,
      ),
    );
  }
  return out.join('');
}

function shrub(x, base, w, rand) {
  const h = w * 0.5;
  const n = 3;
  let d = `M${num(x - w / 2)} ${num(base + 30)}L${num(x - w / 2)} ${num(base)}`;
  for (let i = 0; i < n; i++) {
    const x0 = x - w / 2 + (i * w) / n;
    const x1 = x0 + w / n;
    const lift = h * (0.7 + 0.3 * Math.sin(((i + 0.5) / n) * Math.PI)) * (0.9 + rand() * 0.2);
    d += `C${num(x0 + 2)} ${num(base - lift)} ${num(x1 - 2)} ${num(base - lift)} ${num(x1)} ${num(base)}`;
  }
  return night(`${d}L${num(x + w / 2)} ${num(base + 30)}Z`);
}

function trees() {
  {
    // lower left corner: low, so the title keeps its sky
    const rand = rng(3);
    const B = 330;
    // (the corner itself stays open: the round music button of the site sits there)
    const body =
      cypress(286, B + 2, 168, 34, rand) +
      pine(184, B + 6, 204, 150, rand, 6) +
      cypress(336, B + 10, 112, 27, rand) +
      pine(452, B + 14, 128, 98, rand, -5) +
      shrub(388, B + 16, 56, rand) +
      shrub(534, B + 20, 70, rand) +
      cypress(596, B + 20, 78, 21, rand);
    save('trees-left', svg(620, 360, body));
  }
  {
    // lower right corner: cypresses standing beside the temple, a little in front of it
    const rand = rng(9);
    const B = 400;
    const body =
      cypress(214, B + 4, 338, 46, rand) +
      cypress(150, B + 8, 232, 38, rand) +
      cypress(266, B + 10, 190, 34, rand) +
      cypress(92, B + 12, 138, 28, rand) +
      shrub(40, B + 16, 66, rand) +
      shrub(190, B + 20, 60, rand);
    save('trees-right', svg(320, 430, body));
  }
}

function ground() {
  // CLIENT DIRECTION, 11 October 2026: one line, end to end, and nothing else (no furrows, no
  // contour lines). It is nearly level, with only the waver of a line drawn by hand, because the
  // temple stands on it: the page places it at the height of the lowest step (y 946 in the scene).
  const W = 3200;
  const rand = rng(17);
  const top = [];
  for (let x = -40; x <= W + 40; x += 160) top.push([x, 46 + Math.sin(x / 420) * 2.2 + (rand() - 0.5) * 1.6]);
  const out = [];
  // The wash below the line has no outline and runs far down: the picture fades into the page
  // below the first screen, so nothing may end there with an edge. Only the ground line is drawn.
  out.push(`<path d="M${pt(top[0])}${curve(top)}L${W + 40} 2000L-40 2000Z" fill="var(--pb-night, #071260)" stroke="none"/>`);
  out.push(path(`M${pt(top[0])}${curve(top)}`));
  save('ground', svg(W, 140, out.join('')));
}

temple();
cella();
light();
flame();
athena();
rays();
sky();
milkyway();
hill();
trees();
ground();
