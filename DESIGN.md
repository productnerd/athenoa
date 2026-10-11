# ATHENOA design system

A redesign of athenoa.academy for Dr. Athena Potari's modern Platonic Academy. Static Astro site, plain CSS, no UI framework.

## The idea

A two-ink print from Greece: Aegean blue ink on crème paper, or crème on blue. Paper cut-outs with hand-cut edges, line illustrations in the manner of the Nymfi beer label (one even stroke weight, flowing parallel waves, fish scales, calm stylised faces), a calligraphic italic where Athena speaks in her own voice. Photographs sit in arches and pebbles like windows.

Tone: organic and warm, but composed. The client's words: "we don't want to be TOO playful". Things sit straight (tilt of 1.5 degrees at most, and rarely), rows are even, nothing bounces or wobbles.

Reference images supplied by the client: a deep ultramarine field with naive crème brush lettering; a cobalt rounded card on beige with a crème cut-out hand; the Nymfi label (crème paper, monoline mermaid, radiating wavy hair, scallop pattern ground).

## Hard rules from the client

- Palette is Greek blue and crème only. Blue comes in three shades of one hue and all three must be used so the page is not monotonous: light blue (`--blue-light`), Greek blue (`--blue`) and darker Greek blue (`--blue-deep`). No other hues, no black, no grey shadows.
- Lots of organic shapes. Every box has an organic outline, or at the very least a corner radius. No hard rectangles, including full-bleed bands: blue areas are `.panel` cut-outs inset from the page edge. The one exception, by the client's wish, is the Home hero: its picture is full bleed (it runs under the header to the edges of the window) and its foot fades into the page. Nothing in it may end with a visible edge or line.
- Paper texture and roughness (grain on paper and on blue, rough-cut edges on shapes).
- Every photograph goes through `<Media>`: curved outline plus a light vignette. Never a bare `<img>` for a photo.
- Copy is fixed. Text comes only from `src/data/*.ts`. Do not write, reword, trim, re-case or duplicate copy. If a design needs a word that is not in the data (a label, an aria-label), keep it minimal and report it.
- Type (decided): titles in PP Editorial New (narrow; ultralight at the two largest sizes, regular below), reading text in Tekst, and a calligraphic voice face. There is no type switch any more. Titles use `.t-hero`, `.t-1`, `.t-2`, `.t-3`. Editorial New has no Greek and the Tekst trial lacks accented Greek, so Greek pages fall back to EB Garamond: check both languages. Never rely on a title fitting on one line. The alternatives are kept on `/font-test/` only.
- The site is bilingual, English and Greek. Greek words are often longer; leave room. Only EB Garamond and the voice face cover Greek fully.
- In the hero title the words PLATONIC ACADEMY sit on an organic highlight (`.hl`), which animates in last. The second line of the title ("& REMEMBER WHO YOU REALLY ARE") is a subtitle: smaller than the first, class `.t-sub`, still inside the h1.
- The hero title is as large as the space allows: beside the picture it is a tall stack of short rows (no trees on the left of the picture, so the title has the height). The hero picture follows the day/night switch: a marble temple under a light-blue sky with two clouds by day, the starry night scene by night. Athena herself (with spear and Nike) is hidden for now at the client's wish and may return: `showAthena` in `Hero.astro`. The disc and rays behind her head are hidden with her (without her they read as a sun over the roof, which the client did not want).
- The voice face (`.hand`, a fine calligraphic italic, not casual handwriting) only where a person is speaking or annotating: greetings, asides, Greek maxims, notes. Never for body copy, never for navigation. It is light, so use it at `.hand--m` size or larger and never below 1.2rem. Never set it in capitals. Its tails are long: never put it inside a box that clips, and never tighten its line height below `--hand-leading`. Two exceptions asked for by the client: Athena's announcement on Home is set smaller and closer (it is an announcement more than a letter), and the note under the 404 button is half size, slanted, with an asterisk, like a note in a margin.
- Social icons are monochrome, in a plain straight row: no circles, no chips, no tilt.
- No owls anywhere (the client finds them too "Duolingo"). Use the symbol drawings instead.
- Smooth load and scroll animation across the site, with parallax depth where it helps. Motion must be switchable off (see Motion). Parallax is gentle and trails slightly; photographs simply fade in; every hover effect starts after a short delay (`--hover-delay`).

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
- Type: `.t-hero`, `.t-1`, `.t-2`, `.t-3`, `.lead`, `.small`, `.hand` with `.hand--m`, `.hand--l` (the voice face), `.t-sub` (subtitle line inside a large title, in a lighter blue).
- `.panel` (+ `.panel--big`, `.panel--arch`, combine with `on-blue`, `on-blue-deep` or `on-blue-light`): blue cut-out with rough edge. Colour lives on `::before`, so text is never distorted. Put parallax layers that must be cut to the outline inside a child `.panel__clip`.
- `.box` (+ `.box--line`, `.box--offset`, `.box--deep` for darker paper; add a surface class for a blue one): smaller organic text container.
- `.hl` with `.hl__w` per word: organic brush highlight behind emphasised words.
- `.btn`, `.btn--ghost`. On blue they invert automatically.
- `.scales`: fish-scale ground (the aegis of Athena). Use very sparingly, and never behind the Apollo statue.
- `.field`: form field wrapper (label + input/textarea).
- `<Media src alt shape ratio focus widths sizes priority framed innerDepth reveal caption />`: shapes are soft, soft-2, arch, pebble-1/2/3, leaf, pill, circle. Import photos from `src/assets/media/`.
- `<Illustration name draw label />`: inlines `src/assets/illustrations/<name>.svg`. `draw` makes the strokes draw themselves on reveal.
- `<SocialIcons />`.
- SVG filters available by id: `#rough`, `#rough-sm` (edges of shapes), `#wobble` (line art). Apply filters to decorative layers only, never to text, and never to a large element that also moves.

See the type options at `/font-test/`.

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

- `data-reveal` (rise), `data-reveal="grow"`, `data-reveal="fade"`. Photographs (`<Media>`) fade in: the client asked for a plain fade instead of the paper curtain. Stagger with `style="--i:2"` or `--delay:200ms`.
- `data-reveal-group` on a parent reveals its children in turn.
- `data-split` on a heading: words rise from a mask one after another.
- `data-draw` on an element containing inline SVG (or `draw` on `<Illustration>`): strokes draw in.
- `data-depth="0.3"`: scroll parallax. Positive is far (moves slower than the page), negative is near (moves faster). Typical: 0.1 to 0.4 for things behind, -0.05 to -0.3 for things in front. The client asked for it to be less sensitive and to answer with a tiny delay: the constants at the top of `motion.ts` (TRAVEL, POINTER, EASE, LAG) set that for the whole site; do not turn them back up.
- `data-pointer="14"` inside a `[data-pointer-scene]`: follows the pointer by up to N px (negative moves against it). Use in the hero only.
- `.drift`: slow idle float for small ornaments.
- Reveals use `transform`, parallax writes `translate`, static tilt should use `rotate`. Keep to that split so effects stack.
- Aim for one orchestrated moment per section, not everything moving at once.
- Hover: every transition that answers the pointer carries `var(--hover-delay)` as its delay (links, buttons, menu marks, tabs, icons), so nothing flickers as the pointer passes. A press (`:active`) answers at once.

## Checking your work

The dev server is already running at http://localhost:4321 (do not start another, do not run `astro build`).

```
node scripts/shot.mjs /courses/ shots/page.png                # full page, desktop 1440, motion off
node scripts/shot.mjs /courses/ shots/page-m.png --mobile     # 390 wide
node scripts/shot.mjs / shots/top.png --viewport --motion     # first screen only, motion on, after the load sequence
node scripts/shot.mjs / shots/mid.png --scroll 1400 --motion  # viewport after scrolling
```

Read the PNG back and look at it. Large screenshots are easier to read after `magick in.png -resize 50% out.jpg` or a `-crop`.
Render a standalone SVG with `magick -background '#f2e9d3' -density 144 file.svg out.png` (set `color` first by replacing `currentColor` in a temp copy, since ImageMagick does not know the page ink).

## Structure

- `src/data/` copy and facts (site, home, about, courses, schema).
- `src/components/home/`, `about/`, `courses/` section components. `src/pages/` routes. `src/pages/lab/` scratch pages, excluded from the sitemap and removed before launch.
- `src/assets/media/` photographs from the live site. `src/assets/illustrations/` line art.

## Two languages

English at the root, Greek under `/el/` (same pages, same components). Every component reads its copy for the current language, never from one language's file directly:

```astro
---
import { content } from '../../data';
import { getLocale } from '../../lib/locale';
const locale = getLocale(Astro.url);
const { home, site } = content(locale); // also: about, courses, coursesPage, registrationTab, courseHref, coursePageHref, ui
---
```

- `content(locale)` returns the same shape in both languages; internal links in the Greek data already carry `/el`.
- Words a component adds itself (alt text, aria-labels, control labels) live beside it as `const t = { en: {...}, el: {...} }[locale]`, in both languages. Nothing visible or announced may stay English on a Greek page.
- Types still come from `src/data/courses` (`import type { Course } from ...`).
- The Greek copy in `src/data/el/` is a draft translation; do not rewrite it, only report problems.
- Greek runs longer than English and its capitals are wide: check every layout at `/el/...` too.

## Where each blue goes

So the three blues are all in play and no two neighbours match:
- Home: hero is full bleed, light blue by day (marble in the paper colour, Greek-blue line) and darker Greek blue by night; Membership on paper with light-blue shapes; Announcement on paper; Seminar on Greek blue; Series on paper; course tabs on a light-blue sheet; Transmission on darker Greek blue; Start is Greek blue over the fresco; Benefits on paper with one light-blue, one Greek-blue and one darker-blue box.
- About: opening on paper; the story's third block on darker Greek blue; the Academy block on light blue; Contact on Greek blue.
- Courses: the open course leads on Greek blue; the other cards on light blue and paper; the price block inside the popup on darker Greek blue.

## Symbols

Besides athena, lyre, laurel, olive-branch, temple, sun-rays and waves there are twelve symbol drawings tied to what Athena teaches: tetractys, monad, bow-lyre, cave-sun, ladder, torch, spring-cypress, tripod, butterfly, orphic-egg, cicada, wheat. Use them as ornaments where their meaning fits the content beside them. The lyre belongs to the Home seminar section only.
