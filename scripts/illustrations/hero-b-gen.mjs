// Generates the line art for the "Label" home hero (src/components/home/hero/HeroB.astro).
// node scripts/illustrations/hero-b-gen.mjs
//
// Everything that sits on the arch shares one 720 x 900 "stage" so the layers register:
//   hero-b-rays-out   wavy rays in the band between the outer hairline and the blue arch
//   hero-b-rays-in    the same rays inside the blue arch (they change ink at the edge)
//   hero-b-athena     the bust
// Free ornaments have their own boxes: hero-b-owl, hero-b-olive, hero-b-sprig, hero-b-star.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../src/assets/illustrations');
const PAPER = 'var(--paper, #f2e9d3)';
const W = 720;
const H = 900;
const CX = 360;

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
const mirror = (pts) => pts.map(([x, y]) => [2 * CX - x, y]);

/** Smooth curve through points (Catmull-Rom as cubic Béziers). Returns the commands after "M". */
function curve(pts, closed = false, k = 1) {
  const n = pts.length;
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = '';
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
}
const spline = (pts, closed = false, k = 1) => `M${pt(pts[0])}${curve(pts, closed, k)}${closed ? 'Z' : ''}`;
const poly = (pts, closed = false) => `M${pts.map(pt).join('L')}${closed ? 'Z' : ''}`;

const path = (d, attrs = '') => `<path d="${d}"${attrs}/>`;
const solid = (d) => path(d, ` fill="${PAPER}"`);
/** A shape that only hides what is behind it: no outline. */
const mask = (d) => path(d, ` fill="${PAPER}" stroke="none"`);
/** Texture that fades in instead of being drawn stroke by stroke. */
const quiet = (d, attrs = '') => path(d, ` data-nodraw${attrs}`);
const dot = ([x, y], r) =>
  `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="currentColor" stroke="none" data-nodraw/>`;
const ring = ([x, y], r, fill = false) =>
  `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}"${fill ? ` fill="${PAPER}"` : ''}/>`;

const svg = (w, h, strokeWidth, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;

function save(name, content) {
  writeFileSync(join(OUT, `${name}.svg`), content);
  console.log(`${name}.svg  ${(content.length / 1024).toFixed(1)} KB`);
}

/** Archimedean spiral, from radius r0 at angle a0, winding inwards. */
function spiral(c, r0, a0, turns, dir = 1, r1 = 1.5) {
  const pts = [];
  const steps = Math.ceil(turns * 10);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push(polar(c, lerp(r0, r1, t), a0 + dir * 360 * turns * t));
  }
  return pts;
}

// ---------- stage geometry (must match the CSS in HeroB.astro) ----------
// Arch: semicircular top, straight sides. { l, r, t, b }
const ARCH_OUT = { l: 14, r: 706, t: 14, b: 886 };
const ARCH_IN = { l: 84, r: 636, t: 84, b: 820 };
const HEAD = [CX, 334]; // centre of the helmet: rays and crest radiate from here

function insideArch(a, x, y) {
  const R = (a.r - a.l) / 2;
  if (x < a.l || x > a.r || y > a.b || y < a.t) return false;
  if (y >= a.t + R) return true;
  return Math.hypot(x - (a.l + R), y - (a.t + R)) <= R;
}
function edgeDistance(a, deg) {
  let r = 0;
  for (; r < 900; r += 2) {
    const [x, y] = polar(HEAD, r, deg);
    if (!insideArch(a, x, y)) break;
  }
  return r;
}

// ---------- rays ----------
function rays() {
  const rand = rng(11);
  const HALF = 37; // half a wavelength
  const AMP = 7.5;
  const R0 = 112;
  const MARGIN = 64; // overlap either side of the blue arch edge, so parallax never opens a gap
  const PRIMARY = 60;
  const lines = [];
  for (let i = 0; i < PRIMARY * 4; i++) {
    const order = i % 4 === 0 ? 0 : i % 2 === 0 ? 1 : 2;
    const deg = (i / (PRIMARY * 4)) * 360 + (rand() - 0.5) * 0.5;
    const first = order === 0 ? 0 : order === 1 ? 2 + Math.floor(rand() * 3) : 8 + Math.floor(rand() * 3);
    lines.push({ deg, first, amp: AMP * (0.85 + rand() * 0.3) });
  }

  // One wavy radial line between node indices n0 and n1, as "M Q T T T".
  const wavy = ({ deg, amp }, n0, n1) => {
    const dir = [Math.cos(rad(deg)), Math.sin(rad(deg))];
    const nrm = [-dir[1], dir[0]];
    const node = (n) => {
      const r = R0 + n * HALF;
      return [HEAD[0] + dir[0] * r, HEAD[1] + dir[1] * r];
    };
    const sign = n0 % 2 === 0 ? 1 : -1;
    const mid = R0 + (n0 + 0.5) * HALF;
    const ctrl = [
      HEAD[0] + dir[0] * mid + nrm[0] * amp * 2 * sign,
      HEAD[1] + dir[1] * mid + nrm[1] * amp * 2 * sign,
    ];
    let d = `M${pt(node(n0))}Q${pt(ctrl)} ${pt(node(n0 + 1))}`;
    for (let n = n0 + 2; n <= n1; n++) d += `T${pt(node(n))}`;
    return d;
  };

  let dIn = '';
  let dOut = '';
  for (const line of lines) {
    const eIn = edgeDistance(ARCH_IN, line.deg);
    const eOut = edgeDistance(ARCH_OUT, line.deg);
    const lastIn = Math.ceil((eIn + MARGIN - R0) / HALF);
    if (line.first < lastIn - 1) dIn += wavy(line, line.first, lastIn);
    const firstOut = Math.max(line.first, Math.floor((eIn - MARGIN - R0) / HALF));
    const lastOut = Math.ceil((eOut + MARGIN - R0) / HALF);
    if (firstOut < lastOut - 1) dOut += wavy(line, firstOut, lastOut);
  }
  save('hero-b-rays-in', svg(W, H, 2.4, path(dIn)));
  save('hero-b-rays-out', svg(W, H, 2.4, path(dOut)));
}

// ---------- Athena ----------
function athena() {
  const rand = rng(5);
  const out = [];
  const jit = (v, amount = 1) => v + (rand() - 0.5) * 2 * amount;

  // --- spear, behind everything ---
  {
    const base = [596, 910];
    const neck = [566, 338];
    const ux = (neck[0] - base[0]) / (neck[1] - base[1]);
    const at = (y, dx = 0) => [base[0] + (y - base[1]) * ux + dx, y];
    out.push(solid(poly([at(910, -4), at(344, -4), at(344, 4), at(910, 4)])));
    // leaf-shaped head with a midrib
    const tip = at(232);
    out.push(
      solid(
        `M${pt(at(340, 0))}C${pt(at(322, -20))} ${pt(at(286, -19))} ${pt(tip)}C${pt(at(286, 19))} ${pt(at(322, 20))} ${pt(at(340, 0))}Z`,
      ),
    );
    out.push(path(poly([at(332), at(262)])));
    out.push(solid(poly([at(338, -8), at(338, 8), at(350, 8), at(350, -8)], true)));
  }

  // --- hair: two falls of parallel waves from under the helmet to behind the shoulders ---
  {
    const STRANDS = 8;
    const HALF_WAVE = 33;
    const TOP = 344;
    // centre line of strand f (0 next to the face, 1 outermost): close to the cheek, then out over the shoulder
    const centre = (f, y) => lerp(lerp(293, 249, f), lerp(336, 148, f), Math.pow((y - TOP) / 380, 1.7));
    for (const side of [-1, 1]) {
      const flip = ([x, y]) => [side < 0 ? x : 2 * CX - x, y];
      const strand = (f) => {
        let d = `M${pt(flip([centre(f, TOP), TOP]))}`;
        for (let i = 0; i < 12; i++) {
          const y0 = TOP + i * HALF_WAVE;
          const mid = y0 + HALF_WAVE / 2;
          const amp = lerp(3, 10.5, Math.min(1, i / 5)) * (i % 2 ? 1 : -1);
          d += `Q${pt(flip([centre(f, mid) + amp, mid]))} ${pt(flip([centre(f, y0 + HALF_WAVE), y0 + HALF_WAVE]))}`;
        }
        return d;
      };
      // the shape that hides the rays behind the hair, a little wider than the outer strands
      const edge = (f, pad) => {
        const pts = [];
        for (let i = 0; i <= 8; i++) {
          const y = TOP + (i / 8) * 396;
          pts.push(flip([centre(f, y) + pad, y]));
        }
        return pts;
      };
      const inner = edge(0, 9);
      const outer = edge(1, -9);
      out.push(mask(`M${pt(outer[0])}${curve(outer)}L${pt(inner[inner.length - 1])}${curve([...inner].reverse())}Z`));
      for (let k = STRANDS - 1; k >= 0; k--) out.push(path(strand(k / (STRANDS - 1))));
    }
  }

  // --- crest: a fan of horsehair set into a ridge ---
  {
    const A0 = 217;
    const A1 = 323;
    const HAIRS = 34;
    const step = (A1 - A0) / HAIRS;
    const R_IN = 127;
    const R_OUT = 201;
    const arc = (r, to, sweep) => `A${r} ${r} 0 0 ${sweep} ${pt(polar(HEAD, r, to))}`;
    out.push(
      solid(
        `M${pt(polar(HEAD, 104, A0 + 2))}L${pt(polar(HEAD, R_OUT, A0))}${arc(R_OUT, A1, 1)}L${pt(polar(HEAD, 104, A1 - 2))}`,
      ),
    );
    for (let i = 1; i < HAIRS; i++) {
      const a = A0 + i * step;
      const from = i % 2 ? R_IN : jit(152, 5);
      out.push(path(`M${pt(polar(HEAD, from, a))}L${pt(polar(HEAD, R_OUT - 2, a + jit(0, 0.25)))}`));
    }
    // ridge the plume is set into
    out.push(
      solid(
        `M${pt(polar(HEAD, 113, A0 - 2.5))}${arc(113, A1 + 2.5, 1)}L${pt(polar(HEAD, R_IN, A1 + 2.5))}${arc(R_IN, A0 - 2.5, 0)}Z`,
      ),
    );
  }

  // --- helmet dome ---
  const dome = [
    [252, 344],
    [253, 298],
    [282, 253],
    [360, 229],
    [438, 253],
    [467, 298],
    [468, 344],
  ];
  out.push(solid(spline(dome)));

  // --- shoulders and dress ---
  const torsoL = [
    [316, 588],
    [272, 610],
    [208, 636],
    [158, 664],
    [128, 702],
    [113, 770],
    [106, 910],
  ];
  const torso = [...torsoL, ...mirror(torsoL).reverse()];
  const torsoD = `M${pt(torso[0])}${curve(torsoL)}L${pt(torso[torsoL.length])}${curve(mirror(torsoL).reverse())}Z`;
  out.push(`<clipPath id="hb-torso"><path d="${torsoD}"/></clipPath>`);
  out.push(mask(torsoD));
  out.push(path(spline(torsoL)));
  out.push(path(spline(mirror(torsoL))));

  const AEGIS = [CX, 520]; // the scales lie on arcs around this point
  const HEM = 250;
  const shoulderY = (x) => {
    const ax = x > CX ? 2 * CX - x : x;
    for (let i = 0; i < torsoL.length - 1; i++) {
      const [x0, y0] = torsoL[i];
      const [x1, y1] = torsoL[i + 1];
      if (ax <= x0 && ax >= x1) return lerp(y0, y1, (x0 - ax) / (x0 - x1 || 1));
    }
    return 588;
  };
  // drapery below the aegis: long folds, every other one starting lower
  let fold = 0;
  for (let x = 128; x <= 592; x += 25.8) {
    const dx = x - CX;
    const hemY = Math.abs(dx) < HEM + 20 ? AEGIS[1] + Math.sqrt((HEM + 20) ** 2 - dx ** 2) : 0;
    const y0 = Math.max(hemY + 12, shoulderY(x) + 22) + (fold++ % 2 ? 34 : 0);
    if (y0 > 870) continue;
    const sway = dx * 0.05;
    out.push(
      path(`M${pt([jit(x, 1.5), y0])}Q${pt([x - sway * 0.6, lerp(y0, 910, 0.5)])} ${pt([x + sway, 910])}`),
    );
  }

  // --- aegis: scales, hem with snake curls, medallion ---
  {
    const rows = [];
    const DEPTH = 17.5;
    for (let k = 0; k < 7; k++) {
      const r = 124 + k * DEPTH;
      const count = Math.round((rad(150) * r) / 27);
      const da = 150 / count;
      let d = '';
      for (let i = -1; i <= count; i++) {
        const a = 15 + (i + (k % 2 ? 0.5 : 0)) * da;
        const p0 = polar(AEGIS, r, a);
        const p1 = polar(AEGIS, r, a + da);
        const chord = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        d += `M${pt(p0)}A${num(chord / 2)} ${num(DEPTH + 1.5)} ${num(a + da / 2 + 90)} 0 0 ${pt(p1)}`;
      }
      rows.push(quiet(d));
    }
    // hem band
    const hemArc = (r) => `M${pt(polar(AEGIS, r, 12))}A${r} ${r} 0 0 1 ${pt(polar(AEGIS, r, 168))}`;
    const curls = [];
    for (let a = 34; a <= 146; a += 11.2) {
      const c = polar(AEGIS, HEM + 20, a + 2.6);
      const start = polar(AEGIS, HEM + 6, a - 1.8);
      const sp = spiral(c, 10.5, a + 150, 1.05, 1, 2.5);
      curls.push(path(`M${pt(start)}${curve([start, ...sp])}`));
    }
    out.push(
      `<g clip-path="url(#hb-torso)">${rows.join('')}${path(hemArc(HEM - 6))}${path(hemArc(HEM + 6))}${curls.join('')}</g>`,
    );

    // medallion: a rosette where the gorgoneion would be
    const M = [CX, 700];
    out.push(ring(M, 37, true));
    out.push(ring(M, 29));
    for (let i = 0; i < 8; i++) {
      const a = i * 45 + 22.5;
      const tip = polar(M, 23, a);
      const base = polar(M, 5.5, a);
      out.push(
        path(`M${pt(base)}Q${pt(polar(M, 15, a - 21))} ${pt(tip)}Q${pt(polar(M, 15, a + 21))} ${pt(base)}Z`),
      );
    }
  }

  // --- neck ---
  const neckL = [
    [327, 508],
    [323, 548],
    [316, 590],
  ];
  out.push(mask(poly([...neckL, ...mirror(neckL).reverse()], true)));
  out.push(path(spline(neckL)));
  out.push(path(spline(mirror(neckL))));
  // collar of the aegis, lying over the base of the neck
  const collarOut = [
    [296, 596],
    [322, 622],
    [360, 636],
    [398, 622],
    [424, 596],
  ];
  const collarIn = [
    [311, 588],
    [331, 607],
    [360, 618],
    [389, 607],
    [409, 588],
  ];
  out.push(solid(`M${pt(collarOut[0])}${curve(collarOut)}L${pt(collarIn[4])}${curve([...collarIn].reverse())}Z`));

  // --- face ---
  const faceL = [
    [287, 336],
    [282, 380],
    [283, 420],
    [290, 458],
    [307, 492],
    [333, 517],
    [360, 526],
  ];
  const face = [...faceL, ...mirror(faceL.slice(0, -1)).reverse()];
  out.push(solid(spline(face)));
  // brow running into the nose (one line), second brow
  out.push(
    path(
      spline([
        [292, 383],
        [314, 375],
        [338, 377],
        [350, 390],
        [352, 420],
        [349, 444],
        [346, 453],
        [352, 459.5],
        [362, 459.5],
        [367, 454],
      ]),
    ),
  );
  out.push(
    path(
      spline([
        [380, 378],
        [405, 375],
        [428, 383],
      ]),
    ),
  );
  // eyes: almond lids, a crease above, the iris hanging from the upper lid
  for (const side of [-1, 1]) {
    const m = (p) => (side < 0 ? p : [2 * CX - p[0], p[1]]);
    const outer = m([294, 410]);
    const inner = m([342, 411]);
    out.push(path(`M${pt(outer)}Q${pt(m([317, 385]))} ${pt(inner)}Q${pt(m([319, 424]))} ${pt(outer)}Z`));
    out.push(path(spline([m([298, 398]), m([317, 387]), m([337, 396])])));
    out.push(path(`M${pt(m([309.6, 400.6]))}A9 9 0 1 ${side < 0 ? 0 : 1} ${pt(m([326.4, 400.6]))}`));
    out.push(dot(m([318, 406]), 3));
  }
  // mouth
  out.push(
    path(
      spline([
        [340, 483.5],
        [350, 483],
        [360, 486],
        [370, 483],
        [380, 483.5],
      ]),
    ),
  );
  out.push(
    path(
      spline([
        [350, 493],
        [360, 496.5],
        [370, 493],
      ]),
    ),
  );

  // --- helmet rim: a small pediment over the brow, ending in volutes ---
  {
    const lower = [
      [246, 348],
      [300, 354],
      [360, 357],
      [420, 354],
      [474, 348],
    ];
    out.push(solid(`M248 326L360 291L472 326L${pt(lower[4])}${curve([...lower].reverse())}Z`));
    out.push(path(spline([[250, 337], [300, 343], [360, 346], [420, 343], [470, 337]])));
    out.push(path('M270 328L360 301L450 328'));
    // rivets along the band
    for (let i = -8; i <= 8; i++) {
      const x = CX + i * 11.6;
      out.push(dot([x, 351.6 - (i * i) / 64 * 6.2], 1.7));
    }
    for (const side of [-1, 1]) {
      const c = [CX + side * 113, 343];
      out.push(ring(c, 17, true));
      out.push(path(spline(spiral(c, 11.5, side < 0 ? 200 : -20, 1.6, side < 0 ? 1 : -1, 1.5))));
    }
  }

  save('hero-b-athena', svg(W, H, 3, out.join('')));
}

// ---------- owl on an olive twig ----------
function leaf(base, deg, len, width) {
  const tip = polar(base, len, deg);
  const c1 = polar(polar(base, len * 0.45, deg), width, deg - 90);
  const c2 = polar(polar(base, len * 0.45, deg), width, deg + 90);
  return (
    solid(`M${pt(base)}Q${pt(c1)} ${pt(tip)}Q${pt(c2)} ${pt(base)}Z`) +
    path(`M${pt(polar(base, len * 0.12, deg))}L${pt(polar(base, len * 0.74, deg))}`)
  );
}

function owl() {
  const out = [];
  const OX = 150;
  const m = (pts) => pts.map(([x, y]) => [2 * OX - x, y]);

  // tail: three feathers hanging below the twig
  out.push(solid('M130 306L123 348Q130 357 138 349L142 306Z'));
  out.push(solid('M170 306L177 348Q170 357 162 349L158 306Z'));
  out.push(solid('M142 306L142 354Q150 363 158 354L158 306Z'));

  // twig
  const twig = [
    [6, 324],
    [80, 314],
    [150, 317],
    [226, 308],
    [294, 314],
  ];
  out.push(leaf([40, 319], 205, 56, 13) + leaf([60, 316], 148, 52, 12));
  out.push(leaf([246, 309], -30, 60, 13) + leaf([262, 311], 22, 54, 12) + leaf([230, 309], 64, 46, 11));
  out.push(path(spline(twig)));

  // body
  const bodyL = [
    [150, 34],
    [104, 44],
    [70, 80],
    [62, 130],
    [66, 190],
    [84, 250],
    [116, 296],
    [150, 308],
  ];
  out.push(solid(spline([...bodyL, ...m(bodyL.slice(1, -1)).reverse()], true)));

  // breast: rows of scallops between the wings
  let breast = '';
  for (let row = 0; row < 6; row++) {
    const y = 180 + row * 19;
    const half = 44 - row * 5.5;
    const count = Math.max(2, Math.round((half * 2) / 20));
    const w = (half * 2) / count;
    for (let i = 0; i < count; i++) {
      const x = OX - half + i * w;
      breast += `M${num(x)} ${num(y)}Q${num(x + w / 2)} ${num(y + 21)} ${num(x + w)} ${num(y)}`;
    }
  }
  out.push(quiet(breast));

  // folded wings
  for (const side of [-1, 1]) {
    const s = (pts) => (side < 0 ? pts : m(pts));
    out.push(path(spline(s([[84, 156], [92, 208], [112, 258], [136, 296]]))));
    out.push(path(spline(s([[73, 176], [80, 224], [98, 266]]))));
    out.push(path(spline(s([[66, 200], [72, 234], [86, 262]]))));
  }

  // face: two great discs under rounded brows, beak
  for (const side of [-1, 1]) {
    const c = [OX + side * 35, 108];
    const brow = [];
    for (let a = -46; a >= -176; a -= 26) brow.push(polar(c, 40.5, side < 0 ? a : -180 - a));
    out.push(path(`M${pt([OX, 104])}${curve([[OX, 104], ...brow])}`));
    out.push(ring(c, 32, true));
    out.push(ring(c, 21));
    out.push(dot(c, 9));
  }
  out.push(solid('M141 116Q150 106 159 116Q156 137 150 146Q144 137 141 116Z'));

  // feet gripping the twig
  for (const side of [-1, 1]) {
    const x = OX + side * 25;
    out.push(
      path(
        `M${x - 9} 302Q${x - 12} 315 ${x - 8} 324M${x} 304Q${x - 1} 317 ${x + 1} 326M${x + 9} 302Q${x + 12} 315 ${x + 9} 324`,
      ),
    );
  }

  save('hero-b-owl', svg(300, 370, 3, out.join('')));
}

// ---------- olive branches ----------
function olive(name, w, h, stem, opts) {
  const rand = rng(opts.seed);
  const out = [];
  // sample the stem
  const samples = [];
  const N = 200;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Catmull-Rom evaluation through the stem points
    const seg = Math.min(stem.length - 2, Math.floor(t * (stem.length - 1)));
    const u = t * (stem.length - 1) - seg;
    const p = (j) => stem[Math.max(0, Math.min(stem.length - 1, j))];
    const [p0, p1, p2, p3] = [p(seg - 1), p(seg), p(seg + 1), p(seg + 2)];
    const cr = (a, b, c, d) =>
      0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    samples.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
  }
  const at = (t) => samples[Math.round(t * N)];
  const heading = (t) => {
    const i = Math.max(1, Math.min(N - 1, Math.round(t * N)));
    return (Math.atan2(samples[i + 1][1] - samples[i - 1][1], samples[i + 1][0] - samples[i - 1][0]) * 180) / Math.PI;
  };

  const leaves = [];
  const fruit = [];
  const count = opts.leaves;
  for (let i = 0; i < count; i++) {
    const t = lerp(opts.from ?? 0.1, 0.97, i / (count - 1));
    const side = i % 2 ? 1 : -1;
    const base = at(t);
    const taper = lerp(1, 0.62, t);
    const angle = heading(t) + side * lerp(52, 30, t) + (rand() - 0.5) * 12;
    const len = opts.len * taper * (0.88 + rand() * 0.24);
    leaves.push(leaf(base, angle, len, len * 0.25));
    if (opts.olives && i % 3 === 1 && t < 0.85) {
      const stalk = polar(base, 16, heading(t) - side * 70);
      const c = polar(stalk, 11, heading(t) - side * 70);
      fruit.push(
        path(`M${pt(base)}L${pt(stalk)}`) +
          `<ellipse cx="${num(c[0])}" cy="${num(c[1])}" rx="9.5" ry="13" transform="rotate(${num(heading(t) - side * 70 + 90)} ${num(c[0])} ${num(c[1])})" fill="${PAPER}"/>`,
      );
    }
  }
  // tip leaf
  leaves.push(leaf(at(1), heading(0.99), opts.len * 0.62, opts.len * 0.12));
  out.push(leaves.join(''), path(spline(stem)), fruit.join(''));
  save(name, svg(w, h, opts.stroke ?? 3, out.join('')));
}

function star() {
  // four-pointed spark
  const d = 'M30 3Q33 27 57 30Q33 33 30 57Q27 33 3 30Q27 27 30 3Z';
  save('hero-b-star', svg(60, 60, 3, solid(d)));
}

rays();
athena();
owl();
olive(
  'hero-b-olive',
  520,
  440,
  [
    [512, 434],
    [436, 322],
    [334, 232],
    [200, 160],
    [44, 112],
  ],
  { seed: 3, leaves: 15, len: 104, olives: true, from: 0.12 },
);
olive(
  'hero-b-sprig',
  300,
  220,
  [
    [10, 208],
    [62, 134],
    [150, 74],
    [286, 44],
  ],
  { seed: 9, leaves: 9, len: 70, olives: false, from: 0.16 },
);
star();
