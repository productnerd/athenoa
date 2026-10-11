// Scroll reveals, split headings, SVG line drawing and depth parallax.
//
// Markup contract (all optional, all inert without JavaScript):
//   data-reveal[="grow|fade|unveil"]  animate in when scrolled into view
//   data-reveal-group                 each child reveals in turn
//   data-split                        heading words rise one after another
//   data-draw                         inline SVG strokes draw themselves
//   data-depth="0.3"                  scroll parallax. Positive = far away (moves slower than
//                                     the page), negative = close (moves faster). Range -1..1.
//   data-pointer="14"                 follows the pointer by up to N px inside the nearest
//                                     [data-pointer-scene]. Negative values move against it.

type Layer = {
  el: HTMLElement;
  depth: number;
  pointer: number;
  scene: HTMLElement | null;
  top: number;
  height: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  near: boolean;
};

const TRAVEL = 130; // px moved per viewport of scroll at depth 1
const POINTER = 0.55; // share of each layer's data-pointer distance that is actually used
const EASE = 0.06; // how much of the remaining distance a layer covers each frame: low, so it trails a little
const LAG = 70; // ms before layers start to answer the scroll or the pointer

let layers: Layer[] = [];
let frame = 0;
let cleanup: Array<() => void> = [];
const pointerByScene = new WeakMap<HTMLElement, { x: number; y: number }>();

const motionAllowed = () =>
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  !new URLSearchParams(location.search).has('nomotion');

function splitHeadings() {
  document.querySelectorAll<HTMLElement>('[data-split]:not([data-split-done])').forEach((el) => {
    el.dataset.splitDone = '';
    const label = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    let index = 0;
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = (node.textContent ?? '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(' ');
            continue;
          }
          const outer = document.createElement('span');
          outer.className = 'w';
          const inner = document.createElement('span');
          inner.className = 'w__i';
          inner.style.setProperty('--i', String(index++));
          inner.textContent = part;
          outer.append(inner);
          frag.append(outer);
        }
        node.parentNode?.replaceChild(frag, node);
      } else if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName !== 'BR') {
        Array.from(node.childNodes).forEach(walk);
      }
    };
    Array.from(el.childNodes).forEach(walk);
    // Screen readers get the sentence once, not word by word.
    el.setAttribute('aria-label', label);
    el.querySelectorAll('.w').forEach((w) => w.setAttribute('aria-hidden', 'true'));
  });
}

function prepareDrawings() {
  document.querySelectorAll<SVGElement>('[data-draw]').forEach((host) => {
    let i = 0;
    host
      .querySelectorAll<SVGGeometryElement>('path, line, polyline, polygon, circle, ellipse, rect')
      .forEach((shape) => {
        if (shape.hasAttribute('data-nodraw')) return;
        shape.setAttribute('pathLength', '1');
        shape.style.setProperty('--i', String(i++));
      });
  });
}

function observeReveals() {
  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      const el = child as HTMLElement;
      if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
      if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', String(i));
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.06 },
  );
  document.querySelectorAll('[data-reveal], [data-split], [data-draw]').forEach((el) => io.observe(el));
  cleanup.push(() => io.disconnect());
}

function measure() {
  const scrollY = window.scrollY;
  for (const layer of layers) {
    const rect = layer.el.getBoundingClientRect();
    layer.top = rect.top + scrollY - layer.y;
    layer.height = rect.height;
  }
}

function setTargets() {
  const vh = window.innerHeight;
  const mid = window.scrollY + vh / 2;
  const travel = window.innerWidth < 720 ? TRAVEL * 0.5 : TRAVEL;
  for (const layer of layers) {
    const progress = Math.max(-1.4, Math.min(1.4, (layer.top + layer.height / 2 - mid) / vh));
    layer.near = Math.abs(progress) < 1.3;
    const pointer = layer.scene ? pointerByScene.get(layer.scene) : undefined;
    layer.ty = -progress * layer.depth * travel + (pointer ? pointer.y * layer.pointer * POINTER : 0);
    layer.tx = pointer ? pointer.x * layer.pointer * POINTER : 0;
  }
}

function tick() {
  let moving = false;
  for (const layer of layers) {
    if (!layer.near) continue;
    const dx = layer.tx - layer.x;
    const dy = layer.ty - layer.y;
    if (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.08) continue;
    layer.x += dx * EASE;
    layer.y += dy * EASE;
    layer.el.style.translate = `${layer.x.toFixed(2)}px ${layer.y.toFixed(2)}px`;
    moving = true;
  }
  frame = moving ? requestAnimationFrame(tick) : 0;
}

let lag = 0;
function kick(now = false) {
  if (now) {
    setTargets();
    if (!frame) frame = requestAnimationFrame(tick);
    return;
  }
  if (lag) return;
  lag = window.setTimeout(() => {
    lag = 0;
    kick(true);
  }, LAG);
}

function startParallax() {
  layers = Array.from(document.querySelectorAll<HTMLElement>('[data-depth], [data-pointer]')).map((el) => ({
    el,
    depth: Number(el.dataset.depth ?? 0) || 0,
    pointer: Number(el.dataset.pointer ?? 0) || 0,
    scene: el.closest<HTMLElement>('[data-pointer-scene]'),
    top: 0,
    height: 0,
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    near: true,
  }));
  if (!layers.length) return;

  const remeasure = () => {
    measure();
    kick();
  };
  const onScroll = () => kick();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  const ro = new ResizeObserver(remeasure);
  ro.observe(document.body);

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const scenes = fine ? Array.from(document.querySelectorAll<HTMLElement>('[data-pointer-scene]')) : [];
  const onMove = (event: PointerEvent) => {
    const scene = event.currentTarget as HTMLElement;
    const rect = scene.getBoundingClientRect();
    pointerByScene.set(scene, {
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    });
    kick();
  };
  const onLeave = (event: PointerEvent) => {
    pointerByScene.set(event.currentTarget as HTMLElement, { x: 0, y: 0 });
    kick();
  };
  scenes.forEach((scene) => {
    scene.addEventListener('pointermove', onMove);
    scene.addEventListener('pointerleave', onLeave);
  });

  remeasure();
  cleanup.push(() => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', remeasure);
    window.removeEventListener('load', remeasure);
    ro.disconnect();
    scenes.forEach((scene) => {
      scene.removeEventListener('pointermove', onMove);
      scene.removeEventListener('pointerleave', onLeave);
    });
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    clearTimeout(lag);
    lag = 0;
    layers = [];
  });
}

function headerState() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  update();
  window.addEventListener('scroll', update, { passive: true });
  cleanup.push(() => window.removeEventListener('scroll', update));

  // The footer is a picture of its own: once it fills about a third of the window the header steps
  // aside, so nothing lies across it.
  const footer = document.querySelector('footer.footer');
  if (footer) {
    const io = new IntersectionObserver(([entry]) => header.classList.toggle('is-away', entry.isIntersecting), {
      rootMargin: '0px 0px -34% 0px',
    });
    io.observe(footer);
    cleanup.push(() => {
      io.disconnect();
      header.classList.remove('is-away');
    });
  }
}

async function init() {
  (window as unknown as { __athMotion?: boolean }).__athMotion = true;
  cleanup.forEach((fn) => fn());
  cleanup = [];
  headerState();

  const root = document.documentElement;
  // Drawings that animate themselves (the vibrating wave lines) hold still when motion is off.
  const drawings = document.querySelectorAll<SVGSVGElement>('.illo svg');
  if (!motionAllowed()) {
    root.classList.remove('motion');
    drawings.forEach((svg) => svg.pauseAnimations?.());
    return;
  }
  root.classList.add('motion');
  // They cost the browser work on every frame while they run, seen or not (measured: about a
  // tenth of the main thread with the waves far down the page), so each one runs only while it
  // is on screen.
  const living = Array.from(drawings).filter((svg) => svg.querySelector('animate, animateTransform'));
  if (living.length) {
    const watch = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const svg = entry.target as SVGSVGElement;
        if (entry.isIntersecting) svg.unpauseAnimations?.();
        else svg.pauseAnimations?.();
      }
    });
    living.forEach((svg) => {
      svg.pauseAnimations?.();
      watch.observe(svg);
    });
    cleanup.push(() => watch.disconnect());
  }
  splitHeadings();
  prepareDrawings();
  startParallax();
  // Hold the first reveal until the display type is ready, so headings do not animate in a fallback face.
  await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 900))]);
  observeReveals();
}

document.addEventListener('astro:page-load', init);
