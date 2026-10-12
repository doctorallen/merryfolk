'use strict';
// The villagers' design must not drift by accident: a change to the sprite
// builders should be a deliberate one. This builds a few fixed figures (every
// gene that shows is pinned) and hashes the pixels of each straight-on view
// (down, side, up; every pose; eyes open and shut), comparing them to
// test/sprites.json. When a change to the folk is meant, run
// `node test/sprites.js --update` and commit the new file with it.
const fs = require('fs');
const path = require('path');
const { launch, openGame, finish } = require('./lib');

const FILE = path.join(__dirname, 'sprites.json');

// Runs in the page: builds the figures and hashes every cardinal-view sprite.
function hashFolk() {
  const seeded = mulberry32(7);
  Math.random = seeded;
  const pin = (i) => ({ skin: i % 4, hair: HAIR_COLS[i % HAIR_COLS.length], vest: VEST_COLS[(i * 2) % VEST_COLS.length], shirt: SHIRT_COLS[i % SHIRT_COLS.length], legs: LEG_COLS[i % LEG_COLS.length], eyes: ['B', 'B'], freckles: [i % 2, i % 2], neon: i % 3, wit: 0.9, rift: 0, chrome: [0, 0] });
  let gi = 0;
  const mk = (label, stage, fix, look = {}) => ({ label, stage, look, genes: Object.assign(randomGenes(), pin(gi++), fix) });
  const folk = [
    mk('man', 'adult', { sex: 'm', style: 0, garment: 0, curls: [0, 0] }),
    mk('woman', 'adult', { sex: 'f', style: 1, garment: 1, curls: [0, 0] }),
    mk('child', 'child', { sex: 'm', style: 2, garment: 0, curls: [0, 0] }),
    mk('elder', 'elder', { sex: 'm', style: 0, garment: 0, curls: [0, 0], wit: 0.9 }),
    mk('rift', 'adult', { sex: 'f', style: 0, garment: 0, curls: [1, 1], rift: 1, chrome: [1, 1] }, { tier: 2, visor: true }),
    mk('baby', 'baby', { sex: 'm' }),
  ];
  const out = {};
  for (const f of folk) for (const shut of [false, true]) {
    const sp = buildVillagerSprites(f.genes, f.stage, f.look, shut);
    for (const view of ['down', 'side', 'up']) for (const pose of FOLK_POSES) {
      const c = sp[view][pose];
      let h = 0;
      const mix = (v) => { h = (Math.imul(h ^ (v | 0), 2654435761) + 7) | 0; };
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      mix(c.width); mix(c.height);
      for (let i = 0; i < d.length; i++) mix(d[i]);
      out[`${f.label}/${shut ? 'shut' : 'open'}/${view}/${pose}`] = h >>> 0;
    }
  }
  return out;
}

(async () => {
  const update = process.argv.includes('--update');
  const browser = await launch();
  const { page, errors } = await openGame(browser);
  const got = await page.evaluate(hashFolk);
  await browser.close();
  const failures = errors.map((e) => 'page error: ' + e);
  if (update) {
    fs.writeFileSync(FILE, JSON.stringify(got, null, 1) + '\n');
    console.log(`sprites: recorded ${Object.keys(got).length} views`);
  } else {
    const want = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    const changed = Object.keys(want).filter((k) => want[k] !== got[k]);
    if (changed.length) failures.push(`${changed.length} of ${Object.keys(want).length} views differ from test/sprites.json (first: ${changed.slice(0, 4).join(', ')}); run \`node test/sprites.js --update\` if the change is meant`);
    for (const k of Object.keys(got)) if (!(k in want)) failures.push('new view not in test/sprites.json: ' + k);
  }
  finish('sprites', failures);
})();
