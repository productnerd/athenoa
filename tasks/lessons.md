# Lessons

## 2026-10-10: "Don't change the text" still means fix typos

- What happened: Maria said not to change any of the actual text. I proposed keeping typos and the Greek button labels on the English site verbatim and only listing them. She corrected that: fix typos, and put buttons in English where they are in Greek.
- Rule: "keep the copy" means keep the wording and voice. Obvious typos and interface labels in the wrong language get fixed, and every fix is logged in `tasks/text-changes.md` so it can be reviewed or reverted.
- Still off limits without asking: rewording, grammar "improvements", trimming, re-casing, or inventing copy.

## 2026-10-10: One blue reads as monotonous

- What happened: the first pass used a single Greek blue for every panel, with a darker blue only for body text. Maria found it a tad monotonous and asked for two or three shades of the same hue: light, Greek, darker.
- Rule: when a brief gives one brand colour, build a small tonal family of that hue from the start and use every step as a surface, not only as text or hover states.

## 2026-10-10: Check glyph coverage before promising a typeface

- What happened: Maria expected Tekst and Garamond to cover Greek. The installed Tekst trial has Greek capitals but no accented lowercase, PP Editorial New has no Greek at all, and the ws Pontac demo only draws letters.
- Rule: for a bilingual site, read each font's character set (fc-query) before building a type set around it, and say plainly what falls back.

## 2026-10-11: This Mac has no disk headroom; keep parallel work small

- What happened: the disk hit zero twice while I ran 13 to 20 agents at once, each with a headless browser. A pending macOS update and its snapshots take whatever space is freed, and swap from heavy runs lands on the same disk.
- Rule: on this machine run at most two or three agents at a time, delete screenshots and temporary renders as soon as they have been looked at, and check `df` before starting anything heavy. Stop and say so if free space drops under about 5 GB. Commit to git before long runs.
- Also: when stopping for a usage limit, offer to schedule a restart. I cannot wake myself; nothing resumes unless a message or a background task arrives.

## 2026-10-11: When a clip or a frame is removed, look at what it was hiding

- What happened: the hero went from a clipped cut-out to a full-bleed picture that fades out. Two hard lines appeared under it: the outlined lower edge of the ground wash, and the foot of the hill behind it, both of which the old clip had hidden. Maria saw them in the live preview before I did.
- Rule: after removing a clip, mask or frame from a layered drawing, check every layer for parts that only looked right because they were cut off (closed outlines, washes that stop short, shapes behind other shapes), and look at the newly exposed area in the browser, with motion on, before moving on.

## 2026-10-11: A hover rule that never wins is a missing hover effect

- What happened: Maria asked for hover effects on the top menu. There was one already (an underline), but its selector was less specific than the rule that hid it, so it never showed.
- Rule: check every hover and focus state by actually hovering in the browser (Playwright `hover`, then a screenshot), not by reading the CSS.

## 2026-10-11: "Longer" needs a direction

- What happened: asked to make the dove's papyrus "more long and unfolded", I drew it long sideways; Maria meant long downwards, hanging under the bird, and narrower than the bird.
- Rule: when a request about a shape leaves the direction open, say in one line which reading I am taking before drawing, or draw the more natural one for the object (a scroll hangs).

## 2026-10-11: Small interface changes are done directly, not handed to a helper

- What happened: I gave a waitlist popup, a restyled note and a moved button to a background helper. It ran for about two and a half hours on a loaded machine while Maria waited ("its been 2.5 hours for a popup?"). The footer skies helper took over four hours. Done directly, each was minutes of work.
- Rule: on this machine, do anything that is one component or a handful of edits myself, in the main thread, and show it at once. Keep helpers for work that is truly large and separate (a full translation, a new illustration set), give them a narrow brief, and say up front how long they may take. If one has not reported within about fifteen minutes on a small task, stop it and finish the job directly.
- Also: an effect that animates over a blur or a drop-shadow is redrawn every frame. A glow under pulsing stars and a blurred mask under a breathing flame pushed the machine's load past 150 while the preview was open. Animate opacity or transform on a layer of its own, and draw glows and fades as gradients.

## 2026-10-11: Measure what the page costs at rest; do not guess

- What happened: the machine ran hot again with the preview open. I had blamed the star glow; the real cost was the wave drawings (SMIL path animation), which made the browser work on every frame even when far off screen. `document.getAnimations()` in the preview and `node scripts/perf.mjs` (main-thread seconds used over a four-second rest) showed it in two minutes.
- Rule: after adding anything that loops, run `node scripts/perf.mjs` and compare with the still page. Anything that animates inside an SVG (SMIL, or CSS on an inner element) is main-thread work: run it only while it is on screen.

## 2026-10-11: A descendant selector reaches into nested lists

- What happened: `.header__links li:not(...) a` was meant for the menu links but also matched the links of the language list nested inside one of those items, so the list took the menu's large title type on phones.
- Rule: when a list can contain another list, style its items with child combinators (`> li > a`).


## Sounds must be tested where the visitor is, not only in Chrome (13 October 2026)
- Maria heard nothing on the GitHub Pages preview in Safari. Three causes, none visible in my Chrome tests: (1) Safari refuses `new Audio().play()` outside a click, and most effects answered timers, scroll or hover; (2) the fire sound waited for the music to be playing, and the music file is not on the preview; (3) with no music file the sound button could not switch anything.
- Rule: short sounds go through `src/scripts/sound.ts` (one Web Audio context, woken by the first gesture). No sound may depend on another file having loaded. Say plainly when a browser is untested, and test with the music file blocked as well as present.
- Still open: looping sounds (music, fire, sea) are `<audio>` elements, whose volume the iPhone ignores, so they may play at full loudness there. Untested.
