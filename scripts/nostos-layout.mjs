// Nostos star map: the layout, worked out once here so the visitor's browser never runs a simulation
// (the client's machine is slow; tasks/nostos.md, step 1). It reads the concepts and their links from
// src/data/nostos/ (read-only, another session fills them) and writes src/data/nostos-layout.json:
// for every star its x, y and radius, and for every star its three strongest links (the "core" lines).
//
// Settings are the prototype's (reference/nostos-prototype/app.js, buildGraph), except the radius: it is
// a function of how connected an idea is and how often it is used (client direction, 6 November 2026),
// 3 to 48 on a steep curve: its links on the map (two thirds) and its mentions in the talks (one third;
// where a count was only estimated from the weight, the links alone); each link scored as her own link 0.6 +
// npmi x 2.2 + log1p(co) x 0.18 + (weight a + weight b) / 18; the three strongest per star pull the
// layout; each theme is anchored on an ellipse 540 by 300 so themes form regions; charge
// -120 - r x 14; collide r + 10. d3-force places nodes without randomness, so the same data always
// gives the same map.
//
// node scripts/nostos-layout.mjs   (also runs before every build: package.json "prebuild")
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY } from 'd3-force';

const read = (name) => JSON.parse(readFileSync(new URL(`../src/data/nostos/${name}.json`, import.meta.url), 'utf8'));
const concepts = read('concepts');
const edges = read('edges');
const { groups } = read('meta');

const byId = new Map(concepts.map((c) => [c.id, c]));
const weight = (id) => byId.get(id)?.weight || 2;
// how connected each idea is: its links on the map
const degree = new Map();
for (const e of edges) if (byId.has(e.a) && byId.has(e.b)) for (const id of [e.a, e.b]) degree.set(id, (degree.get(id) ?? 0) + 1);
const maxDegree = Math.max(...concepts.map((c) => degree.get(c.id) ?? 0), 1);
const counted = concepts.filter((c) => !c.est && c.freq);
const maxLogF = Math.max(...counted.map((c) => Math.log1p(c.freq)), 1);
const centrality = (c) => {
  const links = Math.sqrt((degree.get(c.id) ?? 0) / maxDegree);
  // an estimated count is not a count of use: the links decide alone
  if (c.est || !c.freq) return links;
  const mentions = Math.log1p(c.freq) / maxLogF;
  return (2 / 3) * links + (1 / 3) * mentions;
};
const scores = new Map(concepts.map((c) => [c.id, centrality(c)]));
const top = Math.max(...scores.values());
// a steep curve over a wide range, so the central ideas stand out and the small ones stay small
const radius = (id) => 3 + Math.pow(scores.get(id) / top, 2.2) * 45;

const nodes = concepts.map((c) => ({ id: c.id, group: c.group, r: radius(c.id) }));
const node = new Map(nodes.map((n) => [n.id, n]));

const links = edges
  .filter((e) => node.has(e.a) && node.has(e.b))
  .map((e) => ({
    a: e.a,
    b: e.b,
    score: (e.her ? 0.6 : 0) + (e.npmi || 0) * 2.2 + Math.log1p(e.co || 0) * 0.18 + (weight(e.a) + weight(e.b)) / 18,
  }));
const core = new Set();
for (const n of nodes) {
  links
    .filter((l) => l.a === n.id || l.b === n.id)
    .sort((x, y) => y.score - x.score)
    .slice(0, 3)
    .forEach((l) => core.add(l));
}

const ids = groups.map((g) => g.id);
const anchor = (g) => {
  const a = (ids.indexOf(g) / ids.length) * Math.PI * 2 - Math.PI / 2;
  return [Math.cos(a) * 540, Math.sin(a) * 300];
};

const sim = forceSimulation(nodes)
  .force(
    'link',
    forceLink([...core].map((l) => ({ source: l.a, target: l.b })))
      .id((d) => d.id)
      .distance((d) => 60 + d.source.r + d.target.r)
      .strength(0.22),
  )
  .force('charge', forceManyBody().strength((d) => -120 - d.r * 14))
  .force('collide', forceCollide((d) => d.r + 10))
  .force('x', forceX((d) => anchor(d.group)[0]).strength(0.2))
  .force('y', forceY((d) => anchor(d.group)[1]).strength(0.22))
  .stop();
// Run until the layout settles (the default cooling reaches its floor after about 300 ticks)
for (let i = 0; i < 600; i++) sim.tick();

// The sky is made wide, about as wide as a screen, so that at the full width of the window the furthest
// ideas reach its edges and the whole map is still in sight (client direction, 6 November 2026): the
// places are spread sideways only, the stars keep their sizes
const wide = 1.8;
const spanX = Math.max(...nodes.map((n) => n.x + n.r)) - Math.min(...nodes.map((n) => n.x - n.r));
const spanY = Math.max(...nodes.map((n) => n.y + n.r)) - Math.min(...nodes.map((n) => n.y - n.r));
const stretch = Math.max(1, (wide * spanY) / spanX);
for (const n of nodes) n.x *= stretch;

// The box around every star with its label room, for the map's viewBox
const pad = 40;
const minX = Math.min(...nodes.map((n) => n.x - n.r)) - pad;
const maxX = Math.max(...nodes.map((n) => n.x + n.r)) + pad;
const minY = Math.min(...nodes.map((n) => n.y - n.r)) - pad;
const maxY = Math.max(...nodes.map((n) => n.y + n.r)) + pad + 20; // labels sit under the stars
const r1 = (v) => Math.round(v * 10) / 10;

const out = {
  about:
    'Generated by scripts/nostos-layout.mjs from src/data/nostos/concepts.json and edges.json. Do not edit by hand: run the script (it also runs before every build).',
  // which data this layout was made from, so a page can tell when it is stale
  source: createHash('sha1')
    .update(JSON.stringify([concepts.map((c) => [c.id, c.freq, c.group]), edges.map((e) => [e.a, e.b])]))
    .digest('hex')
    .slice(0, 12),
  viewBox: [r1(minX), r1(minY), r1(maxX - minX), r1(maxY - minY)],
  // each star: its place, its radius, and how central the idea is (0 to 1, the measure behind the radius)
  stars: Object.fromEntries(nodes.map((n) => [n.id, [r1(n.x), r1(n.y), r1(n.r), Math.round((scores.get(n.id) / top) * 1000) / 1000]])),
  core: [...core].map((l) => [l.a, l.b]),
};
writeFileSync(new URL('../src/data/nostos-layout.json', import.meta.url), JSON.stringify(out) + '\n');
console.log(`nostos-layout.json: ${nodes.length} stars, ${core.size} core links, source ${out.source}`);
