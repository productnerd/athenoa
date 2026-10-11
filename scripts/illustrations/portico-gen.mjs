// The portico that frames the newsletter popup, drawn as separate pieces so the frame can grow
// with its content: only the shaft stretches (preserveAspectRatio="none"); capital, base, pediment,
// ledge and steps keep their proportions.
//   node scripts/illustrations/portico-gen.mjs        writes src/assets/illustrations/portico-*.svg
//   node scripts/illustrations/portico-preview.mjs    puts them together to look at
//
// One scale for everything: the whole frame is W units wide and a column piece is CELL units wide,
// so the component only has to make 1 unit = (frame width / W) and the pieces meet exactly.
// The lower diameter of a column is 50 units; everything else is proportioned from it.
// Every stroke carries vector-effect="non-scaling-stroke": the line keeps one weight in all the
// pieces however each one is scaled (the component sets the weight with stroke-width in CSS).
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../../src/assets/illustrations');

const PAPER = 'var(--paper, #f2e9d3)';
const LIGHT = 'var(--blue-light, #b3c0f3)';
const DEEP = 'var(--blue-deep, #071260)';
const INK = 'currentColor';
const TAU = Math.PI * 2;
const deg = Math.PI / 180;

// ---------- The measures shared by the pieces ----------
// NewsletterDialog.astro repeats four of them in its grid: W, CELL, AXIS - CELL / 2 (= 15) and WALL.
const W = 620; // the frame, paper margins included
const AXIS = 56; // axis of the left column, from the left edge of the frame
const CELL = 82; // width of a column piece
const CX = CELL / 2; // the column axis inside its own piece
const R_LOW = 25; // half the lower diameter of the shaft
const R_TOP = 21; // half the upper diameter (0.84 of the lower)
const WALL = 23; // face of the podium that carries the form on a narrow screen, from the edge
// Five flutes face the viewer. Their edges, as fractions of the half-width: wider in the middle,
// narrower as the shaft turns away.
const FLUTES = [-1, -0.71, -0.25, 0.25, 0.71, 1];
// The two flutes on the outer side lie in shade.
const SHADED = [0, 1];

const n = (v) => String(Math.round(v * 100) / 100);
const P = (x, y) => `${n(x)} ${n(y)}`;

const attrs = (o) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== false)
    .map(([k, v]) => ` ${k}="${v}"`)
    .join('');
// A stroked line. Fills are opt-in.
const line = (d, o = {}) => `<path d="${d}" vector-effect="non-scaling-stroke"${attrs(o)}/>`;
// A flat wash: no outline.
const wash = (d, fill, o = {}) => `<path d="${d}" fill="${fill}" stroke="none"${attrs(o)}/>`;
const svg = (w, h, body, o = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(w)} ${n(h)}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"${attrs(o)}>${body.join('')}</svg>\n`;

// Smooth open path through points (Catmull-Rom converted to cubic Béziers).
function spline(pts) {
  const g = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M${P(...pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [g(i - 1), g(i), g(i + 1), g(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(...c1)} ${P(...c2)} ${P(...p2)}`;
  }
  return d;
}

// A spiral that loses the same share of its radius with every turn, as a volute does.
// side = 1 winds clockwise from the top, -1 the other way.
function whorl(cx, cy, r0, decay, side, from, to, steps) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = from + ((to - from) * i) / steps;
    const a = -90 * deg + side * t * TAU;
    const r = r0 * decay ** t;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

// A band with round ends (a torus or a bead seen from the front).
const pill = (cx, r, y0, y1) => {
  const k = (y1 - y0) / 2;
  return (
    `M${P(cx - r + k, y0)}L${P(cx + r - k, y0)}A${n(k)} ${n(k)} 0 0 1 ${P(cx + r - k, y1)}` +
    `L${P(cx - r + k, y1)}A${n(k)} ${n(k)} 0 0 1 ${P(cx - r + k, y0)}Z`
  );
};

// ---------- Capital ----------
// Ionic, seen from the front: a thin abacus; two volutes joined by the canalis; between them the
// echinus with its eggs, in shade; the astragal; and the top of the shaft with the round heads of
// the flutes.
const CAP_H = 36;
function capital() {
  const abacusH = 5;
  const abacusR = 31.5;
  const eyeX = 24.5; // volute eyes, from the axis
  const r0 = 14.5; // outer radius of a volute
  const decay = 0.55; // what is left of the radius after one turn
  const turns = 2.05;
  const eyeY = abacusH + r0;
  const yInner = eyeY - r0 * decay; // where the second turn passes the top: the canalis joins here
  const sag = 1.8; // the canalis hangs a little between the volutes

  const yEchinus = 21; // foot of the echinus
  const yAstragal = 24.6;
  const yHead = 27.8; // top of the flute heads
  const ySpring = 31.6; // where the heads become straight
  const xs = FLUTES.map((f) => CX + f * R_TOP);
  const head = (i) => {
    const rx = (xs[i + 1] - xs[i]) / 2;
    return `A${n(rx)} ${n(ySpring - yHead)} 0 0 1 ${P(xs[i + 1], ySpring)}`;
  };

  const out = [];
  // Shade in the outer flutes
  for (const i of SHADED) {
    out.push(wash(`M${P(xs[i], CAP_H + 1)}L${P(xs[i], ySpring)}${head(i)}L${P(xs[i + 1], CAP_H + 1)}Z`, LIGHT));
  }
  // Top of the shaft: outline, flute heads, the lines between flutes
  out.push(
    line(
      `M${P(xs[0], yAstragal)}L${P(xs[0], CAP_H + 0.6)}M${P(xs[5], yAstragal)}L${P(xs[5], CAP_H + 0.6)}` +
        `M${P(xs[0], ySpring)}${[0, 1, 2, 3, 4].map(head).join('')}` +
        [1, 2, 3, 4].map((i) => `M${P(xs[i], ySpring)}L${P(xs[i], CAP_H + 0.6)}`).join(''),
    ),
  );
  // Echinus, in the shade of the canalis, with three eggs
  const canalis = `M${P(CX - eyeX, yInner)}Q${P(CX, yInner + 2 * sag)} ${P(CX + eyeX, yInner)}`;
  out.push(wash(`${canalis}L${P(CX + eyeX, yEchinus)}L${P(CX - eyeX, yEchinus)}Z`, LIGHT));
  const eggs = [-8.7, 0, 8.7]
    .map((x) => {
      const top = yInner + sag * (1 - (x / eyeX) ** 2) - 0.4;
      const low = yEchinus - 0.7;
      return (
        `M${P(CX + x - 3.6, top)}C${P(CX + x - 3.6, top + 5.4)} ${P(CX + x - 2.3, low)} ${P(CX + x, low)}` +
        `C${P(CX + x + 2.3, low)} ${P(CX + x + 3.6, top + 5.4)} ${P(CX + x + 3.6, top)}`
      );
    })
    .join('');
  out.push(line(eggs, { fill: PAPER }));
  // Astragal: the bead between capital and shaft
  out.push(line(pill(CX, R_TOP + 2.2, yEchinus, yAstragal), { fill: PAPER }));
  // Volutes: a paper disc hides what passes behind, then the whorl and its eye
  for (const side of [-1, 1]) {
    const x = CX + side * eyeX;
    out.push(wash(spline(whorl(x, eyeY, r0, decay, side, 0, 1, 16)) + 'Z', PAPER));
    out.push(line(spline(whorl(x, eyeY, r0, decay, side, 0, turns, 34))));
    out.push(`<circle cx="${n(x)}" cy="${n(eyeY)}" r="2.2" fill="${INK}" stroke="none"/>`);
  }
  // Lower edge of the canalis
  out.push(line(canalis));
  // Abacus. Its top edge lies on the underside of the architrave (the last line of the pediment piece).
  out.push(
    line(
      `M${P(CX - abacusR, 0)}L${P(CX - abacusR, abacusH - 1.6)}Q${P(CX - abacusR, abacusH)} ${P(CX - abacusR + 1.6, abacusH)}` +
        `L${P(CX + abacusR - 1.6, abacusH)}Q${P(CX + abacusR, abacusH)} ${P(CX + abacusR, abacusH - 1.6)}L${P(CX + abacusR, 0)}Z`,
      { fill: PAPER },
    ),
  );
  return svg(CELL, CAP_H, out);
}

// ---------- Shaft ----------
// The only piece of the column that stretches. Entasis: the lower part rises almost straight, then
// the shaft draws in more and more towards the top. Every flute edge follows the same curve.
const SHAFT_H = 200;
function shaft() {
  // Half-width along the height, as the four control values of one cubic (bottom to top)
  const halfW = [R_LOW, R_LOW, R_TOP + 0.9, R_TOP];
  const ys = [SHAFT_H + 1, SHAFT_H * 0.56, SHAFT_H * 0.24, -1];
  const up = (f, move = 'M') =>
    `${move}${P(CX + f * halfW[0], ys[0])}C${P(CX + f * halfW[1], ys[1])} ${P(CX + f * halfW[2], ys[2])} ${P(CX + f * halfW[3], ys[3])}`;
  const down = (f) =>
    `L${P(CX + f * halfW[3], ys[3])}C${P(CX + f * halfW[2], ys[2])} ${P(CX + f * halfW[1], ys[1])} ${P(CX + f * halfW[0], ys[0])}`;
  const out = [];
  for (const i of SHADED) out.push(wash(`${up(FLUTES[i])}${down(FLUTES[i + 1])}Z`, LIGHT));
  out.push(line(FLUTES.map((f) => up(f)).join(''), { 'stroke-linecap': 'butt' }));
  return svg(CELL, SHAFT_H, out, { preserveAspectRatio: 'none' });
}

// ---------- Base ----------
// Attic: the foot of the shaft with the round ends of the flutes, upper torus, scotia (in shade),
// lower torus, plinth.
const BASE_H = 36;
function base() {
  const xs = FLUTES.map((f) => CX + f * R_LOW);
  const ySpring = 3;
  const yFoot = 6.8; // bottom of the flute ends
  const yTorus1 = 10.4;
  const yScotia = 16.6;
  const yTorus2 = 21.6;
  const yPlinth = 29.4;
  const foot = (i) => {
    const rx = (xs[i + 1] - xs[i]) / 2;
    return `A${n(rx)} ${n(yFoot - ySpring)} 0 0 0 ${P(xs[i + 1], ySpring)}`;
  };
  const out = [];
  for (const i of SHADED) {
    out.push(wash(`M${P(xs[i], -1)}L${P(xs[i], ySpring)}${foot(i)}L${P(xs[i + 1], -1)}Z`, LIGHT));
  }
  // Foot of the shaft: it flares out a little (apophyge) to meet the base
  out.push(
    line(
      `M${P(xs[0], -0.6)}L${P(xs[0], yFoot)}Q${P(xs[0], yTorus1 - 0.6)} ${P(xs[0] - 2.2, yTorus1)}` +
        `M${P(xs[5], -0.6)}L${P(xs[5], yFoot)}Q${P(xs[5], yTorus1 - 0.6)} ${P(xs[5] + 2.2, yTorus1)}` +
        `M${P(xs[0], ySpring)}${[0, 1, 2, 3, 4].map(foot).join('')}` +
        [1, 2, 3, 4].map((i) => `M${P(xs[i], -0.6)}L${P(xs[i], ySpring)}`).join(''),
    ),
  );
  // Scotia: the hollow between the two tori
  const hollow =
    `M${P(CX - 27, yScotia)}Q${P(CX - 24.4, (yScotia + yTorus2) / 2 + 0.6)} ${P(CX - 30.4, yTorus2)}` +
    `L${P(CX + 30.4, yTorus2)}Q${P(CX + 24.4, (yScotia + yTorus2) / 2 + 0.6)} ${P(CX + 27, yScotia)}Z`;
  out.push(wash(hollow, LIGHT));
  out.push(line(hollow));
  out.push(line(pill(CX, 29.4, yTorus1, yScotia), { fill: PAPER }));
  out.push(line(pill(CX, 33.2, yTorus2, yPlinth), { fill: PAPER }));
  // Plinth. Its bottom edge is the top of the stylobate, drawn by the piece below.
  const pr = 34;
  out.push(
    line(
      `M${P(CX - pr, BASE_H)}L${P(CX - pr, yPlinth + 1.2)}Q${P(CX - pr, yPlinth)} ${P(CX - pr + 1.2, yPlinth)}` +
        `L${P(CX + pr - 1.2, yPlinth)}Q${P(CX + pr, yPlinth)} ${P(CX + pr, yPlinth + 1.2)}L${P(CX + pr, BASE_H)}`,
      { fill: PAPER },
    ),
  );
  return svg(CELL, BASE_H, out);
}

// ---------- Pediment and entablature ----------
const PED = {
  apexY: 34, // top of the roof; the apex acroterion stands above it
  rise: 70, // from the cornice to the top of the roof: a low Greek gable, a little over 13 degrees
  eaveX: 12, // how far the cornice stops from the edge of the frame
  raking: 8, // thickness of the raking cornice
  corniceH: 8,
  dentilH: 7,
  friezeH: 18,
  architraveH: 24,
};
const CORNICE_Y = PED.apexY + PED.rise;
const PED_H = CORNICE_Y + PED.corniceH + PED.dentilH + PED.friezeH + PED.architraveH;

// A palmette: slender leaves fanning from a small calyx, the middle one drawn last so it lies on top.
function palmette(x, y, leaves, { calyx = 5, lift = 3 } = {}) {
  const out = [];
  const order = [...leaves].sort((a, b) => Math.abs(b.a) - Math.abs(a.a));
  for (const { a, len, w } of order) {
    const d =
      `M0 0C${P(-w * 0.55, -len * 0.2)} ${P(-w * 1.05, -len * 0.46)} ${P(-w * 0.94, -len * 0.68)}` +
      `C${P(-w * 0.84, -len * 0.86)} ${P(-w * 0.3, -len * 0.96)} ${P(0, -len)}` +
      `C${P(w * 0.3, -len * 0.96)} ${P(w * 0.84, -len * 0.86)} ${P(w * 0.94, -len * 0.68)}` +
      `C${P(w * 1.05, -len * 0.46)} ${P(w * 0.55, -len * 0.2)} 0 0Z`;
    out.push(line(d, { fill: PAPER, transform: `translate(${n(x)} ${n(y)}) rotate(${n(a)}) translate(0 ${n(-lift)})` }));
  }
  // The calyx the leaves spring from
  out.push(
    line(`M${P(x - calyx, y)}A${n(calyx)} ${n(calyx * 0.82)} 0 0 1 ${P(x + calyx, y)}Z`, { fill: PAPER }),
  );
  return out;
}

function pediment() {
  const { apexY, eaveX, raking, corniceH, dentilH, friezeH, architraveH } = PED;
  const corniceY = CORNICE_Y;
  const mid = W / 2;
  const xL = eaveX;
  const xR = W - eaveX;
  const pitch = (corniceY - apexY) / (mid - xL);
  const slope = Math.hypot(1, pitch);
  const drop = raking * slope; // the raking cornice measured straight down
  const inset = drop / pitch;
  // Entablature, from the cornice down
  const yDentil = corniceY + corniceH;
  const yFrieze = yDentil + dentilH;
  const yArch = yFrieze + friezeH;
  const yBottom = yArch + architraveH;
  const aL = AXIS - R_TOP - 5; // the architrave ends just outside the top of the shaft, inside the abacus
  const aR = W - aL;

  const out = [];
  // Tympanum: the recessed field, in the darker blue
  const tympApex = apexY + drop;
  out.push(line(`M${P(xL + inset, corniceY)}L${P(mid, tympApex)}L${P(xR - inset, corniceY)}Z`, { fill: DEEP }));
  // The light rising in it: half a sun on the cornice, its rays reaching as far as the gable allows
  const field = corniceY - tympApex;
  const margin = 6.6 * slope;
  const reach = (a) => (field - margin) / (Math.sin(a) + pitch * Math.abs(Math.cos(a)));
  const from = 20.5;
  let rays = '';
  for (let k = 0; k < 15; k++) {
    const a = (6 + 12 * k) * deg;
    const to = k % 2 ? reach(a) : from + (reach(a) - from) * 0.5;
    rays += `M${P(mid + from * Math.cos(a), corniceY - from * Math.sin(a))}L${P(mid + to * Math.cos(a), corniceY - to * Math.sin(a))}`;
  }
  out.push(line(rays, { stroke: PAPER }));
  out.push(
    line(
      `M${P(mid - 9, corniceY)}A9 9 0 0 1 ${P(mid + 9, corniceY)}M${P(mid - 14.6, corniceY)}A14.6 14.6 0 0 1 ${P(mid + 14.6, corniceY)}`,
      { stroke: PAPER },
    ),
  );
  // Raking cornice
  out.push(line(`M${P(xL, corniceY)}L${P(mid, apexY)}L${P(xR, corniceY)}`));
  // Horizontal cornice
  out.push(
    line(
      `M${P(xL + 1.4, corniceY)}L${P(xR - 1.4, corniceY)}Q${P(xR, corniceY)} ${P(xR, corniceY + 1.4)}L${P(xR, yDentil - 1.4)}Q${P(xR, yDentil)} ${P(xR - 1.4, yDentil)}` +
        `L${P(xL + 1.4, yDentil)}Q${P(xL, yDentil)} ${P(xL, yDentil - 1.4)}L${P(xL, corniceY + 1.4)}Q${P(xL, corniceY)} ${P(xL + 1.4, corniceY)}Z`,
      { fill: PAPER },
    ),
  );
  // Dentils: small solid blocks under the cornice, one on the axis
  const pitchD = 11;
  const blockW = 5.4;
  const half = Math.floor((mid - aL - 2 - blockW / 2) / pitchD);
  let blocks = '';
  for (let i = -half; i <= half; i++) {
    const x = mid + i * pitchD - blockW / 2;
    blocks += `M${P(x, yDentil)}h${n(blockW)}v${n(dentilH)}h${n(-blockW)}Z`;
  }
  out.push(`<path d="${blocks}" fill="${INK}" stroke="none"/>`);
  // Frieze: a plain band, washed in the light blue
  out.push(wash(`M${P(aL, yFrieze)}H${n(aR)}V${n(yArch)}H${n(aL)}Z`, LIGHT));
  // Architrave and frieze: the outline and the lines across (the lowest is the soffit the capitals carry)
  out.push(
    line(
      `M${P(aL, yFrieze)}L${P(aR, yFrieze)}M${P(aL, yArch)}L${P(aR, yArch)}` +
        `M${P(aL, yArch + architraveH * 0.46)}L${P(aR, yArch + architraveH * 0.46)}` +
        `M${P(aL, yFrieze)}L${P(aL, yBottom)}L${P(aR, yBottom)}L${P(aR, yFrieze)}`,
    ),
  );
  // Acroteria: a palmette on the apex between two small scrolls, a smaller one above each corner
  for (const side of [-1, 1]) {
    const cx = mid + side * 16;
    const cy = apexY - 2;
    const scroll = whorl(cx, cy, 5, 0.5, side, 0, 1.35, 20);
    out.push(
      line(`M${P(mid + side * 4, apexY - 3.4)}Q${P(mid + side * 10, apexY - 7.6)} ${P(...scroll[0])}${spline(scroll).replace(/^M[^C]*/, '')}`),
    );
  }
  out.push(
    ...palmette(mid, apexY - 0.6, [
      { a: -62, len: 14.5, w: 3 },
      { a: -31, len: 21.5, w: 3.3 },
      { a: 0, len: 26, w: 3.6 },
      { a: 31, len: 21.5, w: 3.3 },
      { a: 62, len: 14.5, w: 3 },
    ]),
  );
  for (const side of [-1, 1]) {
    const x = mid + side * (mid - xL - 13);
    const y = corniceY - 13 * pitch - 0.4;
    out.push(
      ...palmette(
        x,
        y,
        [
          { a: -46, len: 9.5, w: 2.5 },
          { a: 0, len: 13.5, w: 2.8 },
          { a: 46, len: 9.5, w: 2.5 },
        ],
        { calyx: 3.8, lift: 2.4 },
      ),
    );
  }
  return svg(W, PED_H, out);
}

// ---------- Steps ----------
const STEP = 10;
const STEPS_H = STEP * 3 + 1;
function steps() {
  const out = [];
  const edges = [17, 11, 5]; // each step comes out a little further than the one above
  // The lowest step stands in the light blue, so the building has a ground to stand on
  out.push(wash(`M${P(edges[2], STEP * 2)}H${n(W - edges[2])}V${n(STEP * 3)}H${n(edges[2])}Z`, LIGHT));
  edges.forEach((x, i) => {
    const y = i * STEP;
    out.push(line(`M${P(x, y + STEP)}L${P(x, y)}L${P(W - x, y)}L${P(W - x, y + STEP)}`));
  });
  out.push(line(`M${P(edges[2], STEP * 3)}L${P(W - edges[2], STEP * 3)}`));
  return svg(W, STEPS_H, out);
}

// ---------- Podium (narrow screens) ----------
// Where there is no room for the form between the columns, the columns stand on a podium and the
// form is set into its face. The ledge is its cap, with the shadow it throws; the two lines down
// the sides of the podium are drawn by the component, WALL units in from each edge.
const LEDGE_H = 13;
function ledge() {
  const slab = 8.6;
  const xL = 17;
  const out = [];
  out.push(wash(`M${P(WALL, slab)}H${n(W - WALL)}V${n(LEDGE_H + 0.6)}H${n(WALL)}Z`, LIGHT));
  out.push(line(`M${P(WALL, slab)}L${P(WALL, LEDGE_H + 0.6)}M${P(W - WALL, slab)}L${P(W - WALL, LEDGE_H + 0.6)}`));
  out.push(
    line(
      `M${P(xL, 0)}L${P(W - xL, 0)}L${P(W - xL, slab - 1.4)}Q${P(W - xL, slab)} ${P(W - xL - 1.4, slab)}` +
        `L${P(xL + 1.4, slab)}Q${P(xL, slab)} ${P(xL, slab - 1.4)}Z`,
      { fill: PAPER },
    ),
  );
  return svg(W, LEDGE_H, out);
}
const pieces = {
  'portico-capital': capital(),
  'portico-shaft': shaft(),
  'portico-base': base(),
  'portico-pediment': pediment(),
  'portico-steps': steps(),
  'portico-ledge': ledge(),
};
for (const [name, markup] of Object.entries(pieces)) {
  writeFileSync(resolve(outDir, `${name}.svg`), markup);
}
console.log(
  `portico: W ${W}, axis ${AXIS}, cell ${CELL}, wall ${WALL}; heights pediment ${n(PED_H)}, capital ${CAP_H}, base ${BASE_H}, ledge ${LEDGE_H}, steps ${STEPS_H}`,
);
