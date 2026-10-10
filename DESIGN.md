# ATHENOA design system

A redesign of athenoa.academy for Dr. Athena Potari's modern Platonic Academy. Static Astro site, plain CSS, no UI framework.

## The idea

A two-ink print from Greece: Aegean blue ink on crème paper, or crème on blue. Paper cut-outs with hand-cut edges, line illustrations in the manner of the Nymfi beer label (one even stroke weight, flowing parallel waves, fish scales, calm stylised faces), a little rough handwriting where Athena speaks in her own voice. Photographs sit in arches and pebbles like windows.

Reference images supplied by the client: a deep ultramarine field with naive crème brush lettering; a cobalt rounded card on beige with a crème cut-out hand; the Nymfi label (crème paper, monoline mermaid, radiating wavy hair, scallop pattern ground).

## Hard rules from the client

- Palette is Greek blue and crème only. Blue comes in three shades of one hue and all three must be used so the page is not monotonous: light blue (`--blue-light`), Greek blue (`--blue`) and darker Greek blue (`--blue-deep`). No other hues, no black, no grey shadows.
- Lots of organic shapes. Every box has an organic outline, or at the very least a corner radius. No hard rectangles, including full-bleed bands: blue areas are `.panel` cut-outs inset from the page edge.
- Paper texture and roughness (grain on paper and on blue, rough-cut edges on shapes).
- Every photograph goes through `<Media>`: curved outline plus a light vignette. Never a bare `<img>` for a photo.
- Copy is fixed. Text comes only from `src/data/*.ts`. Do not write, reword, trim, re-case or duplicate copy. If a design needs a word that is not in the data (a label, an aria-label), keep it minimal and report it.
- Type: three sets are under test, switched with `html[data-fonts]` (the Type control, bottom left, or `?fonts=a|b|c`). a = EB Garamond throughout (default, the only one shipped). b = Tekst throughout. c = PP Editorial New throughout (narrow, light at the largest sizes). Layouts must hold in all three, so never rely on a title fitting on one line. Titles use `.t-hero`, `.t-1`, `.t-2`, `.t-3`.
- The site is bilingual, English and Greek. Greek words are often longer; leave room. Only EB Garamond and the handwriting face cover Greek fully.
- In the hero title the words PLATONIC ACADEMY sit on an organic highlight (`.hl`), which animates in last. The second line of the title ("& REMEMBER WHO YOU REALLY ARE") is a subtitle: smaller than the first, class `.t-sub`, still inside the h1.
- Rough handwriting (`.hand`) only where a person is speaking or annotating: greetings, asides, Greek maxims, notes. Never for body copy, never for navigation.
- Social icons are monochrome and free-floating: no circles, no chips.
- Smooth load and scroll animation across the site, with parallax depth where it helps. Motion must be switchable off (see Motion).

## Avoid

All-caps eyebrow labels (unless the source text is already in capitals), numbered markers, arrows in buttons, identical card grids, drop shadows, gradients as decoration, centred-everything layouts, emoji, icon fonts.

## Tokens (src/styles/tokens.css)

- Blues (one hue): `--blue-light` #b3c0f3, `--blue` #0b1c8c, `--blue-deep` #071260. `--blue-bright` is for hover and focus only.
- Paper: `--creme` #f2e9d3, `--creme-light`, `--creme-deep`, `--sand`.
- Semantic: `--paper`, `--ink`, `--ink-strong`, `--ink-soft`, `--line`, `--grain`, `--highlight`. A surface class on a container flips them for everything inside: `on-blue` (Greek blue, crème ink), `on-blue-deep` (darker blue, crème ink), `on-blue-light` (light blue, dark ink).
- Type steps: `--step--1` to `--step-5`. Space: `--space-2xs` to `--space-2xl`, `--gutter`. Measure: `--measure`.
- Shapes: `--r-arch`, `--r-pebble-1/2/3`, `--r-soft`, `--r-soft-2`, `--r-leaf`, `--r-pill`.
- Easing and durations: `--ease-out`, `--ease-in-out`, `--dur-1` to `--dur-4`.

## Kit (src/styles/global.css, src/components)

- Layout: `.wrap`, `.wrap--narrow`, `.section`, `.stack` (`--stack` sets the gap), `.measure`, `.prose` (rich text with leaf bullets).
- Type: `.t-hero`, `.t-1`, `.t-2`, `.t-3`, `.lead`, `.small`, `.hand` with `.hand--m`, `.hand--l`, `.hand--tilt`.
- `.panel` (+ `.panel--big`, `.panel--arch`, combine with `on-blue`, `on-blue-deep` or `on-blue-light`): blue cut-out with rough edge. Colour lives on `::before`, so text is never distorted. Put parallax layers that must be cut to the outline inside a child `.panel__clip`.
- `.box` (+ `.box--line`, `.box--offset`, `.box--deep` for darker paper; add a surface class for a blue one): smaller organic text container.
- `.hl` with `.hl__w` per word: organic brush highlight behind emphasised words.
- `.btn`, `.btn--ghost`. On blue they invert automatically.
- `.scales`: fish-scale ground (the aegis of Athena). Use sparingly.
- `.field`: form field wrapper (label + input/textarea).
- `<Media src alt shape ratio focus widths sizes priority framed innerDepth reveal caption />`: shapes are soft, soft-2, arch, pebble-1/2/3, leaf, pill, circle. Import photos from `src/assets/media/`.
- `<Illustration name draw label />`: inlines `src/assets/illustrations/<name>.svg`. `draw` makes the strokes draw themselves on reveal.
- `<SocialIcons />`.
- SVG filters available by id: `#rough`, `#rough-sm` (edges of shapes), `#wobble` (line art). Apply filters to decorative layers only, never to text, and never to a large element that also moves.

View the kit at `/lab/kit/`.

## Illustration style

- Inline SVG, transparent background, no border, no frame unless the frame is the drawing.
- Monoline: `fill="none" stroke="currentColor"`, one stroke weight per drawing (about 2.2 to 3 units on a 600-unit drawing), `stroke-linecap="round" stroke-linejoin="round"`.
- Shapes that must hide what is behind them use `fill="var(--paper, #f2e9d3)"`, so the same file works on paper and on blue.
- Vocabulary: long parallel flowing lines (hair, light, sea), scallop scales, concentric arcs, simple almond eyes and small mouths, calm frontal or profile poses, symmetry inside ovals and arches. Greek subjects: Athena (helmet, aegis, spear, owl), olive, pine, lyre, Ionic column, temple pediment, mountains of Attica, sea.
- Drawn, not plotted: slightly irregular spacing and curvature is welcome. No gradients, no drop shadows, no clip-art.
- Complex repetitive linework is best generated with a short script and then checked by eye.
- Always render the SVG to PNG and look at it before calling it done.

## Motion (src/scripts/motion.ts, src/styles/motion.css)

Everything is attribute-driven and inert without JavaScript or with `prefers-reduced-motion`.

- `data-reveal` (rise), `data-reveal="grow"`, `data-reveal="fade"`, `data-reveal="unveil"` (default on `<Media>`). Stagger with `style="--i:2"` or `--delay:200ms`.
- `data-reveal-group` on a parent reveals its children in turn.
- `data-split` on a heading: words rise from a mask one after another.
- `data-draw` on an element containing inline SVG (or `draw` on `<Illustration>`): strokes draw in.
- `data-depth="0.3"`: scroll parallax. Positive is far (moves slower than the page), negative is near (moves faster). Typical: 0.1 to 0.4 for things behind, -0.05 to -0.3 for things in front.
- `data-pointer="14"` inside a `[data-pointer-scene]`: follows the pointer by up to N px (negative moves against it). Use in the hero only.
- `.drift`: slow idle float for small ornaments.
- Reveals use `transform`, parallax writes `translate`, static tilt should use `rotate`. Keep to that split so effects stack.
- Aim for one orchestrated moment per section, not everything moving at once.

## Checking your work

The dev server is already running at http://localhost:4321 (do not start another, do not run `astro build`).

```
node scripts/shot.mjs /lab/kit/ shots/kit.png                 # full page, desktop 1440, motion off
node scripts/shot.mjs /lab/kit/ shots/kit-m.png --mobile      # 390 wide
node scripts/shot.mjs /lab/kit/ shots/kit-b.png --fonts b     # type set b (Tekst); c is PP Editorial New
node scripts/shot.mjs / shots/top.png --viewport --motion     # first screen only, motion on, after the load sequence
node scripts/shot.mjs / shots/mid.png --scroll 1400 --motion  # viewport after scrolling
```

Read the PNG back and look at it. Large screenshots are easier to read after `magick in.png -resize 50% out.jpg` or a `-crop`.
Render a standalone SVG with `magick -background '#f2e9d3' -density 144 file.svg out.png` (set `color` first by replacing `currentColor` in a temp copy, since ImageMagick does not know the page ink).

## Structure

- `src/data/` copy and facts (site, home, about, courses, schema).
- `src/components/home/`, `about/`, `courses/` section components. `src/pages/` routes. `src/pages/lab/` scratch pages, excluded from the sitemap and removed before launch.
- `src/assets/media/` photographs from the live site. `src/assets/illustrations/` line art.
