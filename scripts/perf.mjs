// How much work the home page costs the browser while it just sits there: node scripts/perf.mjs
// Prints main-thread seconds used over a 4-second rest, per case. The still page is the floor.
import { chromium } from 'playwright-core';
const cases = [
  ['top of page, as it is', 0, ''],
  ['top, wave drawings paused', 0, 'document.querySelectorAll("svg").forEach((s) => s.querySelector("animate") && s.pauseAnimations())'],
  ['top, waves paused and flame still', 0, 'document.querySelectorAll("svg").forEach((s) => s.querySelector("animate") && s.pauseAnimations()); document.querySelectorAll(".pb-fire").forEach((e) => (e.style.animation = "none"))'],
  ['at the waves, as it is', 'waves', ''],
  ['at the waves, paused', 'waves', 'document.querySelectorAll("svg").forEach((s) => s.querySelector("animate") && s.pauseAnimations())'],
];
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
const cdp = await p.context().newCDPSession(p);
await cdp.send('Performance.enable');
const read = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
for (const [label, where, tweak] of cases) {
  await p.goto('http://localhost:4321/?theme=light', { waitUntil: 'load' });
  await p.waitForTimeout(4500);
  if (where === 'waves') await p.evaluate(() => [...document.querySelectorAll('svg')].find((s) => s.querySelector('animate'))?.scrollIntoView({ block: 'center' }));
  if (tweak) await p.evaluate(tweak);
  await p.waitForTimeout(2500);
  const a = await read();
  await p.waitForTimeout(4000);
  const z = await read();
  const d = (k) => (z[k] - a[k]).toFixed(2);
  console.log(label.padEnd(36), 'tasks', d('TaskDuration'), 's   style', d('RecalcStyleDuration'), '  layout', d('LayoutDuration'));
}
await b.close();
