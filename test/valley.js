'use strict';
// A planned valley must hold together: every building, home, field, the
// party field and the story oak reachable from the square by the lanes,
// and every knoll placed by the planner rather than a fallback.
const { launch, openGame, finish } = require('./lib');

const SEEDS = [1337, 42, 9001];

function checkValley(seed) {
  buildWorld({ ...defaultGen(seed), layout: 'valley' });
  const sq = nearestWalkable(PLAZA.cx, PLAZA.cy);
  const lost = [];
  const check = (name, tx, ty) => { const s = nearestWalkable(tx, ty); if (!s || !findPath(sq[0], sq[1], s[0], s[1])) lost.push(name); };
  for (const k in World.buildings) { const b = World.buildings[k]; check(k, Math.floor(b.stepX / 16), Math.floor(b.stepY / 16)); }
  for (const h of World.homes) check('home' + h.id, h.stepTile[0], h.stepTile[1]);
  for (const f of World.fields) if (f.plots[0]) check('field', f.plots[0].tx, f.plots[0].ty);
  check('party', PARTY.danceX, Math.floor(PARTY.danceY + 3));
  check('story', STORY.x, STORY.y + 2);
  return { lost, fallbacks: World.L.fallbacks, homes: World.homes.length, built: World.homes.filter((h) => h.built).length, buildings: Object.keys(World.buildings).length, mills: World.L.mills.length };
}

(async () => {
  const browser = await launch();
  const { page, errors } = await openGame(browser);
  const failures = [];
  for (const seed of SEEDS) {
    const r = await page.evaluate(checkValley, seed);
    if (r.lost.length) failures.push(`seed ${seed}: unreachable ${r.lost.join(', ')}`);
    if (r.fallbacks) failures.push(`seed ${seed}: ${r.fallbacks} knolls fell back to a default spot`);
    if (r.built !== 10 || r.homes !== 16) failures.push(`seed ${seed}: ${r.built} built homes of ${r.homes} (want 10 of 16)`);
    if (r.buildings < 9) failures.push(`seed ${seed}: only ${r.buildings} buildings`);
    if (!r.mills) failures.push(`seed ${seed}: no mill`);
  }
  await browser.close();
  for (const e of errors) failures.push('page error: ' + e);
  finish('valley', failures);
})().catch((e) => { console.error(e); process.exit(1); });
