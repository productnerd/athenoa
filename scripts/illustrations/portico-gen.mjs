// The portico that frames the newsletter popup, drawn as five pieces so the frame can grow with
// its content: only the shaft stretches (preserveAspectRatio="none"); capital, base, pediment and
// steps keep their proportions.
//   node scripts/illustrations/portico-gen.mjs        writes src/assets/illustrations/portico-*.svg
//
// One scale for everything: the whole frame is W units wide and a column piece is CELL units wide,
// so the component only has to make 1 unit = (frame width / W) and the pieces meet exactly.
// Every stroke carries vector-effect="non-scaling-stroke": the line keeps one weight in all five
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

// ---------- The measures shared by the pieces (and by NewsletterDialog.astro) ----------
export const W = 640; // the frame, paper margins included
export const AXIS = 53; // axis of the left column, from the left edge of the frame
export const CELL = 64; // width of a column piece
const CX = CELL / 2; // the column axis inside its own piece
const R_LOW = 21; // half the lower diameter of the shaft
const R_TOP = 17.6; // half the upper diameter (0.84 of the lower)
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

// Smooth path through points (Catmull-Rom converted to cubic Béziers).
function spline(pts, { closed = false, move = true } = {}) {
  const len = pts.length;
  const g = (i) => (closed ? pts[((i % len) + len) % len] : pts[Math.max(0, Math.min(len - 1, i))]);
  let d = `${move ? 'M' : 'L'}${P(...pts[0])}`;
  const segs = closed ? len : len - 1;
  for (let i = 0; i < segs; i++) {
    const [p0, p1, p2, p3] = [g(i - 1), g(i), g(i + 1), g(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(...c1)} ${P(...c2)} ${P(...p2)}`;
  }
  return d + (closed ? 'Z' : '');
}

// ---------- Capital ----------
// Ionic: a thin abacus, two volutes joined by the canalis, the echinus between them, a necking
// line, and the top of the shaft with the rounded heads of the flutes.
const CAP_H = 29;
function capital() {
  const abacusH = 4.8;
  const abacusR = 25.5;
  const eyeX = 21; // volute eyes, from the axis
  const r0 = 10.6; // outer radius of a volute
  const rEnd = 2.3;
  const turns = 1.75;
  const eyeY = abacusH + r0;
  const radius = (t) => rEnd + (r0 - rEnd) * (1 - t) ** 1.25;
  // side = 1 for the right volute (winds clockwise from the top), -1 for the left.
  const whorl = (side, from = 0, to = 1, steps = 44) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = from + ((to - from) * i) / steps;
      const a = -90 * deg + side * t * turns * TAU;
      pts.push([CX + side * eyeX + radius(t) * Math.cos(a), eyeY + radius(t) * Math.sin(a)]);
    }
    return pts;
  };
  const yInner = eyeY - radius(1 / turns); // where the second turn passes the top: the canalis joins here

  const yNeck = 20;
  const yHead = 22.8; // top of the flute heads
  const ySpring = 25.6; // where the heads become straight
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
      `M${P(xs[0], yNeck)}L${P(xs[0], CAP_H + 0.6)}M${P(xs[5], yNeck)}L${P(xs[5], CAP_H + 0.6)}` +
        `M${P(xs[0], ySpring)}${[0, 1, 2, 3, 4].map(head).join('')}` +
        [1, 2, 3, 4].map((i) => `M${P(xs[i], ySpring)}L${P(xs[i], CAP_H + 0.6)}`).join(''),
    ),
  );
  // Necking
  out.push(line(`M${P(CX - R_TOP - 1.2, yNeck)}L${P(CX + R_TOP + 1.2, yNeck)}`));
  // Echinus, in the shade of the canalis
  const echinus = `M${P(CX - 14.4, yInner + 0.5)}Q${P(CX, 2 * 17 - yInner - 0.5)} ${P(CX + 14.4, yInner + 0.5)}`;
  out.push(wash(`${echinus}Z`, LIGHT));
  out.push(line(echinus));
  // Volutes: a paper disc hides what passes behind, then the whorl and its eye
  for (const side of [-1, 1]) {
    out.push(wash(spline(whorl(side, 0, 1 / turns, 30)) + 'Z', PAPER));
    out.push(line(spline(whorl(side))));
    out.push(
      `<circle cx="${n(CX + side * eyeX)}" cy="${n(eyeY)}" r="1" fill="${INK}" stroke="none"/>`,
    );
  }
  // Lower edge of the canalis: sags a little between the volutes
  out.push(
    line(
      `M${P(CX - eyeX, yInner)}C${P(CX - 12, yInner)} ${P(CX - 9, yInner + 1.5)} ${P(CX, yInner + 1.5)}` +
        `S${P(CX + 12, yInner)} ${P(CX + eyeX, yInner)}`,
    ),
  );
  // Abacus. Its top edge lies on the underside of the architrave (the last line of the pediment piece).
  out.push(
    line(
      `M${P(CX - abacusR, 0)}L${P(CX - abacusR, abacusH - 1.3)}Q${P(CX - abacusR, abacusH)} ${P(CX - abacusR + 1.3, abacusH)}` +
        `L${P(CX + abacusR - 1.3, abacusH)}Q${P(CX + abacusR, abacusH)} ${P(CX + abacusR, abacusH - 1.3)}L${P(CX + abacusR, 0)}Z`,
    ),
  );
  return svg(CELL, CAP_H, out);
}

// ---------- Shaft ----------
// The only piece that stretches. Entasis: the lower part rises almost straight, then the shaft
// draws in more and more towards the top. Every flute edge follows the same curve.
const SHAFT_H = 200;
function shaft() {
  // Half-width along the height, as the four control values of one cubic (bottom to top)
  const halfW = [R_LOW, R_LOW, R_TOP + 0.75, R_TOP];
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
// Attic: the foot of the shaft with the rounded ends of the flutes, upper torus, scotia (in
// shade), lower torus, plinth.
const BASE_H = 33;
function base() {
  const xs = FLUTES.map((f) => CX + f * R_LOW);
  const ySpring = 2.6;
  const yFoot = 5.6; // bottom of the flute ends
  const yTorus1 = 9.6;
  const yScotia = 15.2;
  const yTorus2 = 20;
  const yPlinth = 27;
  const foot = (i) => {
    const rx = (xs[i + 1] - xs[i]) / 2;
    return `A${n(rx)} ${n(yFoot - ySpring)} 0 0 0 ${P(xs[i + 1], ySpring)}`;
  };
  const pill = (r, y0, y1) => {
    const k = (y1 - y0) / 2;
    return (
      `M${P(CX - r + k, y0)}L${P(CX + r - k, y0)}A${n(k)} ${n(k)} 0 0 1 ${P(CX + r - k, y1)}` +
      `L${P(CX - r + k, y1)}A${n(k)} ${n(k)} 0 0 1 ${P(CX - r + k, y0)}Z`
    );
  };
  const out = [];
  for (const i of SHADED) {
    out.push(wash(`M${P(xs[i], -1)}L${P(xs[i], ySpring)}${foot(i)}L${P(xs[i + 1], -1)}Z`, LIGHT));
  }
  // Foot of the shaft: it flares out a little (apophyge) to meet the base
  out.push(
    line(
      `M${P(xs[0], -0.6)}L${P(xs[0], yFoot)}Q${P(xs[0], yTorus1 - 0.6)} ${P(xs[0] - 1.8, yTorus1)}` +
        `M${P(xs[5], -0.6)}L${P(xs[5], yFoot)}Q${P(xs[5], yTorus1 - 0.6)} ${P(xs[5] + 1.8, yTorus1)}` +
        `M${P(xs[0], ySpring)}${[0, 1, 2, 3, 4].map(foot).join('')}` +
        [1, 2, 3, 4].map((i) => `M${P(xs[i], -0.6)}L${P(xs[i], ySpring)}`).join(''),
    ),
  );
  // Scotia: the hollow between the two tori
  const hollow =
    `M${P(CX - 23.4, yScotia)}Q${P(CX - 21.4, (yScotia + yTorus2) / 2 + 0.6)} ${P(CX - 25.6, yTorus2)}` +
    `L${P(CX + 25.6, yTorus2)}Q${P(CX + 21.4, (yScotia + yTorus2) / 2 + 0.6)} ${P(CX + 23.4, yScotia)}Z`;
  out.push(wash(hollow, LIGHT));
  out.push(line(hollow));
  out.push(line(pill(25.2, yTorus1, yScotia), { fill: PAPER }));
  out.push(line(pill(28.6, yTorus2, yPlinth), { fill: PAPER }));
  // Plinth. Its bottom edge is the top of the stylobate, drawn by the steps piece.
  const pr = 29.6;
  out.push(
    line(
      `M${P(CX - pr, BASE_H)}L${P(CX - pr, yPlinth + 1)}Q${P(CX - pr, yPlinth)} ${P(CX - pr + 1, yPlinth)}` +
        `L${P(CX + pr - 1, yPlinth)}Q${P(CX + pr, yPlinth)} ${P(CX + pr, yPlinth + 1)}L${P(CX + pr, BASE_H)}`,
    ),
  );
  return svg(CELL, BASE_H, out);
}

// ---------- Pediment and entablature ----------
const PED = {
  apexY: 27, // top of the roof; the apex acroterion stands above it
  corniceY: 98, // top of the horizontal cornice
  eaveX: 17, // how far the cornice stops from the edge of the frame
  raking: 9, // thickness of the raking cornice
  corniceH: 7,
  dentilH: 5.6,
  friezeH: 15.4,
  architraveH: 19,
};
const PED_H = PED.corniceY + PED.corniceH + PED.dentilH + PED.friezeH + PED.architraveH;

// A palmette: round-ended lobes fanning from one point, the middle one drawn last so it lies on top.
function palmette(x, y, leaves, { turn = 0, band = 6 } = {}) {
  const out = [];
  const order = [...leaves].sort((a, b) => Math.abs(b.a) - Math.abs(a.a));
  for (const { a, len, w } of order) {
    const d = `M0 0C${P(-w * 0.2, -len * 0.42)} ${P(-w, -len * 0.56)} ${P(-w, -len + w)}A${n(w)} ${n(w)} 0 0 1 ${P(w, -len + w)}C${P(w, -len * 0.56)} ${P(w * 0.2, -len * 0.42)} 0 0Z`;
    out.push(
      line(d, { fill: PAPER, transform: `translate(${n(x)} ${n(y)}) rotate(${n(a + turn)})` }),
    );
  }
  // The band that ties the leaves
  if (band) {
    out.push(
      line(`M${P(-band, 0)}Q${P(0, 2.6)} ${P(band, 0)}Q${P(0, -2.2)} ${P(-band, 0)}Z`, {
        fill: PAPER,
        transform: `translate(${n(x)} ${n(y + 0.4)}) rotate(${n(turn)})`,
      }),
    );
  }
  return out;
}

function pediment() {
  const { apexY, corniceY, eaveX, raking, corniceH, dentilH, friezeH, architraveH } = PED;
  const mid = W / 2;
  const xL = eaveX;
  const xR = W - eaveX;
  const pitch = (corniceY - apexY) / (mid - xL);
  const drop = raking * Math.hypot(1, pitch); // the raking cornice measured straight down
  const inset = drop / pitch;
  // Entablature, from the cornice down
  const yDentil = corniceY + corniceH;
  const yFrieze = yDentil + dentilH;
  const yArch = yFrieze + friezeH;
  const yBottom = yArch + architraveH;
  const aL = AXIS - 22.5; // the architrave ends just inside the abacus
  const aR = W - aL;

  const out = [];
  // Tympanum: the recessed field, in the darker blue
  const tymp = `M${P(xL + inset, corniceY)}L${P(mid, apexY + drop)}L${P(xR - inset, corniceY)}Z`;
  out.push(line(tymp, { fill: DEEP }));
  // A sun in the tympanum: a disc and short rays, in the colour of the paper
  const sunY = corniceY - 24;
  const sun = [];
  const rays = 16;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU - 90 * deg;
    const long = i % 2 === 0;
    const r1 = 10.4;
    let r2 = long ? 17.5 : 14.4;
    // Keep every ray inside the field
    const reach = (r) => [mid + r * Math.cos(a), sunY + r * Math.sin(a)];
    const inside = ([x, y]) => y < corniceY - 3.4 && y > apexY + drop + Math.abs(x - mid) * pitch + 3.6;
    while (r2 > r1 + 1.5 && !inside(reach(r2))) r2 -= 0.4;
    if (r2 <= r1 + 1.5) continue;
    sun.push(`M${P(...reach(r1))}L${P(...reach(r2))}`);
  }
  out.push(line(sun.join(''), { stroke: PAPER }));
  out.push(
    `<circle cx="${n(mid)}" cy="${n(sunY)}" r="6.6" vector-effect="non-scaling-stroke" stroke="${PAPER}"/>`,
  );
  // Raking cornice
  out.push(line(`M${P(xL, corniceY)}L${P(mid, apexY)}L${P(xR, corniceY)}`));
  // Horizontal cornice
  out.push(
    line(
      `M${P(xL + 1, corniceY)}L${P(xR - 1, corniceY)}Q${P(xR, corniceY)} ${P(xR, corniceY + 1)}L${P(xR, yDentil - 1)}Q${P(xR, yDentil)} ${P(xR - 1, yDentil)}` +
        `L${P(xL + 1, yDentil)}Q${P(xL, yDentil)} ${P(xL, yDentil - 1)}L${P(xL, corniceY + 1)}Q${P(xL, corniceY)} ${P(xL + 1, corniceY)}Z`,
    ),
  );
  // Dentils: small solid blocks under the cornice, one on the axis
  const pitchD = 9.4;
  const blockW = 4.5;
  const half = Math.floor((mid - aL - 1 - blockW / 2) / pitchD);
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
        `M${P(aL, yArch + architraveH * 0.5)}L${P(aR, yArch + architraveH * 0.5)}` +
        `M${P(aL, yFrieze)}L${P(aL, yBottom)}L${P(aR, yBottom)}L${P(aR, yFrieze)}`,
    ),
  );
  // Acroteria: a palmette on the apex, a smaller one at each corner
  out.push(
    ...palmette(mid, apexY - 1.2, [
      { a: -64, len: 13.5, w: 2.9 },
      { a: -31, len: 19.5, w: 3.2 },
      { a: 0, len: 24, w: 3.5 },
      { a: 31, len: 19.5, w: 3.2 },
      { a: 64, len: 13.5, w: 2.9 },
    ]),
  );
  for (const side of [-1, 1]) {
    const x = mid + side * (mid - xL - 10);
    const y = corniceY - 10 * pitch - 1;
    out.push(
      ...palmette(
        x,
        y,
        [
          { a: -54, len: 10.5, w: 2.5 },
          { a: 0, len: 16, w: 2.9 },
          { a: 54, len: 10.5, w: 2.5 },
        ],
        { turn: side * 12, band: 4.4 },
      ),
    );
  }
  return svg(W, PED_H, out);
}

// ---------- Steps ----------
const STEP = 9;
const STEPS_H = STEP * 3 + 1;
function steps() {
  const out = [];
  const edges = [22, 17, 12]; // each step comes out a little further than the one above
  edges.forEach((x, i) => {
    const y = i * STEP;
    out.push(line(`M${P(x, y + STEP)}L${P(x, y)}L${P(W - x, y)}L${P(W - x, y + STEP)}`));
  });
  out.push(line(`M${P(12, STEP * 3)}L${P(W - 12, STEP * 3)}`));
  return svg(W, STEPS_H, out);
}

const pieces = {
  'portico-capital': capital(),
  'portico-shaft': shaft(),
  'portico-base': base(),
  'portico-pediment': pediment(),
  'portico-steps': steps(),
};
for (const [name, markup] of Object.entries(pieces)) {
  writeFileSync(resolve(outDir, `${name}.svg`), markup);
}
console.log(
  `portico: W ${W}, axis ${AXIS}, cell ${CELL}; heights pediment ${n(PED_H)}, capital ${CAP_H}, base ${BASE_H}, steps ${STEPS_H}`,
);
