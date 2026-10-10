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
