# Nostos praxis: the content format (7 November 2026)

A practical activity on the Learn path: an **olive leaf** at the end of its chapter. Maria's picks are in `tasks/nostos-praxis.md` (the four-option table) and listed below. Each activity is one JSON file in `src/data/nostos-praxis/`, named `NN-id.json` (NN = the chapter's number, 01 to 34). The page `/nostos/praxis/<id>/` runs it.

## Rules

- **Grounding:** everything rests on Athena's practices (`src/data/nostos/practices.json`; give their numbers, 1-based, in `practices`), her concepts (`concepts.json`) and, for the Practical Guide picks, the guide's own wording (`src/data/nostos-guide.ts`: `habits`, `meditations`).
- **Voice and spelling:**
  - Never invent readings.
  - Use Athena's name, never "she/her".
  - Plain, warm, second person, British spelling.
  - Greek in Greek script, with its sense.
- **Concrete:** each activity is an exercise with a start and an end, how long, how often, and what to note. No vague attitudes.
- **No AI yet:** nothing in an activity needs the AI. Photo checks and AI readings are a later phase; note them in `later`.
- **Safety:** look at the light, never straight into the sun. Nothing physically risky. For darker themes (death, shame), gentle wording.

## Common fields

```jsonc
{
  "id": "short-id",          // lowercase, hyphens; also the URL
  "chapter": "call-socrates", // chapter id (src/data/nostos-arc.json)
  "n": 2,                     // the chapter's number, 1 to 34
  "kind": "meditation",       // meditation | challenge | mission | make | ritual | tool
  "title": "A real conversation",
  "line": "One line under the title",
  "intro": "Two or three sentences: what you will do and why, in Athena's terms.",
  "does": "What you do, one line (shown on hover on the path).",
  "trains": "What it trains in you, one line (shown on hover on the path).",
  "practices": [57, 170],     // Athena's practice numbers it rests on
  "concepts": ["socrates", "maieutics"], // ids from concepts.json
  "later": "Optional: what a later phase could add (an AI reading, a photo check…)."
  // then the fields of its kind:
}
```

## Fields by kind

- **meditation**: `"minutes": 8`, `"steps": [{ "text": "...", "seconds": 60 }]`. Each step is one instruction shown while it lasts (and later read aloud). A bell sounds between steps, wind plays softly underneath, and there is a Start and a Skip button. The seconds add up to the minutes. 4 to 9 steps; the first settles, the last returns.
- **challenge**: `"days": 5`, or `"times": 3` for something done a number of times rather than daily. Also:
  - `"each"`: what to do each day or each time; or, for an activity in parts, a list of `{ "title", "text" }`;
  - `"when"`: "morning", "evening" or "during the day";
  - `"note"`: the one-line prompt to answer at each check-in; or a list of prompts, one box each (for example one per part);
  - `"end"`: a closing question after the last day.
- **mission**: `"steps": ["...", "..."]` (2 to 4 things to do, once) and `"report": ["prompt 1", "prompt 2"]` (two short written answers afterwards).
- **make**: `"prompts": [{ "label": "...", "hint": "...", "placeholder": "..." }]` (2 to 4 written parts) and `"end"` (one line shown when saved).
- **ritual**:
  - `"date"`: "winter-solstice", or null for a ritual done whenever it is needed;
  - `"steps": ["..."]`;
  - `"note"`: the prompt for a line afterwards;
  - `"calendar"`: true to offer a calendar file for the date.
- **tool**: `"tool"` is one of the four below, with its own fields:
  - **`asleep-audit`** (chapter 3): `"areas": [{ "id", "name", "hint" }]` (8 life areas). For each, two sliders: awake ↔ asleep (lived by habit), satisfied ↔ dissatisfied. Then `"questions": ["..."]`: 2 written questions on the area that itches most.
  - **`values-sort`** (chapter 4): `"values": [{ "greek", "translit", "name", "means", "concept" }]` (12 to 16 Greek values, each with Athena's sense in one sentence). Values are sorted by pairs ("is X more important to you than Y?", Y already placed), then the top five are shown, and `"questions": ["..."]` (1 or 2 written).
  - **`beauty-journal`** (chapter 15): `"days": 7`, `"photos": 3` (at least three photos of small beautiful things), `"intangibles": 3` (at least three beauties that cannot be photographed: a voice, a kindness, a scent), `"note"` (the prompt for each entry).
  - **`watch-talk`** (chapter 22): `"talk": "YouTube id"`, `"from": "mm:ss"` (optional), `"before": ["question to hold while watching"]`, `"after": ["...", "..."]` (2 written questions after).
