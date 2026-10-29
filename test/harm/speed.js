// A day's CPU, for two checkouts back to back: a fresh village (seed 7) runs
// a morning to settle, then a whole day is simulated and the page's main
// thread time is read (puppeteer's metrics, TaskDuration), each checkout in
// turn, several times over.
//
//   node test/harm/speed.js ../merryfolk-main . [rounds]
const path = require('path');
const roots = process.argv.slice(2).filter((a) => !/^\d+$/.test(a)).map((r) => path.resolve(r));
const rounds = +(process.argv.slice(2).find((a) => /^\d+$/.test(a)) || 3);
(async () => {
  const res = Object.fromEntries(roots.map((r) => [r, []]));
  for (let k = 0; k < rounds; k++) {
    for (const root of roots) {
      const { launch, openGame } = require(path.join(root, 'test/lib'));
      const kit = await launch();
      const { page } = await openGame(kit);
      await page.evaluate(() => { Math.random = mulberry32(7); startGame(true); Game.generating = true; for (let i = 0; i < 480; i++) simulate(0.5); });
      const t0 = (await page.metrics()).TaskDuration, w0 = Date.now();
      await page.evaluate(() => { for (let i = 0; i < 2880; i++) simulate(0.5); });
      const cpu = (await page.metrics()).TaskDuration - t0, wall = (Date.now() - w0) / 1000;
      res[root].push([cpu, wall]);
      console.log(`${path.basename(root)}: ${cpu.toFixed(2)} s CPU, ${wall.toFixed(2)} s wall`);
      await kit.close();
    }
  }
  for (const r of roots) {
    const c = res[r].map((x) => x[0]), w = res[r].map((x) => x[1]), mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
    console.log(`${path.basename(r)}: mean ${mean(c).toFixed(2)} s CPU (${Math.min(...c).toFixed(2)} to ${Math.max(...c).toFixed(2)}), wall ${mean(w).toFixed(2)} s`);
  }
})();
