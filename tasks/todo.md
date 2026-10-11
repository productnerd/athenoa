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
- [x] About page: graduation photo cropped to portrait (3:4) with Athena centred, and shown larger
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

## Added by Maria on 2026-10-11 (seventh round)

- [x] 404: no header, no visible "Page not found" block, no courses link, no sun, water runs to the bottom in dark blue; one button "Take me home" bottom right with "Not everybody who wanders is lost" above and "but let the journey be long and filled with adventures" below (Greek: Cavafy, Ithaka); "daimon" explained in the translation
- [x] Wave lines vibrate in place (no sideways travel), weave through one another and stay inside the blue panel
- [x] Footer: "Internal Links" column removed
- [ ] Integrate workflow finished: read its shared-file requests (sitemap i18n, header overflow on Greek phones, etc.) and wire the final home page

## State when the usage limit was reached (2026-10-11)

- [x] Hero subtitle set in the handwritten voice face (`.t-sub`)
- Background agents were stopped. Still to do:
  - [ ] Hero: two recreations of the original image exist (src/components/home/hero/PortalA.astro, PortalB.astro, at /lab/portal-a/ and /lab/portal-b/); judging and the polish pass did not finish. Pick one, polish, wire into src/pages/index.astro in place of the provisional title.
  - [ ] Newsletter popup: build was in progress (src/components/NewsletterDialog.astro may be partial); finish, critique, then include once in Base. The "Subscribe" button already points at #newsletter.
  - [ ] Twelve symbols: drawn and critiqued; the fix pass was interrupted.
  - [ ] Olympus footer: redraw the foreground as clear pines (see sixth round), then point Footer.astro back at footer-olympus-near.
  - [ ] Aegean footer: fix pass was interrupted.
  - [ ] 404: an agent critique was running; its notes were not applied. The page follows Maria's seventh-round brief; do not restore the old parts.
  - [ ] Integrate results: read the shared-file requests (sitemap for two languages, Greek header overflow on phones), assemble the final home page, run the responsive check, remove the lab pages.
  - [ ] Voice face: waiting for Maria's pick on /font-test.

## Added by Maria on 2026-10-11 (eighth round) — NOT STARTED, disk full again (145 MB free at 07:20)

- [ ] /font-test: show a wider set of handwritten fonts (she likes none of the six). Mark which cover Greek.
- [ ] Home, course tiles (Plato's Republic, Marcus Aurelius, Cratylus): reuse the Courses page's CourseCard so courses look the same wherever they appear. Cratylus has no course entry yet: add it as a placeholder course in both languages.

## Added by Maria on 2026-10-11 (ninth round)

- [x] Barely visible animated paper grain behind the page (22% strength)
- [x] Night mode switch in the header (moon/sun), remembered; owl sound on switching to night, cicadas and a wave on switching back. Sounds are synthesised (public/audio/owl.mp3, daylight.mp3) and can be replaced with recordings.
- [ ] Night mode second pass once the hero is in: keep the hero as a night scene (class theme-day on its panel), decide how footers end at night, check every section
- [x] /font-test handwriting: one sentence per font in English and Greek; thirteen more Greek-capable hands added
- [x] Handwriting: trying NF-Lolotte (local font, needs a web licence), set at 240% of nominal size with tight lines; hero subtitle shown in lower case because the script is unreadable in capitals (home.hero.subtitle). When the final Hero.astro lands, make it use home.hero.subtitle for its .t-sub line.

## Added by Maria on 2026-10-11 (tenth round)

- [x] Handwriting: La Belle Aurore for English (shipped), Bradley Hand for Greek (macOS only); NF-Lolotte dropped
- [x] Language switch is one control that opens a list, with hand-cut shapes
- [x] Newsletter popup wired into the layout (opens from any link to #newsletter)
- [x] Footer ink band about a third of its former height; copyright and mute button centred on it
- [x] Animated grain a little stronger, and visible at night
- [ ] Cicada sound: second synthesised attempt in place; Maria found the first too artificial. Real public-domain recordings exist on Wikimedia Commons ("Cicadas in Greece.ogg", 209 KB; "Cicada orni.ogg", 1.7 MB): download only with her permission.
- [ ] Ancient Greek as a third language, for fun, LOW PRIORITY: translation being drafted into src/data/grc/; then add 'grc' to src/lib/locale.ts, src/data/index.ts, ui.ts, the header list and routes under src/pages/grc/. Components index their own word lists by locale ({en, el}[locale]): make those fall back to Greek for grc.

## Added by Maria on 2026-10-11 (eleventh round)

- [x] Handwriting no longer cut (word masks off for handwriting, more line height); never set in capitals (seminar note now sentence case; rule added to DESIGN.md)
- [x] Footer: "Connect with us" and "Follow us" larger and closer to their lists; mute button the size of the night switch
- [x] Course cards: title, subtitle, short description, a four-row facts table (dates, length, format, fee), "Enroll" where available, "Details to follow" note removed from the card. One course has dates "TBC".
- [ ] The details of three courses are SAMPLE VALUES (marked in src/data/courses.ts and el/courses.ts): replace with Athena's own before launch
- [x] Seminar section: only the lyre (Orphic egg and olive branch removed)
- [x] About: "Contact Us" button above the contact form removed
- [ ] Ancient Greek draft is being translated from the earlier course data: when wiring it, add the new course fields (subtitle, duration, format, available, facts, enrollNow)

## Added by Maria on 2026-10-11 (twelfth round)

- [x] Day sound: one soft two-second wave, quieter, with a long fade (cicadas dropped). Owl call 20% faster.
- [x] Athena's announcement sentence in handwriting; an envelope on the newsletter slip
- [x] "Enroll" is the solid button, "View course" a quiet underlined one; "& VAT" set smaller than the price (cards, popup, course page)
- [x] "Explore our new course series" section removed from Home (Series.astro deleted; home.series data still feeds the course tabs)
- [x] Torch moved from the Transmission panel to the Benefits heading, larger, replacing the olive sprig
- [x] Hilltop photo in Benefits larger (up to 34rem)

## Added by Maria on 2026-10-11 (thirteenth round)

- [x] Home hero in place (portal-b drawing). Wheat as the emblem of "Your Contribution".
- [x] Newsletter slip: a dove carrying a papyrus flies in from the left (first drawn with a wide roll; she wanted it long downwards and narrower than the bird: now a sheet hanging beneath it)
- [x] Hero: no trees on the left beside the title; title a tall stack, about a third larger; picture full bleed, under the header, fading into the page with no line under it
- [x] Hero follows the day/night switch (marble temple, light-blue sky and two clouds by day; the starry scene by night); clouds drift off and stars come out when switching
- [x] Parallax calmer and with a little lag (TRAVEL, POINTER, EASE, LAG in motion.ts)
- [x] Top menu: brush-mark hover on the links (the old underline never showed), small lean on the logo; every hover effect waits 90 ms (--hover-delay)
- [x] ATHENOA name in the header a little smaller
- [x] Laurel above the course cards removed
- [x] Announcement letter set smaller and closer
- [x] "Let's Get Started": the two lines shown as one block
- [x] Membership: the three points sit close together
- [x] 404: "Not everybody who wanders is lost" in the sky in the reading face (both languages), button "Take me to Ithaka", note under it half size, slanted, with an asterisk, close to the button
- [x] Music keeps its place when a whole new page loads (typed address, 404, language switch) and fades out before a reload it can foresee. A typed address is a new page for the browser: it cannot fade out there, it resumes with a fade-in.
- [x] Owl call quicker again (2.1 s); day wave 2.5 s with a steeper fade
- [x] Athena hidden in the hero for now, and the disc and rays behind her with her (showAthena in Hero.astro brings them back)
- [x] Ancient Greek wired in under /grc/ and offered in the language list (draft, noindex, no structured data, out of the sitemap)
- [x] Hero: the disc and rays above the temple hidden too; rays from the flame run a little past the building and fade out; one ground line end to end (dashes and hill lines removed)
- [x] Membership: the three points side by side in one row across the page (from 52rem); the statue now stands beside the button and the frieze
- [ ] HELPER RUNNING: course card photos all one size; card summary smaller and quieter; photographs fade in instead of the paper curtain; hilltop photo (first asked "almost the full width", then "too pixelated, half the width"); torch left of the Benefits title, question close under the title
- [ ] HELPER RUNNING: footer scenes at night show a moon and stars instead of a sun; the sun slides down and the moon and stars animate in when switching
- [ ] After the helpers: add --hover-delay to the hovers in CourseCard.astro and Footer.astro; run the responsive check; commit

## Open questions

See the chat message of 2026-10-10.
