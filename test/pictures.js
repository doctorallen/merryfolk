'use strict';
// The pictures must not change by accident. The renderer and the sprite
// machinery are being moved onto a shared engine, so this pins what the
// original code paints, for the worlds golden.js builds:
//   - the ground: every chunk painted in full by the real painter
//     (paintGroundGen, as Ground paints it in the background), in each
//     world's own season (between them, all four), and in the original
//     valley and the planned one every eighth chunk in the other three too;
//   - the scenery's seasonal images (trees, bushes, hedges, buildings with
//     their night faces, props), a fixed sample through each world's statics,
//     in all four seasons;
//   - the tufts of long grass, wild plants and tall grass, in every season
//     and lean;
//   - the night's light pools (Light.render) over a fixed scene, at dusk, at
//     night and on a winter night, and over the square by night;
//   - the hobbit-hole and building interiors: the cutaway's painted layer in
//     every season, and a whole frame of a few of them by day and by night.
// Villagers are left out of everything hashed (they live by Math.random): the
// interiors are painted empty. The values are kept in test/pictures.json, and
// every single hash (each chunk, each static) goes to test/out/pictures.json
// for a closer look when something changes. It also leaves screenshots of a
// few fixed views in test/out/ to look at (not hashed). When a change to the
// pictures is meant, run `node test/pictures.js --update` and commit the new
// file with it.
const fs = require('fs');
const os = require('os');
const path = require('path');
const tk = require('../vendor/tycho/dist/testkit.cjs');
const { launch, outDir, finish, WORLDS, ROOT, READY } = require('./lib');

const FILE = path.join(__dirname, 'pictures.json');
// each world's own season, painted in full (between them, all four)
const OWN_SEASON = { 'classic-1337': 'spring', 'classic-42': 'summer', 'classic-9001': 'autumn', 'valley-42': 'winter' };
// the worlds pinned more closely: the ground through the year, the square by
// night and the interiors (the other two seeds add little a third time)
const DEEP = new Set(['classic-1337', 'valley-42']);

// ---------------------------------------------------------------------------
// In the page. Each of these runs synchronously with the frame loop held
// (Game.generating), so nothing moves or paints between its steps.
// ---------------------------------------------------------------------------

// Builds a world and hashes its ground, scenery, lights and interiors.
function pictureWorld({ name, cfg, own, deep }) {
  Game.generating = true;
  Math.random = mulberry32(5); // none of the painting should draw on it, but if it ever does, the same each time
  if (cfg.layout === 'valley') cfg = { ...defaultGen(cfg.seed), layout: 'valley' };
  const tb = performance.now(), took = {};
  buildWorld(cfg);
  took.build = performance.now() - tb;
  const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  const values = {}, detail = {};
  const combine = (list) => TK.hash(new TextEncoder().encode(list.join(' ')));
  const pic = (img) => (!img ? 'none' : img instanceof HTMLCanvasElement ? TK.canvas(img) : TK.image(img));
  const t0 = performance.now();
  let tHash = 0;

  // --- the ground, chunk by chunk, as Ground paints it ---
  const cols = Ground.cols(), rows = Ground.rows();
  const paintChunk = (season, cx, cy) => {
    const r = Ground.rect(cx, cy);
    const [c] = makeCanvas((r.x1 - r.x0) * GS, (r.y1 - r.y0) * GS);
    const g = paintGroundGen(season, c, r, { x: r.x0, y: r.y0 });
    while (!g.next().done) { /* every slice */ }
    return c;
  };
  SEASONS.forEach((season, si) => {
    const hs = [];
    for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
      if (season !== own && (!deep || (cy * cols + cx + si) % 8)) continue;
      const c = paintChunk(season, cx, cy), th = performance.now();
      const h = TK.canvas(c);
      tHash += performance.now() - th;
      hs.push(h);
      detail[`ground/${name}/${season}/${cx},${cy}`] = h;
    }
    if (hs.length) values[`ground/${name}/${season}`] = `${hs.length} of ${cols * rows} chunks ${combine(hs)}`;
  });
  took.ground = performance.now() - t0; took.groundHash = tHash;

  // --- the scenery: a fixed sample of each kind, through the four seasons ---
  // trees, bushes and hedges by recipe (many share one), buildings all, props
  // by image; at most 24 of a kind, evenly spaced through World.statics
  const t1 = performance.now();
  const buildingStatics = new Set(Object.values(World.buildings).map((b) => b.static));
  const kinds = { tree: [], bush: [], hedge: [], building: [], prop: [] };
  const recipes = new Set(), images = new Set();
  for (const s of World.statics) {
    if (s.gen) {
      const k = [s.gen.type, s.gen.seed, s.gen.kind || '', s.gen.len || '', s.gen.dir || ''].join(':');
      if (recipes.has(k)) continue;
      recipes.add(k); (kinds[s.gen.type] || kinds.prop).push(s);
    } else if (buildingStatics.has(s)) kinds.building.push(s);
    else if (!images.has(s.base)) { images.add(s.base); kinds.prop.push(s); }
  }
  const sample = (list, n) => (list.length <= n ? list : Array.from({ length: n }, (_, i) => list[Math.floor((i * list.length) / n)]));
  for (const k in kinds) kinds[k] = sample(kinds[k], k === 'building' ? 64 : 24);
  // the season is put on the sample alone (making every static's images for
  // every season would take as long again as the rest)
  const all = World.statics;
  World.statics = Object.values(kinds).flat();
  for (const season of SEASONS) {
    applySeasonToStatics(season);
    for (const k in kinds) {
      const hs = kinds[k].map((s, i) => {
        const h = (s.hidden ? 'hidden ' : '') + pic(s.img) + (s.alt ? ' night ' + pic(s.alt) : '');
        detail[`statics/${name}/${k}/${i}@${s.x},${s.y}/${season}`] = h;
        return h;
      });
      values[`statics/${name}/${k}/${season}`] = `${hs.length} ${combine(hs)}`;
    }
  }
  World.statics = all;
  took.statics = performance.now() - t1;

  // --- the square by night: each built home's windows, the lamps and the
  // buildings lit, over the painted ground in the world's own season ---
  if (deep) {
    const cam = { x: Math.round(PLAZA.cx * 16 - 200), y: Math.round(PLAZA.cy * 16 - 130), w: 400, h: 260 };
    const [c, x] = makeCanvas(cam.w * RS, cam.h * RS);
    x.setTransform(RS, 0, 0, RS, -cam.x * RS, -cam.y * RS);
    for (let cy = Math.floor(cam.y / CHUNK_PX); cy <= Math.floor((cam.y + cam.h - 1) / CHUNK_PX); cy++) for (let cx = Math.floor(cam.x / CHUNK_PX); cx <= Math.floor((cam.x + cam.w - 1) / CHUNK_PX); cx++) {
      const r = Ground.rect(cx, cy);
      x.drawImage(paintChunk(own, cx, cy), r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0);
    }
    const L = [];
    for (const h of World.homes) if (h.built) for (const w of h.windows) L.push({ x: w.x, y: w.y + 3, r: 30, a: 0.9, warm: true });
    for (const k in World.buildings) { const b = World.buildings[k]; L.push({ x: b.left + b.w / 2, y: b.bottom - 24, r: 44, a: 0.8, warm: true }); }
    for (const l of World.lamps) L.push({ x: l.x, y: l.y + 6, r: 80, a: 0.97, warm: true, glow: 1.8 });
    Light.render(x, cam, 0.7, own === 'winter' ? '14,22,54' : '12,18,46', L);
    values[`light/${name}/square`] = `${L.length} lights ${TK.canvas(c)}`;
  }

  // --- the interiors: every built hole and every building, empty ---
  if (deep) {
    const t2 = performance.now();
    const folk = Game.villagers, stores = Village.stores, clock = [Game.hour, Game.darkness, Game.raining, Game.weather];
    Game.villagers = [];
    // the stores' shelves, filled to a fixed level
    Village.stores = Object.fromEntries(STOCK_KEYS.map((k, i) => [k, 10 + i * 6]));
    const homes = World.homes.filter((h) => h.built);
    const blds = Object.values(World.buildings).filter((b) => BUILDING_KIND[b.key]);
    for (const b of blds) { b.built = true; b.doorColor = b.doorColor || (isRiftBuilding(b) ? '#2a2f4e' : '#6a4426'); } // as openInterior does
    for (const season of SEASONS) {
      World.season = season;
      for (const [k, list] of [['homes', homes], ['buildings', blds]]) {
        const hs = list.map((h) => { const v = pic(paintStatic(interiorLayout(h))); detail[`interior/${name}/${k}/${h.key || h.id}/${season}`] = v; return v; });
        values[`interior/${name}/${k}/${season}`] = `${hs.length} ${combine(hs)}`;
      }
    }
    // whole frames, as renderInterior draws them with nobody in: the sky and
    // the views, the painted layer, the fire, and the light, by day and by night
    World.season = own;
    const frame = (h, hour) => {
      Game.hour = hour; Game.raining = false; Game.weather = 'clear'; Game.darkness = skyState(hour).dark;
      Interior.baking = false;
      const L = interiorLayout(h), stat = paintStatic(L);
      const [c, x] = makeCanvas(L.IW, IH);
      IX = x;
      drawSkyAndViews(L, 0); IX.drawImage(stat, 0, 0); drawFire(L, 0); drawLight(L, [], 0);
      return c;
    };
    const shown = [homes.find((h) => h.grand) || homes[0], homes[homes.length - 1], World.buildings.inn].filter(Boolean);
    const frames = {};
    for (const h of shown) for (const [when, hour] of [['day', 13], ['night', 22.5]]) {
      const c = frame(h, hour), k = `interior/${name}/frame/${h.key || 'home' + h.id}/${when}`;
      values[k] = TK.canvas(c);
      frames[k.replace(/\//g, '-')] = c.toDataURL('image/png');
    }
    Game.villagers = folk; Village.stores = stores; [Game.hour, Game.darkness, Game.raining, Game.weather] = clock;
    took.interiors = performance.now() - t2;
    return { values, detail, took, frames };
  }
  return { values, detail, took, frames: {} };
}

// The pictures that don't belong to a world: tufts, and light pools over a
// fixed scene.
function pictureCommon() {
  Game.generating = true;
  Math.random = mulberry32(6);
  const values = {}, detail = {};
  const combine = (list) => TK.hash(new TextEncoder().encode(list.join(' ')));
  const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
  // long grass and reeds (0-7), the wild plants (four variants of each), the tall grass (six)
  const TUFTS = {
    grass: Array.from({ length: 8 }, (_, i) => i),
    wild: Array.from({ length: WILD.length * 4 }, (_, i) => WILD_V + i),
    tall: Array.from({ length: 6 }, (_, i) => TALL_V + i),
  };
  for (const season of SEASONS) for (const k in TUFTS) {
    const hs = [];
    for (const v of TUFTS[k]) for (let lean = -1; lean <= 2; lean++) { const h = TK.canvas(tuftSprite(v, season, lean)); hs.push(h); detail[`tufts/${k}/${v}/${lean}/${season}`] = h; }
    values[`tufts/${k}/${season}`] = `${hs.length} ${combine(hs)}`;
  }
  // a fixed scene: bands of flat ground, and every kind of light there is
  const cam = { x: 1000, y: 2000, w: 320, h: 200 };
  const LIGHTS = [
    { x: 40, y: 60, r: 30, a: 0.9, warm: true }, // a window
    { x: 100, y: 60, r: 30, a: 0.85, col: '#7af0ff' }, // a wired window
    { x: 160, y: 120, r: 80, a: 0.97, warm: true, glow: 1.8 }, // a lamp
    { x: 230, y: 70, r: 32, a: 0.85, col: '#b070ff', glow: 2, tint: 0.5 }, // a rift lantern
    { x: 250, y: 150, r: 10, a: 0.55, col: '#ff8a3a' }, // a pipe
    { x: 330, y: 180, r: 110, a: 0.95, col: '#ff9a3a', glow: 1.2 }, // a bonfire half off the edge
    { x: 20, y: 180, r: 9, a: 0.5 }, // a firefly
    { x: 290, y: 30, r: 26, a: 0.5 }, // round whoever's selected
    { x: -300, y: -300, r: 40, a: 0.9, warm: true }, // well out of sight
  ];
  const scene = (dark, tint) => {
    const [c, x] = makeCanvas(cam.w * RS, cam.h * RS);
    const bands = ['#5a8a3a', '#3f6b2f', '#8a6440', '#c8b890', '#4a6a8a', '#e8eef4', '#2a3a22', '#a8a090'];
    bands.forEach((col, i) => { x.fillStyle = col; x.fillRect(i * 40 * RS, 0, 40 * RS, cam.h * RS); });
    x.setTransform(RS, 0, 0, RS, -cam.x * RS, -cam.y * RS);
    Light.render(x, cam, dark, tint, LIGHTS.map((l) => ({ ...l, x: cam.x + l.x, y: cam.y + l.y })));
    return TK.canvas(c);
  };
  values['light/scene/dusk'] = scene(0.35, '12,18,46');
  values['light/scene/night'] = scene(0.7, '12,18,46');
  values['light/scene/winter-night'] = scene(0.7, '14,22,54');
  return { values, detail };
}

// A few fixed views of the founding village for people to look at: the
// square by day and by night at zoom 2 and 4, with the folk out of sight and
// the clock stopped. Returns PNG data URLs of the game's frame.
function viewShots() {
  startGame(false);
  setSpeed(0);
  Game.villagers = [];
  Game.selected = null;
  const shots = {};
  for (const z of [2, 4]) for (const [when, hour] of [['day', 13], ['night', 22.5]]) {
    setZoom(z);
    centerOn(PLAZA.cx * 16, (PLAZA.cy - 2) * 16);
    Game.hour = hour; Game.time = Math.floor(Game.time / 1440) * 1440 + hour * 60;
    for (const h of World.homes) if (h.built) h.lit = hour > 20;
    for (const l of World.lamps) { l.lit = hour > 20; l.litAt = Game.time - 60; }
    for (const b of Object.values(World.buildings)) b.lit = hour > 20;
    while (World.paintJob) stepPaint(1000); // the ground in view, painted for real
    for (const ch of Ground.chunks.values()) { ch.prev = null; ch.fade = 0; }
    render(0, 0);
    shots[`view-z${z}-${when}`] = view.toDataURL('image/png');
  }
  Game.generating = true;
  return shots;
}

// ---------------------------------------------------------------------------
(async () => {
  const t0 = Date.now();
  const browser = await launch();
  const failures = [], values = {}, detail = {}, took = {};
  // how long each step took, in the page and all told, for test/out/pictures.json
  const timed = async (label, fn) => { const t = Date.now(); const r = await fn(); took[label] = Object.assign(took[label] || {}, { all: Date.now() - t }); return r; };
  const save = (name, url) => fs.writeFileSync(path.join(outDir(), name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  // the classic valleys on one page, and the planned valley, the common
  // pictures and the screenshots on another: side by side where there are
  // cores to spare, one after the other where there aren't
  const job = async (page, worlds) => {
    for (const w of worlds) {
      const r = await timed(w.name, () => page.evaluate(pictureWorld, { name: w.name, cfg: w.cfg, own: OWN_SEASON[w.name], deep: DEEP.has(w.name) }));
      Object.assign(values, r.values); Object.assign(detail, r.detail);
      Object.assign(took[w.name], Object.fromEntries(Object.entries(r.took).map(([k, v]) => [k, Math.round(v)])));
      for (const [k, url] of Object.entries(r.frames)) save(k, url);
    }
  };
  const extras = async (page) => {
    const shots = await timed('screenshots', () => page.evaluate(viewShots));
    for (const [k, url] of Object.entries(shots)) save(k, url);
    const r = await timed('common', () => page.evaluate(pictureCommon));
    Object.assign(values, r.values); Object.assign(detail, r.detail);
  };
  // (a new browser's storage is empty already, so the game is opened once, not cleared and reloaded)
  let opened = 0;
  const open = () => timed('open ' + ++opened, async () => {
    const { page, errors } = await tk.open(browser, { root: ROOT, viewport: tk.DESKTOP, ready: READY, timeout: 60000 });
    await page.evaluate(tk.PAGE);
    return { page, errors };
  });
  const classic = WORLDS.filter((w) => !w.cfg.layout), planned = WORLDS.filter((w) => w.cfg.layout);
  const pages = [];
  // PICTURES_PAGES=1 or 2 overrides the choice
  const cpus = os.availableParallelism ? os.availableParallelism() : os.cpus().length;
  if (+(process.env.PICTURES_PAGES || (cpus >= 3 ? 2 : 1)) === 2) {
    await Promise.all([
      open().then(async (p) => { pages.push(p); await job(p.page, classic); }),
      open().then(async (p) => { pages.push(p); await extras(p.page); await job(p.page, planned); }),
    ]);
  } else {
    const p = await open();
    pages.push(p);
    await extras(p.page); await job(p.page, classic); await job(p.page, planned);
  }
  for (const p of pages) for (const e of p.errors) failures.push('page error: ' + e);
  await browser.close();
  const sorted = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
  fs.writeFileSync(path.join(outDir(), 'pictures.json'), JSON.stringify({ values: sorted(values), detail: sorted(detail), took }, null, 1) + '\n');
  failures.push(...tk.golden(FILE, sorted(values)));
  console.log(`pictures: ${Object.keys(values).length} values from ${Object.keys(detail).length} pictures in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  finish('pictures', failures);
})().catch((e) => { console.error(e); process.exit(1); });
