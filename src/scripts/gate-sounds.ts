// The preview gate's sounds (src/components/PreviewGate.astro), made in code on the site's one Web
// Audio context (sound.ts) rather than played from files: knocks on a wooden door, a key turning in
// an old lock, and the door creaking open.

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

/** An old door creaking open over `dur` seconds. A hinge creaks by sticking and slipping: tiny
 *  catches whose rate wanders as the door turns (heard as the creak's rising and falling pitch),
 *  ringing through the wood, with the slower crackle of the old timber under it. */
export function creak(ctx: AudioContext, at: number, level: number, dur = 2.3) {
  const sr = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.round(sr * dur), sr);
  const data = buffer.getChannelData(0);
  // Two-pole resonators: the squeal of the hinge, its overtone, and the body of the door
  const res = (f: number, bw: number) => {
    const r = Math.exp((-Math.PI * bw) / sr);
    return { a1: 2 * r * Math.cos((2 * Math.PI * f) / sr), a2: -r * r, y1: 0, y2: 0 };
  };
  const bands = [
    { ...res(820, 110), mix: 1 },
    { ...res(1650, 190), mix: 0.55 },
    { ...res(240, 70), mix: 0.7 },
  ];
  let squeal = 0;
  let crackle = 0;
  let wander = 0;
  let peak = 0;
  for (let i = 0; i < data.length; i++) {
    const x = i / data.length; // how far through the swing
    wander = wander * 0.9995 + (Math.random() - 0.5) * 0.004;
    const swing = Math.sin(Math.PI * Math.min(1, x * 1.15));
    const rate = 150 + 230 * swing * (0.8 + 0.2 * Math.sin(x * 19)) + 400 * wander;
    let impulse = 0;
    squeal += Math.max(60, rate) / sr;
    if (squeal >= 1) {
      squeal -= 1;
      if (Math.random() > 0.06) impulse += 0.5 + 0.5 * Math.random();
    }
    crackle += (28 + 26 * Math.random()) / sr;
    if (crackle >= 1) {
      crackle -= 1;
      impulse += 0.8 * Math.random();
    }
    let y = 0;
    for (const b of bands) {
      const out = impulse + b.a1 * b.y1 + b.a2 * b.y2;
      b.y2 = b.y1;
      b.y1 = out;
      y += out * b.mix;
    }
    // swell in, hold, and let the last of the swing die away
    const env = Math.min(1, x / 0.07) * Math.min(1, (1 - x) / 0.3) * (0.7 + 0.3 * swing);
    data[i] = y * env;
    peak = Math.max(peak, Math.abs(data[i]));
  }
  if (peak > 0) for (let i = 0; i < data.length; i++) data[i] = (data[i] / peak) * 0.9;

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.connect(output(ctx, level));
  src.start(ctx.currentTime + at);
}
