// The site's short sounds (chirps, the bray, the splashes, the note tone...), all played through one
// Web Audio context.
//
// Why not `new Audio(file).play()`: Safari refuses that unless the call is made inside a click or key
// press, and most of these sounds answer a timer, a scroll or a hover instead, so in Safari they were
// silent. A Web Audio context, once woken by the visitor's first click, tap or key press, may play at
// any time. It also sets loudness itself (a gain), which the iPhone ignores on an <audio> element.
//
// Each browser decides whether a page may sound before the visitor has pressed anything: most say no,
// but Chrome says yes to a site its user often plays sound on. So the context is tried at once, and if
// the browser holds it back, it is woken by the first click, tap or key press instead (and the corner
// invites one, see BackgroundMusic.astro). The sound button in the corner mutes only the music: these
// effects play either way (client direction, 15 October 2026).

type Win = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;
let woken = false;
const buffers = new Map<string, Promise<AudioBuffer>>();

function make() {
  if (!context) {
    const Context = window.AudioContext ?? (window as Win).webkitAudioContext;
    if (Context) context = new Context();
  }
  return context;
}
function wake() {
  woken = true;
  const ctx = make();
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}

/** True while the browser is still holding sound back until the visitor presses something. */
export const soundHeldBack = () => {
  const ctx = make();
  return !woken && (!ctx || ctx.state !== 'running');
};
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

/** Plays a short sound once, at `volume` (0 to 1). Silent while the browser holds sound back. */
export async function playSound(file: string, volume: number) {
  const ctx = make();
  if (!ctx) return;
  try {
    if (ctx.state !== 'running') {
      // (a resume the browser does not allow waits for a gesture; this sound would come late, so skip it)
      if (!woken) return;
      await ctx.resume();
    }
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
