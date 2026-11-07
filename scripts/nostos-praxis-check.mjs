// Checks the Nostos practical activities (src/data/nostos-praxis/*.json) against their format
// (tasks/nostos-praxis-spec.md). Run: node scripts/nostos-praxis-check.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'src/data/nostos-praxis');
const concepts = new Set(JSON.parse(readFileSync(join(root, 'src/data/nostos/concepts.json'), 'utf8')).map((c) => c.id));
const practices = JSON.parse(readFileSync(join(root, 'src/data/nostos/practices.json'), 'utf8')).length;
const arc = JSON.parse(readFileSync(join(root, 'src/data/nostos-arc.json'), 'utf8'));
const chapters = Object.values(arc.chapters).flat().map((c) => c.id);
const KINDS = ['meditation', 'challenge', 'mission', 'make', 'ritual', 'tool'];
const TOOLS = ['asleep-audit', 'values-sort', 'beauty-journal', 'watch-talk'];

let bad = 0;
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
const ids = new Map();
for (const file of files) {
  const problems = [];
  const say = (m) => problems.push(m);
  let a;
  try {
    a = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  } catch (e) {
    console.log(`✗ ${file}: not valid JSON (${e.message})`);
    bad++;
    continue;
  }
  for (const f of ['id', 'chapter', 'n', 'kind', 'title', 'line', 'intro', 'does', 'trains', 'practices', 'concepts']) if (a[f] === undefined) say(`missing "${f}"`);
  if (ids.has(a.id)) say(`id "${a.id}" also in ${ids.get(a.id)}`);
  ids.set(a.id, file);
  const ci = chapters.indexOf(a.chapter);
  if (ci < 0) say(`unknown chapter "${a.chapter}"`);
  else if (ci + 1 !== a.n) say(`chapter "${a.chapter}" is number ${ci + 1}, not ${a.n}`);
  if (!file.startsWith(String(a.n).padStart(2, '0'))) say(`file name does not start with ${String(a.n).padStart(2, '0')}`);
  if (!KINDS.includes(a.kind)) say(`unknown kind "${a.kind}"`);
  for (const c of a.concepts ?? []) if (!concepts.has(c)) say(`unknown idea "${c}"`);
  for (const p of a.practices ?? []) if (!(p >= 1 && p <= practices)) say(`no practice ${p}`);
  if (a.kind === 'meditation') {
    const total = (a.steps ?? []).reduce((s, x) => s + (x.seconds || 0), 0);
    if (!(a.steps?.length >= 3)) say('a meditation needs at least 3 steps');
    if (!a.minutes || Math.abs(total - a.minutes * 60) > a.minutes * 6) say(`steps add up to ${total}s, not about ${a.minutes} min`);
  }
  if (a.kind === 'challenge') {
    if (!a.days && !a.times) say('a challenge needs days or times');
    for (const f of ['each', 'note', 'end']) if (!a[f]) say(`challenge missing "${f}"`);
  }
  if (a.kind === 'mission' && !(a.steps?.length && a.report?.length)) say('a mission needs steps and report');
  if (a.kind === 'make' && !(a.prompts?.length >= 2)) say('a make needs at least 2 prompts');
  if (a.kind === 'ritual' && !(a.steps?.length)) say('a ritual needs steps');
  if (a.kind === 'tool') {
    if (!TOOLS.includes(a.tool)) say(`unknown tool "${a.tool}"`);
    if (a.tool === 'asleep-audit' && !(a.areas?.length >= 6 && a.questions?.length)) say('asleep-audit needs areas and questions');
    if (a.tool === 'values-sort') {
      if (!(a.values?.length >= 10)) say('values-sort needs at least 10 values');
      for (const v of a.values ?? []) if (v.concept && !concepts.has(v.concept)) say(`value ${v.name}: unknown idea "${v.concept}"`);
    }
    if (a.tool === 'beauty-journal' && !(a.photos && a.intangibles)) say('beauty-journal needs photos and intangibles');
    if (a.tool === 'watch-talk' && !(a.talk && a.after?.length)) say('watch-talk needs talk and after');
  }
  if (problems.length) bad++;
  const size = a.kind === 'meditation' ? `${a.minutes} min` : a.days ? `${a.days} days` : a.times ? `${a.times} times` : a.tool ?? '';
  console.log(`${problems.length ? '✗' : '✓'} ${file}: ${a.kind} ${size}`);
  for (const p of problems) console.log(`    - ${p}`);
}
console.log(bad ? `\n${bad} file(s) with problems` : `\nall ${files.length} fine`);
process.exit(bad ? 1 : 0);
