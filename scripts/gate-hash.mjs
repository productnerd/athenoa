// Prints the hashes the preview gate checks answers against (src/data/gate.ts, `hashes`).
//   node scripts/gate-hash.mjs Ithaca Ιθάκη ...
// Give every spelling that should pass; each is normalised the way the gate normalises what a
// visitor types (lower case, no accents, letters only, final sigma as sigma). The answers themselves
// are never written into the repo, which is public: only these hashes are.
import { createHash } from 'node:crypto';

const norm = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ς/g, 'σ').replace(/[^a-zα-ω]/g, '');
const answers = [...new Set(process.argv.slice(2).map(norm).filter(Boolean))];
if (!answers.length) {
  console.error('usage: node scripts/gate-hash.mjs <answer> [<another spelling> ...]');
  process.exit(1);
}
console.log(JSON.stringify(answers.map((a) => createHash('sha256').update('athenoa:' + a).digest('hex')), null, 2));
