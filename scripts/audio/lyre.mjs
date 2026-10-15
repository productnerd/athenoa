// A seven-string lyre (chelys), plucked with a plectrum in one sweep across the strings, tuned to the
// Dorian harmonia (the diatonic octave E F G A B C D, two conjunct tetrachords) in Pythagorean ratios.
// Karplus-Strong plucked strings; a short, dry, gut-string sound with a quick decay.
// node scripts/audio/lyre.mjs out.wav, then through ffmpeg (high-pass 110 Hz, a little body at 420 and
// 1300 Hz, a short echo, loudness -22 LUFS) to public/audio/lyre.mp3
import { writeFileSync } from 'node:fs';
const SR = 44100, LEN = 3.2, base = 164.81; // E3
const ratios = [1, 256 / 243, 32 / 27, 4 / 3, 3 / 2, 128 / 81, 16 / 9]; // E F G A B C D
const out = new Float32Array(Math.round(SR * LEN));
let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
ratios.forEach((r, i) => {
  const f = base * r;
  const N = Math.round(SR / f);
  const line = new Float32Array(N);
  // the plectrum: a bright burst, softened a little (gut, not steel)
  let prev = 0;
  for (let k = 0; k < N; k++) { const v = rnd(); prev = 0.6 * v + 0.4 * prev; line[k] = prev; }
  const start = Math.round(SR * (0.03 + i * 0.042)); // the sweep, low string to high (slowed a touch, 15 October 2026)
  const decay = 0.9955 - i * 0.0004; // higher strings die a little sooner
  const gain = 0.5 * (1 - i * 0.04);
  let idx = 0;
  for (let t = start; t < out.length; t++) {
    const a = line[idx], b = line[(idx + 1) % N];
    const v = decay * 0.5 * (a + b);
    line[idx] = v;
    idx = (idx + 1) % N;
    out[t] += a * gain;
  }
});
// 16-bit WAV
const data = Buffer.alloc(out.length * 2);
let peak = 0; for (const v of out) peak = Math.max(peak, Math.abs(v));
out.forEach((v, i) => data.writeInt16LE(Math.round((v / peak) * 0.9 * 32767), i * 2));
const head = Buffer.alloc(44);
head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8); head.write('fmt ', 12);
head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(1, 22); head.writeUInt32LE(SR, 24);
head.writeUInt32LE(SR * 2, 28); head.writeUInt16LE(2, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(data.length, 40);
writeFileSync(process.argv[2], Buffer.concat([head, data]));
