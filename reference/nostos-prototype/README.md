# Nostos prototype (reference only)

The working prototype built in a Claude chat session, kept so the Astro version can be ported from it. It is not part of the site build.

Run it: `node reference/nostos-prototype/make-data.mjs`, then open `reference/nostos-prototype/index.html` in a browser (it loads d3 from cdnjs). The two Claude-powered activities (Socratic sparring, Teach it back) and saved progress only work inside claude.ai; here they show as unavailable and progress uses localStorage.

Its look (night-sky palette, seven theme hues, XP pill) is the prototype's own and does NOT follow DESIGN.md. See tasks/nostos.md for how each part maps onto the Athenoa design system.
