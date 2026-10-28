'use strict';
// The minds are deterministic: the same village, run the same way, comes out
// the same, byte for byte (Tyrell's world.hash(), and where everyone is and
// what they're doing). Half a day of a fresh village is run twice in fresh
// pages and compared, and it has to have been lived: meals eaten, and the
// minds choosing what folk did. The two runs found the same village and then
// give Math.random different seeds: every chance the valley takes is drawn
// from the minds' streams, so it makes no difference.
const { launch, openGame, finish } = require('./lib');

// Runs in the page: a fresh village (founded from a seeded chance), half a day.
function halfDay(seed, salt) {
  Math.random = mulberry32(seed);
  startGame(true);
  Math.random = mulberry32(salt);
  Game.generating = true; // (the page's own frames neither run the village nor draw meanwhile)
  // what they finish: they must live, not just keep busy (meals, and the minds' own choices)
  let meals = 0, chosen = 0;
  const fin = Villager.prototype.finish;
  Villager.prototype.finish = function () { const t = this.task; if (t && t.a.sat && t.a.sat.hunger < -0.2) meals++; return fin.apply(this, arguments); };
  for (let i = 0; i < 720 * 2; i++) { simulate(0.5); if (i % 20 === 0) Game.darkness = skyState(Game.hour).dark; }
  Villager.prototype.finish = fin;
  for (const v of Game.villagers) for (const d of Shell.on ? Shell.why(v) : []) if (d.picked) chosen++;
  const folk = Game.villagers.map((v) => [v.id, v.first, v.task ? v.task.a.id : null, Math.round(v.x), Math.round(v.y), Math.round(DRIVES.reduce((s, d) => s + v.drives[d], 0) * 1e6)].join(':')).join('|');
  return { on: Shell.on, hash: Shell.on ? Shell.w.hash() : null, folk, people: Shell.on ? Shell.w.people().length : 0, decisions: Shell.on ? Shell.w.s.seq : 0, meals, chosen, n: Game.villagers.length };
}

(async () => {
  const kit = await launch();
  const failures = [], runs = [];
  try {
    for (let k = 0; k < 2; k++) {
      const { page, errors } = await openGame(kit);
      runs.push(await page.evaluate(halfDay, 7, 100 + k));
      for (const e of errors) failures.push(`run ${k + 1}: page error: ${e}`);
      await page.close();
    }
  } finally { await kit.close(); }
  const [a, b] = runs;
  if (!a.on) failures.push('the minds (Tyrell) are not running');
  if (a.people < 10) failures.push(`only ${a.people} people in the minds`);
  if (a.hash !== b.hash) failures.push(`the minds differ between two runs of the same village: ${a.hash} vs ${b.hash}`);
  if (a.folk !== b.folk) failures.push('the villagers differ between two runs of the same village');
  // (half a day from the morning: most folk have had a meal or two, and the minds chose what they did)
  if (a.meals < a.n) failures.push(`only ${a.meals} meals among ${a.n} folk in half a day`);
  if (a.chosen < a.n) failures.push(`the minds chose only ${a.chosen} things for ${a.n} folk in half a day`);
  console.log(`minds: ${a.people} people, ${a.decisions} events and inputs, ${a.meals} meals, hash ${a.hash}`);
  finish('minds', failures);
})().catch((e) => { console.error(e); process.exit(1); });
