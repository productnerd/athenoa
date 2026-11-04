(function(){
'use strict';
const D = window.DATA;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
function h(tag, attrs, ...kids){
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)){
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()){ if (k == null || k === false) continue; el.append(k.nodeType ? k : document.createTextNode(String(k))); }
  return el;
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clip = (s, n) => (s = String(s || '')).length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;

const C = Object.fromEntries(D.concepts.map(c => [c.id, c]));
const T = Object.fromEntries(D.talks.map(t => [t.id, t]));
(D.writings || []).forEach(w => { T[w.id] = { id: w.id, title: w.title, en: w.title_en || w.title, url: w.url, kind: 'text' }; });
const GROUP = Object.fromEntries(D.groups.map(g => [g.id, g]));
const gcol = g => `var(--g-${g})`;
const GCOL = {}; // resolved colours for SVG
const bridgesBy = {}; D.bridges.forEach(b => (bridgesBy[b.concept] = bridgesBy[b.concept] || []).push(b));
const talkName = id => { const t = T[id]; return t ? (t.en ? t.en.replace(/^#\s*/, '') : t.title) : id; };
const ytLink = (id, t) => { if (T[id] && T[id].url) return T[id].url; let s = 0; if (t){ const p = String(t).split(':').map(Number); if (p.every(n => !isNaN(n))) s = p.reduce((a, b) => a * 60 + b, 0); } return `https://www.youtube.com/watch?v=${id}${s ? '&t=' + s + 's' : ''}`; };

/* ---------------- progress ---------------- */
const KEY = 'nostos-progress-v1';
let P = { xp: 0, days: {}, srs: {}, known: {}, best: {}, done: {}, v: 1 };
try { const s = localStorage.getItem(KEY); if (s) P = Object.assign(P, JSON.parse(s)); } catch (e) {}
let dbDoc = null, saveTimer = null;
const today = () => new Date().toISOString().slice(0, 10);
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {}
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { if (dbDoc) dbDoc.set(JSON.parse(JSON.stringify(P))).catch(() => {}); }, 1500);
}
function streak(){
  let n = 0; const d = new Date();
  if (!P.days[today()]) d.setDate(d.getDate() - 1);
  for (;;){ const k = d.toISOString().slice(0, 10); if (P.days[k]) { n++; d.setDate(d.getDate() - 1); } else break; }
  return n;
}
const RUNGS = [
  [0, 'One beautiful body', 'You fall for a single form: one idea that catches you.'],
  [120, 'All beautiful bodies', 'You see the same beauty in many forms.'],
  [350, 'Beautiful souls', 'You come to love what is within, not the surface.'],
  [700, 'Laws and customs', 'Beauty in ways of living together, in ethos and the polis.'],
  [1200, 'Knowledge', 'The beauty of understanding itself.'],
  [1900, 'The sea of beauty', 'Turned toward the vast open sea of the beautiful.'],
  [2800, 'Beauty itself', 'Suddenly, ἐξαίφνης, the beautiful itself comes into view.']
];
const rungIdx = () => { let i = 0; RUNGS.forEach((r, k) => { if (P.xp >= r[0]) i = k; }); return i; };
function award(n, why){
  if (!n) return;
  const before = rungIdx();
  P.xp += n; P.days[today()] = (P.days[today()] || 0) + n;
  save(); hud();
  const after = rungIdx();
  toast(after > before ? `<i>Ἀνάβασις</i> New rung: ${RUNGS[after][1]}` : `<i>+${n}</i> ${esc(why || '')}`);
}
function hud(){ $('#hud-xp').textContent = P.xp; $('#hud-streak').textContent = streak(); }
let toastT;
function toast(html){ const t = $('#toast'); t.innerHTML = html; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }

/* runtime capabilities (progress sync, Claude) */
let sample = null;
(async () => {
  try {
    if (!window.claude || !window.claude.use) return;
    const [db, user, smp] = await Promise.all([claude.use('db'), claude.use('user'), claude.use('sample')]);
    sample = smp || null; renderPlay();
    if (db && user){
      const uid = await user.id();
      if (uid){
        dbDoc = db.doc('data/users/' + uid + '/progress');
        const snap = await dbDoc.get();
        const r = snap.exists ? snap.data() : null;
        if (r && (r.xp || 0) > P.xp){ P = Object.assign({ xp: 0, days: {}, srs: {}, known: {}, best: {}, done: {}, v: 1 }, r); try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) {} hud(); refreshKnown(); }
        else if (P.xp) save();
      }
    }
  } catch (e) {}
})();

/* ---------------- router ---------------- */
const VIEWS = ['map', 'play', 'shelf', 'talks', 'me'];
function route(){
  const v = (location.hash || '#map').slice(1);
  const cur = VIEWS.includes(v) ? v : 'map';
  VIEWS.forEach(x => { $('#v-' + x).hidden = x !== cur; });
  $$('nav.tabs a').forEach(a => a.setAttribute('aria-current', a.getAttribute('href') === '#' + cur ? 'page' : 'false'));
  if (cur !== 'map') closeDrawer();
  if (cur === 'map') requestAnimationFrame(() => graph && graph.resize());
  if (cur === 'me') renderMe();
  if (cur === 'play') renderPlay();
}
window.addEventListener('hashchange', route);

/* ---------------- star map ---------------- */
let graph = null;
function buildGraph(){
  const sky = $('#sky'), svg = d3.select('#graph');
  const cs = getComputedStyle(document.documentElement);
  D.groups.forEach(g => GCOL[g.id] = cs.getPropertyValue('--g-' + g.id).trim() || '#ccc');
  const maxF = d3.max(D.concepts, c => c.freq);
  const rad = d3.scaleSqrt().domain([1, maxF]).range([5, 36]);
  const nodes = D.concepts.map(c => ({ id: c.id, c, r: rad(Math.max(1, c.freq)) }));
  const N = Object.fromEntries(nodes.map(n => [n.id, n]));
  const allLinks = D.edges.map(e => ({ source: e.a, target: e.b, e })).filter(l => N[l.source] && N[l.target]);
  const wOf = id => C[id].weight || 2;
  allLinks.forEach(l => { const e = l.e; l.score = (e.her ? 0.6 : 0) + (e.npmi || 0) * 2.2 + Math.log1p(e.co || 0) * 0.18 + (wOf(e.a) + wOf(e.b)) / 18; });
  const core = new Set();
  nodes.forEach(n => allLinks.filter(l => l.source === n.id || l.target === n.id).sort((a, b) => b.score - a.score).slice(0, 3).forEach(l => core.add(l)));
  allLinks.forEach(l => l.core = core.has(l));
  const links = allLinks;
  links.forEach(l => { l.sid = l.source; l.tid = l.target; });
  const adj = {}; links.forEach(l => { (adj[l.sid] = adj[l.sid] || new Set()).add(l.tid); (adj[l.tid] = adj[l.tid] || new Set()).add(l.sid); });
  links.forEach(l => { l.source = N[l.sid]; l.target = N[l.tid]; });
  const gids = D.groups.map(g => g.id);
  let W = sky.clientWidth, H = sky.clientHeight;
  const anchor = g => { const i = gids.indexOf(g), a = (i / gids.length) * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * 540, Math.sin(a) * 300]; };
  const rank = nodes.slice().sort((a, b) => b.r - a.r).map(n => n.id); const topLabel = new Set(rank.slice(0, 34));
  const short = s => s.replace(/\s*\(.*?\)/g, '').replace(/,.*$/, '');

  const root = svg.append('g');
  links.forEach(l => {}); const linkSel = root.append('g').selectAll('line').data(links).join('line')
    .attr('stroke', d => d.e.her ? 'rgba(242,193,78,.55)' : 'rgba(185,200,255,.35)')
    .attr('stroke-width', d => d.e.her ? 1.2 : 0.6 + Math.min(2, (d.e.co || 0) / 30))
    .attr('stroke-dasharray', d => d.e.her ? null : '3 4');
  const nodeSel = root.append('g').selectAll('g').data(nodes).join('g')
    .attr('class', d => 'node' + (d.r > 13 ? ' big' : '')).attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', d => d.c.label);
  nodeSel.append('circle').attr('r', d => d.r).attr('fill', d => GCOL[d.c.group] || '#ddd');
  nodeSel.append('text').attr('text-anchor', 'middle').attr('dy', d => d.r + 12).text(d => short(d.c.label));

  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links.filter(l => l.core)).id(d => d.id).distance(d => 60 + (N[d.e.a].r + N[d.e.b].r)).strength(0.22))
    .force('charge', d3.forceManyBody().strength(d => -120 - d.r * 14))
    .force('collide', d3.forceCollide(d => d.r + 10))
    .force('x', d3.forceX(d => anchor(d.c.group)[0]).strength(0.2))
    .force('y', d3.forceY(d => anchor(d.c.group)[1]).strength(0.22))
    .on('tick', () => {
      linkSel.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
    });
  for (let i = 0; i < 260; i++) sim.tick();
  sim.alpha(0.15);

  const zoom = d3.zoom().scaleExtent([0.35, 4]).on('zoom', ev => { root.attr('transform', ev.transform); labelZoom(ev.transform.k); });
  svg.call(zoom).on('dblclick.zoom', null);
  function labelZoom(k){ const fs = Math.max(10.5, Math.min(13, 11.5 / Math.sqrt(k))) / k; nodeSel.select('text').attr('font-size', d => (d.r > 16 ? fs * 1.15 : fs)).attr('dy', d => d.r + fs * 1.15).attr('stroke-width', 3 / k); nodeSel.select('text').style('opacity', d => (d._lit || (k < 1.25 ? topLabel.has(d.id) : d.r * k > 7)) ? 1 : 0); }
  function fit(){
    W = sky.clientWidth; H = sky.clientHeight;
    const xs = nodes.map(n => n.x), ys = nodes.map(n => n.y);
    const [x0, x1, y0, y1] = [d3.min(xs) - 40, d3.max(xs) + 40, d3.min(ys) - 40, d3.max(ys) + 60];
    const k = Math.min(W / (x1 - x0), (H - 70) / (y1 - y0), 1.6);
    svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(W / 2 - k * (x0 + x1) / 2, 30 + (H - 30) / 2 - k * (y0 + y1) / 2).scale(k));
  }
  let mode = 'core', hidden = new Set(), sel = null, hunt = null;
  function visible(l){ if (hidden.has(N[l.source.id].c.group) || hidden.has(N[l.target.id].c.group)) return false; if (sel && (l.source.id === sel || l.target.id === sel)) return true; return mode === 'both' || (mode === 'core' ? l.core : mode === 'her' ? l.e.her && l.core : l.e.co > 0); }
  function paint(){
    const lit = sel ? new Set([sel, ...(adj[sel] || [])]) : null;
    nodes.forEach(n => { n._lit = lit ? lit.has(n.id) : false; });
    nodeSel.classed('dim', d => hidden.has(d.c.group) || (lit && !lit.has(d.id)))
      .classed('hl', d => d.id === sel).classed('known', d => !!P.known[d.id]);
    linkSel.style('display', d => visible(d) ? null : 'none')
      .classed('dim', d => lit && !(d.source.id === sel || d.target.id === sel))
      .attr('stroke-opacity', d => lit && (d.source.id === sel || d.target.id === sel) ? 1 : null);
    labelZoom(d3.zoomTransform(svg.node()).k);
  }
  nodeSel.on('click', (ev, d) => { ev.stopPropagation(); if (hunt) return huntGuess(d.id); select(d.id); })
    .on('keydown', (ev, d) => { if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); if (hunt) huntGuess(d.id); else select(d.id); } })
    .on('mouseenter', function(ev, d){ d3.select(this).select('text').style('opacity', 1); })
    .on('mouseleave', () => paint());
  svg.on('click', () => { if (!hunt){ sel = null; paint(); closeDrawer(); } });
  nodeSel.call(d3.drag().on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.2).restart(); d.fx = d.x; d.fy = d.y; })
    .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; }).on('end', (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  function select(id, focus){
    sel = id; paint(); openConcept(id);
    if (focus){ const n = N[id]; const k = Math.max(1.3, d3.zoomTransform(svg.node()).k); svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(W / 2 - n.x * k - (W > 760 ? 160 : 0), H / 2 - n.y * k - (W > 760 ? 0 : 120)).scale(k)); }
  }
  // controls
  $$('.seg button').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode; $$('.seg button').forEach(x => x.setAttribute('aria-pressed', x === b)); paint(); }));
  const lg = $('#legend');
  D.groups.forEach(g => {
    const b = h('button', { 'aria-pressed': 'true', title: g.sub }, h('span', { class: 'dot', style: { background: gcol(g.id) } }), g.label);
    b.addEventListener('click', () => { hidden.has(g.id) ? hidden.delete(g.id) : hidden.add(g.id); b.setAttribute('aria-pressed', !hidden.has(g.id)); paint(); });
    lg.append(b);
  });
  $('#fit-btn').addEventListener('click', fit);
  const q = $('#q');
  q.addEventListener('keydown', e => { if (e.key === 'Enter'){ const id = findConcept(q.value); if (id){ select(id, true); q.blur(); } else toast('No star by that name yet'); } });
  q.addEventListener('input', () => { const id = findConcept(q.value); if (id && q.value.length > 2){ sel = id; paint(); } });

  // find-the-link game
  const herEdges = D.edges.filter(e => e.her && e.why && e.why.length > 12);
  function huntStart(){
    const e = pick(herEdges, 1)[0]; if (!e) return;
    const flip = Math.random() < 0.5; const a = flip ? e.b : e.a, b = flip ? e.a : e.b;
    hunt = { a, b, why: e.why, tries: 0 };
    sel = null; paint(); closeDrawer();
    nodeSel.select('circle').classed('pulse', d => d.id === a);
    const n = N[a]; const k = 1.1; svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(W / 2 - n.x * k, H / 2 - n.y * k).scale(k));
    showClue();
  }
  function showClue(msg){
    const c = $('#clue'); c.hidden = false; c.innerHTML = '';
    const A = C[hunt.a];
    c.append(h('div', { class: 'eyebrow', style: { color: 'var(--g-path)' } }, 'Find the link · try ' + (hunt.tries + 1) + ' of 3'),
      h('div', { style: { marginTop: '4px' } }, h('b', null, A.label), A.greek ? h('span', { class: 'greek', style: { opacity: .8 } }, ' ' + A.greek) : '', ' is pulsing. She links it to another star:'),
      h('div', { class: 'greek', style: { fontSize: '17px', marginTop: '6px' } }, '“' + hunt.why + '”'),
      msg ? h('div', { style: { marginTop: '6px', color: 'var(--g-ethics)' } }, msg) : '',
      h('div', { class: 'row' }, h('span', { style: { color: 'var(--sky-muted)', fontSize: '12px' } }, 'Tap the other star on the map.'), h('button', { class: 'sbtn ghost', onclick: huntEnd }, 'Stop')));
  }
  function huntGuess(id){
    if (id === hunt.a) return;
    if (id === hunt.b){ award(hunt.tries === 0 ? 15 : 8, 'link found'); reveal(true); }
    else { hunt.tries++; if (hunt.tries >= 3) reveal(false); else showClue('Not that one: ' + C[id].label + '.'); }
  }
  function reveal(ok){
    const B = C[hunt.b], A = C[hunt.a];
    sel = hunt.a; paint(); nodeSel.select('circle').classed('pulse', d => d.id === hunt.b);
    const c = $('#clue'); c.innerHTML = '';
    c.append(h('div', { class: 'eyebrow', style: { color: ok ? 'var(--g-ways)' : 'var(--g-ethics)' } }, ok ? 'Found it' : 'The answer'),
      h('div', { style: { marginTop: '4px' } }, h('b', null, A.label), ' ↔ ', h('b', null, B.label), B.greek ? h('span', { class: 'greek' }, ' ' + B.greek) : ''),
      h('div', { class: 'row' }, h('button', { class: 'sbtn', onclick: huntStart }, 'Another'), h('button', { class: 'sbtn ghost', onclick: huntEnd }, 'Done')));
  }
  function huntEnd(){ hunt = null; $('#clue').hidden = true; nodeSel.select('circle').classed('pulse', false); sel = null; paint(); }
  $('#hunt-btn').addEventListener('click', huntStart);

  // background stars
  const cv = $('#starfield');
  function stars(){
    const dpr = window.devicePixelRatio || 1; cv.width = sky.clientWidth * dpr; cv.height = sky.clientHeight * dpr;
    const x = cv.getContext('2d'); x.scale(dpr, dpr); let s = 7;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 260; i++){ x.globalAlpha = 0.15 + rnd() * 0.5; x.fillStyle = '#fff'; x.beginPath(); x.arc(rnd() * sky.clientWidth, rnd() * sky.clientHeight, rnd() * 1.1 + 0.2, 0, 7); x.fill(); }
  }
  stars(); paint(); fit();
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { stars(); }, 200); });
  graph = { select, paint, resize(){ stars(); }, fit };
}
function findConcept(s){
  s = String(s || '').trim().toLowerCase(); if (!s) return null;
  const norm = x => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const ns = norm(s);
  let best = D.concepts.find(c => norm(c.label) === ns || norm(c.greek) === ns || c.id === ns);
  if (!best) best = D.concepts.filter(c => norm(c.label).includes(ns) || norm(c.greek).includes(ns) || norm(c.translit).includes(ns)).sort((a, b) => b.freq - a.freq)[0];
  return best ? best.id : null;
}
function refreshKnown(){ if (graph) graph.paint(); }

/* ---------------- concept drawer ---------------- */
const drawer = $('#drawer');
function closeDrawer(){ drawer.classList.remove('open'); }
function openConcept(id){
  const c = C[id]; if (!c) return;
  const maxF = Math.max(...D.concepts.map(x => x.freq));
  const inner = h('div', { class: 'drawer-in' });
  inner.append(h('button', { class: 'x', 'aria-label': 'Close', onclick: closeDrawer }, '×'));
  inner.append(h('div', null,
    h('div', { class: 'chips' }, h('span', { class: 'chip' }, h('span', { class: 'dot', style: { background: gcol(c.group) } }), GROUP[c.group]?.label || c.group), h('span', { class: 'chip' }, c.kind)),
    c.greek ? h('div', { class: 'gk greek', style: { marginTop: '10px' } }, c.greek) : '',
    h('h2', { style: { fontSize: c.greek ? '20px' : '34px', marginTop: '4px' } }, c.label),
    c.translit ? h('div', { class: 'tr' }, c.translit) : ''));
  inner.append(h('div', null,
    h('div', { class: 'eyebrow', style: { marginBottom: '4px' } }, c.est ? 'Weight in her teaching (estimated)' : `Mentioned ${c.freq} times across the transcripts`),
    h('div', { class: 'freqbar' }, h('i', { style: { width: Math.max(4, Math.sqrt(c.freq / maxF) * 100) + '%' } }))));
  if (c.take) inner.append(h('div', null, h('div', { class: 'eyebrow' }, 'In her teaching'), h('p', { style: { margin: '6px 0 0' } }, c.take)));
  (c.more || []).forEach(m => inner.append(h('details', null, h('summary', { class: 'muted', style: { cursor: 'pointer', fontSize: '13px' } }, 'Another angle'), h('p', { style: { margin: '6px 0 0' } }, m))));
  (bridgesBy[id] || []).forEach(b => inner.append(h('div', { class: 'bridge' }, h('div', { class: 'eyebrow' }, 'Your link · ' + b.domain), h('p', { style: { margin: '6px 0 0' } }, b.hook))));
  const ety = D.etymologies.filter(e => e.word && c.greek && (e.word === c.greek || c.greek.includes(e.word) || e.word.includes(c.greek)));
  ety.slice(0, 2).forEach(e => inner.append(h('div', { class: 'card' }, h('div', { class: 'eyebrow' }, 'Roots · ' + (e.status === 'hers' ? 'her own reading' : e.status)), h('div', { class: 'greek', style: { fontSize: '18px', margin: '4px 0' } }, (e.parts || []).map(p => `${p.part} (${p.meaning})`).join(' + ')), h('div', { style: { fontSize: '14px' } }, e.reading))));
  if (c.links.length) inner.append(h('div', null, h('div', { class: 'eyebrow', style: { marginBottom: '6px' } }, 'She connects it to'),
    h('ul', { class: 'links' }, c.links.slice(0, 8).map(l => h('li', null, h('button', { onclick: () => graph.select(l.to, true) }, C[l.to].label), l.why ? h('div', { class: 'muted', style: { fontSize: '13px' } }, l.why) : '')))));
  if (c.talks.length) inner.append(h('div', null, h('div', { class: 'eyebrow', style: { marginBottom: '4px' } }, 'Where she says it'),
    c.talks.slice(0, 7).map(t => h('div', { class: 'talkrow' }, h('a', { href: ytLink(t.id, t.t), target: '_blank', rel: 'noopener' }, T[t.id] && T[t.id].kind === 'text' ? 'read' : (t.t || 'open')), h('div', null, h('div', null, t.note), h('div', { class: 'muted', style: { fontSize: '12px' } }, clip(talkName(t.id), 70)))))));
  const known = !!P.known[id];
  inner.append(h('div', { class: 'btnrow' },
    h('button', { class: 'btn' + (known ? ' ghost' : ' gold'), onclick: () => { if (P.known[id]) delete P.known[id]; else { P.known[id] = today(); award(2, 'star claimed'); } save(); refreshKnown(); openConcept(id); } }, known ? '★ I know this one' : '☆ Mark as known'),
    h('button', { class: 'btn ghost', onclick: () => { location.hash = '#play'; startActivity('quiz', { concept: id }); } }, 'Quiz me on it'),
    sample ? h('button', { class: 'btn ghost', onclick: () => { location.hash = '#play'; startActivity('spar', { concept: id }); } }, 'Spar on it') : ''));
  drawer.innerHTML = ''; drawer.append(inner); drawer.classList.add('open'); drawer.scrollTop = 0;
}

/* ---------------- activities ---------------- */
const termPool = D.concepts.filter(c => c.greek && c.take);
const ACTS = [
  { id: 'cards', sec: 'remember', glyph: 'Λ', name: 'Logos cards', desc: 'Spaced-repetition flashcards: the Greek word on the front, her meaning on the back.', count: () => termPool.length + ' cards' },
  { id: 'match', sec: 'remember', glyph: '⇄', name: 'Match race', desc: 'Pair six Greek words with their meanings against the clock.', count: () => 'best ' + (P.best.match ? P.best.match + 's' : '-') },
  { id: 'quiz', sec: 'remember', glyph: 'Δ', name: 'Oracle', desc: 'Ten questions drawn from what she actually says, with the talk to check.', count: () => D.quiz.length + ' questions' },
  { id: 'tf', sec: 'remember', glyph: 'ϟ', name: 'Lightning', desc: 'True or false, sixty seconds, streaks multiply.', count: () => 'best ' + (P.best.tf || 0) },
  { id: 'ladder', sec: 'understand', glyph: '≡', name: 'Ladders', desc: 'Put her stages in order: the cave ascent, the rungs of eros, the steps of initiation.', count: () => D.sequences.length + ' ladders' },
  { id: 'myth', sec: 'understand', glyph: 'Μ', name: 'Myth decoder', desc: 'A story unfolds beat by beat. Choose how she reads each moment.', count: () => D.myths.length + ' myths' },
  { id: 'forge', sec: 'understand', glyph: 'Ρ', name: 'Root forge', desc: 'Build Greek words from their roots, then see what she draws out of them.', count: () => D.etymologies.length + ' words' },
  { id: 'fork', sec: 'understand', glyph: 'Υ', name: 'The fork', desc: 'The letter of Pythagoras: two paths. Which side of her distinction is this?', count: () => D.distinctions.length + ' pairs' },
  { id: 'threads', sec: 'own', glyph: 'Ξ', name: 'Threads', desc: 'Your world, her ideas. Which of her stars does each of your hooks tie to?', count: () => D.bridges.length + ' threads' },
  { id: 'spar', sec: 'own', glyph: 'Σ', name: 'Socratic sparring', desc: 'Claude questions you, one question at a time, on an idea of hers until it is truly yours.', count: () => 'with Claude', claude: true },
  { id: 'teach', sec: 'own', glyph: 'Ω', name: 'Teach it back', desc: 'Explain an idea in your own words. Claude checks it against her teaching.', count: () => 'with Claude', claude: true },
  { id: 'askesis', sec: 'own', glyph: 'Α', name: 'Askesis', desc: 'One practice from her talks to live today, and one of her questions to carry.', count: () => D.practices.length + ' practices' }
];
function renderPlay(){
  ['remember', 'understand', 'own'].forEach(sec => {
    const g = $('#g-' + sec); if (!g) return; g.innerHTML = '';
    ACTS.filter(a => a.sec === sec).forEach(a => {
      const off = a.claude && !sample;
      g.append(h('button', { class: 'act', onclick: () => off ? toast('Open this page in the Claude app to play with Claude') : startActivity(a.id), 'aria-disabled': off ? 'true' : null, style: off ? { opacity: .55 } : null },
        a.claude ? h('span', { class: 'tag' }, 'Claude') : '',
        h('span', { class: 'glyph' }, a.glyph), h('h3', null, a.name), h('p', null, a.desc),
        h('span', { class: 'meta' }, h('span', null, a.count()), P.done[a.id] ? h('span', null, 'played ' + P.done[a.id] + '×') : '')));
    });
  });
  const due = termPool.filter(c => { const s = P.srs[c.id]; return !s || s.due <= today(); }).length;
  const t = $('#play-today'); t.innerHTML = '';
  t.append(h('div', { class: 'card', style: { display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' } },
    h('div', null, h('div', { class: 'eyebrow' }, 'Today'), h('div', { style: { fontSize: '16px', marginTop: '2px' } }, `${due} cards due · rung ${rungIdx() + 1} of 7, ${RUNGS[rungIdx()][1]}`)),
    h('div', { class: 'btnrow' }, h('button', { class: 'btn gold', onclick: () => startActivity('cards') }, 'Review cards'), h('button', { class: 'btn ghost', onclick: () => startActivity(pick(['ladder', 'myth', 'forge', 'fork', 'quiz', 'threads'], 1)[0]) }, 'Surprise me'))));
}

const arena = $('#arena');
function openArena(title, sub){
  arena.hidden = false; document.body.style.overflow = 'hidden'; arena.innerHTML = '';
  const bar = h('div', { class: 'progress' }, h('i', { style: { width: '0%' } }));
  const score = h('span', { class: 'score' });
  const stage = h('div', { class: 'stage' });
  arena.append(h('div', { class: 'arena-in' },
    h('div', { class: 'arena-top' }, h('div', { style: { marginRight: 'auto' } }, h('div', { class: 'eyebrow' }, sub || 'Play'), h('h2', null, title)), score, h('button', { class: 'btn ghost', onclick: closeArena }, 'Close')),
    bar, stage));
  arena.scrollTop = 0;
  return { stage, setProg: f => bar.firstChild.style.width = Math.round(f * 100) + '%', setScore: s => score.textContent = s };
}
let arenaCleanup = null;
function closeArena(){ if (arenaCleanup){ arenaCleanup(); arenaCleanup = null; } arena.hidden = true; document.body.style.overflow = ''; renderPlay(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape'){ if (!$('.bookstage')?.hidden && $('.bookstage')) closeBook(); else if (!arena.hidden) closeArena(); else closeDrawer(); } });
function finish(A, id, msg, extra){
  P.done[id] = (P.done[id] || 0) + 1; save();
  A.setProg(1);
  A.stage.innerHTML = '';
  A.stage.append(h('div', { class: 'big-gk' }, 'τέλος'), h('p', { style: { textAlign: 'center', fontSize: '17px', margin: 0 } }, msg), extra || '',
    h('div', { class: 'btnrow', style: { justifyContent: 'center' } }, h('button', { class: 'btn gold', onclick: () => startActivity(id) }, 'Play again'), h('button', { class: 'btn ghost', onclick: closeArena }, 'Back to Play')));
}
function talkRef(id, t){ return T[id] ? h('small', null, 'From: ', h('a', { href: ytLink(id, t), target: '_blank', rel: 'noopener' }, clip(talkName(id), 60) + (t ? ' · ' + t : ''))) : ''; }
function mcq(stage, prompt, right, wrongs, onDone, explainEl){
  const opts = shuffle([right, ...wrongs]);
  const box = h('div', { class: 'opts' });
  opts.forEach(o => box.append(h('button', { class: 'opt', onclick: ev => {
    $$('.opt', box).forEach(b => { b.disabled = true; if (b.textContent === right) b.classList.add('right'); });
    const ok = o === right; if (!ok) ev.currentTarget.classList.add('wrong');
    if (explainEl) stage.append(explainEl);
    stage.append(h('div', { class: 'btnrow' }, h('button', { class: 'btn', onclick: () => onDone(ok) }, 'Next')));
    onDone.answered && onDone.answered(ok);
  } }, o)));
  stage.append(typeof prompt === 'string' ? h('div', { class: 'prompt' }, prompt) : prompt, box);
}

function startActivity(id, opt = {}){
  const a = ACTS.find(x => x.id === id);
  ({ cards: actCards, match: actMatch, quiz: actQuiz, tf: actTF, ladder: actLadder, myth: actMyth, forge: actForge, fork: actFork, threads: actThreads, spar: actSpar, teach: actTeach, askesis: actAskesis })[id](openArena(a.name, a.sec === 'remember' ? 'Remember' : a.sec === 'understand' ? 'Understand' : 'Make it yours'), opt);
}

/* Logos cards (Leitner) */
const INTERVALS = [0, 1, 3, 7, 16, 35];
function addDays(n){ const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function actCards(A){
  let due = termPool.filter(c => { const s = P.srs[c.id]; return !s || s.due <= today(); });
  due = due.sort((x, y) => (P.srs[x.id]?.box || 0) - (P.srs[y.id]?.box || 0) || y.freq - x.freq);
  const deck = (due.length ? due : pick(termPool, 10)).slice(0, 12);
  let i = 0, good = 0;
  function show(){
    if (i >= deck.length) return finish(A, 'cards', `${good} of ${deck.length} remembered. Cards you missed come back sooner.`);
    A.setProg(i / deck.length); A.setScore(`${i + 1} / ${deck.length}`);
    const c = deck[i]; const box = P.srs[c.id]?.box || 0;
    const card = h('div', { class: 'flip', tabindex: 0, role: 'button', 'aria-label': 'Flip card' },
      h('div', { class: 'flip-in' },
        h('div', { class: 'face' }, h('div', { class: 'eyebrow' }, 'Box ' + (box + 1) + ' · tap to turn'), h('div', { class: 'big-gk' }, c.greek), h('div', { class: 'tr greek', style: { color: 'var(--muted)', fontStyle: 'italic' } }, c.translit || '')),
        h('div', { class: 'face back' }, h('div', { class: 'eyebrow' }, GROUP[c.group]?.label), h('h3', { style: { fontSize: '26px' } }, c.label), h('p', { style: { margin: 0, fontSize: '15px' } }, clip(c.take, 420)))));
    const grade = h('div', { class: 'btnrow', style: { justifyContent: 'center', visibility: 'hidden' } },
      h('button', { class: 'btn ghost', onclick: () => rate(0) }, 'Again'), h('button', { class: 'btn ghost', onclick: () => rate(1) }, 'Hazy'), h('button', { class: 'btn gold', onclick: () => rate(2) }, 'Got it'));
    const turn = () => { card.classList.toggle('on'); grade.style.visibility = 'visible'; };
    card.addEventListener('click', turn); card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); turn(); } });
    function rate(r){
      const b = r === 0 ? 0 : r === 1 ? Math.max(0, box) : Math.min(5, box + 1);
      P.srs[c.id] = { box: b, due: addDays(INTERVALS[b]) };
      if (r === 2){ good++; award(5, c.label); } else save();
      i++; show();
    }
    A.stage.innerHTML = ''; A.stage.append(card, grade);
  }
  show();
}

/* Match race */
function actMatch(A){
  const set = pick(termPool.filter(c => c.label.length < 34), 6);
  const left = shuffle(set), right = shuffle(set); let sel = null, done = 0, misses = 0; const t0 = Date.now();
  const timer = h('div', { class: 'timer' }, '0.0s');
  const iv = setInterval(() => timer.textContent = ((Date.now() - t0) / 1000).toFixed(1) + 's', 100); arenaCleanup = () => clearInterval(iv);
  const L = h('div', { class: 'col' }), R = h('div', { class: 'col' });
  left.forEach(c => L.append(h('button', { class: 'tile greek', style: { fontSize: '20px' }, 'data-id': c.id, onclick: ev => { $$('.tile', L).forEach(x => x.classList.remove('sel')); ev.currentTarget.classList.add('sel'); sel = c.id; } }, c.greek)));
  right.forEach(c => R.append(h('button', { class: 'tile', 'data-id': c.id, onclick: ev => {
    if (!sel) return toast('Pick a Greek word first');
    const t = ev.currentTarget;
    if (sel === c.id){ t.classList.add('done'); $(`[data-id="${c.id}"]`, L).classList.add('done'); sel = null; done++;
      A.setProg(done / 6);
      if (done === 6){ clearInterval(iv); const s = (Date.now() - t0) / 1000; const best = P.best.match && P.best.match < s ? P.best.match : +s.toFixed(1); P.best.match = best;
        award(20 + (s < 30 ? 10 : 0) - Math.min(10, misses * 2), 'matched'); finish(A, 'match', `All six in ${s.toFixed(1)} seconds with ${misses} miss${misses === 1 ? '' : 'es'}. Your best: ${best}s.`); }
    } else { misses++; t.classList.remove('no'); void t.offsetWidth; t.classList.add('no'); }
  } }, c.label)));
  A.setScore('6 pairs');
  A.stage.append(h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, h('div', { class: 'prompt' }, 'Tap a Greek word, then its meaning.'), timer), h('div', { class: 'match' }, L, R));
}

/* Oracle quiz */
function actQuiz(A, opt){
  let pool = D.quiz.slice();
  if (opt.concept){ const c = C[opt.concept]; const k = [c.label, c.greek, c.id].filter(Boolean).map(s => s.toLowerCase());
    const rel = pool.filter(q => k.some(w => (q.q + ' ' + q.a + ' ' + (q.explain || '')).toLowerCase().includes(w)));
    if (rel.length >= 3) pool = rel; }
  const qs = pick(pool, Math.min(10, pool.length)); let i = 0, right = 0;
  function show(){
    if (i >= qs.length) return finish(A, 'quiz', `${right} of ${qs.length}. ${right >= qs.length * 0.8 ? 'The oracle approves.' : 'Know thyself, then try again.'}`);
    A.setProg(i / qs.length); A.setScore(`${right} ✓ · ${i + 1}/${qs.length}`);
    const q = qs[i]; A.stage.innerHTML = '';
    const ex = h('div', { class: 'explain' }, q.explain || '', talkRef(q.talk, q.t));
    const done = ok => { i++; show(); }; done.answered = ok => { if (ok){ right++; award(8, 'oracle'); } };
    mcq(A.stage, q.q, q.a, (q.wrong || []).slice(0, 3), done, ex);
  }
  show();
}

/* Lightning true/false */
function actTF(A){
  const items = shuffle(D.truefalse); let i = 0, score = 0, streakN = 0, left = 60;
  const timer = h('div', { class: 'timer' }, '60');
  const iv = setInterval(() => { left--; timer.textContent = left; A.setProg((60 - left) / 60); if (left <= 0) end(); }, 1000); arenaCleanup = () => clearInterval(iv);
  function end(){ clearInterval(iv); const best = Math.max(P.best.tf || 0, score); P.best.tf = best; award(Math.round(score / 2), 'lightning'); finish(A, 'tf', `Score ${score}. Best ${best}.`); }
  function show(){
    if (i >= items.length) return end();
    const it = items[i]; A.setScore(`score ${score} · streak ${streakN}`);
    A.stage.innerHTML = '';
    const fb = h('div', { class: 'explain', style: { minHeight: '2.4em' } });
    const go = v => { const ok = v === it.true; if (ok){ streakN++; score += Math.min(5, streakN); } else streakN = 0;
      fb.innerHTML = `<b style="color:var(--${ok ? 'good' : 'bad'})">${ok ? 'Yes' : 'No'}.</b> ${esc(it.explain || '')}`; i++; setTimeout(show, ok ? 900 : 1900); $$('.fork .opt', A.stage).forEach(b => b.disabled = true); };
    A.stage.append(h('div', { style: { display: 'flex', justifyContent: 'space-between' } }, h('div', { class: 'eyebrow' }, 'True or false'), timer), h('div', { class: 'prompt' }, it.s),
      h('div', { class: 'fork' }, h('button', { class: 'opt', onclick: () => go(true) }, h('span', { class: 'greek' }, 'ἀληθές'), 'True'), h('button', { class: 'opt', onclick: () => go(false) }, h('span', { class: 'greek' }, 'ψευδές'), 'False')), fb);
  }
  show();
}

/* Ladders */
function actLadder(A){
  const seqs = pick(D.sequences.filter(s => s.steps && s.steps.length >= 3 && s.steps.length <= 9), 4); let si = 0, total = 0;
  function show(){
    if (si >= seqs.length) return finish(A, 'ladder', `${total} of ${seqs.length} ladders climbed without a slip.`);
    A.setProg(si / seqs.length); A.setScore(`ladder ${si + 1}/${seqs.length}`);
    const s = seqs[si]; const order = []; const tiles = shuffle(s.steps.map((t, k) => ({ t, k })));
    A.stage.innerHTML = '';
    const built = h('div', { class: 'ladder' }), pool = h('div', { class: 'tiles' });
    const redraw = () => { built.innerHTML = ''; order.forEach((o, n) => built.append(h('button', { class: 'tile', onclick: () => { order.splice(n, 1); redraw(); } }, h('b', null, n + 1), o.t))); $$('.tile', pool).forEach(b => b.classList.toggle('done', order.some(o => o.k == b.dataset.k))); check.disabled = order.length !== tiles.length; };
    tiles.forEach(o => pool.append(h('button', { class: 'tile', 'data-k': o.k, onclick: () => { order.push(o); redraw(); } }, o.t)));
    const check = h('button', { class: 'btn gold', disabled: true, onclick: () => {
      const ok = order.every((o, n) => o.k === n);
      built.innerHTML = ''; s.steps.forEach((t, n) => built.append(h('div', { class: 'tile ' + (order[n] && order[n].k === n ? 'ok' : 'no') }, h('b', null, n + 1), t)));
      pool.remove(); check.remove();
      if (ok){ total++; award(20, 'ladder'); } else award(5, 'ladder attempt');
      A.stage.append(h('div', { class: 'explain' }, s.note || '', talkRef(s.talk, s.t)), h('div', { class: 'btnrow' }, h('button', { class: 'btn', onclick: () => { si++; show(); } }, 'Next ladder')));
    } }, 'Check order');
    A.stage.append(h('div', { class: 'eyebrow' }, 'Tap the steps in order, lowest first'), h('h3', { style: { fontSize: '24px' } }, s.title), built, pool, h('div', { class: 'btnrow' }, check));
    redraw();
  }
  show();
}

/* Myth decoder */
function actMyth(A){
  const myths = D.myths.filter(m => m.beats && m.beats.length >= 2);
  const m = pick(myths, 1)[0]; const allReadings = D.myths.flatMap(x => (x.beats || []).map(b => b.reading)).filter(Boolean);
  let i = 0, right = 0;
  function show(){
    if (i >= m.beats.length) return finish(A, 'myth', `${right} of ${m.beats.length} readings matched hers.`, h('div', { class: 'explain' }, talkRef(m.talk)));
    A.setProg(i / m.beats.length); A.setScore(`${right} ✓`);
    const b = m.beats[i]; A.stage.innerHTML = '';
    const wr = pick(allReadings.filter(r => r !== b.reading), 2).map(r => clip(r, 220));
    const done = () => { i++; show(); }; done.answered = ok => { if (ok){ right++; award(8, 'decoded'); } };
    mcq(A.stage, h('div', null, h('div', { class: 'eyebrow' }, m.title + ' · beat ' + (i + 1) + ' of ' + m.beats.length), h('div', { class: 'prompt greek', style: { fontSize: '21px', marginTop: '6px' } }, b.beat), h('div', { class: 'muted', style: { marginTop: '8px' } }, 'How does she read this moment?')), clip(b.reading, 220), wr, done);
  }
  show();
}

/* Root forge */
function actForge(A){
  const items = pick(D.etymologies.filter(e => e.parts && e.parts.length >= 2 && e.parts.length <= 4), 6);
  const allParts = D.etymologies.flatMap(e => e.parts || []);
  let i = 0, right = 0;
  function show(){
    if (i >= items.length) return finish(A, 'forge', `${right} of ${items.length} words forged first time.`);
    A.setProg(i / items.length); A.setScore(`${right} ✓`);
    const e = items[i]; const need = e.parts.map(p => p.part);
    const decoys = pick(allParts.filter(p => !need.includes(p.part)), 3);
    const tiles = shuffle([...e.parts.map(p => ({ ...p, real: true })), ...decoys]);
    const chosen = []; A.stage.innerHTML = '';
    const slot = h('div', { class: 'tiles', style: { minHeight: '46px', borderBottom: '1px dashed var(--line)', paddingBottom: '8px' } });
    const pool = h('div', { class: 'tiles' }); let miss = false;
    tiles.forEach(p => pool.append(h('button', { class: 'tile', onclick: ev => {
      const t = ev.currentTarget;
      if (need.includes(p.part) && !chosen.some(x => x.part === p.part)){ chosen.push(p); t.classList.add('done'); slot.append(h('span', { class: 'tile ok' }, h('span', { class: 'greek', style: { fontSize: '18px' } }, p.part), h('small', { class: 'muted' }, ' ' + p.meaning)));
        if (chosen.length === need.length) reveal(); }
      else { miss = true; t.classList.remove('no'); void t.offsetWidth; t.classList.add('no'); }
    } }, h('span', { class: 'greek', style: { fontSize: '18px' } }, p.part), h('small', { class: 'muted' }, ' ' + p.meaning))));
    function reveal(){
      pool.remove(); if (!miss){ right++; award(10, 'forged'); } else award(4, 'forged');
      const badge = e.status === 'hers' ? 'her own reading' : e.status === 'disputed' ? 'disputed by scholars' : 'standard etymology';
      A.stage.append(h('div', { class: 'explain' }, h('div', { class: 'eyebrow', style: { color: e.status === 'standard' ? 'var(--good)' : 'var(--gold)' } }, badge), e.reading, talkRef(e.talk)), h('div', { class: 'btnrow' }, h('button', { class: 'btn', onclick: () => { i++; show(); } }, 'Next word')));
    }
    A.stage.append(h('div', { class: 'eyebrow' }, 'Pick the roots it is built from'), h('div', { class: 'big-gk' }, e.word), h('div', { class: 'tr greek', style: { textAlign: 'center', color: 'var(--muted)', fontStyle: 'italic' } }, e.translit || ''), slot, pool);
  }
  show();
}

/* The fork (distinctions) */
function actFork(A){
  const ds = pick(D.distinctions.filter(d => d.a && d.b && d.a_gloss && d.b_gloss), 8); let i = 0, right = 0;
  function show(){
    if (i >= ds.length) return finish(A, 'fork', `${right} of ${ds.length} forks taken well.`);
    A.setProg(i / ds.length); A.setScore(`${right} ✓`);
    const d = ds[i]; const side = Math.random() < 0.5 ? 'a' : 'b'; const gloss = side === 'a' ? d.a_gloss : d.b_gloss;
    A.stage.innerHTML = '';
    const fb = h('div');
    const go = (v, el) => { $$('.fork .opt', A.stage).forEach(b => b.disabled = true); const ok = v === side; el.classList.add(ok ? 'right' : 'wrong'); if (ok){ right++; award(6, 'fork'); }
      fb.append(h('div', { class: 'explain' }, h('b', null, d.a), ' ', d.a_gloss, ' · ', h('b', null, d.b), ' ', d.b_gloss, h('div', { style: { marginTop: '6px' } }, d.point || ''), talkRef(d.talk)), h('div', { class: 'btnrow' }, h('button', { class: 'btn', onclick: () => { i++; show(); } }, 'Next fork'))); };
    A.stage.append(h('div', { class: 'eyebrow' }, 'Which side does this belong to?'), h('div', { class: 'prompt', style: { textAlign: 'center', fontSize: '20px' } }, '“' + gloss + '”'),
      h('div', { class: 'fork' }, h('button', { class: 'opt', onclick: ev => go('a', ev.currentTarget) }, h('span', { class: 'greek' }, d.a)), h('button', { class: 'opt', onclick: ev => go('b', ev.currentTarget) }, h('span', { class: 'greek' }, d.b))), fb);
  }
  show();
}

/* Threads (bridges) */
function actThreads(A){
  const items = shuffle(D.bridges).slice(0, 8); let i = 0, right = 0;
  function show(){
    if (i >= items.length) return finish(A, 'threads', `${right} of ${items.length} threads tied. These are your hooks: use them when you recall her ideas.`);
    A.setProg(i / items.length); A.setScore(`${right} ✓`);
    const b = items[i]; const c = C[b.concept]; A.stage.innerHTML = '';
    const lbl = x => (x.greek ? x.greek + '  ·  ' : '') + x.label;
    const wrong = pick(D.concepts.filter(x => x.id !== c.id && x.group !== 'thinkers' && x.weight >= 3), 3).map(lbl);
    const hook = b.hook.replace(new RegExp(c.label, 'ig'), '▢▢▢');
    const done = () => { i++; show(); }; done.answered = ok => { if (ok){ right++; award(6, 'thread'); } };
    mcq(A.stage, h('div', null, h('div', { class: 'eyebrow', style: { color: 'var(--gold)' } }, 'Your world · ' + b.domain), h('div', { class: 'prompt', style: { marginTop: '6px' } }, hook), h('div', { class: 'muted', style: { marginTop: '8px' } }, 'Which of her stars does this tie to?')), lbl(c), wrong, done,
      h('div', { class: 'explain' }, clip(c.take, 260), h('small', null, h('a', { href: '#map', onclick: () => setTimeout(() => graph.select(c.id, true), 50) }, 'Open this star on the map'))));
  }
  show();
}

/* Claude: Socratic sparring */
function conceptPicker(onPick, preset){
  const sel = h('select', { id: 'concept-pick' }, D.concepts.filter(c => c.take).sort((a, b) => b.freq - a.freq).map(c => h('option', { value: c.id, selected: c.id === preset ? true : null }, (c.greek ? c.greek + ' · ' : '') + c.label)));
  return h('div', { class: 'btnrow', style: { alignItems: 'center' } }, h('label', { for: 'concept-pick', class: 'eyebrow' }, 'Idea'), sel, h('button', { class: 'btn gold', onclick: () => onPick(sel.value) }, 'Begin'), h('button', { class: 'btn ghost', onclick: () => { sel.value = pick(D.concepts.filter(c => c.take && c.weight >= 3), 1)[0].id; } }, 'Random'));
}
function brief(c){
  const links = c.links.slice(0, 6).map(l => `- ${C[l.to].label}: ${l.why}`).join('\n');
  const br = (bridgesBy[c.id] || []).map(b => `- ${b.domain}: ${b.hook}`).join('\n');
  return `IDEA: ${c.label}${c.greek ? ' (' + c.greek + ')' : ''}\nHER TEACHING: ${c.take}\n${(c.more || []).join('\n')}\nLINKS SHE MAKES:\n${links}\nLEARNER'S OWN HOOKS (optional to use):\n${br || '- none'}`;
}
function claudeErr(e){ return e && e.code === 'rate_limited' ? 'Claude needs a short pause. Try again in a minute.' : e && e.code === 'not_granted' ? 'Claude is not available on this page right now.' : 'That did not go through. Try again.'; }
function actSpar(A, opt){
  if (!sample){ A.stage.append(h('p', null, 'This activity needs the Claude app.')); return; }
  A.setScore('5 rounds');
  A.stage.append(h('p', { class: 'muted', style: { margin: 0 } }, 'Claude plays a Socratic questioner: one question at a time, pushing on your answers until the idea holds. Five rounds.'), conceptPicker(go, opt.concept));
  function go(cid){
    const c = C[cid]; const RULES = `You are a Socratic sparring partner helping the learner study the teaching of the Greek philosopher Dr Athena Potari. You are not Athena Potari and never claim to be. Ground everything in the material below, which summarises what she teaches; do not add generic doctrine that contradicts it.\n\n${brief(c)}\n\nMethod: ask ONE short, pointed question at a time (under 60 words in total). Start from everyday experience, then lead toward her view. When the learner answers, briefly name what is right or shaky (one sentence), then ask the next question. If the learner is stuck, offer an image or one of her hooks. Plain text, no lists, no em dashes. After the fifth answer, give a closing reflection of at most 90 words: what she now sees, and one question to carry for the day.`;
    const turns = [{ role: 'user', content: RULES + '\n\nBegin with your first question.' }];
    const chat = h('div', { class: 'chat' }); const ta = h('textarea', { id: 'spar-answer', placeholder: 'Your answer…', 'aria-label': 'Your answer' });
    const send = h('button', { class: 'btn gold' }, 'Answer'); let round = 0; let ctl = null;
    arenaCleanup = () => ctl && ctl.abort();
    A.stage.innerHTML = ''; A.stage.append(h('div', { class: 'eyebrow' }, 'Sparring on ' + c.label), chat, ta, h('div', { class: 'btnrow' }, send));
    async function ask(){
      const bubble = h('div', { class: 'msg q' }, '…'); chat.append(bubble); send.disabled = true;
      ctl = new AbortController();
      try { const { text } = await sample(turns, { cache: false, signal: ctl.signal, onText: ({ text }) => { bubble.textContent = text; } });
        bubble.textContent = text; turns.push({ role: 'assistant', content: text });
        if (round >= 5){ ta.remove(); send.remove(); award(30, 'sparred'); P.done.spar = (P.done.spar || 0) + 1; save(); A.setProg(1); A.stage.append(h('div', { class: 'btnrow' }, h('button', { class: 'btn', onclick: () => startActivity('spar') }, 'Spar again'), h('button', { class: 'btn ghost', onclick: closeArena }, 'Done'))); }
        else { send.disabled = false; ta.focus(); }
      } catch (e){ if (e && e.code === 'cancelled') return; bubble.textContent = claudeErr(e); send.disabled = false; }
    }
    send.addEventListener('click', () => { const v = ta.value.trim(); if (!v) return; chat.append(h('div', { class: 'msg a' }, v)); turns.push({ role: 'user', content: v }); ta.value = ''; round++; A.setProg(round / 5); A.setScore(`round ${round}/5`); ask(); });
    ask();
  }
}

/* Claude: teach it back */
function actTeach(A, opt){
  if (!sample){ A.stage.append(h('p', null, 'This activity needs the Claude app.')); return; }
  A.stage.append(h('p', { class: 'muted', style: { margin: 0 } }, 'Pick an idea, then explain it as if to a friend at the kafeneio. Claude compares your version with her teaching.'), conceptPicker(go, opt.concept));
  function go(cid){
    const c = C[cid]; A.stage.innerHTML = '';
    const ta = h('textarea', { id: 'teach-text', placeholder: `Explain ${c.label} in your own words…`, 'aria-label': 'Your explanation', style: { minHeight: '170px' } });
    const btn = h('button', { class: 'btn gold' }, 'Check my explanation'); const out = h('div');
    A.stage.append(h('div', { class: 'eyebrow' }, 'Teach it back'), h('h3', { style: { fontSize: '28px' } }, (c.greek ? c.greek + ' · ' : '') + c.label), ta, h('div', { class: 'btnrow' }, btn), out);
    btn.addEventListener('click', async () => {
      const v = ta.value.trim(); if (v.length < 40) return toast('Write a little more first');
      btn.disabled = true; out.innerHTML = '<p class="muted">Reading your explanation…</p>';
      try {
        const r = await sample.json(`Compare a learner's explanation with what the Greek philosopher Dr Athena Potari teaches about this idea. Be warm and exact. Reply with JSON only: {"score":1-5,"got":["up to 3 things she got right"],"missed":["up to 3 things from the teaching she left out"],"misread":["anything that contradicts the teaching, or empty"],"nudge":"one sentence to improve, under 30 words"}. No em dashes.\n\nTEACHING:\n${brief(c)}\n\nLEARNER'S EXPLANATION:\n${v}`);
        const s = Math.max(1, Math.min(5, +r.score || 1));
        award(s * 8, 'taught back'); P.done.teach = (P.done.teach || 0) + 1; save();
        out.innerHTML = '';
        const list = (t, a, col) => a && a.length ? h('div', null, h('div', { class: 'eyebrow', style: { color: col } }, t), h('ul', { style: { margin: '4px 0 0', paddingLeft: '18px' } }, a.map(x => h('li', null, x)))) : '';
        out.append(h('div', { class: 'card', style: { display: 'flex', flexDirection: 'column', gap: '10px' } }, h('div', { class: 'big-gk', style: { fontSize: '44px' } }, '★'.repeat(s) + '☆'.repeat(5 - s)), list('You got', r.got, 'var(--good)'), list('Missing', r.missed, 'var(--gold)'), list('Check this', r.misread, 'var(--bad)'), r.nudge ? h('div', { class: 'explain' }, r.nudge) : ''),
          h('div', { class: 'btnrow' }, h('button', { class: 'btn', onclick: () => { btn.disabled = false; out.innerHTML = ''; ta.focus(); } }, 'Revise and resubmit'), h('button', { class: 'btn ghost', onclick: () => startActivity('teach') }, 'Another idea')));
      } catch (e){ out.innerHTML = ''; out.append(h('p', null, claudeErr(e))); btn.disabled = false; }
    });
  }
}

/* Askesis */
function actAskesis(A){
  const k = today(); const seed = [...k].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  const p = D.practices[seed % D.practices.length]; const q = D.questions[(seed * 7) % D.questions.length];
  const doneToday = P.best.askesis === k;
  A.setScore(k);
  A.stage.append(h('div', { class: 'eyebrow' }, 'Practice for today'), h('h3', { style: { fontSize: '26px' } }, p.title),
    h('ol', { style: { margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px' } }, (p.steps || []).map(s => h('li', null, s))),
    p.why ? h('div', { class: 'explain' }, p.why, talkRef(p.talk)) : '',
    q ? h('div', { class: 'bridge' }, h('div', { class: 'eyebrow' }, 'A question of hers to carry'), h('p', { class: 'greek', style: { fontSize: '19px', margin: '6px 0 0' } }, q.q)) : '',
    h('div', { class: 'btnrow' }, h('button', { class: 'btn gold', disabled: doneToday ? true : null, onclick: ev => { P.best.askesis = k; award(25, 'practice lived'); ev.currentTarget.disabled = true; ev.currentTarget.textContent = 'Done for today'; P.done.askesis = (P.done.askesis || 0) + 1; save(); } }, doneToday ? 'Done for today' : 'I did it today'),
      h('button', { class: 'btn ghost', onclick: () => { A.stage.innerHTML = ''; const all = h('div', { style: { display: 'grid', gap: '10px' } }, D.practices.map(x => h('details', { class: 'card' }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, x.title), h('ol', null, (x.steps || []).map(s => h('li', null, s))), x.why ? h('p', { class: 'muted', style: { margin: 0 } }, x.why) : ''))); A.stage.append(h('div', { class: 'eyebrow' }, 'All practices'), all); } }, 'See all practices')));
}

/* ---------------- bookshelf ---------------- */
const PIG = [['#7b2d26', '#f1e4cf'], ['#1f3b63', '#efe6d2'], ['#2f5d50', '#f2ead6'], ['#8c6a1f', '#1c160a'], ['#3e2b52', '#efe5d6'], ['#a3532c', '#f7eedd'], ['#22313a', '#e9dfc8'], ['#5b6b2f', '#f4ecd8'], ['#6d1f3f', '#f3e6d4'], ['#c9b58a', '#2a2214'], ['#1b4d57', '#efe7d4'], ['#4a3a2a', '#efe4cf']];
let bookEl = null;
function renderShelf(){
  const works = (D.library.works || []).slice().sort((a, b) => (b.weight || 0) - (a.weight || 0));
  const shelf = $('#shelf'); shelf.innerHTML = '';
  if (!works.length){ shelf.append(h('p', { class: 'muted', style: { alignSelf: 'center' } }, 'The bookshelf is being stocked.')); return; }
  const order = works.map((w, i) => ({ w, i })).sort((a, b) => (a.w.author || '').localeCompare(b.w.author || ''));
  order.forEach(({ w, i }) => {
    const [c, ci] = PIG[i % PIG.length]; const ht = 230 + (w.weight || 3) * 16 + ((i * 37) % 30);
    const b = h('button', { class: 'spine', style: { height: ht + 'px', width: (44 + ((w.excerpts || []).length * 6) + (i % 3) * 4) + 'px', '--c': c, '--ci': ci }, 'aria-label': `${w.title} by ${w.author}`, onclick: () => openBook(w, c, ci) },
      h('span', { class: 'top-ed' }), h('span', { class: 'sp' }, h('span', { class: 'a' }, w.author || ''), h('span', { class: 't' }, w.greek_title || w.title), h('span', { class: 'greek', style: { fontSize: '13px', opacity: .8 } }, '❦')));
    shelf.append(b);
  });
  const rp = $('#readpath'); rp.innerHTML = '';
  if ((D.library.reading_path || []).length){
    rp.append(h('span', null, 'A path to read them in:'));
    D.library.reading_path.forEach((id, k) => { const w = works.find(x => x.id === id); if (!w) return; const i = works.indexOf(w);
      rp.append(h('button', { class: 'chip', onclick: () => openBook(w, ...PIG[i % PIG.length]) }, h('span', { class: 'mono' }, k + 1), w.title)); });
  }
}
function openBook(w, c, ci){
  closeBook(true);
  const ex = (w.excerpts || []);
  let exI = 0;
  const pageBody = h('div');
  function renderPage(){
    pageBody.innerHTML = '';
    pageBody.append(h('div', { class: 'eyebrow' }, 'Why she reads it'), h('p', null, w.why_she_reads_it || ''));
    if (ex.length){
      const e = ex[exI];
      pageBody.append(h('div', { class: 'eyebrow', style: { marginTop: '14px' } }, `Passage ${exI + 1} of ${ex.length} · ${e.ref || ''}`), h('h3', null, e.label || ''));
      const exBox = h('div', { class: 'ex', style: { '--c': c } });
      if (e.translation) exBox.append(h('div', { class: 'e' }, e.translation));
      if (e.greek) exBox.append(h('details', { style: { marginTop: '8px' } }, h('summary', { style: { cursor: 'pointer', fontSize: '12px', color: '#7a6a49' } }, 'Original Greek'), h('div', { class: 'g' }, e.greek)));
      exBox.append(h('small', null, [e.translator, e.source_url ? h('a', { href: e.source_url, target: '_blank', rel: 'noopener' }, 'source') : ''].filter(Boolean).flatMap((x, i) => i ? [' · ', x] : [x])));
      if (e.translation || e.greek) pageBody.append(exBox);
      if (e.her_reading) pageBody.append(h('div', { class: 'reading' }, h('div', { class: 'eyebrow' }, 'Her reading'), h('div', null, e.her_reading), e.talk && T[e.talk] ? h('div', { style: { marginTop: '6px', fontSize: '12px' } }, h('a', { href: ytLink(e.talk, e.t), target: '_blank', rel: 'noopener' }, 'Hear her on it' + (e.t ? ' · ' + e.t : ''))) : ''));
      if (ex.length > 1) pageBody.append(h('div', { class: 'btnrow', style: { marginTop: '12px' } }, h('button', { class: 'btn ghost', style: { color: '#2a2416', borderColor: '#d8ccb0' }, onclick: () => { exI = (exI + ex.length - 1) % ex.length; renderPage(); } }, '‹ Previous'), h('button', { class: 'btn ghost', style: { color: '#2a2416', borderColor: '#d8ccb0' }, onclick: () => { exI = (exI + 1) % ex.length; renderPage(); } }, 'Next passage ›')));
    }
    const ids = conceptsFor(w);
    if (ids.length) pageBody.append(h('div', { class: 'eyebrow', style: { marginTop: '16px' } }, 'Threads into her ideas'), h('div', { class: 'chips', style: { marginTop: '6px' } }, ids.map(id => h('button', { class: 'chip', onclick: () => { closeBook(); location.hash = '#map'; setTimeout(() => graph.select(id, true), 120); } }, h('span', { class: 'dot', style: { background: gcol(C[id].group) } }), C[id].label))));
    const tks = [...new Set([...(w.talks || []), ...ex.map(e => e.talk)].filter(t => T[t]))];
    if (tks.length) pageBody.append(h('div', { class: 'eyebrow', style: { marginTop: '16px' } }, 'In her talks'), h('div', null, tks.map(t => h('div', { style: { fontSize: '13px', margin: '4px 0' } }, h('a', { href: ytLink(t), target: '_blank', rel: 'noopener' }, clip(talkName(t), 80))))));
  }
  renderPage();
  const stars = '★'.repeat(Math.round(w.weight || 3)) + '☆'.repeat(5 - Math.round(w.weight || 3));
  const book = h('div', { class: 'book3d closed', style: { '--c': c, '--ci': ci } },
    h('div', { class: 'page' }, pageBody),
    h('div', { class: 'spinebar' }),
    h('div', { class: 'cover' },
      h('div', { class: 'outside' }, h('div', { class: 'ca' }, w.author || ''), h('div', null, h('div', { class: 'ct' }, w.title), w.greek_title ? h('div', { class: 'cg' }, w.greek_title) : ''), h('div', { class: 'orn' }, (w.greek_title || w.title || 'Β')[0])),
      h('div', { class: 'inside' }, h('div', { class: 'eyebrow', style: { color: '#7a6a49' } }, w.author || ''), h('div', { class: 'ct' }, w.title), w.greek_title ? h('div', { class: 'greek', style: { fontSize: '20px', color: '#5a4b2c' } }, w.greek_title) : '',
        h('div', { style: { color: '#9a670f', letterSpacing: '.15em' } }, stars), h('div', { style: { fontSize: '12px', color: '#7a6a49' } }, 'How central it is to her teaching'),
        w.next_step ? h('div', { style: { marginTop: 'auto', fontSize: '14px' } }, h('div', { class: 'eyebrow', style: { color: '#7a6a49' } }, 'Start here'), w.next_step) : '')));
  bookEl = h('div', { class: 'bookstage', role: 'dialog', 'aria-label': w.title, onclick: ev => { if (ev.target === bookEl) closeBook(); } }, h('button', { class: 'btn closebook', onclick: () => closeBook() }, 'Close'), book);
  document.body.append(bookEl); document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => { book.className = 'book3d front'; setTimeout(() => { book.className = 'book3d open'; }, 750); }));
  P.done.book = (P.done.book || 0) + 1; save();
}
function closeBook(instant){ if (!bookEl) return; const el = bookEl; bookEl = null; document.body.style.overflow = ''; if (instant) return el.remove(); const b = $('.book3d', el); if (b) b.className = 'book3d closed'; el.style.transition = 'opacity .5s'; el.style.opacity = 0; setTimeout(() => el.remove(), 500); }
function conceptsFor(w){
  const txt = [w.title, w.author, w.why_she_reads_it, ...(w.excerpts || []).map(e => e.her_reading + ' ' + e.label)].join(' ').toLowerCase();
  const ids = new Set();
  const authorMap = { plato: 'plato', heraclitus: 'heraclitus', homer: 'homer', plotinus: 'plotinus', proclus: 'proclus', pythagoras: 'pythagoras', parmenides: 'parmenides', aristotle: 'aristotle', orpheus: 'orpheus', orphic: 'orpheus', empedocles: 'empedocles' };
  Object.entries(authorMap).forEach(([k, v]) => { if (txt.includes(k) && C[v]) ids.add(v); });
  D.concepts.forEach(c => { if (c.group === 'thinkers') return; const l = c.label.toLowerCase(); if (l.length > 3 && txt.includes(l)) ids.add(c.id); });
  return [...ids].sort((a, b) => C[b].freq - C[a].freq).slice(0, 10);
}

/* ---------------- talks ---------------- */
function renderTalks(){
  const ok = D.talks.filter(t => t.status === 'notes').length;
  $('#talks-sub').textContent = `${D.talks.length} long-form talks, interviews and podcasts, in Greek and English. ${ok === D.talks.length ? 'All are transcribed and feed this app.' : ok + ' are fully transcribed and feed this app; the rest are queued for transcription.'}`;
  const L = $('#talklist'); L.innerHTML = '';
  const mentions = {}; D.concepts.forEach(c => c.talks.forEach(t => (mentions[t.id] = mentions[t.id] || new Set()).add(c.id)));
  D.talks.slice().sort((a, b) => (a.status === 'notes' ? 0 : 1) - (b.status === 'notes' ? 0 : 1)).forEach(t => {
    const ids = [...(mentions[t.id] || [])].sort((a, b) => C[b].freq - C[a].freq).slice(0, 8);
    L.append(h('article', { class: 'talk' },
      h('div', { style: { minWidth: 0 } }, h('h3', { class: t.lang === 'el' ? 'greek' : '' }, t.title), t.en && t.lang === 'el' ? h('div', { class: 'sub' }, t.en.replace(/^#\s*/, '')) : '', h('div', { class: 'sub' }, t.channel),
        ids.length ? h('div', { class: 'chips', style: { marginTop: '8px' } }, ids.map(id => h('button', { class: 'chip', onclick: () => { location.hash = '#map'; setTimeout(() => graph.select(id, true), 120); } }, h('span', { class: 'dot', style: { background: gcol(C[id].group) } }), C[id].label))) : ''),
      h('div', { class: 'side' }, h('span', { class: 'status ' + t.status }, t.status === 'notes' ? 'in the app' : 'awaiting transcript'), h('span', { class: 'mono' }, t.dur + ' · ' + (t.lang === 'el' ? 'Greek' : 'English')), h('a', { href: ytLink(t.id), target: '_blank', rel: 'noopener' }, 'Watch'))));
  });
}

function renderWritings(){
  const ws = D.writings || []; const box = $('#writelist'); if (!box) return; box.innerHTML = '';
  $('#write-h').hidden = !ws.length;
  ws.forEach(w => box.append(h('article', { class: 'talk' },
    h('div', { style: { minWidth: 0 } }, h('h3', { class: w.lang === 'el' ? 'greek' : '' }, w.title), w.title_en && w.title_en !== w.title ? h('div', { class: 'sub' }, w.title_en) : '', h('div', { class: 'sub' }, [w.venue, w.year].filter(Boolean).join(' · ')),
      w.summary ? h('p', { style: { margin: '8px 0 0' } }, w.summary) : '',
      (w.key_ideas || []).length ? h('details', { style: { marginTop: '6px' } }, h('summary', { class: 'muted', style: { cursor: 'pointer', fontSize: '13px' } }, 'Key ideas'), h('ul', { style: { margin: '6px 0 0', paddingLeft: '18px' } }, w.key_ideas.map(k => h('li', null, k)))) : '',
      (w.concepts || []).filter(id => C[id]).length ? h('div', { class: 'chips', style: { marginTop: '8px' } }, w.concepts.filter(id => C[id]).slice(0, 8).map(id => h('button', { class: 'chip', onclick: () => { location.hash = '#map'; setTimeout(() => graph.select(id, true), 120); } }, h('span', { class: 'dot', style: { background: gcol(C[id].group) } }), C[id].label))) : ''),
    h('div', { class: 'side' }, h('span', { class: 'status notes' }, w.kind || 'text'), h('span', { class: 'mono' }, (w.lang || '').toUpperCase()), w.url ? h('a', { href: w.url, target: '_blank', rel: 'noopener' }, w.readable === false ? 'View' : 'Read') : ''))));
}

/* ---------------- me ---------------- */
function renderMe(){
  const ri = rungIdx(); const nxt = RUNGS[ri + 1];
  const st = $('#stats'); st.innerHTML = '';
  [[P.xp, 'experience'], [streak(), 'day streak'], [Object.keys(P.known).length + ' / ' + D.concepts.length, 'stars known'], [Object.values(P.srs).filter(s => s.box >= 3).length, 'cards in long memory']].forEach(([v, l]) => st.append(h('div', { class: 'stat' }, h('b', null, v), h('span', null, l))));
  const R = $('#rungs'); R.innerHTML = '';
  RUNGS.forEach((r, k) => R.append(h('div', { class: 'rung' + (k <= ri ? ' on' : '') }, h('span', { class: 'n' }, r[0] + ' ξ'), h('div', null, h('b', null, r[1]), h('div', { class: 'muted', style: { fontSize: '13px' } }, r[2])), k === ri && nxt ? h('span', { class: 'muted mono', style: { marginLeft: 'auto', fontSize: '12px' } }, (nxt[0] - P.xp) + ' to go') : '')));
  const B = $('#boxes'); B.innerHTML = '';
  const counts = [0, 0, 0, 0, 0, 0]; termPool.forEach(c => { const s = P.srs[c.id]; counts[s ? s.box : 0]++; });
  const mx = Math.max(...counts, 1);
  counts.forEach((n, k) => B.append(h('div', { style: { height: Math.max(3, n / mx * 100) + '%', opacity: .45 + k * .11 }, title: n + ' cards' }, h('span', null, (k === 0 ? 'new ' : 'box ' + k) + ' · ' + n))));
  const K = $('#knownlist'); K.innerHTML = '';
  const ks = Object.keys(P.known).filter(id => C[id]);
  if (!ks.length) K.append(h('span', { class: 'muted' }, 'Open a star on the map and claim it when you can explain it.'));
  ks.forEach(id => K.append(h('button', { class: 'chip', onclick: () => { location.hash = '#map'; setTimeout(() => graph.select(id, true), 120); } }, h('span', { class: 'dot', style: { background: gcol(C[id].group) } }), C[id].label)));
}
$('#reset-btn').addEventListener('click', () => {
  const area = $('#reset-area'); area.innerHTML = '';
  area.append(h('div', { class: 'card', style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' } }, h('span', null, 'Erase all experience, cards and stars?'),
    h('button', { class: 'btn', style: { background: 'var(--bad)' }, onclick: () => { P = { xp: 0, days: {}, srs: {}, known: {}, best: {}, done: {}, v: 1 }; save(); hud(); renderMe(); refreshKnown(); area.innerHTML = ''; area.append(h('span', { class: 'muted' }, 'Progress erased.')); } }, 'Erase'),
    h('button', { class: 'btn ghost', onclick: () => { area.innerHTML = ''; area.append($('#reset-btn') || h('button', { class: 'btn ghost', id: 'reset-btn' }, 'Reset my progress')); location.reload(); } }, 'Keep it')));
});

/* ---------------- boot ---------------- */
hud(); renderPlay(); renderShelf(); renderTalks(); renderWritings(); if ($('#ntr') && D.meta) $('#ntr').textContent = D.meta.ntranscribed;
try { buildGraph(); } catch (e) { console.error(e); $('#sky').append(h('p', { style: { position: 'absolute', inset: '40% 0 auto', textAlign: 'center' } }, 'The star map could not draw here.')); }
route();
})();
