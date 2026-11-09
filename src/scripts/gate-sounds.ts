// The preview gate's sounds (src/components/PreviewGate.astro), made in code on the site's one Web
// Audio context (sound.ts) rather than played from files: knocks on a wooden door, a key turning in
// an old lock, and a shimmer of light as the gate opens. (A creaking door was tried and dropped: too
// creepy, Maria, 9 November 2026.)

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

/** A shimmer of light for the moment the gate opens: a rising run of glassy bells (a bright
 *  pentatonic scale, so no two notes can clash), a soft breath of air sweeping up under it, and a
 *  warm chord held beneath, all in a small generated hall. */
export function shimmer(ctx: AudioContext, at: number, level: number) {
  const t0 = ctx.currentTime + at;
  const out = output(ctx, level);

  // The hall: a tail of decaying noise, a little different in each ear
  const hall = ctx.createConvolver();
  const length = Math.round(ctx.sampleRate * 2.6);
  const tail = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = tail.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  }
  hall.buffer = tail;
  const wet = ctx.createGain();
  wet.gain.value = 0.45;
  hall.connect(wet).connect(out);
  const dry = ctx.createGain();
  dry.gain.value = 0.8;
  dry.connect(out);
  const send = (node: AudioNode) => {
    node.connect(dry);
    node.connect(hall);
  };

  // The run: D major pentatonic, rising over two octaves. Each bell is a sine with two faint,
  // slightly out-of-tune overtones, which is what makes it sound like glass.
  const notes = [587.3, 659.3, 740, 880, 987.8, 1174.7, 1318.5, 1480, 1760];
  notes.forEach((f, i) => {
    const t = t0 + i * 0.11 + Math.random() * 0.015;
    const bell = ctx.createGain();
    bell.gain.setValueAtTime(0.0001, t);
    bell.gain.exponentialRampToValueAtTime(0.22 * (1 - i * 0.05), t + 0.006);
    bell.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    send(bell);
    for (const [ratio, amp] of [
      [1, 1],
      [2.76, 0.25],
      [5.4, 0.08],
    ]) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f * ratio * (1 + (Math.random() - 0.5) * 0.002);
      const g = ctx.createGain();
      g.gain.value = amp;
      osc.connect(g).connect(bell);
      osc.start(t);
      osc.stop(t + 2.3);
    }
  });

  // A breath of air rising under the run
  const air = ctx.createBufferSource();
  air.buffer = noise(ctx);
  air.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 1.4;
  band.frequency.setValueAtTime(900, t0);
  band.frequency.exponentialRampToValueAtTime(6000, t0 + 1.6);
  const airGain = ctx.createGain();
  airGain.gain.setValueAtTime(0.0001, t0);
  airGain.gain.exponentialRampToValueAtTime(0.12, t0 + 0.7);
  airGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 2);
  air.connect(band).connect(airGain);
  send(airGain);
  air.start(t0);
  air.stop(t0 + 2.05);

  // A warm chord beneath (D, A, D), swelling in and away
  for (const f of [293.7, 440, 587.3]) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    osc.detune.value = (Math.random() - 0.5) * 8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4);
    osc.connect(g);
    send(g);
    osc.start(t0);
    osc.stop(t0 + 3.5);
  }
}
