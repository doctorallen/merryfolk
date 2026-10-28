'use strict';
// The minds are deterministic: the same village, run the same way, comes out
// the same, byte for byte (Tyrell's world.hash(), and where everyone is and
// what they're doing). Half a day of a fresh village is run twice in fresh
// pages and compared.
const { launch, openGame, finish } = require('./lib');

// Runs in the page: a fresh village (founded from a seeded chance), half a day.
function halfDay(seed) {
  Math.random = mulberry32(seed);
  startGame(true);
  Game.generating = true; // (the page's own frames neither run the village nor draw meanwhile)
  for (let i = 0; i < 720 * 2; i++) { simulate(0.5); if (i % 20 === 0) Game.darkness = skyState(Game.hour).dark; }
  const folk = Game.villagers.map((v) => [v.id, v.first, v.task ? v.task.a.id : null, Math.round(v.x), Math.round(v.y), Math.round(DRIVES.reduce((s, d) => s + v.drives[d], 0) * 1e6)].join(':')).join('|');
  return { on: Shell.on, hash: Shell.on ? Shell.w.hash() : null, folk, people: Shell.on ? Shell.w.people().length : 0, decisions: Shell.on ? Shell.w.s.seq : 0 };
}

(async () => {
  const kit = await launch();
  const failures = [], runs = [];
  try {
    for (let k = 0; k < 2; k++) {
      const { page, errors } = await openGame(kit);
      runs.push(await page.evaluate(halfDay, 7));
      for (const e of errors) failures.push(`run ${k + 1}: page error: ${e}`);
      await page.close();
    }
  } finally { await kit.close(); }
  const [a, b] = runs;
  if (!a.on) failures.push('the minds (Tyrell) are not running');
  if (a.people < 10) failures.push(`only ${a.people} people in the minds`);
  if (a.hash !== b.hash) failures.push(`the minds differ between two runs of the same village: ${a.hash} vs ${b.hash}`);
  if (a.folk !== b.folk) failures.push('the villagers differ between two runs of the same village');
  console.log(`minds: ${a.people} people, ${a.decisions} events and inputs, hash ${a.hash}`);
  finish('minds', failures);
})().catch((e) => { console.error(e); process.exit(1); });
