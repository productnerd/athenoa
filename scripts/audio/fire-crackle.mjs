// Sparse crackles for the fire loop: tiny pops of bright noise, a few a second, at uneven strengths,
// none across the loop's seam.
// (client request, 15 October 2026: "a little more crackle") node scripts/audio/fire-crackle.mjs c.wav,
// then mixed into the 12-second fire loop with ffmpeg: high-pass 1.5 kHz, low-pass 7 kHz, volume 0.25.
import { writeFileSync } from 'node:fs';
const SR = 44100, LEN = 12;
const out = new Float32Array(SR * LEN);
let seed = 11; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
let t = 0.15;
while (t < LEN - 0.15) {
  const at = Math.round(t * SR);
  const amp = 0.25 + r() ** 2 * 0.75; // mostly small, now and then a louder one
  const len = Math.round(SR * (0.0015 + r() * 0.004));
  const taps = r() < 0.3 ? 2 + Math.floor(r() * 3) : 1; // sometimes a little cluster
  for (let k = 0; k < taps; k++) {
    const off = at + Math.round(k * SR * (0.008 + r() * 0.02));
    for (let i = 0; i < len; i++) out[off + i] += (r() * 2 - 1) * amp * Math.exp(-i / (len / 3)) * (k ? 0.6 : 1);
  }
  t += 0.12 + r() * 0.45;
}
const data = Buffer.alloc(out.length * 2);
out.forEach((v, i) => data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(v * 0.8 * 32767))), i * 2));
const h = Buffer.alloc(44);
h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16);
h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
h.write('data', 36); h.writeUInt32LE(data.length, 40);
writeFileSync(process.argv[2], Buffer.concat([h, data]));
