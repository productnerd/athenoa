// The site's short sounds (chirps, the bray, the splashes, the note tone...), all played through one
// Web Audio context.
//
// Why not `new Audio(file).play()`: Safari refuses that unless the call is made inside a click or key
// press, and most of these sounds answer a timer, a scroll or a hover instead, so in Safari they were
// silent. A Web Audio context, once woken by the visitor's first click, tap or key press, may play at
// any time. It also sets loudness itself (a gain), which the iPhone ignores on an <audio> element.
//
// Until that first gesture nothing plays, in any browser. The sound button in the corner mutes only
// the music: these effects play either way (client direction, 15 October 2026).

type Win = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let woken = false;
const buffers = new Map<string, Promise<AudioBuffer>>();

function wake() {
  woken = true;
  if (!context) {
    const Context = window.AudioContext ?? (window as Win).webkitAudioContext;
    if (!Context) return;
    context = new Context();
  }
  if (context.state !== 'running') context.resume().catch(() => {});
}
for (const type of ['pointerdown', 'keydown', 'touchend']) {
  window.addEventListener(type, wake, { capture: true, passive: true });
}

function load(ctx: AudioContext, file: string) {
  let buffer = buffers.get(file);
  if (!buffer) {
    buffer = fetch(file)
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.arrayBuffer();
      })
      // (the callback form: older Safari has no promise here)
      .then((data) => new Promise<AudioBuffer>((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)));
    buffer.catch(() => buffers.delete(file));
    buffers.set(file, buffer);
  }
  return buffer;
}

/** Plays a short sound once, at `volume` (0 to 1). Silent until something has been pressed. */
export async function playSound(file: string, volume: number) {
  if (!woken || !context) return;
  const ctx = context;
  try {
    if (ctx.state !== 'running') await ctx.resume();
    const buffer = await load(ctx, file);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // no file, or the browser will not play: stay silent
  }
}
