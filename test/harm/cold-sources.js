// Where the village's colds come from, and how much the sick are about:
// every catchCold by its caller (the season's chill, society.js; chilled to
// the bone, villager.js's update; someone poorly at a social do, socialTick;
// a natter), whether it took, and the hours folk spent poorly, poorly at
// something social, poorly out of doors and poorly abed.
//
//   node test/harm/cold-sources.js [root] [seeds] [days]
//   node test/harm/cold-sources.js ../merryfolk-main 1,2,3,4 12 > before.log
//   node test/harm/cold-sources.js . 1,2,3,4 12 > after.log
//
// (It asked whether a year on Athelas had fewer colds: it doesn't, test/minds.md.)
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const { launch, openGame } = require(path.join(root, 'test/lib'));
(async () => {
  const kit = await launch();
  const seeds = (process.argv[3] || '1,2').split(',').map(Number), days = +(process.argv[4] || 12);
  const tot = {};
  for (const seed of seeds) {
    const { page } = await openGame(kit);
    const r = await page.evaluate(({ seed, days }) => {
      Math.random = mulberry32(seed); startGame(true); Game.generating = true;
      const R0 = { tries: {}, took: {}, sickMin: 0, sickSocial: 0, sickOut: 0, sickAsleep: 0, coldMin: 0, flu: 0, bySeason: {} };
      const cc = Villager.prototype.catchCold;
      Villager.prototype.catchCold = function (from) {
        const st = new Error().stack.split('\n').slice(2, 4).join(' ');
        const src = /socialTick/.test(st) ? 'social' : /society\.js/.test(st) ? 'season chill' : /update/.test(st) ? 'chilled' : /bree\.js|converse\.js|exchange|villager\.js/.test(st) ? 'natter' : 'other';
        const before = this.chem.germs > 0 || (this.illness && this.illness.kind === 'flu');
        R0.tries[src] = (R0.tries[src] || 0) + 1;
        const r = cc.apply(this, arguments);
        if (!before && (this.chem.germs > 0 || (this.illness && this.illness.kind === 'flu'))) { R0.took[src] = (R0.took[src] || 0) + 1; R0.bySeason[World.season] = (R0.bySeason[World.season] || 0) + 1; if (this.illness && this.illness.kind === 'flu') R0.flu++; }
        return r;
      };
      for (let i = 0; i < 2880 * days; i++) {
        simulate(0.5);
        if (i % 20 === 0) Game.darkness = skyState(Game.hour).dark;
        if (i % 20 === 0) for (const v of Game.villagers) {
          if (v.chem.germs > 0) R0.coldMin += 10;
          if (!v.isSick()) continue;
          R0.sickMin += 10;
          if (!v.inside) R0.sickOut += 10;
          if (v.task && v.task.a.social && v.task.phase === 'do') R0.sickSocial += 10;
          if (v.task && v.task.a.id === 'sleep') R0.sickAsleep += 10;
        }
      }
      return R0;
    }, { seed, days });
    console.log('seed', seed, JSON.stringify(r));
    for (const k of ['sickMin', 'sickSocial', 'sickOut', 'sickAsleep', 'coldMin', 'flu']) tot[k] = (tot[k] || 0) + r[k];
    for (const g of ['tries', 'took', 'bySeason']) { tot[g] = tot[g] || {}; for (const k in r[g]) tot[g][k] = (tot[g][k] || 0) + r[g][k]; }
    await page.close();
  }
  await kit.close();
  for (const k of ['sickMin', 'sickSocial', 'sickOut', 'sickAsleep', 'coldMin']) tot[k] = Math.round(tot[k] / 60);
  console.log('total (hours)', JSON.stringify(tot));
})();
