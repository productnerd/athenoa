# ATHENOA rebuild — plan

Status: building (go-ahead received 2026-10-10: fix typos, English buttons, three sample courses, athenoa.com as main address, developer credit removed).

## Assumptions (to confirm)

- Static site (Astro + plain CSS, no UI framework), content in data files so courses can be edited without touching layout.
- English only in v1, built so Greek can be added (the current Greek toggle goes nowhere).
- No sign-in / Odoo eLearning in v1 (the current Courses module is empty).
- Stripe and the contact form are stubbed, not wired.
- Built and previewed locally. Nothing is pushed or published until Maria says so (the content and photos belong to Athena).
- Copy is word for word from the live site, with typos fixed and Greek buttons put into English. Every change is logged in tasks/text-changes.md.

## Site map (new)

- `/` Home
- `/about-athena/` About Athena (replaces About Us; contact form lives at the bottom, `#contact`)
- `/courses/` Courses (2–3 sample cards, click opens popup)
- `/courses/<slug>/` one real page per course (same content as the popup, for search engines and AI agents)
- No privacy or cookie pages yet: the live privacy page is empty and the cookie policy describes Odoo cookies the new site does not set. A privacy notice is needed before launch because the contact form collects personal data.
- `robots.txt`, `sitemap.xml`, `llms.txt`

## Steps

- [ ] 1. Scaffold project, design tokens (Greek blue, crème, paper texture, organic radii) → verify: tokens page renders
- [ ] 2. Font sets with a switcher: A = Garamond Book + Garamond Narrow titles, B = Tekst + ws Pontac, plus a rough handwritten accent → verify: toggle swaps both sets on Maria's machine via local fonts
- [ ] 3. Media pipeline: selected images only, resized to AVIF/WebP, vignette layer + curved corners applied in CSS → verify: every image has vignette, radius, alt text, width/height
- [ ] 4. Illustrations: Nymfi-style line art (SVG), footer mountains + pine forest with transparent background and no border, as a swappable file → verify: replacing the SVG file changes the footer with no code edits
- [ ] 5. Home page, all existing sections and copy, organic-shaped boxes → verify: text diff against live site is empty apart from requested removals
- [ ] 6. About Athena page + contact section → verify: text diff
- [ ] 7. Courses page: sample cards, popup with details, enroll step, "Pay with Stripe" stub → verify: keyboard and screen-reader usable, deep link per course works without JS
- [ ] 8. Header/footer: monochrome floating social icons (no circles), "Who We Are" removed → verify visually
- [ ] 8b. Motion: page-load sequence, scroll-reveal on every section, parallax with elements at different depths (hero built from separate layers: sky, mountains, temple/figure, foreground pines, title), all disabled under `prefers-reduced-motion` → verify: 60fps on mobile, no layout shift, content visible with JS off
- [ ] 9. SEO + AI readiness: one h1 per page, meta/OG, JSON-LD (EducationalOrganization, Person, Course + Offer), sitemap, robots, llms.txt → verify: Lighthouse SEO 100, Rich Results test passes, pages readable with JS off
- [ ] 10. Responsive + accessibility pass (contrast of blue on crème, focus states, reduced motion) → verify: mobile screenshots, axe clean
- [ ] 11. Review section added here

## Added by Maria on 2026-10-10 (during the build)

- [x] Type sets: EB Garamond throughout (default), Tekst throughout, PP Editorial New throughout. ws Pontac and the narrow ITC Garamond removed.
- [x] Three blues of one hue as real surfaces (light, Greek, darker), with surface classes `on-blue-light`, `on-blue`, `on-blue-deep`
- [x] Organic highlight behind PLATONIC ACADEMY in the hero title, animating in last (`.hl`)
- [ ] Spread the three blues across the finished sections (polish pass after the page agents land)
- [x] Hero subtitle: "& REMEMBER WHO YOU REALLY ARE" set smaller than the first line (`.t-sub`)
- [ ] Carry the highlight and the smaller subtitle into the chosen hero
- [ ] Greek version with a visible language toggle: draft translation in `src/data/el/`, routes under `/el/`, hreflang → verify: every page renders in Greek in all three type sets
- [ ] Creative 404: calm Aegean, one sailing boat looping left to right, drifting clouds, a Greek quotation on eudaimonia in the centre
- [ ] Twelve symbolic illustrations approved by Maria (no winged chariot, no Academy doorway): tetractys, monad, bow and lyre, cave and sun, ladder, torch, spring and white cypress, tripod, butterfly, Orphic egg, cicada, wheat
- [ ] A different nature scene in each page's footer: Attica on Home, Olympus with mountain pines on About Athena, the Aegean on Courses
- [x] Photos were invisible with motion on (the reveal clipped them away so they never loaded): reveal rewritten, all photos verified loading on Home

## Added by Maria on 2026-10-10 (second round)

- [ ] Hero: recreate the original hero image (Athena on the temple, light in the doorway, night sky, pines) in the site's illustration style and use it as the hero
- [x] Hero subtitle in a different colour from the title
- [x] Social icons: straight row, no tilt or offset; tone down playfulness in general
- [ ] Greek everywhere: connect every component to `content(locale)` and translate hard-coded alt text and labels (About Athena is still English under /el/)
- [x] Remove the scale pattern behind the Apollo statue (Membership section)
- [x] Copy fix: "You will immerse" → "You will be immersed" (log in text-changes.md)
- [x] Handwriting font: replace Mansalva with something more calligraphic and less casual that covers Greek
- [x] About Athena: remove the lyre (already used on Home)
- [x] Remove every owl illustration (too "Duolingo") and replace with another symbol; owl.svg deleted (final symbol art still being drawn)
- [ ] Benefits: pair each photo with a benefit instead of a separate collage above them

State when work stopped: all background agents were stopped. Hero candidates A/B/C exist but were never judged. Olympus footer has far and mid layers (near layer is still the Attica stand-in). Aegean footer has three draft layers. The 404 scene has a draft component and sea-*.svg layers, unverified. None of the twelve symbols has been drawn. Screenshots in shots/ were deleted to free space.

## Added by Maria on 2026-10-10 (third round)

- [ ] Newsletter sign-up as a popup inside an architectural frame of Greek columns, with blurred background; headline, description, one email field (being built; then include once in Base)
- [x] Remove the "In progress" page selector from the preview
- [ ] About page: crop the graduation photo to 1:1 with Athena in the centre (do after the About agent finishes with that file: ratio "1 / 1", focus about "78% 50%")
- [x] Footer: social icons left-aligned under "Follow us" (check the About contact block too)
- [x] /font-test page with every type option in English and Greek; kit page deleted
- [x] Mobile menu: hover effect on the links, phone number removed

## Added by Maria on 2026-10-10 (fourth round)

- [x] Wave lines flow sideways slowly and breathe (waves.svg regenerated to loop seamlessly; CSS in motion.css)
- [x] Type decided: PP Editorial New titles, Tekst reading text; type switch removed (alternatives stay on /font-test)
- [ ] Handwritten voice face not settled: six candidates on /font-test, waiting for Maria's pick
- [x] Unknown addresses show the site's own 404 in the preview (trailingSlash 'ignore')
- [ ] Before launch: web licences for PP Editorial New and Tekst (currently loaded from Maria's machine; Greek falls back to EB Garamond)

## Added by Maria on 2026-10-10 (fifth round)

- [x] Very quiet background music (3.5 minute cut, 2.2 MB, fades at both ends, loops) with a mute button; starts on load where the browser allows, otherwise on the first click or key press; choice remembered
- [ ] Before launch: confirm the licence for the music track (public/audio/ is kept out of git until then)
- [x] Header menu: Home link removed (the logo goes home); current page highlighted, with or without a trailing slash
- [x] Footer text smaller

## Added by Maria on 2026-10-10 (sixth round)

- [x] Copyright line sits in its own band of ink under every footer scene
- [x] Header item renamed "About Dr. Athena" (Greek "Σχετικά με τη Δρ. Αθηνά"); phone removed from the header
- [x] Current page marked with an organic highlighter stroke (two ragged passes), desktop and mobile menu
- [ ] Olympus footer foreground: Maria finds the new trees bonsai-like and prefers the earlier pines. About currently reuses footer-pines.svg. After the art workflow finishes, redraw footer-olympus-near.svg as unmistakable pines in that preferred manner (straight trunks, full layered crowns, no gnarled or wind-twisted shapes), then point Footer.astro back at it.

## Open questions

See the chat message of 2026-10-10.
