// Checks the Nostos reflections (src/data/nostos-reflections/*.json) against their format
// (tasks/nostos-reflections-spec.md): known kinds, ideas and chapters, scores that point at real types,
// at least two written answers, at least four kinds of item, and 2 to 6 minutes to complete.
// Run: node scripts/nostos-reflections-check.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'src/data/nostos-reflections');
const concepts = new Set(JSON.parse(readFileSync(join(root, 'src/data/nostos/concepts.json'), 'utf8')).map((c) => c.id));
const arc = JSON.parse(readFileSync(join(root, 'src/data/nostos-arc.json'), 'utf8'));
const chapters = new Set(Object.values(arc.chapters).flat().map((c) => c.id));
// seconds each kind takes, as the page estimates them
export const SECONDS = { choice: 20, ladder: 20, scale: 8, rank: 30, points: 35, multi: 20, text: 75 };
const PAIR = 6;

let bad = 0;
const seen = new Map();
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
for (const file of files) {
  const problems = [];
  let r;
  try {
    r = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    console.log(`✗ ${file}: not valid JSON (${e.message})`);
    bad++;
    continue;
  }
  const say = (m) => problems.push(m);
  for (const f of ['id', 'n', 'after', 'title', 'line', 'intro', 'concepts', 'types', 'items', 'looks', 'learn', 'later', 'ai']) if (r[f] === undefined) say(`missing "${f}"`);
  if (seen.has(r.id)) say(`id "${r.id}" also in ${seen.get(r.id)}`);
  seen.set(r.id, file);
  if (!file.startsWith(String(r.n).padStart(2, '0'))) say(`file name does not start with its number ${r.n}`);
  if (!chapters.has(r.after)) say(`unknown chapter "${r.after}"`);
  for (const c of r.concepts ?? []) if (!concepts.has(c)) say(`unknown idea "${c}"`);
  const types = new Set((r.types ?? []).map((t) => t.id));
  if (types.size < 3 || types.size > 7) say(`${types.size} types (3 to 7)`);
  for (const t of r.types ?? []) {
    for (const f of ['id', 'name', 'short', 'about']) if (!t[f]) say(`type ${t.id ?? '?'} missing "${f}"`);
    for (const c of t.concepts ?? []) if (!concepts.has(c)) say(`type ${t.id}: unknown idea "${c}"`);
  }
  const scoreTo = (to, where) => {
    if (!to) return;
    for (const k of Object.keys(to)) if (!types.has(k)) say(`${where}: scores unknown type "${k}"`);
  };
  let seconds = 0;
  const kinds = new Set();
  const ids = new Set();
  for (const it of r.items ?? []) {
    const where = `item ${it.id}`;
    if (ids.has(it.id)) say(`${where}: id used twice`);
    ids.add(it.id);
    if (!it.prompt) say(`${where}: no prompt`);
    kinds.add(it.kind);
    if (it.kind === 'pairs') {
      seconds += PAIR * (it.pairs?.length ?? 0);
      if (!(it.pairs?.length >= 4 && it.pairs.length <= 8)) say(`${where}: 4 to 8 pairs`);
      for (const p of it.pairs ?? []) scoreTo(p.aTo, where), scoreTo(p.bTo, where);
      continue;
    }
    if (!(it.kind in SECONDS)) {
      say(`${where}: unknown kind "${it.kind}"`);
      continue;
    }
    seconds += SECONDS[it.kind];
    const opts = it.kind === 'ladder' ? it.rungs : it.options;
    if (['choice', 'ladder', 'rank', 'multi', 'points'].includes(it.kind) && !(opts?.length >= 3)) say(`${where}: needs at least 3 options`);
    if (it.kind === 'points') {
      if (!it.total) say(`${where}: no total`);
      for (const o of opts ?? []) if (!types.has(o.to)) say(`${where}: points to unknown type "${o.to}"`);
    } else if (it.kind === 'scale') {
      if (!it.left || !it.right) say(`${where}: needs left and right`);
      if (it.steps !== undefined && it.steps !== 5 && it.steps !== 7) say(`${where}: steps must be 5 or 7`);
      if (!it.to && !it.mid && !it.ends) say(`${where}: scores nothing (to, mid or ends)`);
      scoreTo(it.to, where), scoreTo(it.mid, where), scoreTo(it.ends, where);
    } else if (it.kind !== 'text') for (const o of opts ?? []) scoreTo(o.to, where);
    if (it.kind === 'multi' && !(it.max >= 1)) say(`${where}: no max`);
    if ((it.kind === 'choice' || it.kind === 'ladder') && it.max !== undefined && !(it.max >= 2 && it.max <= 3)) say(`${where}: max must be 2 or 3`);
    // a short plain-words note under every option of these kinds (client direction, 7 November 2026)
    if (['choice', 'ladder', 'rank', 'multi'].includes(it.kind)) for (const o of opts ?? []) if (!o.note) say(`${where}: an option without its note ("${String(o.text).slice(0, 30)}…")`);
  }
  const texts = (r.items ?? []).filter((i) => i.kind === 'text').length;
  if (texts < 2 || texts > 3) say(`${texts} text items (2 to 3)`);
  if (kinds.size < 4) say(`only ${kinds.size} kinds of item (at least 4)`);
  if (seconds < 120 || seconds > 360) say(`about ${Math.round(seconds / 60 * 10) / 10} minutes (2 to 6)`);
  // every type can be reached
  const reached = new Set();
  for (const it of r.items ?? []) {
    const add = (to) => to && Object.entries(to).forEach(([k, v]) => v > 0 && reached.add(k));
    if (it.kind === 'pairs') it.pairs.forEach((p) => (add(p.aTo), add(p.bTo)));
    else if (it.kind === 'points') it.options.forEach((o) => reached.add(o.to));
    else if (it.kind === 'scale') {
      add(it.to), add(it.mid), add(it.ends);
      // the left end scores against `to`: a negative weight is reached from there
      if (it.to) Object.entries(it.to).forEach(([k, v]) => v < 0 && reached.add(k));
    }
    else (it.kind === 'ladder' ? it.rungs : it.options ?? []).forEach((o) => add(o.to));
  }
  for (const t of types) if (!reached.has(t)) say(`type "${t}" can never score`);
  const status = problems.length ? '✗' : '✓';
  if (problems.length) bad++;
  console.log(`${status} ${file}: ${r.items?.length ?? 0} items, ${kinds.size} kinds, ${texts} written, ${types.size} types, about ${(seconds / 60).toFixed(1)} min`);
  for (const p of problems) console.log(`    - ${p}`);
}
console.log(bad ? `\n${bad} file(s) with problems` : `\nall ${files.length} fine`);
process.exit(bad ? 1 : 0);
