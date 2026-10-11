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

- What happened: the disk (926 GB, about 880 GB of it Maria's own files) hit zero twice while I ran 13 to 20 agents at once, each with a headless browser. A pending macOS update and its snapshots take whatever space is freed, and swap from heavy runs lands on the same disk.
- Rule: on this machine run at most two or three agents at a time, delete screenshots and temporary renders as soon as they have been looked at, and check `df` before starting anything heavy. Stop and say so if free space drops under about 5 GB. Commit to git before long runs.
- Also: when stopping for a usage limit, offer to schedule a restart. I cannot wake myself; nothing resumes unless a message or a background task arrives.
