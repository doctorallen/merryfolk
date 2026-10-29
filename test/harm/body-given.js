// The body given on purpose: the same villagers, before and after, catch a
// cold, nibble a toadstool or are laid up with the flu at six on the first
// morning, and each is watched until it's over. A season's colds are too few
// to compare course by course; this compares the courses themselves.
//
//   node test/harm/body-given.js [root] [seeds]     root: a checkout of the game (default this one)
//   node test/harm/body-given.js ../merryfolk-main 1,2,3,4 > before.log
//   node test/harm/body-given.js . 1,2,3,4 > after.log
//   node test/harm/body-given-sum.js before.log after.log
//
// Each seed must found the same village in both (the new actions draw no
// instinct: test/harm/founding.js checks it), so the same people are given
// the same things. It isn't part of npm test.
const path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const { launch, openGame } = require(path.join(root, 'test/lib'));
(async () => {
  const kit = await launch();
  const all = [];
  for (const seed of (process.argv[3] || '1,2,3,4').split(',').map(Number)) {
    const { page } = await openGame(kit);
    const r = await page.evaluate((seed) => {
      Math.random = mulberry32(seed); startGame(true); Game.generating = true;
      const step = (n) => { for (let i = 0; i < n; i++) { simulate(0.5); if (i % 20 === 0) Game.darkness = skyState(Game.hour).dark; } };
      step(2880 / 4); // to six in the morning or so
      const adults = Game.villagers.filter((v) => v.isGrown() && !v.isSick() && !v.illness && v.chem.germs === 0 && v.chem.immune < 0.3).sort((a, b) => a.id - b.id);
      const colds = adults.slice(0, 8), toads = adults.slice(8, 12), flus = adults.slice(12, 15);
      const T = new Map();
      const rec = (v, kind) => T.set(v, { kind, name: v.first, hardy: Math.round(v.genes.hardiness * 100) / 100, cold: 0, sniff: 0, toxin: 0, sick: 0, flu: 0, asleep: 0, cures: [], open: true });
      for (const v of colds) { v.catchCold('the test'); rec(v, 'cold'); }
      for (const v of toads) { v.chem.toxin = Math.min(1, v.chem.toxin + 0.6); rec(v, 'toad'); }
      for (const v of flus) { v.illness = { kind: 'flu', until: Game.time + 2 * 1440 }; v.chem.germs = 0.6; v.chem.peaked = false; rec(v, 'flu'); }
      const cure = Villager.prototype.cure;
      Villager.prototype.cure = function () { const t = T.get(this); if (t) t.cures.push(Math.round(this.chem.germs * 100) / 100 + '/' + Math.round(this.chem.toxin * 100) / 100); return cure.apply(this, arguments); };
      for (let k = 0; k < 6 * 24 * 4; k++) {
        step(20);
        for (const [v, t] of T) {
          if (!Game.villagers.includes(v) || !t.open) continue;
          const c = v.chem, ill = v.illness && Game.time < v.illness.until ? v.illness.kind : null;
          if (c.germs > 0) t.cold += 10;
          if (c.germs > 0.35) t.sniff += 10;
          if (c.toxin > 0.35) t.toxin += 10;
          if (v.isSick()) t.sick += 10;
          if (ill === 'flu') t.flu += 10;
          if (v.isSick() && v.task && v.task.a.id === 'sleep') t.asleep += 10;
          if (t.kind !== 'toad' && c.germs === 0 && ill !== 'flu') t.open = false;
          if (t.kind === 'toad' && c.toxin === 0) t.open = false;
        }
      }
      return [...T.values()].map((t) => ({ ...t, cold: t.cold / 60, sniff: t.sniff / 60, toxin: t.toxin / 60, sick: t.sick / 60, flu: t.flu / 60, asleep: t.asleep / 60 }));
    }, seed);
    for (const x of r) all.push({ seed, ...x });
    await page.close();
  }
  await kit.close();
  const by = (k) => all.filter((x) => x.kind === k);
  const mean = (xs, f) => (xs.length ? (xs.reduce((a, x) => a + f(x), 0) / xs.length).toFixed(1) : '-');
  for (const k of ['cold', 'toad', 'flu']) {
    const xs = by(k);
    console.log(k, xs.length, 'cold h', mean(xs, (x) => x.cold), 'sniffles h', mean(xs, (x) => x.sniff), 'toxin h', mean(xs, (x) => x.toxin), 'poorly h', mean(xs, (x) => x.sick), 'asleep poorly h', mean(xs, (x) => x.asleep), 'flu h', mean(xs, (x) => x.flu), 'cured', xs.filter((x) => x.cures.length).length, 'turned flu', xs.filter((x) => x.kind === 'cold' && x.flu > 0).length);
  }
  console.log(JSON.stringify(all));
})();
