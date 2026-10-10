// Generates the line-art layers of the home hero "Portal A" (Monument): the original hero image of
// athenoa.academy redrawn in the site's manner. Athena rises behind a six-column temple at night.
// Run:  node scripts/illustrations/portal-a-build.mjs
// Writes src/assets/illustrations/portal-a-*.svg. Everything is seeded, so a rerun gives the same files.
//
// The scene layers share one frame: viewBox 0 0 1200 1050, centre line x = 600, the temple stands on
// y = 1000 and the near ground line runs at about y = 1046. Sky and Milky Way have their own wide frame.
//
// Colour: strokes follow currentColor (crème on the night panel). Fills use palette tokens with a hex
// fallback, so each file also renders on its own:
//   --paper (darker Greek blue, the night)   --blue (Greek blue: the hill, the lit cella, Athena's body)
//   --blue-light (the halo and the doorway)  --creme-light (the flame)
//   --pa-skin / --pa-armour                  the two tones of the figure, set by the hero component
import { writeFileSync } from 'node:fs';

const OUT = new URL('../../src/assets/illustrations/', import.meta.url);
const NIGHT = 'var(--paper,#071260)';
const STONE = 'var(--blue,#0b1c8c)';
const GLOW = 'var(--blue-light,#b3c0f3)';
const BRIGHT = 'var(--creme-light,#f9f3e3)';
const DARK = 'var(--blue-deep,#071260)';
const SKIN = 'var(--pa-skin,#0b1c8c)';
const ARMOUR = 'var(--pa-armour,#071260)';

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
const n1 = (v) => String(Math.round(v * 10) / 10);
const n0 = (v) => String(Math.round(v));
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
/** The same curve without the leading M, to continue a path. */
const smoothOn = (pts) => smooth(pts).replace(/^M[^C]+/, '');

const FRAME = '0 0 1200 1050';
const CX = 600;
const svg = (viewBox, body, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"${extra}>${body}</svg>\n`;
const P = (d, attrs = '') => `<path d="${d}"${attrs ? ' ' + attrs : ''}/>`;
const centred = (body) => `<g transform="translate(${CX} 0)">${body}</g>`;

function save(name, content) {
  writeFileSync(new URL(`portal-a-${name}.svg`, OUT), content);
  console.log(`portal-a-${name}.svg`, `${(content.length / 1024).toFixed(1)} KB`);
}

/* =====================================================================================
   Sky: dots of three sizes and four-point sparks of three sizes
   ===================================================================================== */
function sky() {
  const r = rng(2026);
  const W = 1600;
  const H = 1000;
  const taken = [];
  const place = (n, minD) => {
    const out = [];
    for (let tries = 0; out.length < n && tries < n * 90; tries++) {
      const p = [16 + r() * (W - 32), 8 + r() * (H - 16)];
      if (taken.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > Math.max(minD, q[2]))) {
        taken.push([p[0], p[1], minD]);
        out.push(p);
      }
    }
    return out;
  };
  const spark = ([x, y], s) => {
    const w = s * 0.6;
    const k = s * 0.13;
    return (
      `M${n1(x)} ${n1(y - s)}Q${n1(x + k)} ${n1(y - k)} ${n1(x + w)} ${n1(y)}Q${n1(x + k)} ${n1(y + k)} ${n1(x)} ${n1(y + s)}` +
      `Q${n1(x - k)} ${n1(y + k)} ${n1(x - w)} ${n1(y)}Q${n1(x - k)} ${n1(y - k)} ${n1(x)} ${n1(y - s)}Z`
    );
  };
  const dots = (pts) => pts.map(([x, y]) => `M${n0(x)} ${n0(y)}h.01`).join('');
  const sparks = [
    ...place(6, 190).map((p) => spark(p, 17)),
    ...place(14, 110).map((p) => spark(p, 11.5)),
    ...place(30, 64).map((p) => spark(p, 7.5)),
  ].join('');
  const body =
    P(sparks, 'fill="currentColor" stroke="none"') +
    P(dots(place(56, 34)), 'stroke-width="5"') +
    P(dots(place(150, 20)), 'stroke-width="3.4"') +
    P(dots(place(340, 11)), 'stroke-width="2.2" stroke-opacity=".78"');
  save('sky', svg(`0 0 ${W} ${H}`, body, ' preserveAspectRatio="xMidYMid slice"'));
}

/* =====================================================================================
   Milky Way: a drifting band of fine dots with a darker lane through it
   ===================================================================================== */
function milkyway() {
  const r = rng(77);
  const gauss = () => (r() + r() + r() + r() - 2) / 0.577;
  const A = [1470, -110];
  const B = [1130, 10];
  const C = [740, 150];
  const D = [200, 880];
  const at = (t) => {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return [a * A[0] + b * B[0] + c * C[0] + d * D[0], a * A[1] + b * B[1] + c * C[1] + d * D[1]];
  };
  const groups = [[], [], []];
  let made = 0;
  for (let tries = 0; made < 2500 && tries < 40000; tries++) {
    const t = r();
    const clump = 0.55 + 0.45 * Math.sin(t * 23 + 1.3) * Math.sin(t * 7.1);
    if (r() > (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * t), 0.7)) * clump) continue;
    const sigma = 24 + 64 * Math.pow(Math.sin(Math.PI * t), 1.1);
    const n = gauss() * sigma;
    const lane = 12 * Math.sin(t * 8.5 + 0.6);
    if (t > 0.12 && t < 0.9 && Math.abs(n - lane) < 7 + 6 * Math.sin(t * 31) && r() < 0.86) continue;
    const p0 = at(t);
    const p1 = at(t + 0.002);
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy) || 1;
    const x = p0[0] + (-dy / len) * n + gauss() * 3;
    const y = p0[1] + (dx / len) * n + gauss() * 3;
    if (x < -10 || x > 1610 || y < -10 || y > 1010) continue;
    const pick = r();
    groups[pick < 0.7 ? 0 : pick < 0.95 ? 1 : 2].push(`M${n0(x)} ${n0(y)}h.01`);
    made++;
  }
  const body =
    P(groups[0].join(''), 'stroke-width="1.7" stroke-opacity=".6"') +
    P(groups[1].join(''), 'stroke-width="2.5" stroke-opacity=".7"') +
    P(groups[2].join(''), 'stroke-width="3.6" stroke-opacity=".8"');
  save('milkyway', svg('0 0 1600 1000', body, ' preserveAspectRatio="xMidYMid slice"'));
}

/* =====================================================================================
   The glow behind Athena's head: a disc of light blue and long wavy rays
   ===================================================================================== */
const HEAD = [0, 205];
function rays() {
  const R0 = 137;
  const LAMBDA = 58;
  const pattern = [1, 0.6, 0.8, 0.6];
  let out = `<circle cx="0" cy="${HEAD[1]}" r="119" fill="${GLOW}" stroke="none" data-nodraw=""/>`;
  const count = 49;
  for (let i = 0; i < count; i++) {
    const deg = -118 + (236 * i) / (count - 1); // 0 = straight up
    const a = (deg * Math.PI) / 180;
    const dir = [Math.sin(a), -Math.cos(a)];
    const perp = [-dir[1], dir[0]];
    const up = Math.max(0, Math.cos(a));
    const reach = 1 / Math.sqrt((Math.sin(a) / 580) ** 2 + (up / 222) ** 2);
    const end = Math.min(reach, 580) * pattern[i % 4];
    const halves = Math.floor((end - R0) / (LAMBDA / 2));
    if (halves < 2) continue;
    const at = (s, off) => [
      HEAD[0] + dir[0] * (R0 + s) + perp[0] * off,
      HEAD[1] + dir[1] * (R0 + s) + perp[1] * off,
    ];
    let d = `M${pt(at(0, 0))}`;
    for (let h = 0; h < halves; h++) {
      const s0 = (h * LAMBDA) / 2;
      const amp = 6.4 * Math.min(1, 0.35 + s0 / 110) * (h % 2 ? -1 : 1);
      d += `Q${pt(at(s0 + LAMBDA / 4, amp * 2))} ${pt(at(s0 + LAMBDA / 2, 0))}`;
    }
    out += P(d);
  }
  save('rays', svg(FRAME, centred(out)));
}

/* =====================================================================================
   Athena: half figure, crested helmet, aegis of scales, spear, and Nike on an orb
   ===================================================================================== */
function athena() {
  let o = '';
  const mirror = (d) =>
    // mirrors a path written with absolute M/L/C/Q commands only
    d.replace(/([MLCQ])([^MLCQZ]*)/g, (_, cmd, nums) => {
      const v = nums.trim().split(/[\s,]+/).map(Number);
      for (let i = 0; i < v.length; i += 2) v[i] = -v[i];
      return cmd + v.map(n1).join(' ');
    });

  /* --- hair: a dark mass behind the face, strands falling to the shoulders --- */
  const strand = (j, side) => {
    const pts = [];
    for (let y = 184; y <= 338; y += 11) {
      const t = (y - 184) / 140;
      const m = 43 + 4.8 * j - (9 - 11 * j) * Math.pow(t, 1.3) - (2.6 + 0.25 * j) * Math.sin(((y - 184) / 41) * Math.PI * 2 + 0.6);
      pts.push([side * m, y]);
    }
    return pts;
  };
  for (const side of [-1, 1]) {
    const outer = strand(3, side);
    o += P(`${smooth(outer)}L${side * 20} 338L${side * 20} 200L${side * 40} 182Z`, `fill="${ARMOUR}" stroke="none"`);
    o += P([0, 1, 2, 3].map((j) => smooth(strand(j, side))).join(''));
  }

  /* --- body: shoulders, the arm that carries Nike, the raised arm with its hanging cloth --- */
  o += P(
    'M-21 262L-22 296C-52 300 -102 318 -126 340C-140 358 -150 388 -152 411C-162 414 -174 419 -185 421L-185 442' +
      'C-172 445 -158 446 -146 445C-146 470 -146 495 -146 520L182 520C181 480 186 430 185 398C190 394 190 388 188 383.6' +
      'L221.6 260.6L204.4 255.4L169.5 359.8C150 350 132 338 118 332C100 318 52 300 22 296L21 262Z',
    `fill="${SKIN}"`,
  );
  // where the arms leave the body
  o += P('M-104 364C-110 386 -119 410 -128 432M106 361L170 394');
  // folds of the peplos under the aegis, and the cloth hanging from the raised arm
  const arcY = (x) => 250 + Math.sqrt(164 * 164 - x * x);
  let folds = '';
  for (const x of [-97, -78, -59, -40, -21]) {
    const y = arcY(x) + 3;
    folds += `M${n1(x)} ${n1(y)}C${n1(x - 4)} ${n1(y + 34)} ${n1(x * 1.07 + 3)} ${n1(y + 70)} ${n1(x * 1.08 - 2)} 520`;
  }
  for (const x of [22, 42, 62, 82, 102]) {
    const y = arcY(x) + 3;
    folds += `M${n1(x)} ${n1(y)}C${n1(x + 4)} ${n1(y + 34)} ${n1(x * 1.05 - 3)} ${n1(y + 70)} ${n1(x * 1.06 + 2)} 520`;
  }
  for (const x of [124, 143, 162]) {
    const y = 361 + 0.515 * (x - 106) + 2;
    folds += `M${n1(x)} ${n1(y)}C${n1(x - 5)} ${n1(y + 36)} ${n1(x + 6)} ${n1(y + 74)} ${n1(x + 1)} 520`;
  }
  o += P(folds);

  /* --- aegis: a cape of scallop scales with a medallion --- */
  const AEGIS = 'M-24 291Q0 317 24 291L139.5 336.5A164 164 0 0 1 -135 343.8Z';
  o += `<clipPath id="pa-aegis"><path d="M-27.5 297Q0 322.5 27.5 297L131 337.6A156.4 156.4 0 0 1 -127 344.4Z"/></clipPath>`;
  o += P(AEGIS, `fill="${ARMOUR}"`);
  let sc = '';
  const W = 19;
  const RR = 9.6;
  const SAG = 0.0034;
  let row = 0;
  for (let Y = 298; Y <= 434; Y += 9.5, row++) {
    for (let x = -152 + (row % 2 ? W / 2 : 0); x <= 152; x += W) {
      const yc = Y - SAG * x * x;
      if (Math.hypot(x, yc - 250) > 168) continue;
      if (yc < 296 + 0.36 * (Math.abs(x) - 22) - 13) continue;
      const xa = x - W / 2;
      const xb = x + W / 2;
      sc += `M${n1(xa)} ${n1(Y - SAG * xa * xa)}A${RR} ${RR} 0 0 0 ${n1(xb)} ${n1(Y - SAG * xb * xb)}`;
    }
  }
  o += P(sc, 'clip-path="url(#pa-aegis)"');
  o += P('M-27.5 297Q0 322.5 27.5 297M131 337.6A156.4 156.4 0 0 1 -127 344.4');
  let ticks = '';
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    ticks += `M${n1(Math.sin(a) * 8.2)} ${n1(364 - Math.cos(a) * 8.2)}L${n1(Math.sin(a) * 11.6)} ${n1(364 - Math.cos(a) * 11.6)}`;
  }
  o += `<circle cx="0" cy="364" r="16" fill="${ARMOUR}"/><circle cx="0" cy="364" r="4.6"/>` + P(ticks);

  /* --- neck and face --- */
  o += P('M-20.5 264L-21.5 293M20.5 264L21.5 293');
  o += P(
    'M-39 180C-40 200 -39 214 -36 228C-32 250 -16 272 0 272C16 272 32 250 36 228C39 214 40 200 39 180Z',
    `fill="${SKIN}"`,
  );
  const brow = 'M-31 199C-24 192.5 -12.5 192.5 -6.5 199.5C-5.2 207 -5.6 220 -7 229';
  const eye = 'M-29.5 213C-25 206 -13 205.2 -8 212.6C-13 217.8 -24.5 218.2 -29.5 213Z';
  o += P(brow + mirror(brow) + eye + mirror(eye));
  o += P('M-7.8 233.5C-8 239.6 -3 239.6 0 237.4C3 239.6 8 239.6 7.8 233.5');
  o += P('M-9.8 249.8C-6.4 250.8 -3 249.4 0 251C3 249.4 6.4 250.8 9.8 249.8M-5 256.6C-1.8 258.4 1.8 258.4 5 256.6');
  o += `<circle cx="-18.4" cy="211.4" r="3.5" fill="currentColor" stroke="none"/><circle cx="18.4" cy="211.4" r="3.5" fill="currentColor" stroke="none"/>`;

  /* --- helmet: crest, dome, brow band with a gabled frontlet and volutes --- */
  const polar = (rad, deg) => [rad * Math.sin((deg * Math.PI) / 180), 168 - rad * Math.cos((deg * Math.PI) / 180)];
  o += P(
    `M${pt(polar(50, -27))}L${pt(polar(127, -27))}A127 127 0 0 1 ${pt(polar(127, 27))}L${pt(polar(50, 27))}Z`,
    `fill="${ARMOUR}"`,
  );
  let plume = '';
  for (let deg = -22.5; deg <= 22.6; deg += 4.5) plume += `M${pt(polar(61, deg))}L${pt(polar(124, deg))}`;
  o += P(plume);
  o += P(`M${pt(polar(59, -27))}A59 59 0 0 1 ${pt(polar(59, 27))}`);
  o += P('M-47 183C-53 140 -30 119 0 119C30 119 53 140 47 183Q0 173 -47 183Z', `fill="${ARMOUR}"`);
  o += P('M-47.6 174.4Q0 164 47.6 174.4M-41 171.6L0 150L41 171.6M-27 168.6L0 156.4L27 168.6');
  const curl = (cx, cy, dir) => {
    const pts = [];
    const turns = 1.35;
    for (let k = 0; k <= 22; k++) {
      const phi = (k / 22) * turns * Math.PI * 2;
      const rad = 7.4 - 5.4 * (k / 22);
      pts.push([cx + dir * rad * Math.sin(phi), cy - rad * Math.cos(phi)]);
    }
    return smooth(pts);
  };
  o += `<circle cx="-50.5" cy="179.5" r="7.4" fill="${ARMOUR}" stroke="none"/><circle cx="50.5" cy="179.5" r="7.4" fill="${ARMOUR}" stroke="none"/>`;
  o += P(curl(-50.5, 179.5, -1) + curl(50.5, 179.5, 1));

  /* --- Nike on her orb, in the open hand --- */
  const NX = -205;
  const nx = (d) => d.replace(/@(-?[\d.]+)/g, (_, v) => n1(NX + Number(v)));
  o += `<circle cx="${NX}" cy="402" r="17" fill="${SKIN}"/>`;
  o += P('M-185 421C-194 425 -212 427.5 -220 419.5C-223.5 414.5 -229.5 415.5 -229.5 421.5C-229.5 433 -214 444 -185 442', `fill="${SKIN}"`);
  o += P('M-222 428C-214 434 -202 435 -192 433');
  const wing = 'M@-5 330C@-21 326 @-40 304 @-44 264C@-37 275 @-33.5 283 @-32 290.5C@-27.5 292.5 @-24.5 297.5 @-23 303.5C@-18.5 305.5 @-15 310.5 @-13.5 316.5C@-9.5 317.5 @-6 320.5 @-4 324Z';
  const feather = 'M@-39.5 279C@-31 297 @-20 313 @-8.5 326';
  for (const side of [-1, 1]) {
    const flip = (d) => (side < 0 ? d : d.replace(/@(-?[\d.]+)/g, (_, v) => `@${-Number(v)}`));
    o += P(nx(flip(wing)), `fill="${SKIN}"`);
    o += P(nx(flip(feather)));
  }
  o += P(
    nx('M@-10 327C@-9 338 @-7 344 @-6.5 349C@-10 362 @-14 376 @-15.5 386Q@0 391.5 @15.5 386C@14 376 @10 362 @6.5 349C@7 344 @9 338 @10 327Q@0 331.5 @-10 327Z'),
    `fill="${SKIN}"`,
  );
  o += P(nx('M@-6.5 349Q@0 352.5 @6.5 349M@-3.6 353L@-6.4 386.5M@0 353.6L@0 388M@3.6 353L@6.4 386.5'));
  o += `<circle cx="${NX}" cy="315" r="7.6" fill="${SKIN}"/>`;

  /* --- spear and the fist that holds it --- */
  const sx = (y) => 231 - (19 * (y - 16)) / 484;
  o += P(
    `M${n1(sx(62) - 2.9)} 62L${n1(sx(520) - 2.9)} 520L${n1(sx(520) + 2.9)} 520L${n1(sx(62) + 2.9)} 62Z`,
    `fill="${ARMOUR}"`,
  );
  o += P(
    `M${n1(sx(62) - 2.9)} 62C${n1(sx(50) - 10)} 52 ${n1(sx(36) - 8.5)} 36 ${n1(sx(16))} 16C${n1(sx(36) + 8.5)} 36 ${n1(sx(50) + 10)} 52 ${n1(sx(62) + 2.9)} 62Z`,
    `fill="${ARMOUR}"`,
  );
  o += P(`M${n1(sx(57))} 57L${n1(sx(27))} 27M${n1(sx(67) - 5)} 67L${n1(sx(67) + 5)} 67`);
  o += P('M207 229C207 222.5 213 219 220.5 219C229 219 234.5 223 234.5 230L233.5 250C233.5 257 227.5 260.5 220.5 260.5C212.5 260.5 207 257 207 251Z', `fill="${SKIN}"`);
  o += P('M221 229.6Q228 228.4 234 230.4M220.6 239.6Q227.6 238.4 234 240.2M220.4 249.4Q227 248.4 233.4 250M207.4 237Q214 233.4 219.4 238.4');

  save('athena', svg(FRAME, centred(o)));
}

/* =====================================================================================
   Temple: six Ionic columns on three steps, entablature with triglyphs, lettered pediment
   ===================================================================================== */
const AXES = [-360, -216, -72, 72, 216, 360];
function temple() {
  let o = '';
  /* pediment */
  o += P('M-428 528L0 425L428 528Z', `fill="${NIGHT}"`);
  o += P('M-406.4 528L0 430.2L406.4 528M-363.5 528L0 440.5L363.5 528');
  for (const s of [-1, 1]) {
    o += P(`M${s * 428} 528C${s * 441} 520 ${s * 446} 505 ${s * 438} 492C${s * 427} 502 ${s * 422} 516 ${s * 428} 528Z`, `fill="${NIGHT}"`);
    o += P(`M${s * 429.5} 522L${s * 436.5} 499`);
  }
  o += `<text x="7" y="517.5" text-anchor="middle" font-family="var(--font-title)" font-size="46" letter-spacing="14" fill="currentColor" stroke="none" data-nodraw="">ΑΘΕΝΟΑ</text>`;

  /* cornice, frieze, architrave */
  o += P('M-428 546V528H428V546Z', `fill="${NIGHT}"`);
  o += P('M-420 540.6H420');
  o += P('M-394 622V546H394V622Z', `fill="${NIGHT}"`);
  o += P('M-394 590H394M-394 606H394');
  let tri = '';
  for (let k = 0; k < 11; k++) {
    const c = -382 + (764 * k) / 10;
    tri += `M${n1(c - 12)} 546V590M${n1(c - 4)} 550.5V585.5M${n1(c + 4)} 550.5V585.5M${n1(c + 12)} 546V590`;
  }
  o += P(tri);

  /* columns */
  const spiral = (cx, cy, dir) => {
    const pts = [];
    const turns = 1.45;
    for (let k = 0; k <= 28; k++) {
      const phi = (k / 28) * turns * Math.PI * 2;
      const rad = 10.2 - 7.6 * (k / 28);
      pts.push([cx + dir * rad * Math.sin(phi), cy - rad * Math.cos(phi)]);
    }
    return smooth(pts);
  };
  for (const ax of AXES) {
    // shaft, with its flutes
    o += P(`M${ax - 28} 930L${ax - 23.5} 650H${ax + 23.5}L${ax + 28} 930Z`, `fill="${NIGHT}" stroke="none"`);
    let flutes = '';
    for (const f of [-1, -0.78, -0.45, 0, 0.45, 0.78, 1]) {
      const edge = Math.abs(f) === 1;
      flutes += `M${n1(ax + 23.5 * f + (edge ? 0 : 0.1 * f))} ${edge ? 651 : 658}L${n1(ax + 28 * f)} ${edge ? 930 : 924}`;
    }
    o += P(flutes);
    // base: two tori
    o += P(
      `M${ax - 29.5} 930h59a3.7 3.7 0 0 1 0 7.4h-59a3.7 3.7 0 0 1 0-7.4ZM${ax - 33} 937.4h66a4.2 4.2 0 0 1 0 8.4h-66a4.2 4.2 0 0 1 0-8.4Z`,
      `fill="${NIGHT}"`,
    );
    // capital: abacus, cushion, two volutes
    o += P(`M${ax - 27.5} 627.5H${ax + 27.5}V651H${ax - 27.5}Z`, `fill="${NIGHT}" stroke="none"`);
    o += P(`M${ax - 35} 622H${ax + 35}V627.6H${ax - 35}Z`, `fill="${NIGHT}"`);
    o += P(spiral(ax - 27.5, 638.2, -1), `fill="${NIGHT}"`) + P(spiral(ax + 27.5, 638.2, 1), `fill="${NIGHT}"`);
    o += P(`M${ax - 17.6} 640.4Q${ax} 646.6 ${ax + 17.6} 640.4M${ax - 23} 651.2H${ax + 23}`);
  }

  /* three steps */
  o += P('M-448 1000V982H-430V964H-412V946H412V964H430V982H448V1000Z', `fill="${NIGHT}"`);
  o += P('M-430 982H430M-412 964H412');
  save('temple', svg(FRAME, centred(o)));
}

/* The lit wall behind the columns, with the lintel of the doorway */
function cella() {
  let o = P('M-372 624H372V946H-372Z', `fill="${STONE}" stroke="none"`);
  o += P('M-58 694H58M-52 704H52');
  save('cella', svg(FRAME, centred(o)));
}

/* The light of the doorway and the rays that fan out from the flame */
const FIRE = [0, 866];
function light() {
  let o = `<path class="pa-door" d="M-52 704H52V946H-52Z" fill="${GLOW}" stroke="none"/>`;
  let beams = '';
  let i = 0;
  for (let deg = 186; deg <= 354.1; deg += 7, i++) {
    const a = (deg * Math.PI) / 180;
    const dir = [Math.cos(a), Math.sin(a)];
    // from just outside the glow to the walls or the ceiling of the porch
    let far = Infinity;
    if (dir[0] !== 0) far = Math.min(far, 370 / Math.abs(dir[0]));
    far = Math.min(far, (FIRE[1] - 628) / -dir[1]);
    let near = i % 2 ? 74 : 56;
    // inside the doorway the light is already a flat wash: start the ray where it leaves it
    const exitX = Math.abs(dir[0]) > 0.0001 ? 56 / Math.abs(dir[0]) : Infinity;
    const exitY = (FIRE[1] - 690) / -dir[1];
    near = Math.max(near, Math.min(exitX, exitY));
    if (far - near < 26) continue;
    beams += P(`M${n1(FIRE[0] + dir[0] * near)} ${n1(FIRE[1] + dir[1] * near)}L${n1(FIRE[0] + dir[0] * far)} ${n1(FIRE[1] + dir[1] * far)}`);
  }
  o += `<g class="pa-beams">${beams}</g>`;
  save('light', svg(FRAME, centred(o)));
}

/* The brazier and its flame, standing in the doorway */
function flame() {
  let o = '';
  o += P('M-25 903H25L23 908Q14 920 4.5 921.5L5 936L14 946H-14L-5 936L-4.5 921.5Q-14 920 -23 908Z', `fill="${DARK}" stroke="${DARK}"`);
  o +=
    `<g class="pa-fire">` +
    P('M-16.5 902C-25 884 -11 874 -9.5 857C-3 866 -1.5 850 2.5 830C10 848 21 862 17.5 882C16.4 891 14.6 897 16.5 902Z', `fill="${BRIGHT}" stroke="${DARK}"`) +
    P('M-6.5 901C-10.5 890 -3 883 0.4 870C5 880 9.6 889 6.8 901', `stroke="${STONE}"`) +
    `</g>`;
  save('flame', svg(FRAME, centred(o)));
}

/* =====================================================================================
   Trees
   ===================================================================================== */
/** A cypress: a tall flame of foliage, its inner lines gathered at the foot and at the tip. */
function cypress(r, x, yb, h, w, lean = 0, veins = [-0.52, 0.02, 0.54]) {
  const hw = (t) =>
    w * (t < 0.26 ? 0.34 + 0.66 * Math.sin((t / 0.26) * (Math.PI / 2)) : Math.pow(Math.cos(((t - 0.26) / 0.74) * (Math.PI / 2)), 0.72));
  const mid = (t) => x + lean * t * t;
  const ph = r() * 6;
  const sway = (t, k) => w * 0.07 * Math.sin(t * 8.5 + ph + k);
  const left = [];
  const right = [];
  for (let k = 0; k <= 11; k++) {
    const t = k / 12;
    left.push([mid(t) - hw(t) + sway(t, 0), yb - h * t]);
    right.push([mid(t) + hw(t) + sway(t, 2.2), yb - h * t]);
  }
  const outline = smooth([...left, [mid(1), yb - h], ...right.reverse()]);
  let o = P(`${outline}Z`, `fill="${NIGHT}" stroke="none"`) + P(outline);
  let inner = '';
  for (const k of veins) {
    const pts = [];
    const top = 0.8 + r() * 0.12 - Math.abs(k) * 0.12;
    for (let t = 0.02; t <= top; t += 0.08) {
      const gather = Math.min(1, t / 0.34);
      pts.push([mid(t) + k * hw(t) * gather * gather * (3 - 2 * gather) + w * 0.05 * Math.sin(t * 7 + k * 5 + ph), yb - h * t]);
    }
    inner += smooth(pts);
  }
  o += P(inner);
  return o;
}

/** One clump of pine foliage: scallops over a flat, slightly wavy underside, echoed once inside. */
function clump(r, cx, base, w, hgt, n) {
  const a = w / 2;
  const at = (k, count, sc) => {
    const phi = Math.PI * (1 - k / count);
    return [cx + a * sc * Math.cos(phi), base - hgt * sc * Math.pow(Math.sin(phi), 0.8)];
  };
  // uneven scallop widths, so the outline is drawn rather than plotted
  const cuts = [0];
  for (let k = 1; k < n; k++) cuts.push(k + (r() - 0.5) * 0.36);
  cuts.push(n);
  let d = `M${pt(at(0, n, 1))}`;
  for (let k = 0; k < n; k++) {
    const p = at(cuts[k], n, 1);
    const q = at(cuts[k + 1], n, 1);
    const rad = Math.hypot(q[0] - p[0], q[1] - p[1]) * (0.56 + r() * 0.08);
    d += `A${n1(rad)} ${n1(rad)} 0 0 1 ${pt(q)}`;
  }
  const under = [[cx + a, base]];
  for (let k = 1; k <= 4; k++) under.push([cx + a - (2 * a * k) / 4, base + (k < 4 ? hgt * 0.07 * Math.sin(k * 2.1 + cx) : 0)]);
  d += `${smoothOn(under)}Z`;
  let echo = '';
  const m = Math.max(2, n - 2);
  for (let k = 0; k < m; k++) {
    const p = at(k, m, 0.6);
    const q = at(k + 1, m, 0.6);
    const rad = Math.hypot(q[0] - p[0], q[1] - p[1]) * 0.6;
    echo += `M${n1(p[0])} ${n1(p[1] - hgt * 0.08)}A${n1(rad)} ${n1(rad)} 0 0 1 ${n1(q[0])} ${n1(q[1] - hgt * 0.08)}`;
  }
  return P(d, `fill="${NIGHT}"`) + P(echo);
}

/** An umbrella pine: a bare leaning trunk, three boughs, a flat crown in three clumps. */
function pine(r, x, yb, h, W, bend = 0) {
  const fork = [x + bend, yb - h * 0.6];
  const cx = fork[0] + bend * 0.45;
  const under = yb - h * 0.8;
  // a tapering limb between two points, bowed a little
  const limb = (from, to, t0, t1, bow) => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const c = [from[0] + dx * 0.5 + nx * len * bow, from[1] + dy * 0.5 + ny * len * bow];
    const tm = (t0 + t1) / 2;
    return (
      `M${n1(from[0] + nx * t0)} ${n1(from[1] + ny * t0)}Q${n1(c[0] + nx * tm)} ${n1(c[1] + ny * tm)} ${n1(to[0] + nx * t1)} ${n1(to[1] + ny * t1)}` +
      `L${n1(to[0] - nx * t1)} ${n1(to[1] - ny * t1)}Q${n1(c[0] - nx * tm)} ${n1(c[1] - ny * tm)} ${n1(from[0] - nx * t0)} ${n1(from[1] - ny * t0)}Z`
    );
  };
  const t = 5 + h * 0.012;
  let o = '';
  o += P(limb(fork, [cx - W * 0.27, under + h * 0.03], t * 0.5, t * 0.28, -0.1), `fill="${NIGHT}"`);
  o += P(limb(fork, [cx + W * 0.28, under + h * 0.02], t * 0.5, t * 0.28, 0.1), `fill="${NIGHT}"`);
  o += P(limb(fork, [cx + W * 0.02, under - h * 0.06], t * 0.56, t * 0.3, 0.03), `fill="${NIGHT}"`);
  o += P(limb([x, yb], fork, t, t * 0.6, bend > 0 ? 0.05 : -0.05), `fill="${NIGHT}"`);
  o += clump(r, cx + W * 0.02, under - h * 0.045, W * 0.64, h * 0.165, 5);
  o += clump(r, cx - W * 0.27, under + h * 0.035, W * 0.5, h * 0.115, 4);
  o += clump(r, cx + W * 0.29, under + h * 0.02, W * 0.46, h * 0.105, 4);
  return o;
}

function trees() {
  const rl = rng(41);
  let left = '';
  left += `<g class="pa-pine">${pine(rl, 276, 760, 560, 330, 22)}</g>`;
  left += cypress(rl, 96, 760, 480, 34, 5);
  left += cypress(rl, 32, 760, 330, 26, -3);
  save('trees-left', svg('0 0 480 760', left));

  const rr = rng(58);
  let right = '';
  right += `<g class="pa-pine">${pine(rr, 196, 900, 520, 300, -26)}</g>`;
  right += cypress(rr, 400, 900, 800, 50, -7);
  right += `<g class="pa-pine">${cypress(rr, 306, 900, 590, 40, 5)}</g>`;
  right += cypress(rr, 482, 900, 480, 32, 3);
  save('trees-right', svg('0 0 520 900', right));
}

/* =====================================================================================
   The hill the temple stands on, and the near ground the title sits on
   ===================================================================================== */
const hillY = (x) => {
  const d = Math.abs(x - CX);
  return 1000.5 + (d > 470 ? 0.00011 * (d - 470) ** 2 : 0);
};
function hill() {
  const r = rng(9);
  const top = [];
  for (let x = -2400; x <= 3600; x += 75) top.push([x, hillY(x)]);
  let o = P(`${smooth(top)}L3600 1900L-2400 1900Z`, `fill="${STONE}" stroke="none"`) + P(smooth(top));
  // a few flowing lines on the flanks
  let lines = '';
  for (const s of [-1, 1]) {
    for (const [drop, from, to] of [
      [15, 520, 1180],
      [31, 640, 1010],
    ]) {
      const pts = [];
      for (let d = from; d <= to; d += 60) pts.push([CX + s * d, hillY(CX + s * d) + drop + 0.004 * (d - from)]);
      lines += smooth(pts);
    }
  }
  o += P(lines);
  // two cypresses on each side of the temple, further back
  for (const [dx, h, w] of [
    [-540, 212, 15],
    [-592, 150, 12],
    [548, 196, 14.5],
    [604, 138, 11.5],
  ]) {
    o += cypress(r, CX + dx, hillY(CX + dx) + 2, h, w, 0, [0]);
  }
  save('hill', svg(FRAME, o));
}

function ground() {
  const y = (x) => 1046 + 4.5 * Math.sin((x - CX) / 430 + 0.5) - 0.000011 * (x - CX) ** 2;
  const top = [];
  for (let x = -2400; x <= 3600; x += 100) top.push([x, y(x)]);
  const o = P(`${smooth(top)}L3600 3400L-2400 3400Z`, `fill="${NIGHT}" stroke="none"`) + P(smooth(top));
  save('ground', svg(FRAME, o));
}

sky();
milkyway();
rays();
athena();
cella();
light();
temple();
flame();
hill();
ground();
trees();
