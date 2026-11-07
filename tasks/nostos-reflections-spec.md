# Nostos reflections: the content format (7 November 2026)

Each reflection is one JSON file in `src/data/nostos-reflections/`, named `NN-id.json` (NN = its number, 01 to 15). The page `/nostos/reflect/<id>/` runs it. The proposal and the choice of the fifteen are in `tasks/nostos-reflections.md`; this file is the format.

## Rules from Maria (7 November 2026)

- **Length:** each reflection takes **2 to 6 minutes**. The page estimates it from the items (see timings below); aim for 3 to 5 minutes.
- **Variety:** use at least **four different item kinds** in each reflection, and vary the mix from one reflection to the next.
- **Free text:** at least **two `text` items** in each (three at most), so the AI can make the reading personal. Ask for concrete things: a moment, a sentence, an example from the learner's own life, not "what do you think about X".
- **The result is an analysis only,** no longer than an A4 page. **No plans, practices or "what to do next"** in the result: Maria will add those later as a separate layer.
- **Content and voice:**
  - Everything rests on Athena's teaching as gathered in `src/data/nostos/` (concepts.json, practices.json, sequences.json, distinctions.json, lines.json, myths.json). Use her terms and readings, never invented ones.
  - Use Athena's name, never "she/her" for her.
  - Plain, warm, second person, British spelling. No jargon without its meaning; Greek in Greek script with its sense.
  - It is a reflection, not a psychological test: no diagnosis, no clinical words.

## The file

```jsonc
{
  "id": "charioteer",                 // short, lowercase, hyphens; also the URL
  "n": 3,                             // its place on the path, 1 to 15
  "after": "soul-self",               // the chapter it follows (id from src/data/nostos-arc.json)
  "title": "The charioteer",          // shown on the journey and the page
  "line": "Which part of your soul holds the reins?", // one line under the title
  "intro": "Two or three sentences: what this reflection looks at, in Athena's terms, and that it is a reflection, not a test.",
  "concepts": ["tripartitesoul", "soul", "self"], // the ideas it rests on: ids that exist in concepts.json
  "types": [                          // the groupings: 3 to 7; the one with the highest score is the learner's
    {
      "id": "black-horse",
      "name": "The black horse leads", // the name of the grouping
      "short": "Desire sets the pace",  // a few words
      "about": "Two to four sentences: what this grouping means, in Athena's terms. This is what everyone sees, with or without the AI. An analysis, not advice.",
      "concepts": ["desire", "tripartitesoul"] // 1 to 3 ids from concepts.json: stars to see on the map
    }
  ],
  "items": [ /* 7 to 12 items, see below; at least 2 of kind "text" */ ],
  "looks": "What it looks at in you, one line (shown on hover on the journey).",
  "learn": "What you learn from it, one line: the chapter's idea seen in yourself (shown on hover on the journey).",
  "later": {                          // NOT USED YET: a note for a later phase (Maria, 7 November 2026)
    "plan": "The plan the reflection could end with, from the outcomes table in tasks/nostos-reflections.md.",
    "shape": "Maybe (not for every reflection): Add one practice with its dose; Cut one thing; Watch one cue; a check-in after 7 days (did you do it, what changed); a retake after 4 to 6 weeks."
  },
  "ai": "Three to six sentences for the AI: what to look for in these answers, which of Athena's distinctions to read them by, what to be careful of. The AI also sees all of Athena's ideas, the types, the scores and the answers.",
  "reads": []                         // optional: ids of earlier reflections whose results the AI should compare with (for example ["apollo-name"])
}
```

## Later (not built yet)

`later` is a TODO note, ignored by the page: the plans ("what you leave with") and the 7-day check-in and the retake are to be designed and built in another phase, perhaps for some reflections only (Maria, 7 November 2026).

## Item kinds

Each item has an `id` (unique in its file, such as "q1" or "t1") and a `prompt`. Scores go to the types through `to`, an object such as `{ "black-horse": 2, "white-horse": 1 }`. Weights are 1 to 3, and may be negative for a type the answer speaks against.

- **`choice`**: a scenario or question with 3 to 5 options, pick one. `"options": [{ "text": "...", "to": {...} }]`. About 20 s.
- **`ladder`**: like `choice`, but the options are rungs shown from the bottom up (stages, steps, levels). `"rungs": [{ "text": "...", "to": {...} }]`, listed from the lowest rung. About 20 s.
- **`scale`**: a statement placed on a five-point line. `"left": "Never"`, `"right": "Almost always"`, `"to": {...}`. The answer counts from −1 at the left end to +1 at the right, times the weights, so the left end scores against those types. About 8 s.
- **`pairs`**: quick this-or-that, 4 to 8 pairs. `"pairs": [{ "a": "...", "aTo": {...}, "b": "...", "bTo": {...} }]`. About 6 s a pair.
- **`rank`**: put 4 or 5 options in order, most like you first. `"options": [{ "text": "...", "to": {...} }]`. The first counts fully, the last not at all. About 30 s.
- **`points`**: share a number of points (`"total": 10`) among 3 to 6 options, for example where your energy went this week. `"options": [{ "text": "...", "to": "type-id" }]` (here `to` is ONE type id). About 35 s.
- **`multi`**: choose up to `"max"` (2 or 3) of 5 to 8 options. `"options": [{ "text": "...", "to": {...} }]`. About 20 s.
- **`text`**: free text. `"hint"` (a short line under the prompt) and `"placeholder"` (an example of the kind of answer). No scores; the AI reads it. About 75 s.

## More than one answer (Maria, 7 November 2026)

A `choice` or `ladder` item may take `"max": 2` (or 3) where life is rarely one thing at once (for example "Where are you now?" on the Odyssey): the learner may then pick up to that many, and the picks share the weight of one answer. Keep single choice where one honest answer is the point of the item.

## Notes under the options (Maria, 7 November 2026)

Every option of a `choice`, `ladder`, `rank` or `multi` item carries a `"note"`: one short line in small letters under the option, saying in plain, everyday words what the phrase means, so the learner can recognise it in their own life (for example, under "In the house, facing the suitors one by one": "You are back in your own life, clearing out, one by one, what eats your time and energy."). At most about 15 words; no Greek; no advice; it explains, it does not judge. Pairs and points options do not need one.

## Timing

The page adds up the item times above, and the total must fall between 120 and 360 seconds. `node scripts/nostos-reflections-check.mjs` checks every file (ids, kinds, concept ids, types, timing, at least two text items).
