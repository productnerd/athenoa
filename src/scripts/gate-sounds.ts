// The preview gate's sounds (src/components/PreviewGate.astro), made in code on the site's one Web
// Audio context (sound.ts) rather than played from files: knocks on a wooden door, a key turning in
// an old lock, and a bell as the gate opens. (Tried and dropped, Maria, 9 November 2026: a creaking
// door, too creepy, and a rising run of glassy bells.)

let noiseBuffer: AudioBuffer | null = null;
function noise(ctx: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function output(ctx: AudioContext, level: number) {
  const gain = ctx.createGain();
  gain.gain.value = level;
  gain.connect(ctx.destination);
  return gain;
}

/** A short burst of filtered noise: a knuckle on wood, a click of metal, a scrape. */
function burst(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  { freq, q, dur, gain, type = 'bandpass' }: { freq: number; q: number; dur: number; gain: number; type?: BiquadFilterType },
) {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(env).connect(dest);
  src.start(t, Math.random() * 0.3);
  src.stop(t + dur + 0.02);
}

/** A struck tone that falls a little in pitch and dies away: the body of a knock, the ring of iron. */
function tone(
  ctx: AudioContext,
  dest: AudioNode,
  t: number,
  { from, to, dur, gain, type = 'sine' }: { from: number; to: number; dur: number; gain: number; type?: OscillatorType },
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur * 0.6);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.003);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(env).connect(dest);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** One knock on a wooden door, `at` seconds from now: a low thump and the click of the knuckle. */
export function knock(ctx: AudioContext, at: number, level: number) {
  const t = ctx.currentTime + at;
  const out = output(ctx, level);
  tone(ctx, out, t, { from: 170, to: 92, dur: 0.16, gain: 1 });
  burst(ctx, out, t, { freq: 1100, q: 0.9, dur: 0.035, gain: 0.55 });
}

/** A key in an old lock: it slides in, the wards click twice as it turns, and the bolt gives. */
export function unlock(ctx: AudioContext, at: number, level: number) {
  const t = ctx.currentTime + at;
  const out = output(ctx, level);
  burst(ctx, out, t, { freq: 2600, q: 0.6, dur: 0.17, gain: 0.22, type: 'highpass' });
  for (const [dt, ring] of [
    [0.26, 2450],
    [0.4, 2750],
  ]) {
    burst(ctx, out, t + dt, { freq: 3600, q: 5, dur: 0.025, gain: 1 });
    tone(ctx, out, t + dt, { from: ring, to: ring * 0.985, dur: 0.11, gain: 0.1, type: 'triangle' });
  }
  tone(ctx, out, t + 0.62, { from: 150, to: 72, dur: 0.22, gain: 0.9 });
  burst(ctx, out, t + 0.62, { freq: 750, q: 1.2, dur: 0.07, gain: 0.6 });
}

/** A small hall for the bells: a tail of decaying noise, a little different in each ear. Returns the
 *  node to play into; it sends the sound out both dry and through the hall. */
function hall(ctx: AudioContext, out: AudioNode, seconds: number, wetLevel: number) {
  const convolver = ctx.createConvolver();
  const length = Math.round(ctx.sampleRate * seconds);
  const tail = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = tail.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  }
  convolver.buffer = tail;
  const wet = ctx.createGain();
  wet.gain.value = wetLevel;
  convolver.connect(wet).connect(out);
  const input = ctx.createGain();
  input.connect(out);
  input.connect(convolver);
  return input;
}

/** One strike of a bell: each partial a sine at a ratio of `f`, with its own loudness and length. */
function strike(ctx: AudioContext, dest: AudioNode, t: number, f: number, partials: number[][], level = 1) {
  for (const [ratio, amp, decay] of partials) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f * ratio;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(amp * level, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    osc.connect(env).connect(dest);
    osc.start(t);
    osc.stop(t + decay + 0.05);
  }
}

/** The bells offered for the gate's opening (Maria to choose, 9 November 2026). */
export const bells = {
  /** a small bronze temple bell: one warm strike, its hum glowing on (a sweet major third in it) */
  temple: { f: 523.25, wet: 0.35, partials: [[0.5, 0.45, 6], [1, 0.6, 4.5], [1.0012, 0.35, 4.2], [1.26, 0.3, 3.2], [1.5, 0.22, 2.8], [2, 0.55, 3.2], [3, 0.16, 1.8], [4, 0.08, 1.2]] },
  /** a crystal bell: one high, pure note, like a struck wine glass, shimmering softly as it fades */
  crystal: { f: 1174.66, wet: 0.45, partials: [[1, 1, 3.2], [1.0015, 0.6, 3], [2, 0.12, 1.5], [2.76, 0.16, 1.1], [5.4, 0.05, 0.5]] },
  /** the little brass bell on a spring over a shop door, tinkling as you come in */
  door: { f: 1760, wet: 0.25, partials: [[1, 1, 0.9], [2.4, 0.3, 0.45], [4.1, 0.12, 0.25]] },
};
export type BellName = keyof typeof bells;

/** Rings one of the bells `at` seconds from now. */
export function bell(ctx: AudioContext, at: number, level: number, name: BellName) {
  const t = ctx.currentTime + at;
  const b = bells[name];
  const into = hall(ctx, output(ctx, level), 2.4, b.wet);
  if (name === 'door') {
    // the clapper swings back and forth, each strike softer, each in a slightly different place
    [0, 0.09, 0.17, 0.29, 0.46].forEach((dt, i) =>
      strike(ctx, into, t + dt, b.f * (1 + (Math.random() - 0.5) * 0.01), b.partials, [1, 0.7, 0.55, 0.35, 0.2][i]),
    );
  } else strike(ctx, into, t, b.f, b.partials);
}
