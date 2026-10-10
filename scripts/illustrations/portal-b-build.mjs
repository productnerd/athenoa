// Generates the line art for the "Portal B" home hero (src/components/home/hero/PortalB.astro):
// the original hero picture of athenoa.academy redrawn as a night print in the site's manner.
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
const mirror = (pts) => pts.map(([x, y]) => [2 * CX - x, y]);

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
    out.push(path(flutes));
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
  out.push(path(grooves));
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

function light() {
  const out = [];
  // fine rays fanning out from the flame, seen between the columns
  let rays = '';
  for (let k = 0; k < 13; k++) {
    const a = 3.5 + k * 4.9 + (k % 3) * 0.5;
    const w = k % 2 ? 0.8 : 1.5;
    for (const side of [-1, 1]) {
      const deg = side < 0 ? 180 + a : 360 - a;
      rays += `M${pt(polar(FLAME, 40, deg))}L${pt(polar(FLAME, 480, deg - w / 2))}L${pt(polar(FLAME, 480, deg + w / 2))}Z`;
    }
  }
  out.push(`<clipPath id="pb-cella"><path d="${rect(AX[0], T.abacus, AX[5], T.stylobate + 2)}"/></clipPath>`);
  out.push(`<g clip-path="url(#pb-cella)" class="pb-beams">${wash(rays, LIGHT)}</g>`);
  // the doorway itself: an arch of light between the two middle columns
  out.push(wash(`M444 ${T.stylobate + 4}L444 718A56 56 0 0 1 556 718L556 ${T.stylobate + 4}Z`, LIGHT, ' class="pb-door"'));
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
const NIKE = 306; // the axis of the Nike and her orb

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

  // --- the raised arm that holds the spear, and the sleeve hanging from it ---
  {
    // sleeve
    const hang = [
      [704, 331],
      [707, 362],
      [697, 402],
      [680, 446],
      [672, 480],
    ];
    out.push(stone(`M606 344L${pt(hang[0])}${curve(hang)}L604 480Z`));
    for (const [x0, x1, bend] of [
      [684, 668, 9],
      [662, 650, 7],
      [641, 634, 5],
      [622, 619, 3],
    ]) {
      out.push(path(`M${x0} ${num(336 + (704 - x0) * 0.1)}Q${num(x0 + bend)} 392 ${x1} 470`));
    }
    // arm
    out.push(
      stone(
        'M596 316C630 311 668 306 700 303C708 302 711 297 712 288L715 240L731 240C733 262 735 286 736 306C737 322 733 331 722 333C690 335 650 340 610 346Z',
      ),
    );
    // bracelet
    out.push(path('M714 252L732 252M714 258L732.5 258'));
  }

  // --- hair: parallel waves from under the helmet to behind the shoulders ---
  {
    const TOP = 188;
    const STRANDS = 4;
    const HALF = 19;
    const centre = (f, y) => lerp(lerp(458, 439, f), lerp(466, 414, f), Math.pow((y - TOP) / 130, 1.5));
    for (const side of [-1, 1]) {
      const flip = ([x, y]) => [side < 0 ? x : 2 * CX - x, y];
      const edge = (f, pad) => {
        const pts = [];
        for (let i = 0; i <= 6; i++) {
          const y = TOP + (i / 6) * 132;
          pts.push(flip([centre(f, y) + pad, y]));
        }
        return pts;
      };
      const inner = edge(0, 6);
      const outer = edge(1, -6);
      out.push(
        wash(`M${pt(outer[0])}${curve(outer)}L${pt(inner[inner.length - 1])}${curve([...inner].reverse())}Z`, STONE),
      );
      for (let k = STRANDS - 1; k >= 0; k--) {
        const f = k / (STRANDS - 1);
        let d = `M${pt(flip([centre(f, TOP), TOP]))}`;
        for (let i = 0; i < 7; i++) {
          const y0 = TOP + i * HALF;
          const mid = y0 + HALF / 2;
          const amp = lerp(2.5, 6.5, Math.min(1, i / 3)) * (i % 2 ? 1 : -1);
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
    out.push(path(hairs));
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
    [373, 480],
  ];
  const sideR = [
    [523, 297],
    [542, 305],
    [572, 313],
    [601, 323],
    [609, 344],
    [608, 384],
    [607, 424],
    [607, 480],
  ];
  const torsoD = `M${pt(sideL[0])}${curve(sideL)}L${pt(sideR[sideR.length - 1])}${curve([...sideR].reverse())}Z`;
  out.push(`<clipPath id="pb-torso"><path d="${torsoD}"/></clipPath>`);
  out.push(wash(torsoD, STONE));
  out.push(path(spline(sideL)));
  out.push(path(spline(sideR)));

  // --- aegis: scallop scales on arcs about the throat, a double hem, the medallion ---
  {
    const A = [CX, 286];
    const DEPTH = 14.5;
    const rows = [];
    for (let k = 0; k < 6; k++) {
      const r = 46 + k * DEPTH;
      const count = Math.round((rad(230) * r) / 19);
      const da = 230 / count;
      let d = '';
      for (let i = -1; i <= count; i++) {
        const a = -25 + (i + (k % 2 ? 0.5 : 0)) * da;
        const p0 = polar(A, r, a);
        const p1 = polar(A, r, a + da);
        const chord = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        d += `M${pt(p0)}A${num(chord / 2)} ${num(DEPTH + 1)} ${num(a + da / 2 + 90)} 0 0 ${pt(p1)}`;
      }
      rows.push(path(d));
    }
    const hem = (r) => `M${pt(polar(A, r, -30))}A${r} ${r} 0 1 1 ${pt(polar(A, r, 210))}`;
    out.push(`<g clip-path="url(#pb-torso)">${rows.join('')}${path(hem(125))}${path(hem(132))}</g>`);
    // drapery below the hem
    for (const [x, y0] of [
      [391, 370],
      [404, 386],
      [417, 398],
      [583, 398],
      [596, 386],
    ]) {
      out.push(path(`M${x} ${y0}Q${num(x - (x < CX ? 2 : -2))} ${num(y0 + 30)} ${num(x - (x < CX ? 1 : -1))} 470`));
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
    out.push(path(petals));
  }

  // --- neck ---
  out.push(wash('M478 258L476 300Q500 322 524 300L522 258Z', STONE));
  out.push(path('M479 262Q480 284 476 298M521 262Q520 284 524 298'));
  out.push(path('M471 300Q500 327 529 300'));
  out.push(path('M463 305Q500 340 537 305'));

  // --- face ---
  const jaw = [
    [461, 190],
    [461, 216],
    [466, 242],
    [481, 264],
    [500, 273],
    [519, 264],
    [534, 242],
    [539, 216],
    [539, 190],
  ];
  out.push(stone(spline(jaw)));
  for (const s of [-1, 1]) {
    const X = (x) => num(CX + s * (x - CX));
    // brow running down into the side of the nose
    out.push(
      path(
        `M${X(468)} 207.5Q${X(479)} 199 ${X(490.5)} 203.5C${X(494.5)} 205.5 ${X(495.3)} 212 ${X(495.3)} 220L${X(495.3)} 236Q${X(494.5)} 242 ${X(490.5)} 243.5Q${X(489.5)} 247.5 ${X(494)} 248`,
      ),
    );
    // almond eye
    out.push(path(`M${X(470.5)} 217.5Q${X(481)} 208.5 ${X(491.5)} 217.5Q${X(481)} 224 ${X(470.5)} 217.5Z`));
    out.push(wash(circle([CX + s * (481 - CX), 216.6], 3.3), 'currentColor'));
  }
  out.push(path('M494 248Q500 251.5 506 248'));
  // mouth and the shadow under the lip
  out.push(path('M489.5 257.6Q495 255.4 500 257.4Q505 255.4 510.5 257.6'));
  out.push(path('M494.5 262.6Q500 264.8 505.5 262.6'));

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
  out.push(stone('M712 242Q708 228 713 218Q718 211 726 213Q735 215 735 226L733 242Z'));
  out.push(path('M714 222Q724 219 734 223M713 229Q724 226 735 230M713 236Q724 233 734 237'));

  // --- her right arm, the orb and the Nike ---
  {
    const x = NIKE;
    // forearm coming out from behind the roof
    out.push(stone(poly([[x + 22, 404], [392, 426], [380, 452], [x + 16, 421]], true)));
    out.push(path(`M${x + 30} 408L${x + 26} 422M${x + 36} 410L${x + 32} 424`));
    // cupped hand
    out.push(
      stone(
        `M${x - 21} 397C${x - 21} 416 ${x - 10} 425 ${x} 425C${x + 11} 425 ${x + 22} 418 ${x + 24} 403L${x + 17} 400C${x + 15} 410 ${x + 9} 414 ${x} 414C${x - 8} 414 ${x - 14} 409 ${x - 15} 397Z`,
      ),
    );
    // orb
    out.push(stone(circle([x, 397], 15)));
    out.push(path(`M${x - 13.5} 392Q${x} 399 ${x + 13.5} 392`));
    // wings
    for (const s of [-1, 1]) {
      const X = (dx) => num(x + s * dx);
      out.push(
        stone(
          `M${X(7)} 313C${X(18)} 304 ${X(34)} 286 ${X(40)} 262Q${X(42)} 280 ${X(34)} 289Q${X(36)} 300 ${X(26)} 305Q${X(26)} 316 ${X(16)} 319Q${X(14)} 327 ${X(7)} 328Z`,
        ),
      );
      out.push(path(`M${X(11)} 314Q${X(24)} 304 ${X(34)} 289M${X(10)} 319Q${X(18)} 314 ${X(26)} 305`));
    }
    // arms: one hangs by her side, one lifts a wreath towards the goddess
    out.push(path(`M${x - 8} 314Q${x - 15} 324 ${x - 13} 340`));
    out.push(path(`M${x + 8} 314Q${x + 19} 311 ${x + 26} 300`));
    out.push(stone(circle([x + 31, 294], 6.5)));
    // robe
    out.push(
      stone(
        `M${x - 9} 311C${x - 10} 320 ${x - 7} 326 ${x - 6.5} 330C${x - 9} 348 ${x - 14} 366 ${x - 16} 383Q${x} 389 ${x + 16} 383C${x + 14} 366 ${x + 9} 348 ${x + 6.5} 330C${x + 7} 326 ${x + 10} 320 ${x + 9} 311Q${x} 316 ${x - 9} 311Z`,
      ),
    );
    out.push(path(`M${x - 6.5} 330Q${x} 333 ${x + 6.5} 330`));
    out.push(path(`M${x - 3} 337Q${x - 5} 360 ${x - 7} 384M${x} 338L${x} 385M${x + 3} 337Q${x + 5} 360 ${x + 7} 384`));
    // head, with her hair knotted behind
    out.push(stone(circle([x, 298], 7.6)));
    out.push(path(`M${x - 7} 295Q${x} 288 ${x + 7} 295`));
  }

  save('athena', svg(1000, 1000, out.join('')));
}

// =====================================================================================
// The glow behind her head: a disc of light and long wavy rays (the hair of the Nymfi label)
// =====================================================================================
function rays() {
  const rand = rng(11);
  const HALF = 30;
  const AMP = 6;
  const R0 = 166;
  const PRIMARY = 46;
  // a crown: longest straight up, short at the shoulders, none below them
  const reach = (deg) => {
    const off = Math.abs(((deg - 270 + 540) % 360) - 180); // 0 = straight up
    if (off <= 90) return lerp(590, 318, Math.pow(off / 90, 1.35));
    return lerp(318, R0, Math.min(1, (off - 90) / 26));
  };
  let d = '';
  for (let i = 0; i < PRIMARY * 2; i++) {
    const between = i % 2 === 1;
    const deg = (i / (PRIMARY * 2)) * 360 + (rand() - 0.5) * 0.6;
    const first = between ? 3 + Math.floor(rand() * 2) : 0;
    const end = reach(deg) * (between ? 0.86 : 1) + (rand() - 0.5) * 26;
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
  save('rays', svg(1000, 1000, disc + path(d)));
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
  let sparks = '';
  for (const p of place(6, 150)) sparks += spark(p, 15);
  for (const p of place(14, 90)) sparks += spark(p, 10.5);
  for (const p of place(30, 60)) sparks += spark(p, 6.5);
  const big = place(46, 38);
  const mid = place(130, 26);
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
  // centre line of the band, lower left to upper right
  const P = [
    [40, 1090],
    [520, 800],
    [900, 470],
    [1500, -90],
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
    path(dots(scatter(1500, 62)), ' stroke-width="1.5" opacity=".6"') +
    path(dots(scatter(620, 50)), ' stroke-width="2.2" opacity=".75"') +
    path(dots(scatter(150, 40)), ' stroke-width="3" opacity=".9"');
  save('milkyway', svg(SKY_W, SKY_H, body, COVER));
}

// =====================================================================================
// Ground and trees
// =====================================================================================
function hill() {
  const top = [
    [-900, 1004],
    [-520, 992],
    [-200, 972],
    [20, 953],
    [200, 945],
    [800, 945],
    [980, 953],
    [1200, 972],
    [1520, 992],
    [1900, 1004],
  ];
  const out = [];
  out.push(stone(`M${pt(top[0])}${curve(top)}L1900 1200L-900 1200Z`));
  // contour lines following the rise
  for (const [dy, x0, x1] of [
    [15, -420, 60],
    [15, 940, 1420],
    [31, -180, 330],
    [31, 700, 1180],
    [47, 150, 870],
  ]) {
    const line = top.map(([x, y]) => [x, y + dy + Math.pow(Math.abs(x - CX) / 900, 2) * dy * 0.8]);
    const pts = [];
    for (let x = x0; x <= x1; x += (x1 - x0) / 8) {
      let i = 0;
      while (i < line.length - 2 && line[i + 1][0] < x) i++;
      const t = (x - line[i][0]) / (line[i + 1][0] - line[i][0]);
      pts.push([x, lerp(line[i][1], line[i + 1][1], t)]);
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
  const trunkW = Math.max(7, w * 0.05);
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
    const body =
      cypress(196, B + 4, 168, 34, rand) +
      pine(96, B + 8, 236, 150, rand, 8) +
      cypress(262, B + 10, 120, 28, rand) +
      cypress(30, B + 12, 150, 34, rand) +
      pine(372, B + 16, 128, 96, rand, -4) +
      shrub(318, B + 18, 60, rand) +
      shrub(468, B + 22, 74, rand) +
      cypress(540, B + 22, 78, 22, rand);
    save('trees-left', svg(620, 360, body));
  }
  {
    // lower right corner: taller, beside and a little in front of the temple
    const rand = rng(9);
    const B = 560;
    const body =
      cypress(58, B + 6, 150, 30, rand) +
      cypress(128, B + 2, 250, 40, rand) +
      pine(262, B + 10, 470, 220, rand, 10) +
      cypress(190, B + 12, 178, 34, rand) +
      shrub(86, B + 16, 64, rand) +
      pine(352, B + 18, 220, 130, rand, -6) +
      shrub(12, B + 20, 56, rand);
    save('trees-right', svg(420, 590, body));
  }
}

function ground() {
  const W = 3200;
  const rand = rng(17);
  const top = [];
  for (let x = -40; x <= W + 40; x += 160) top.push([x, 46 + Math.sin(x / 310) * 9 + (rand() - 0.5) * 6]);
  const out = [];
  out.push(night(`M${pt(top[0])}${curve(top)}L${W + 40} 260L-40 260Z`));
  // a second line under the first, broken, like a furrow
  let furrow = '';
  for (let x = 60; x < W; x += 380 + rand() * 120) {
    const len = 150 + rand() * 120;
    const y = 70 + Math.sin(x / 310) * 7 + rand() * 8;
    furrow += `M${num(x)} ${num(y)}Q${num(x + len / 2)} ${num(y - 7)} ${num(x + len)} ${num(y + 1)}`;
  }
  out.push(path(furrow));
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
