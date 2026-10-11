// What a page costs the browser while it just sits there: node scripts/perf.mjs [path ...]
// For each address it prints, over a 5-second rest: seconds of main-thread work, and the CPU seconds
// used by all of the browser's processes together (page, compositor and graphics), which is where
// the cost of repainting shows. Compare with the still page (?nomotion=1), which is the floor.
import { chromium } from 'playwright-core';
const cases = process.argv.slice(2).length ? process.argv.slice(2) : ['/?theme=light&nomotion=1', '/?theme=light', '/?theme=dark'];
const b = await chromium.launch({ channel: 'chrome' });
const sys = await b.newBrowserCDPSession();
const cpu = async () => (await sys.send('SystemInfo.getProcessInfo')).processInfo.reduce((sum, p) => sum + p.cpuTime, 0);
for (const path of cases) {
  const p = await b.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Performance.enable');
  await p.goto('http://localhost:4321' + path, { waitUntil: 'load' });
  await p.waitForTimeout(6000); // let the load sequence finish
  const tasks = async () => (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'TaskDuration').value;
  const [t0, c0] = [await tasks(), await cpu()];
  await p.waitForTimeout(5000);
  const [t1, c1] = [await tasks(), await cpu()];
  console.log(path.padEnd(30), 'main thread', (t1 - t0).toFixed(2), 's   all processes', (c1 - c0).toFixed(2), 's');
  await p.close();
}
await b.close();
