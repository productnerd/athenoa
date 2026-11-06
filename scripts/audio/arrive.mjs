// The sound of arriving in a lesson (it replaces the lyre there, client request, 6 November 2026): one
// soft, low bell, like a small bronze singing bowl struck gently, with a slow bloom and a long fade.
// Synthesised: a few inharmonic partials (the bowl's own), each with its own gentle decay and a slight
// beating between near pairs; no attack click.
// node scripts/audio/arrive.mjs out.wav, then through ffmpeg (high-pass 90 Hz, loudness -24 LUFS) to
// public/audio/arrive.mp3
import { writeFileSync } from 'node:fs';
const SR = 44100;
const LEN = 3.6;
const f0 = 196; // G3
// partials of a small bowl (ratio, level, decay seconds), with near twins a hair apart, which beat slowly
const partials = [
  [1, 1, 2.6],
  [1.004, 0.55, 2.4],
  [2.71, 0.42, 1.5],
  [2.716, 0.25, 1.4],
  [5.12, 0.16, 0.8],
  [8.3, 0.06, 0.45],
];
const out = new Float32Array(Math.round(SR * LEN));
for (const [r, level, decay] of partials) {
  const f = f0 * r;
  for (let n = 0; n < out.length; n++) {
    const t = n / SR;
    // a soft strike: rises over 25 ms, then dies away
    const env = Math.min(1, t / 0.025) * Math.exp(-t / decay);
    out[n] += level * env * Math.sin(2 * Math.PI * f * t);
  }
}
// gently down at the very end
for (let n = 0; n < out.length; n++) {
  const t = n / SR;
  if (t > LEN - 0.4) out[n] *= (LEN - t) / 0.4;
}
let peak = 0;
for (const v of out) peak = Math.max(peak, Math.abs(v));
const pcm = Buffer.alloc(44 + out.length * 2);
pcm.write('RIFF', 0);
pcm.writeUInt32LE(36 + out.length * 2, 4);
pcm.write('WAVEfmt ', 8);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(1, 22);
pcm.writeUInt32LE(SR, 24);
pcm.writeUInt32LE(SR * 2, 28);
pcm.writeUInt16LE(2, 32);
pcm.writeUInt16LE(16, 34);
pcm.write('data', 36);
pcm.writeUInt32LE(out.length * 2, 40);
out.forEach((v, n) => pcm.writeInt16LE(Math.round((v / peak) * 0.9 * 32767), 44 + n * 2));
writeFileSync(process.argv[2] ?? 'arrive.wav', pcm);
