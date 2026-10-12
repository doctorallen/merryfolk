'use strict';
// The world a seed makes must not change by accident: saves rebuild the
// valley from the seed, so a drift in generation moves people's homes. This
// hashes everything placed at generation for a few seeds and compares it to
// test/golden.json. When a generation change is meant, run
// `node test/golden.js --update` and commit the new file with it.
const fs = require('fs');
const path = require('path');
const { launch, openGame, finish } = require('./lib');

const FILE = path.join(__dirname, 'golden.json');
const WORLDS = [
  { name: 'classic-1337', cfg: { seed: 1337, hills: 'hilly', river: 'winding', woods: 'fair', wet: 'fair', hedges: 'some', flowers: 'plenty', rocks: 'some' } },
  { name: 'classic-42', cfg: { seed: 42, hills: 'hilly', river: 'winding', woods: 'fair', wet: 'fair', hedges: 'some', flowers: 'plenty', rocks: 'some' } },
  { name: 'classic-9001', cfg: { seed: 9001, hills: 'hilly', river: 'winding', woods: 'fair', wet: 'fair', hedges: 'some', flowers: 'plenty', rocks: 'some' } },
  { name: 'valley-42', cfg: { seed: 42, layout: 'valley' } },
];

// Runs in the page: builds the world and mixes every placed thing into one number.
function hashWorld(cfg) {
  if (cfg.layout === 'valley') cfg = { ...defaultGen(cfg.seed), layout: 'valley' };
  buildWorld(cfg);
  let s = 0;
  const mix = (v) => { s = (Math.imul(s ^ (v | 0), 2654435761) + 7) | 0; };
  World.tiles.forEach(mix); World.block.forEach(mix); World.reserved.forEach(mix);
  for (const st of World.statics) { mix(st.x); mix(st.y); }
  for (const g of World.grass) { mix(g.x); mix(g.y); mix(g.v); }
  World.px.level1.forEach(mix);
  for (const l of World.lots) { mix(l.cx || 0); mix(l.cy || 0); mix(l.x0 || 0); mix(l.y0 || 0); mix(l.kind.length); }
  for (const h of World.homes) { mix(h.doorX); mix(h.doorY); for (const w of h.windows) { mix(w.x); mix(w.y); } }
  for (const l of World.lamps) { mix(l.x); mix(l.y); mix(l.footX); }
  for (const b of World.benches.concat(World.fishing, World.shade, World.storySeats, World.partySeats)) { mix(b.x); mix(b.y); }
  for (const p of World.pens || []) { mix(p.x0); mix(p.y0); mix(p.x1); mix(p.y1); }
  for (const a of World.allotments || []) { mix(a.x0); mix(a.y0); }
  for (const o of World.orchard) { mix(o.x); mix(o.y); }
  for (const m of World.mushrooms.concat(World.wildHerbs, World.woodSpots)) { mix(m.x); mix(m.y); }
  if (World.memorial) { mix(World.memorial.x0); mix(World.memorial.y0); }
  if (World.orchard2) { mix(World.orchard2.x0); mix(World.orchard2.y0); }
  for (const h of World.hens) { mix(h.hx); mix(h.hy); }
  mix(World.henhouse.x); mix(World.marketSpot.x); mix(World.postSpot.y); mix(World.wellSpot.x); mix(World.bonfire.x);
  return { hash: s >>> 0, w: MAP_W, h: MAP_H, statics: World.statics.length, grass: World.grass.length };
}

(async () => {
  const update = process.argv.includes('--update');
  const browser = await launch();
  const { page, errors } = await openGame(browser);
  const got = {};
  for (const w of WORLDS) got[w.name] = await page.evaluate(hashWorld, w.cfg);
  await browser.close();
  const failures = errors.map((e) => 'page error: ' + e);
  if (update) {
    fs.writeFileSync(FILE, JSON.stringify(got, null, 2) + '\n');
    console.log('golden.json updated:', JSON.stringify(got));
  } else {
    const want = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : {};
    for (const w of WORLDS) {
      const a = want[w.name], b = got[w.name];
      if (!a) failures.push(`${w.name}: no golden recorded (run with --update)`);
      else if (JSON.stringify(a) !== JSON.stringify(b)) failures.push(`${w.name}: world changed: expected ${JSON.stringify(a)}, got ${JSON.stringify(b)}`);
    }
  }
  finish('golden', failures);
})().catch((e) => { console.error(e); process.exit(1); });
