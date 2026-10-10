// Generates the line-art layers of home hero candidate C ("Landscape"): an Attic paper theatre.
// Run:  node scripts/illustrations/hero-c-build.mjs
// Writes src/assets/illustrations/hero-c-*.svg. Every drawing is seeded, so a rerun gives the same files.
//
// Colour: strokes follow currentColor (crème on the blue panel). Cut-out fills use the hero's own
// custom properties with a hex fallback, so each file also renders on its own:
//   --hc-far, --hc-mid, --hc-hill, --hc-near   four blues, far to near
//   --hc-sea                        the bright Aegean band
//   --hc-light                      crème paper (sun, temple, sails)
import { writeFileSync } from 'node:fs';

const OUT = new URL('../../src/assets/illustrations/', import.meta.url);
const FAR = 'var(--hc-far,#1631a6)';
const MID = 'var(--hc-mid,#0a1a7e)';
const HILL = 'var(--hc-hill,#081672)';
const NEAR = 'var(--hc-near,#071260)';
const SEA = 'var(--hc-sea,#2a56d6)';
const LIGHT = 'var(--hc-light,#f6eedb)';

/* ---------- helpers ---------- */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function makeNoise(seed) {
  const r = rng(seed);
  const v = Array.from({ length: 1024 }, () => r() * 2 - 1);
  const at = (i) => v[((i % 1024) + 1024) % 1024];
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const t = f * f * (3 - 2 * f);
    return at(i) + (at(i + 1) - at(i)) * t;
  };
}
let PREC = 10; // 10 = one decimal, 2 = halves (enough for small repeated shapes)
const n1 = (v) => String(Math.round(v * PREC) / PREC);
const pt = (p) => `${n1(p[0])} ${n1(p[1])}`;

/** Catmull-Rom through the points, written as cubic Béziers. */
function smooth(pts, closed = false) {
  const n = pts.length;
  const get = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pt(pts[0])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return closed ? d + 'Z' : d;
}
/** The same curve without the leading M, to continue an open path. */
const smoothOn = (pts) => smooth(pts).replace(/^M[^C]+/, '');

/** y(x) through control points (x ascending), Catmull-Rom in y. */
function curve(ctrl) {
  return (x) => {
    let i = 0;
    while (i < ctrl.length - 2 && x > ctrl[i + 1][0]) i++;
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p0 = ctrl[Math.max(0, i - 1)];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    const t = Math.max(0, Math.min(1, (x - p1[0]) / (p2[0] - p1[0])));
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1[1] +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
    );
  };
}

const svg = (viewBox, body, sw = 2.4) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;

function save(name, content) {
  writeFileSync(new URL(`hero-c-${name}.svg`, OUT), content);
  console.log(`hero-c-${name}.svg`, `${(content.length / 1024).toFixed(1)} KB`);
}

/* ---------- band layers share one frame: viewBox 0 0 1000 640, horizon at y = 380 ---------- */
const BAND = '0 0 1000 640';
const X0 = -950;
const X1 = 1420;
const HORIZON = 380;

/**
 * Echo lines under an outline, the way the hair lines run on the Nymfi label: the outline is
 * averaged over a widening window, stepped down, and broken into strokes of uneven length.
 *   top(x)            the outline          clamp(x)   keeps the averaging inside the shape
 *   hidden(x, y, k)   true where line k must not be drawn
 */
function echoLines({ top, clamp = (x) => x, r, noise, count, gap, from, to, hidden }) {
  let out = '';
  let drop = 0;
  for (let k = 1; k <= count; k++) {
    drop += gap * (1 + 0.14 * k) * (0.9 + r() * 0.2);
    const win = 24 + k * 26;
    const line = (x) => {
      let sum = 0;
      let n = 0;
      for (let dx = -win; dx <= win; dx += win / 4) {
        sum += top(clamp(x + dx));
        n++;
      }
      return sum / n + drop + 2 * noise(x / 60 + k * 9);
    };
    let run = [];
    let pen = r() * 160;
    let stroke = 180 + r() * 380;
    const flush = () => {
      if (run.length > 3) out += `<path d="${smooth(run)}"/>`;
      run = [];
    };
    for (let x = from; x <= to; x += 24) {
      const y = line(x);
      pen += 24;
      if (pen > stroke) {
        flush();
        pen = -(24 + r() * 56); // lift the pen for a moment
        stroke = 170 + r() * 420;
      }
      if (pen < 0 || hidden(x, y, k)) {
        flush();
        continue;
      }
      run.push([x, y]);
    }
    flush();
  }
  return out;
}

/** A mountain range across the whole frame: a cut-out with its ridge line and echo lines. */
function ridge({ ctrl, seed, fill, rough, echoes, gap, lineOpacity }) {
  const r = rng(seed);
  const noise = makeNoise(seed + 7);
  const top = curve(ctrl);
  const f = (x) => top(x) + rough * noise(x / 90) + rough * 0.4 * noise(x / 31 + 40);
  const outline = [];
  for (let x = X0; x <= X1; x += 22) outline.push([x, f(x)]);
  const body = `<path d="${smooth(outline)}L${X1} 760L${X0} 760Z" fill="${fill}" stroke="none"/>`;
  const lines =
    `<path d="${smooth(outline)}"/>` +
    echoLines({ top: f, r, noise, count: echoes, gap, from: X0, to: X1, hidden: (x, y) => y > HORIZON + 1 });
  return `${body}<g opacity="${lineOpacity}">${lines}</g>`;
}

/* ---------- 1. Sun: crème disc, a clear ring of sky, then wavy and short rays ---------- */
function sun() {
  const r = rng(11);
  const noise = makeNoise(3);
  const C = 450;
  // the disc is cut by hand: a slow wobble plus a fine tremor along the edge
  const disc = [];
  for (let i = 0; i < 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const rad = 150 + 1.6 * noise(i / 7.5) + 0.9 * noise(i * 1.7 + 50);
    disc.push([C + Math.cos(a) * rad, C + Math.sin(a) * rad]);
  }
  let rays = '';
  const N = 32;
  for (let i = 0; i < N; i++) {
    const deg = (i / N) * 360 - 90 + (r() - 0.5) * 1.4;
    const long = i % 2 === 0;
    const len = (long ? 150 : 96) + (r() - 0.5) * 16;
    const start = 174 + (r() - 0.5) * 4;
    const wave = 62 + (r() - 0.5) * 6;
    const flip = i % 4 < 2 ? 1 : -1;
    const pts = [];
    for (let s = 0; s <= len + 0.01; s += wave / 8) {
      const amp = Math.min(1, s / 50) * (long ? 6 : 5);
      pts.push([C + start + s, C + flip * amp * Math.sin((s / wave) * Math.PI * 2)]);
    }
    rays += `<path transform="rotate(${n1(deg)} ${C} ${C})" d="${smooth(pts)}"/>`;
    // a short straight ray between each pair of wavy ones
    const mid = deg + 180 / N + (r() - 0.5) * 1.2;
    const s0 = 176 + (r() - 0.5) * 5;
    rays += `<path transform="rotate(${n1(mid)} ${C} ${C})" d="M${n1(C + s0)} ${C}L${n1(C + s0 + 34 + r() * 12)} ${C}"/>`;
  }
  return { rays: svg('0 0 900 900', rays, 2.1), disc };
}

function sunDisc(discPts) {
  const noise = makeNoise(5);
  const C = 450;
  const ring = (rad, seed) => {
    const p = [];
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const rr = rad + 1.2 * noise(i / 2.7 + seed);
      p.push([C + Math.cos(a) * rr, C + Math.sin(a) * rr]);
    }
    return smooth(p, true);
  };
  const ink = 'var(--hc-ink,#0b1c8c)';
  const body =
    `<path d="${smooth(discPts, true)}" fill="${LIGHT}" stroke="none"/>` +
    `<path d="${ring(137, 2)}" stroke="${ink}"/>` +
    `<path d="${ring(126, 9)}" stroke="${ink}"/>`;
  return svg('0 0 900 900', body, 2.1);
}

/* ---------- 2. Far and middle ranges ---------- */
function rangeFar() {
  return svg(
    BAND,
    ridge({
      seed: 21,
      fill: FAR,
      rough: 6,
      echoes: 6,
      gap: 15,
      lineOpacity: 0.5,
      ctrl: [
        [-950, 298],
        [-760, 274],
        [-600, 296],
        [-440, 264],
        [-290, 288],
        [-140, 258],
        [10, 282],
        [150, 244],
        [300, 236],
        [430, 206],
        [560, 250],
        [690, 222],
        [830, 262],
        [960, 214],
        [1100, 250],
        [1240, 190],
        [1420, 240],
      ],
    }),
    2.2,
  );
}
function rangeMid() {
  return svg(
    BAND,
    ridge({
      seed: 34,
      fill: MID,
      rough: 5,
      echoes: 4,
      gap: 14,
      lineOpacity: 0.72,
      ctrl: [
        [-950, 322],
        [-720, 300],
        [-520, 326],
        [-330, 304],
        [-150, 330],
        [20, 318],
        [200, 312],
        [380, 338],
        [540, 322],
        [680, 352],
        [800, 340],
        [930, 318],
        [1080, 344],
        [1220, 306],
        [1420, 334],
      ],
    }),
    2.3,
  );
}

/* ---------- 3. Sea: a bright band with flowing wave lines ---------- */
function sea() {
  const r = rng(52);
  const noise = makeNoise(53);
  const top = [];
  for (let x = X0; x <= X1; x += 120) top.push([x, HORIZON + 1.2 * noise(x / 200)]);
  let body = `<path d="${smooth(top)}L${X1} 900L${X0} 900Z" fill="${SEA}" stroke="none"/>`;
  let lines = '';
  // rows widen and grow towards the viewer
  let y = HORIZON;
  for (let row = 0; row < 15; row++) {
    const k = row / 14;
    y += 8 + k * 22;
    const half = 11 + k * 24; // half a wavelength
    const amp = 2.2 + k * 6.5;
    let x = X0 + r() * 80;
    let d = '';
    while (x < X1) {
      const count = 3 + Math.floor(r() * (row < 4 ? 9 : 7)); // half-waves in this stroke
      const y0 = y + 2.5 * noise(x / 140 + row * 3);
      d += `M${n1(x)} ${n1(y0)}q${n1(half / 2)} ${n1(-amp)} ${n1(half)} 0`;
      for (let i = 1; i < count; i++) d += `t${n1(half * (0.88 + r() * 0.24))} ${n1((r() - 0.5) * 1.2)}`;
      x += count * half + half * (0.7 + r() * 1.6);
    }
    lines += `<path d="${d}"${row < 3 ? ' opacity=".7"' : ''}/>`;
  }
  // a boat under sail, out in the bay
  const bx = 604;
  const by = 458;
  const boat =
    `<path d="M${bx - 30} ${by - 2}Q${bx - 2} ${by + 15} ${bx + 33} ${by - 4}Q${bx} ${by + 2} ${bx - 30} ${by - 2}Z" fill="${LIGHT}" stroke="none"/>` +
    `<path d="M${bx + 3} ${by - 9}L${bx + 2} ${by - 68}Q${bx + 27} ${by - 38} ${bx + 25} ${by - 10}Q${bx + 14} ${by - 6} ${bx + 3} ${by - 9}Z" fill="${LIGHT}" stroke="none"/>` +
    `<path d="M${bx - 4} ${by - 9}L${bx - 3} ${by - 56}Q${bx - 22} ${by - 32} ${bx - 23} ${by - 9}Q${bx - 13} ${by - 6} ${bx - 4} ${by - 9}Z" fill="${LIGHT}" stroke="none"/>`;
  return svg(BAND, body + lines + boat, 2.2);
}

/* ---------- 4. Headlands: the right cape, and the left one that carries the temple ---------- */
function cypress(x, base, h, w, r) {
  const lean = (r() - 0.5) * w * 0.3;
  const d =
    `M${n1(x - w * 0.18)} ${n1(base)}` +
    `C${n1(x - w)} ${n1(base - h * 0.22)} ${n1(x - w * 0.62 + lean)} ${n1(base - h * 0.74)} ${n1(x + lean)} ${n1(base - h)}` +
    `C${n1(x + w * 0.62 + lean)} ${n1(base - h * 0.74)} ${n1(x + w)} ${n1(base - h * 0.22)} ${n1(x + w * 0.18)} ${n1(base)}Z`;
  const rib = `M${n1(x)} ${n1(base - h * 0.12)}Q${n1(x - w * 0.22)} ${n1(base - h * 0.5)} ${n1(x + lean * 0.8)} ${n1(base - h * 0.82)}`;
  return `<path d="${d}" fill="${NEAR}"/><path d="${rib}"/>`;
}

function temple(cx, base) {
  // Front of a small Doric temple cut from crème paper: the dark behind it draws the lines.
  const r = rng(77);
  const j = () => (r() - 0.5) * 0.9;
  const cols = 6;
  const cw = 8.6;
  const gapw = 10.6;
  const width = cols * cw + (cols - 1) * gapw;
  const x0 = cx - width / 2;
  const colH = 46;
  const steps = [
    [width + 26, 4.6],
    [width + 15, 4.4],
    [width + 5, 4.2],
  ];
  let out = '';
  let y = base;
  const quad = (xa, ya, xb, yb, xc, yc, xd, yd) =>
    `<path d="M${n1(xa + j())} ${n1(ya + j())}L${n1(xb + j())} ${n1(yb + j())}L${n1(xc + j())} ${n1(yc + j())}L${n1(xd + j())} ${n1(yd + j())}Z"/>`;
  for (const [w, h] of steps) {
    out += quad(cx - w / 2, y, cx + w / 2, y, cx + w / 2, y - h, cx - w / 2, y - h);
    y -= h + 1.5;
  }
  const colBase = y;
  const colTop = colBase - colH;
  for (let i = 0; i < cols; i++) {
    const x = x0 + i * (cw + gapw);
    // shaft tapers a little, with a wider capital
    out += quad(x, colBase, x + cw, colBase, x + cw - 0.9, colTop + 4.6, x + 0.9, colTop + 4.6);
    out += quad(x - 1.6, colTop + 3.2, x + cw + 1.6, colTop + 3.2, x + cw + 1.6, colTop, x - 1.6, colTop);
  }
  y = colTop - 1.5;
  out += quad(x0 - 4, y, x0 + width + 4, y, x0 + width + 4, y - 5, x0 - 4, y - 5); // architrave
  y -= 6.4;
  out += quad(x0 - 4, y, x0 + width + 4, y, x0 + width + 4, y - 4.4, x0 - 4, y - 4.4); // frieze
  y -= 5.9;
  const ped = 23;
  out += `<path d="M${n1(x0 - 8)} ${n1(y)}L${n1(cx + j())} ${n1(y - ped)}L${n1(x0 + width + 8)} ${n1(y)}Z"/>`;
  const acro = `<path d="M${n1(cx)} ${n1(y - ped - 1)}L${n1(cx)} ${n1(y - ped - 8)}" stroke="${LIGHT}" stroke-width="2.4"/>`;
  // the tympanum, drawn in the dark
  const tym = `<path d="M${n1(x0 + 12)} ${n1(y - 3.6)}L${n1(cx)} ${n1(y - ped + 6.4)}L${n1(x0 + width - 12)} ${n1(y - 3.6)}Z" fill="none" stroke="${HILL}" stroke-width="2"/>`;
  return `<g fill="${LIGHT}" stroke="none">${out}</g>${acro}${tym}`;
}

function hillLeft() {
  const r = rng(61);
  const ctrl = [
    [-950, 322],
    [-780, 304],
    [-620, 324],
    [-470, 300],
    [-330, 320],
    [-200, 302],
    [-80, 314],
    [30, 300],
    [120, 288],
    [186, 274],
    [226, 265],
    [374, 265],
    [420, 276],
    [480, 306],
    [540, 338],
    [596, 366],
    [640, 386],
    [664, 396],
  ];
  const top = curve(ctrl);
  const shoreCtrl = [
    [-950, 520],
    [-500, 482],
    [-100, 452],
    [250, 428],
    [470, 412],
    [600, 402],
    [664, 396],
    [1950, 396],
  ];
  const shore = curve(shoreCtrl);
  // The headland ends at the cape: build its outline only up to there.
  const noise = makeNoise(68);
  const f = (x) => top(x) + (x > 210 && x < 390 ? 0 : 4.5 * noise(x / 90) + 1.8 * noise(x / 31 + 40));
  const upper = [];
  for (let x = X0; x <= 664; x += 22) upper.push([x, f(x)]);
  upper.push([664, 396]);
  const under = [];
  for (let x = 620; x >= X0; x -= 60) under.push([x, shore(x) + 1.5 * noise(x / 70)]);
  let out = `<path d="${smooth(upper)}${smoothOn([[664, 396], ...under])}Z" fill="${HILL}" stroke="none"/>`;
  let lines = `<path d="${smooth(upper.slice(0, -1))}"/>`;
  // echo lines, kept above the shore and clear of the temple terrace
  lines += echoLines({
    top,
    clamp: (x) => Math.min(660, x),
    r,
    noise,
    count: 7,
    gap: 15,
    from: X0,
    to: 640,
    hidden: (x, y, k) => y > shore(x) - 7 || (k === 1 && x > 180 && x < 420),
  });
  // shoreline
  lines += `<path d="${smooth([[664, 396], ...under])}" opacity=".85"/>`;
  out += lines;
  // cypresses beside the temple and down the slope
  const trees = [
    [196, 40, 7.5],
    [180, 30, 6.5],
    [398, 44, 8],
    [416, 31, 6.5],
    [470, 34, 7],
    [70, 36, 7.5],
    [-196, 42, 8.5],
    [-214, 30, 7],
    [-470, 40, 8.5],
    [-486, 28, 7],
  ];
  for (const [x, h, w] of trees) out += cypress(x, f(x) + 3, h, w, r);
  out += temple(300, 265.5);
  return svg(BAND, out, 2.3);
}

function hillRight() {
  const ctrl = [
    [780, 392],
    [812, 372],
    [868, 350],
    [940, 334],
    [1020, 306],
    [1110, 296],
    [1210, 266],
    [1330, 276],
    [1460, 240],
    [1600, 256],
    [1760, 226],
    [1950, 244],
  ];
  const top = curve(ctrl);
  const noise = makeNoise(88);
  const r = rng(89);
  const shore = curve([
    [780, 394],
    [900, 404],
    [1150, 424],
    [1500, 456],
    [1950, 500],
  ]);
  const f = (x) => top(x) + 4.5 * noise(x / 90) * Math.min(1, (x - 780) / 80);
  const upper = [];
  for (let x = 780; x <= X1; x += 22) upper.push([x, f(x)]);
  const under = [];
  for (let x = X1; x >= 800; x -= 60) under.push([x, shore(x) + 1.5 * noise(x / 70)]);
  under.push([780, 393]);
  let out = `<path d="${smooth(upper)}L${pt(under[0])}${smoothOn(under)}Z" fill="${HILL}" stroke="none"/>`;
  let lines = `<path d="${smooth(upper)}"/>`;
  lines += echoLines({
    top,
    clamp: (x) => Math.max(790, x),
    r,
    noise,
    count: 7,
    gap: 15,
    from: 800,
    to: X1,
    hidden: (x, y) => y > shore(x) - 7,
  });
  lines += `<path d="${smooth(under)}" opacity=".85"/>`;
  out += lines;
  for (const [x, b, h, w] of [
    [1010, 310, 34, 7],
    [1026, 308, 44, 8.5],
    [1224, 268, 40, 8],
  ])
    out += cypress(x, b, h, w, r);
  return svg(BAND, out, 2.3);
}

/* ---------- 5. Pines ---------- */
/** One clump of needles: a bun with a domed top and a shallow belly, filled so it hides what is behind. */
function lobe(x, y, rx, ry, r, echo = true) {
  const k = 0.5523;
  const b = ry * (0.26 + r() * 0.08); // belly
  const tilt = (r() - 0.5) * 0.14;
  const skew = (r() - 0.5) * rx * 0.18; // the top sits a little off centre
  const ly = y + rx * tilt;
  const ry2 = y - rx * tilt;
  const d =
    `M${n1(x - rx)} ${n1(ly)}` +
    `C${n1(x - rx)} ${n1(ly - k * ry)} ${n1(x + skew - k * rx)} ${n1(y - ry)} ${n1(x + skew)} ${n1(y - ry)}` +
    `C${n1(x + skew + k * rx)} ${n1(y - ry)} ${n1(x + rx)} ${n1(ry2 - k * ry)} ${n1(x + rx)} ${n1(ry2)}` +
    `C${n1(x + rx)} ${n1(ry2 + k * b)} ${n1(x + k * rx)} ${n1(y + b)} ${n1(x)} ${n1(y + b)}` +
    `C${n1(x - k * rx)} ${n1(y + b)} ${n1(x - rx)} ${n1(ly + k * b)} ${n1(x - rx)} ${n1(ly)}Z`;
  let out = `<path d="${d}"/>`;
  if (echo) {
    const s = 0.58;
    const ex = x + skew * 0.8;
    const top = y - ry * 0.68;
    out +=
      `<path fill="none" d="M${n1(ex - rx * s)} ${n1(y - ry * 0.06)}` +
      `C${n1(ex - rx * s)} ${n1(y - ry * 0.44)} ${n1(ex - rx * s * 0.6)} ${n1(top)} ${n1(ex)} ${n1(top)}` +
      `C${n1(ex + rx * s * 0.6)} ${n1(top)} ${n1(ex + rx * s)} ${n1(y - ry * 0.44)} ${n1(ex + rx * s)} ${n1(y - ry * 0.06)}"/>`;
  }
  return out;
}

/** A tapering limb along a centre line, as a closed shape. */
function limb(line, w0, w1) {
  const left = [];
  const right = [];
  for (let i = 0; i < line.length; i++) {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const w = (w0 + (w1 - w0) * (i / (line.length - 1))) / 2;
    left.push([line[i][0] - (dy / len) * w, line[i][1] + (dx / len) * w]);
    right.push([line[i][0] + (dy / len) * w, line[i][1] - (dx / len) * w]);
  }
  right.reverse();
  return `<path d="${smooth(left)}L${pt(right[0])}${smoothOn(right)}Z"/>`;
}

/**
 * A stone pine: a slim leaning trunk, two limbs, and an umbrella crown built from rows of
 * overlapping clumps (back row first), like scales.
 *   x, base   foot of the trunk        h        height to the top of the crown
 *   w         width of the crown       lean     how far the crown sits off the foot
 */
function pine({ x, base, h, w, lean = 0, seed, fill = NEAR, echo = true, bark = false }) {
  const r = rng(seed);
  const crownH = w * 0.4;
  const cx = x + lean;
  const under = base - h + crownH * 0.82; // the underside of the crown
  const sway = (r() - 0.5) * h * 0.04;
  const trunk = [
    [x, base],
    [x + lean * 0.16 + sway, base - h * 0.22],
    [x + lean * 0.42 + sway * 1.4, base - h * 0.45],
    [x + lean * 0.78 + sway * 0.4, under + h * 0.07],
    [cx, under - crownH * 0.12],
  ];
  const tw = Math.max(7, Math.min(h * 0.04, w * 0.085));
  let wood = '';
  // two limbs leave the trunk below the crown and reach into its ends
  const fork = [x + lean * 0.62 + sway, under + h * 0.15];
  for (const side of [-1, 1]) {
    const reach = w * (0.27 + r() * 0.07) * side;
    wood += limb(
      [
        [fork[0] - side * tw * 0.1, fork[1] + h * 0.02],
        [fork[0] + reach * 0.5, under + h * 0.06 + crownH * 0.1],
        [fork[0] + reach, under - crownH * 0.04],
      ],
      tw * 0.52,
      tw * 0.34,
    );
  }
  wood += limb(trunk, tw, tw * 0.56);
  if (bark) {
    // a few short strokes up the trunk
    for (const [t, len, off] of [
      [0.2, 0.09, -0.18],
      [0.36, 0.07, 0.2],
      [0.5, 0.1, -0.12],
      [0.66, 0.06, 0.16],
    ]) {
      const at = (u) => {
        const yy = base - (base - under) * u;
        // the trunk's x at this height, read off its centre line
        let i = 0;
        while (i < trunk.length - 2 && trunk[i + 1][1] > yy) i++;
        const k = (trunk[i][1] - yy) / (trunk[i][1] - trunk[i + 1][1] || 1);
        return [trunk[i][0] + (trunk[i + 1][0] - trunk[i][0]) * k + off * tw, yy];
      };
      wood += `<path fill="none" d="M${pt(at(t))}L${pt(at(t + len))}"/>`;
    }
  }

  // crown: three rows on a shallow dome, the lowest row widest and flattest
  let crown = '';
  const rows = [
    { n: 3, span: 0.5, y: -0.62, ry: 0.36 },
    { n: 4, span: 0.8, y: -0.3, ry: 0.35 },
    { n: 5, span: 1, y: 0, ry: 0.29 },
  ];
  for (const row of rows) {
    const rx = (w * row.span) / row.n / 1.36;
    for (let i = 0; i < row.n; i++) {
      const u = i / (row.n - 1) - 0.5; // -0.5 .. 0.5
      const lx = cx + u * (w * row.span - rx * 1.5) + (r() - 0.5) * rx * 0.24;
      // the dome drops towards its ends
      const ly = under + crownH * row.y + Math.abs(u * 2) ** 1.8 * crownH * 0.2 + (r() - 0.5) * crownH * 0.05;
      crown += lobe(lx, ly, rx * (1 + r() * 0.2), crownH * row.ry * (1 + r() * 0.14), r, echo);
    }
  }
  return `<g fill="${fill}">${wood}${crown}</g>`;
}

function pinesTall() {
  // The tall pine at the right edge carries its crown above the sun, so the sun is seen under it.
  const r = rng(130);
  const body =
    cypress(508, 940, 330, 34, r) +
    pine({ x: 368, base: 960, h: 880, w: 400, lean: 30, seed: 132, bark: true }) +
    cypress(446, 940, 230, 27, r);
  return svg('0 0 560 900', body, 2.6);
}

function pinesRight() {
  // A lower pine in front of it, with one cypress.
  const r = rng(134);
  const body = cypress(338, 600, 214, 27, r) + pine({ x: 196, base: 620, h: 452, w: 268, lean: -24, seed: 135 });
  return svg('0 0 400 560', body, 2.5);
}

function pinesLow() {
  // The lower group at the left: two pines and three cypresses.
  const r = rng(140);
  let body = '';
  body += cypress(388, 640, 250, 30, r) + cypress(446, 640, 176, 24, r);
  body += pine({ x: 262, base: 660, h: 420, w: 270, lean: -40, seed: 141 });
  body += pine({ x: 92, base: 660, h: 300, w: 216, lean: 18, seed: 146 });
  body += cypress(18, 640, 200, 26, r);
  return svg('0 0 520 600', body, 2.5);
}

/* ---------- 6. The pine wood on the near shore: we look out between its trunks ---------- */
// lower in the middle so the bay stays open, climbing at both sides
const woodNoise = makeNoise(151);
const woodLift = (x) => 46 * Math.min(1.6, ((x - 560) / 620) ** 2) + 8 * woodNoise(x / 210);

function shorePines() {
  const r = rng(150);
  PREC = 2;
  let trees = '';
  let x = X0 + 30;
  let i = 0;
  while (x < X1) {
    const lift = woodLift(x);
    const tall = 126 + lift * 1.5 + r() * 46;
    const wCrown = 98 + r() * 44 + lift * 0.5;
    trees += pine({ x, base: 664, h: tall, w: wCrown, lean: (r() - 0.5) * 34, seed: 160 + i, echo: false });
    x += wCrown * (0.9 + r() * 0.66);
    i++;
  }
  PREC = 10;
  return svg(BAND, trees, 2.3);
}

function undergrowth() {
  const r = rng(170);
  let rowsOut = '';
  const rows = [
    { y: 607, rx: 50, ry: 30, step: 84 },
    { y: 642, rx: 66, ry: 38, step: 108 },
    { y: 690, rx: 80, ry: 44, step: 128 },
  ];
  rows.forEach((row, index) => {
    let xx = X0 + index * 41;
    while (xx < X1) {
      const y = row.y - woodLift(xx) * 0.42 + (r() - 0.5) * 10;
      rowsOut += lobe(xx, y, row.rx * (0.9 + r() * 0.3), row.ry * (0.9 + r() * 0.3), r);
      xx += row.step * (0.84 + r() * 0.3);
    }
  });
  const floor = `<path d="M${X0} 612L${X1} 612L${X1} 900L${X0} 900Z" stroke="none"/>`;
  return svg(BAND, `<g fill="${NEAR}">${floor}${rowsOut}</g>`, 2.3);
}

/* ---------- 7. Swallows ---------- */
function birds() {
  const flock = [
    [60, 70, 30, -8],
    [128, 38, 22, 6],
    [176, 96, 18, -14],
    [236, 58, 14, 4],
  ];
  let out = '';
  for (const [x, y, s, tilt] of flock) {
    out +=
      `<path transform="rotate(${tilt} ${x} ${y})" d="M${n1(x - s)} ${n1(y - s * 0.18)}` +
      `Q${n1(x - s * 0.46)} ${n1(y - s * 0.5)} ${x} ${y}` +
      `Q${n1(x + s * 0.4)} ${n1(y - s * 0.62)} ${n1(x + s * 0.96)} ${n1(y - s * 0.34)}"/>`;
  }
  return svg('0 0 280 130', out, 2.6);
}

/* ---------- write ---------- */
const s = sun();
save('rays', s.rays);
save('sun', sunDisc(s.disc));
save('range-far', rangeFar());
save('range-mid', rangeMid());
save('sea', sea());
save('hill-right', hillRight());
save('hill-left', hillLeft());
save('pines-tall', pinesTall());
save('pines-right', pinesRight());
save('pines-low', pinesLow());
save('shore-pines', shorePines());
save('undergrowth', undergrowth());
save('birds', birds());
