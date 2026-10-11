'use strict';
// ---------------------------------------------------------------------------
// Build mode: shaping Thistledown yourself. Open it with the Build button (or
// B). Pick a tool, then click or drag on the map: footpaths, flower beds,
// trees and hedgerows, benches and lamp-posts, clearing scrub and stones,
// raising and lowering the ground a terrace at a time, digging ponds and
// filling them in, staking out new hobbit-holes and wells, and choosing where
// the village's next public buildings go.
//
// Nothing appears by magic. Every stroke becomes a plan: a pencilled ghost on
// the map with stakes and a progress bar. Grown-ups with time on their hands
// (woodwrights first) come and do the work, carrying what's needed from the
// Common Store, so a path is laid tile by tile as you watch. Benches and lamps
// cost a little timber; if the Store is short, the plan waits. Plans can be
// undone (Ctrl+Z) or cancelled with a click before work starts, with no
// penalty. Finished work is admired by passers-by, and the one who built it
// is proud of it. Everything is saved and rebuilt with the valley.
// ---------------------------------------------------------------------------

const BUILD_TOOLS = [
  { id: 'path', label: 'Path', icon: 'pack', kind: 'paint', unit: 4, hint: 'Drag to lay a footpath across the grass' },
  { id: 'flowers', label: 'Flowers', icon: 'heart', kind: 'paint', unit: 3, hint: 'Drag to sow wildflowers' },
  { id: 'tree', label: 'Tree', icon: 'leaf', kind: 'point', unit: 18, hint: 'Click to plant a young tree' },
  { id: 'hedge', label: 'Hedge', icon: 'herb', kind: 'line', unit: 7, hint: 'Drag a straight line to plant a hawthorn hedge' },
  { id: 'bench', label: 'Bench', icon: 'chat', kind: 'point', unit: 35, cost: { wood: 2 }, hint: 'Click to put a bench (2 timber)' },
  { id: 'lamp', label: 'Lamp', icon: 'sun', kind: 'point', unit: 30, cost: { wood: 1 }, hint: 'Click to put up a lamp-post the lamplighter will light (1 timber)' },
  { id: 'statue', label: 'Statue', icon: 'ring', kind: 'point', unit: 90, cost: { coin: 30 }, hint: 'Click to raise a stone statue of a famous hobbit (30 pennies)' },
  { id: 'fountain', label: 'Fountain', icon: 'cup', kind: 'point', unit: 120, cost: { coin: 60 }, hint: 'Click to build a fountain for the green (60 pennies)' },
  { id: 'clear', label: 'Clear', icon: 'axe', kind: 'box', unit: 14, hint: 'Drag a box to clear trees, bushes, hedges and stones (felled trees give timber)' },
  { id: 'raise', label: 'Raise', icon: 'snow', kind: 'brush', unit: 70, hint: 'Click to raise the ground a terrace (3×3)' },
  { id: 'lower', label: 'Lower', icon: 'hoe', kind: 'brush', unit: 70, hint: 'Click to lower the ground a terrace (3×3)' },
  { id: 'pond', label: 'Pond', icon: 'fish', kind: 'paint', unit: 18, hint: 'Drag to dig a pond' },
  { id: 'fill', label: 'Fill in', icon: 'wood', kind: 'paint', unit: 18, hint: 'Drag to fill in water you dug (not the river)' },
  { id: 'home', label: 'Hobbit-hole', icon: 'house', kind: 'site', hint: 'Click to stake out a knoll for a new hobbit-hole: the woodwrights will dig it' },
  { id: 'well', label: 'Well', icon: 'cup', kind: 'site', hint: 'Click to sink a new well' },
  { id: 'civic', label: 'Buildings', icon: 'hammer', kind: 'site', hint: 'Choose where the village\'s next public building goes' },
  { id: 'cancel', label: 'Cancel plan', icon: 'hmph', kind: 'point', hint: 'Click a plan that hasn\'t been started to cancel it' },
];
const BTOOL = Object.fromEntries(BUILD_TOOLS.map((t) => [t.id, t]));
const Build = { on: false, tool: 'path', drag: null, hover: null, civicKey: null, history: [] };
MOODLETS.admired = ['Admired the new {x}', 0.05, 360, ['Isn\'t that new {x} lovely?', 'Someone\'s been busy: a new {x}!']];
MOODLETS.proud_work = ['Proud of the {x} I built', 0.08, 720, ['I built that {x}, you know.']];

function plansList() { return Game.plans || (Game.plans = []); }
function planAt(tx, ty) { return plansList().find((p) => p.tiles.some(([x, y]) => x === tx && y === ty)); }
const tileKey = (x, y) => x + ',' + y;
const RIVER_NEAR = (x, y) => Math.abs(y + 0.5 - RIVER_Y(x + 0.5)) < 2.2;

// --- What can go where ------------------------------------------------------
function staticsOnTile(tx, ty) { return World.statics.filter((s) => !s.hidden && Math.floor(s.x / 16) === tx && Math.floor((s.y - 2) / 16) === ty); }
function clearable(s) { return (s.gen && (s.gen.type === 'tree' || s.gen.type === 'bush' || s.gen.type === 'hedge')) || s.rock; }
function underBuilding(tx, ty) {
  for (const b of Object.values(World.buildings)) if (tx >= b.x0 - 1 && tx <= b.x1 + 1 && ty >= (b.y0 ?? b.y1 - 2) - 2 && ty <= b.y1 + 1) return b;
  for (const h of World.homes) { const d = h.def; if (Math.abs(tx + 0.5 - d.cx) <= d.rx + 0.5 && Math.abs(ty + 0.5 - d.cy) <= d.ry + 1) return h; }
  return null;
}
// Why a tile can't take this tool (or '' if it can).
function tileWhy(tool, tx, ty) {
  if (!inMap(tx, ty)) return 'Off the map';
  const t = World.tiles[tIdx(tx, ty)], blocked = World.block[tIdx(tx, ty)];
  if (planAt(tx, ty)) return 'Already planned';
  switch (tool) {
    case 'path': return t === T.GRASS || t === T.LAWN ? (blocked ? 'Something\'s in the way' : '') : t === T.PATH || t === T.COBBLE ? 'Already a path' : t === T.WATER ? 'Water' : 'Not on grass';
    case 'flowers': return (t === T.GRASS || t === T.LAWN) && !blocked ? '' : 'Needs open grass';
    case 'tree': case 'bench': case 'lamp': case 'hedge': case 'statue': case 'fountain':
      if (t !== T.GRASS && t !== T.LAWN && !(tool !== 'tree' && tool !== 'hedge' && (t === T.PATH || t === T.COBBLE))) return 'Needs grass';
      if (blocked) return 'Something\'s in the way';
      if (World.reserved[tIdx(tx, ty)] && tool === 'tree') return 'Kept clear for building';
      return underBuilding(tx, ty) ? 'Too close to a building' : '';
    case 'clear': return staticsOnTile(tx, ty).some(clearable) ? '' : 'Nothing to clear';
    case 'raise': case 'lower':
      if (t === T.WATER || t === T.BRIDGE || t === T.HILL) return 'Not here';
      if (underBuilding(tx, ty)) return 'Under a building';
      if (t === T.FIELD || t === T.WEED || t === T.SOIL) return 'Not under crops';
      return '';
    case 'pond':
      if (t === T.WATER) return 'Already water';
      if (t !== T.GRASS && t !== T.LAWN) return 'Only on grass';
      if (blocked) return 'Something\'s in the way';
      return underBuilding(tx, ty) ? 'Too close to a building' : '';
    case 'fill': return t !== T.WATER ? 'Not water' : RIVER_NEAR(tx, ty) ? 'That\'s the river' : '';
  }
  return '';
}

// The tiles a stroke covers.
function strokeTiles(tool, a, b) {
  const T0 = BTOOL[tool];
  if (T0.kind === 'line') {
    const dx = b[0] - a[0], dy = b[1] - a[1], out = [];
    if (Math.abs(dx) >= Math.abs(dy)) for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) out.push([x, a[1]]);
    else for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++) out.push([a[0], y]);
    return out;
  }
  if (T0.kind === 'box') { const out = []; for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++) for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) out.push([x, y]); return out; }
  if (T0.kind === 'brush') { const out = []; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) out.push([b[0] + i, b[1] + j]); return out; }
  return [b];
}

// --- Sites for hobbit-holes, wells and public buildings ---------------------
function siteFor(tool, tx, ty) {
  if (tool === 'home') {
    const sh = lotShape('home', null, tx, ty);
    if (!lotFree(sh.core, sh.area)) return { why: 'Needs open ground about 9×7 tiles, clear of trees and buildings' };
    const spur = findSpur(sh.starts, sh.avoid, 26);
    return spur ? { sh, spur, rect: sh.core } : { why: 'No way to reach it from a path' };
  }
  if (tool === 'well') {
    const sh = lotShape('well', null, tx, ty);
    if (!lotFree(sh.core, sh.area)) return { why: 'Needs a clear patch' };
    const spur = findSpur(sh.starts, sh.avoid);
    return spur ? { sh, spur, rect: sh.core } : { why: 'No way to reach it from a path' };
  }
  if (tool === 'civic') {
    const lot = Build.civicKey && World.lots.find((l) => l.key === Build.civicKey);
    if (!lot || lot.state !== 'planned') return { why: 'Pick a building from the list first' };
    const def = lot.def, x0 = tx - Math.floor(def.w / 2);
    // free the lot's old reservation while we look
    const sh = lotShape('building', def, x0, ty);
    if (!lotFree(sh.core, sh.area)) return { why: 'Needs a clear plot' };
    const spur = findSpur(sh.starts, sh.avoid);
    return spur ? { sh, spur, rect: sh.core, x0, y1: ty, lot } : { why: 'No way to reach it from a path' };
  }
  return null;
}
function placeSite(tool, tx, ty, quiet = false) {
  const s = siteFor(tool, tx, ty);
  if (!s || s.why) return s ? s.why : 'Not here';
  if (tool === 'home') {
    const lot = { i: World.lots.length, kind: 'home', cx: tx, cy: ty, spur: s.spur, state: 'planned', player: true };
    World.lots.push(lot); reserveRect(...s.sh.core); reserveTiles(s.spur);
    if (!quiet) { (Game.playerLots || (Game.playerLots = [])).push({ kind: 'home', cx: tx, cy: ty, spur: s.spur }); const p = startProject(lot); chronicle(`At your asking, the woodwrights have staked out a fresh knoll for ${World.homes[p.homeId].name}, a new hobbit-hole. Timber will be wanted!`, 'build'); }
    return lot;
  }
  if (tool === 'well') {
    const n = (Game.playerLots || []).filter((l) => l.kind === 'well').length + 1;
    const name = `the ${['Little', 'Green', 'Hill', 'Mossy', 'Old Oak', 'Bramble'][n % 6]} Well`;
    const lot = { i: World.lots.length, kind: 'well', key: 'well_you' + n, def: { key: 'well_you' + n, kind: 'well', name, desc: 'A well you asked for' }, tx, ty, spur: s.spur, state: 'planned', player: true };
    World.lots.push(lot); reserveRect(...s.sh.core); reserveTiles(s.spur);
    if (!quiet) { (Game.playerLots || (Game.playerLots = [])).push({ kind: 'well', tx, ty, spur: s.spur }); startProject(lot); chronicle(`Diggers are sinking ${name}, where you showed them.`, 'build'); }
    return lot;
  }
  if (tool === 'civic') {
    const lot = s.lot;
    Object.assign(lot, { x0: s.x0, x1: s.x0 + lot.def.w - 1, y1: s.y1, y0: s.y1 - 2, spur: s.spur });
    reserveRect(...s.sh.core); reserveTiles(s.spur);
    if (!quiet) {
      (Game.lotMoves || (Game.lotMoves = {}))[lot.i] = { x0: lot.x0, x1: lot.x1, y0: lot.y0, y1: lot.y1, spur: lot.spur };
      startProject(lot);
      chronicle(`The woodwrights have begun raising ${lot.def.name} on the spot you chose. ${lot.def.desc}.`, 'build');
      Build.civicKey = null; renderBuildBar();
    }
    return lot;
  }
}

// --- Plans ---------------------------------------------------------------------
function makePlan(tool, tiles) {
  const T0 = BTOOL[tool];
  const ok = tiles.filter(([x, y]) => !tileWhy(tool, x, y));
  if (!ok.length) return null;
  let work = T0.unit * ok.length;
  if (tool === 'clear') work = T0.unit * ok.reduce((s, [x, y]) => s + staticsOnTile(x, y).filter(clearable).length, 0);
  if (T0.kind === 'brush') work = T0.unit;
  const p = { id: (Game.planSeq = (Game.planSeq || 0) + 1), tool, tiles: ok, cost: T0.cost || null, paid: !T0.cost, work, prog: 0, done: 0, made: Game.time, workers: 0, seed: Math.floor(Math.random() * 99999) };
  if (T0.kind === 'brush') {
    const [cx, cy] = tiles[4];
    const lv = World.tileLevel ? World.tileLevel[tIdx(cx, cy)] : 1;
    p.level = clamp(lv + (tool === 'raise' ? 1 : -1), 0, TERRACES - 1);
    if (p.level === lv) return null;
  }
  plansList().push(p);
  Build.history.push(p.id);
  return p;
}
function planUnit(p) { return p.tool === 'clear' || BTOOL[p.tool].kind === 'brush' || BTOOL[p.tool].kind === 'point' ? p.work : BTOOL[p.tool].unit; }
const haveRes = (k) => (k === 'wood' ? buildWood() : k === 'coin' ? Game.coin || 0 : Village.stores[k] || 0);
function payRes(k, n) { if (k === 'coin') Game.coin = Math.max(0, (Game.coin || 0) - n); else Village.use(k, n); }
function openPlans() { return plansList().filter((p) => p.paid || !p.cost || Object.entries(p.cost).every(([k, n]) => haveRes(k) >= n)); }

// Doing it: tile by tile for paths and paint, all at once for the rest.
function applyPlanTile(p, i, quiet) {
  const [x, y] = p.tiles[i];
  const idx = tIdx(x, y), rect = [x, y, x, y];
  switch (p.tool) {
    case 'path': if (World.tiles[idx] === T.GRASS || World.tiles[idx] === T.LAWN) World.tiles[idx] = T.PATH; World.grass = World.grass.filter((g) => Math.floor(g.x / 16) !== x || Math.floor(g.y / 16) !== y); break;
    case 'flowers': {
      const ks = Object.keys(FLOWER_KINDS).filter((k) => FLOWER_KINDS[k].seasons.includes(World.season === 'winter' ? 'spring' : World.season));
      const rng = mulberry32(p.seed + i * 13);
      for (let k = 0; k < 3; k++) World.flowers.push({ x: x * 16 + 3 + Math.floor(rng() * 10), y: y * 16 + 6 + Math.floor(rng() * 9), seed: Math.floor(rng() * 9999), kind: ks[Math.floor(rng() * ks.length)] || 'daisy', ground: true });
      return null;
    }
    case 'pond': World.tiles[idx] = T.WATER; World.block[idx] = 0; World.grass = World.grass.filter((g) => Math.floor(g.x / 16) !== x || Math.floor(g.y / 16) !== y); World.flowers = World.flowers.filter((f) => Math.floor(f.x / 16) !== x || Math.floor(f.y / 16) !== y); (World.dug || (World.dug = new Set())).add(idx); break;
    case 'fill': World.tiles[idx] = T.GRASS; break;
    case 'clear': {
      for (const s of staticsOnTile(x, y).filter(clearable)) {
        World.statics.splice(World.statics.indexOf(s), 1);
        if (!quiet && s.gen && s.gen.type === 'tree') Village.produce('wood', s.gen.kind === 'big' || s.gen.kind === 'oak' ? 3 : 2);
        if (s.gen && s.gen.type === 'hedge') { const n = s.gen.len || 1; for (let k = 0; k < n; k++) { const hx = s.gen.dir === 'v' ? x : x - Math.floor(n / 2) + k, hy = s.gen.dir === 'v' ? y - n + 1 + k : y; if (inMap(hx, hy)) World.block[tIdx(hx, hy)] = 0; } }
      }
      World.block[idx] = 0;
      return null;
    }
  }
  return rect;
}
function applyPlanWhole(p, quiet) {
  const add = World._addStatic, blk = World._blk;
  const [x, y] = p.tiles[0];
  switch (p.tool) {
    case 'tree': {
      const kind = ['oak', 'birch', 'apple', 'sapling', 'poplar'][p.seed % 5], seed = p.seed % 997;
      add(makeTree(seed, kind), x * 16 + 8, (y + 1) * 16 - 2, { gen: { type: 'tree', seed, kind } }); blk(x, y);
      return 'tree';
    }
    case 'bench':
      add(makeBench(), x * 16 + 8, y * 16 + 12, { sortBias: -1 });
      World.benches.push(makeSpot(x * 16 + 8, y * 16 + 12, 'down', 'sit', 'bench'));
      return 'bench';
    case 'lamp': {
      const st = add(makeLampPost(false), x * 16 + 8, y * 16 + 14, { snow: true });
      st.alt = st.baseAlt = makeLampPost(true);
      World.lamps.push({ x: x * 16 + 8, y: y * 16 + 14 - 22, footX: x * 16 + 8 + (walkable(x + 1, y) ? 9 : -9), footY: y * 16 + 16, st, lit: false, litAt: 0 });
      blk(x, y);
      return 'lamp-post';
    }
    case 'statue': case 'fountain': {
      const st = add(p.tool === 'statue' ? makeStatue(p.seed) : makeFountain(), x * 16 + 8, y * 16 + 14, { snow: true });
      st.decor = p.tool; blk(x, y);
      if (p.tool === 'statue' && !quiet) { const who = R.pick(['Bandobras "Bullroarer" Took', 'Old Gerontius Took', 'Mungo Fernsby the tinker', 'Marmadas Brockhouse, first of the brewers', 'Lily Cotton, who planted the party tree']); st.honours = who; (Game.statues || (Game.statues = {}))[x + ',' + y] = who; }
      return p.tool === 'statue' ? 'statue' : 'fountain';
    }
    case 'hedge': {
      const xs = p.tiles.map((t) => t[0]), ys = p.tiles.map((t) => t[1]);
      const dir = new Set(ys).size === 1 ? 'h' : 'v', len = p.tiles.length;
      if (dir === 'h') add(makeHedge(p.seed, 'summer', len, 'h'), Math.min(...xs) * 16 + len * 8, y * 16 + 14, { gen: { type: 'hedge', seed: p.seed, len, dir: 'h' }, sway: 0.12 });
      else add(makeHedge(p.seed, 'summer', len, 'v'), x * 16 + 8, (Math.min(...ys) + len - 1) * 16 + 16, { gen: { type: 'hedge', seed: p.seed, len, dir: 'v' }, sway: 0.08 });
      for (const [hx, hy] of p.tiles) blk(hx, hy);
      return 'hedge';
    }
    case 'raise': case 'lower': {
      const xs = p.tiles.map((t) => t[0]), ys = p.tiles.map((t) => t[1]);
      if (!quiet) (Game.terra || (Game.terra = [])).push({ x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), h: (p.level + 0.5) / TERRACES });
      return p.tool === 'raise' ? 'rise' : 'hollow';
    }
  }
  return null;
}

// Finished: repaint, let folk admire it, record it for the valley's rebuild.
function completePlan(p, by, quiet = false) {
  if (!quiet) {
    (Game.planDone || (Game.planDone = [])).push({ tool: p.tool, tiles: p.tiles, seed: p.seed, level: p.level });
    Game.plans = plansList().filter((x) => x !== p);
  }
  let what = null;
  if (BTOOL[p.tool].kind === 'point' || p.tool === 'hedge' || BTOOL[p.tool].kind === 'brush') what = applyPlanWhole(p, quiet);
  else for (let i = p.done; i < p.tiles.length; i++) applyPlanTile(p, i, quiet);
  if (quiet) return;
  const xs = p.tiles.map((t) => t[0]), ys = p.tiles.map((t) => t[1]);
  if (p.tool === 'raise' || p.tool === 'lower') { gatherPads(); computeHeights(World.seed); refreshGround([[Math.min(...xs) - 4, Math.min(...ys) - 4, Math.max(...xs) + 4, Math.max(...ys) + 4]]); }
  else if (['path', 'pond', 'fill'].includes(p.tool)) refreshGround([[Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]]);
  applySeasonToStatics(World.season);
  unstick();
  const name = what || { path: 'path', flowers: 'flower bed', pond: 'pond', fill: 'patch of filled-in ground', clear: 'clearing' }[p.tool];
  const cx = (Math.min(...xs) + Math.max(...xs) + 1) * 8, cy = (Math.min(...ys) + Math.max(...ys) + 1) * 8;
  FX.sparkle(cx, cy - 8, '#ffe680');
  if (by) { feel(by, 'proud_work', name); by.say(R.pick(['There! Done.', `A fine ${name}, if I say so myself.`, 'That\'ll do nicely.']), 2.6); }
  for (const o of Game.villagers) if (o !== by && !o.inside && o.stage !== 'baby' && dist(o.x, o.y, cx, cy) < 140 && p.tool !== 'clear' && p.tool !== 'fill') { feel(o, 'admired', name); if (R.chance(0.3)) o.say(R.pick([`Ooh, a new ${name}!`, 'Well, look at that.', 'Lovely!']), 2.4); }
  if (['pond', 'lamp', 'raise', 'lower'].includes(p.tool) || p.tiles.length >= 12) chronicle(`${by ? by.first : 'Someone'} has finished the ${name} you planned${p.tool === 'path' ? `, ${p.tiles.length} yards of it` : ''}.`, 'build');
}

ACTIONS.work_plan = {
  id: 'work_plan', label: 'Working on your plans', icon: 'hammer', sat: { industry: -0.55, bored: -0.25 }, dur: 45, pose: 'work', outdoor: true, stages: ADULT, skill: 'woodcraft', skillRate: 0.5,
  label2: (v) => { const p = v.task && v.task.target.plan; return p ? `Building the ${BTOOL[p.tool].label.toLowerCase()} you planned` : 'Working on your plans'; },
  avail: () => openPlans().some((p) => p.workers < (p.tiles.length > 8 ? 3 : 2)),
  extra: (v) => 0.3 + (v.job === 'woodwright' ? 0.35 : v.job ? 0 : 0.2),
  time: (h) => (h >= 7.5 && h < 19.5 ? 1 : 0.01) * (Game.raining ? 0.5 : 1),
  target: (v) => {
    const ps = openPlans().filter((p) => p.workers < (p.tiles.length > 8 ? 3 : 2)).sort((a, b) => (a.made - b.made) * 0.002 + dist(v.x, v.y, a.tiles[0][0] * 16, a.tiles[0][1] * 16) - dist(v.x, v.y, b.tiles[0][0] * 16, b.tiles[0][1] * 16));
    const p = ps[0];
    if (!p) return null;
    const [tx, ty] = p.tiles[Math.min(p.done, p.tiles.length - 1)];
    // stand on or next to the spot being worked
    let spot = walkable(tx, ty) && p.tool !== 'pond' ? [tx, ty] : null;
    if (!spot) for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1]]) if (walkable(tx + dx, ty + dy)) { spot = [tx + dx, ty + dy]; break; }
    if (!spot) spot = nearestWalkable(tx, ty);
    if (!spot) return null;
    return { x: spot[0] * 16 + 8 + R.i(-3, 3), y: spot[1] * 16 + 12, plan: p, faceTo: { x: tx * 16 + 8, y: ty * 16 + 8 } };
  },
  start: (v, task) => {
    const p = task.target.plan;
    if (!p.paid && p.cost) { for (const [k, n] of Object.entries(p.cost)) payRes(k, n); p.paid = true; }
    p.workers++; task.data.counted = true;
    return true;
  },
  release: (v, task) => { const p = task.target.plan; if (p && task.data.counted) { p.workers = Math.max(0, p.workers - 1); task.data.counted = false; } },
  tick: (v, task, dt) => {
    const p = task.target.plan;
    if (!plansList().includes(p)) { task.t = 0; return; }
    if (task.phase !== 'do') return;
    p.prog += dt * v.skillMul('woodcraft');
    task.t = Math.max(task.t, 1);
    if (Math.random() < dt * 0.012) v.say(R.pick(BUILD_PHRASES.building.concat(['Nearly there.', 'One more...', 'Mind your toes!'])), 2.2);
    if (p.prog >= p.work) { completePlan(p, v); task.t = 0; return; }
    // tile by tile: lay what's done, and move on along it when the next bit is out of reach
    const unit = planUnit(p);
    if (unit < p.work) {
      const rects = [];
      while (p.done < p.tiles.length - 1 && p.prog >= (p.done + 1) * unit) { const r = applyPlanTile(p, p.done, false); if (r) rects.push(r); p.done++; }
      if (rects.length) { refreshGround(rects); unstick(); }
      const [nx, ny] = p.tiles[p.done];
      if (dist(v.x, v.y, nx * 16 + 8, ny * 16 + 8) > 40) task.t = 0;
    }
  },
};
ACTION_NAMES.work_plan = 'Building your plans';

// --- The valley rebuilt on load: everything you had built, put back ------------
function replayBuilds() {
  for (const l of Game.playerLots || []) {
    const lot = l.kind === 'home' ? { i: World.lots.length, kind: 'home', cx: l.cx, cy: l.cy, spur: l.spur, state: 'planned', player: true }
      : { i: World.lots.length, kind: 'well', key: 'well_you' + World.lots.length, def: { key: 'well_you' + World.lots.length, kind: 'well', name: 'the new well', desc: '' }, tx: l.tx, ty: l.ty, spur: l.spur, state: 'planned', player: true };
    World.lots.push(lot);
  }
  for (const i in Game.lotMoves || {}) { const lot = World.lots[i]; if (lot) Object.assign(lot, Game.lotMoves[i]); }
  for (const d of Game.planDone || []) completePlan({ tool: d.tool, tiles: d.tiles, seed: d.seed, level: d.level, done: 0 }, null, true);
  if ((Game.terra || []).length) { gatherPads(); }
  if ((Game.planDone || []).length || (Game.terra || []).length) computePixelTypes(World.seed);
}

// --- The build bar ----------------------------------------------------------------
function renderBuildBar() {
  const bar = $('buildbar');
  if (!bar) return;
  const open = World.lots.filter((l) => l.kind === 'building' && l.state === 'planned' && !(l.def && l.def.rift));
  bar.innerHTML = `<div class="bb-tools">${BUILD_TOOLS.map((t) => `<button class="tool${Build.tool === t.id ? ' active' : ''}" data-btool="${t.id}" title="${escapeHtml(t.hint)}">${iconHTML(t.icon)}<span>${t.label}</span></button>`).join('')}</div>
  <div class="bb-side"><div id="bb-hint" class="bb-hint">${escapeHtml(BTOOL[Build.tool].hint)}</div>
  ${Build.tool === 'civic' ? `<div class="bb-civic">${open.length ? open.map((l) => `<button data-civic="${l.key}" class="${Build.civicKey === l.key ? 'on' : ''}">${escapeHtml(l.def.name.replace(/^the /, 'The '))}</button>`).join('') : '<span class="sub">Every public building is built or under way.</span>'}</div>` : ''}
  <div class="bb-row"><span class="sub">${plansList().length} plan${plansList().length === 1 ? '' : 's'} waiting · timber to spare: ${Math.floor(buildWood())} · ${Game.coin || 0} pennies</span><button id="bb-undo" title="Undo the last plan (Ctrl+Z)">Undo</button><button id="bb-done" class="primary">Done</button></div></div>`;
  hydrateIcons(bar);
  bar.querySelectorAll('[data-btool]').forEach((b) => b.addEventListener('click', () => { Build.tool = b.dataset.btool; renderBuildBar(); }));
  bar.querySelectorAll('[data-civic]').forEach((b) => b.addEventListener('click', () => { Build.civicKey = b.dataset.civic; renderBuildBar(); }));
  $('bb-undo').addEventListener('click', undoPlan);
  $('bb-done').addEventListener('click', () => setBuildMode(false));
}
function setBuildMode(on) {
  Build.on = on;
  document.body.classList.toggle('building', on);
  $('buildbar').hidden = !on; $('toolbar').hidden = on;
  $('btn-build').classList.toggle('active', on);
  Build.drag = null;
  if (on) { selectVillager(null); renderBuildBar(); }
}
function undoPlan() {
  while (Build.history.length) {
    const id = Build.history.pop(), p = plansList().find((x) => x.id === id);
    if (!p) continue;
    if (p.prog > 0) { toast('That one\'s already being built.', 'info'); Build.history.push(id); return; }
    Game.plans = plansList().filter((x) => x !== p);
    renderBuildBar();
    return;
  }
}

// --- Drawing the plans, the ghost and the reasons ---------------------------
function drawBuildOverlay() {
  const show = Build.on || plansList().length;
  if (!show) return;
  const z = Game.zoom, cam = Game.cam, cx = Math.round(cam.x * RS) / RS, cy = Math.round(cam.y * RS) / RS;
  const S = (wx, wy) => [(wx - cx) * z, (wy - cy) * z];
  octx.save();
  octx.imageSmoothingEnabled = false;
  // the plans: pencilled tiles, stakes, progress
  for (const p of plansList()) {
    const waiting = !openPlans().includes(p);
    octx.globalAlpha = Build.on ? 0.9 : 0.6;
    for (const [i, [x, y]] of p.tiles.entries()) {
      if (i < p.done) continue;
      const [sx, sy] = S(x * 16, y * 16);
      octx.fillStyle = waiting ? 'rgba(200,120,60,0.18)' : 'rgba(255,240,180,0.2)'; octx.fillRect(sx, sy, 16 * z, 16 * z);
      octx.setLineDash([3, 3]); octx.strokeStyle = waiting ? '#c8783c' : '#5a3a22'; octx.lineWidth = 1; octx.strokeRect(sx + 0.5, sy + 0.5, 16 * z - 1, 16 * z - 1); octx.setLineDash([]);
    }
    const [x0, y0] = p.tiles[0], [sx, sy] = S(x0 * 16 + 8, y0 * 16 - 2);
    octx.fillStyle = '#6e4628'; octx.fillRect(sx - 1, sy - 4 * z, 2, 6 * z); octx.fillStyle = '#e8c24a'; octx.fillRect(sx + 1, sy - 4 * z, 4 * z, 2 * z);
    if (p.prog > 0) { const w = 18 * z, f = clamp(p.prog / p.work, 0, 1); octx.fillStyle = '#2a1c12'; octx.fillRect(sx - w / 2, sy - 7 * z, w, 3); octx.fillStyle = '#7ab04c'; octx.fillRect(sx - w / 2, sy - 7 * z, w * f, 3); }
    if (waiting && Build.on) { octx.font = '600 12px "Pixelify Sans", monospace'; octx.fillStyle = '#7a3a1a'; octx.fillText('waiting for timber', sx + 6, sy - 10); }
  }
  octx.globalAlpha = 1;
  if (Build.on && Build.hover) {
    const tool = Build.tool, T0 = BTOOL[tool];
    const [hx, hy] = Build.hover;
    let tiles, why = '';
    if (T0.kind === 'site') {
      const s = siteFor(tool, hx, hy);
      if (s && !s.why) { const [a, b, c, d] = s.rect; tiles = []; for (let y = b; y <= d; y++) for (let x = a; x <= c; x++) tiles.push([x, y]); for (const t of s.spur) tiles.push(t); }
      else { tiles = [[hx, hy]]; why = s ? s.why : 'Not here'; }
      for (const [x, y] of tiles) { const [sx, sy] = S(x * 16, y * 16); octx.fillStyle = why ? 'rgba(220,70,60,0.35)' : 'rgba(120,200,90,0.3)'; octx.fillRect(sx, sy, 16 * z, 16 * z); }
    } else if (tool === 'cancel') {
      const p = planAt(hx, hy);
      why = p ? (p.prog > 0 ? 'Already under way' : `Cancel this ${BTOOL[p.tool].label.toLowerCase()} plan`) : 'No plan here';
      const [sx, sy] = S(hx * 16, hy * 16); octx.strokeStyle = '#c83a2a'; octx.lineWidth = 2; octx.strokeRect(sx, sy, 16 * z, 16 * z);
    } else {
      tiles = Build.drag ? Build.drag.tiles : strokeTiles(tool, [hx, hy], [hx, hy]);
      let bad = 0;
      for (const [x, y] of tiles) {
        const w = tileWhy(tool, x, y); if (w) { bad++; why = why || w; }
        const [sx, sy] = S(x * 16, y * 16);
        octx.fillStyle = w ? 'rgba(220,70,60,0.32)' : 'rgba(120,200,90,0.32)'; octx.fillRect(sx, sy, 16 * z, 16 * z);
      }
      if (bad < tiles.length) why = '';
      // a ghost of the thing itself
      const g = ['bench', 'lamp', 'tree', 'statue', 'fountain'].includes(tool) ? SPR_GHOST(tool) : null;
      if (g && !why) { const [sx, sy] = S(hx * 16 + 8 - g.width / 2, hy * 16 + 14 - g.height); octx.globalAlpha = 0.6; octx.drawImage(g, sx, sy, g.width * z, g.height * z); octx.globalAlpha = 1; }
      if (!why && tiles.length) {
        const ok = tiles.filter(([x, y]) => !tileWhy(tool, x, y)).length;
        why = `${ok} tile${ok === 1 ? '' : 's'}${T0.cost ? ' · ' + Object.entries(T0.cost).map(([k, n]) => `${n} ${k === 'wood' ? 'timber' : k === 'coin' ? 'pennies' : k}`).join(', ') : ''}`;
        why = '✓ ' + why;
      }
    }
    if (why) {
      const [sx, sy] = S(hx * 16 + 16, hy * 16);
      octx.font = '600 13px "Pixelify Sans", monospace';
      const tw = octx.measureText(why).width;
      octx.fillStyle = 'rgba(42,28,18,0.85)'; octx.fillRect(sx + 6, sy - 10, tw + 12, 20);
      octx.fillStyle = why.startsWith('✓') ? '#d8f0b0' : '#ffd0c0'; octx.fillText(why, sx + 12, sy);
    }
  }
  octx.restore();
}
const GHOSTS = {};
function SPR_GHOST(k) { return GHOSTS[k] || (GHOSTS[k] = k === 'bench' ? makeBench() : k === 'lamp' ? makeLampPost(true) : k === 'statue' ? makeStatue(7) : k === 'fountain' ? makeFountain() : makeTree(321, 'sapling')); }
// A stone hobbit on a plinth, and a fountain for the green.
function makeStatue(seed) {
  const rows = ['....kkk....', '...kSSSk...', '...kSsSk...', '....kSk....', '..kSSSSSk..', '.kSSsSSsSk.', '.kS.SSS.Sk.', '...kSSSk...', '...kS.Sk...', '..kSSkSSk..', 'kkkkkkkkkkk', 'kPPPPPPPPPk', 'kPpPPPPPpPk', 'kPPPPPPPPPk', 'kkkkkkkkkkk'];
  return finishSprite(rows, { k: '#5a5650', S: '#b8b4aa', s: '#8e8a82', P: '#a8a196', p: '#c8c2b6' });
}
function makeFountain() {
  const rows = ['.......w.......', '......wWw......', '.....w.k.w.....', '....w..k..w....', '.......k.......', '...kkkkkkkkk...', '..kSSSSSSSSSk..', '.kSwwWwwwWwwSk.', 'kSwWwwwWwwwWwSk', 'kSSSSSSSSSSSSSk', '.kkkkkkkkkkkkk.'];
  return finishSprite(rows, { k: '#5a5650', S: '#b8b4aa', w: '#6aa8e0', W: '#b8e0ff' });
}

// --- Input --------------------------------------------------------------------
function buildPointer(e, phase) {
  if (!Build.on) return false;
  if (e.pointerType === 'mouse' && e.button !== 0 && phase === 'down') return false;
  if (e.pointerType === 'touch' && phase === 'down' && touches.size >= 1) return false;
  const [wx, wy] = screenToWorld(e.clientX, e.clientY);
  const tx = Math.floor(wx / 16), ty = Math.floor(wy / 16);
  Build.hover = [tx, ty];
  const tool = Build.tool, T0 = BTOOL[tool];
  if (phase === 'down') {
    if (T0.kind === 'site') { const r = placeSite(tool, tx, ty); if (typeof r === 'string') toast(r, 'info'); renderBuildBar(); return true; }
    if (tool === 'cancel') { const p = planAt(tx, ty); if (p && p.prog === 0) { Game.plans = plansList().filter((x) => x !== p); renderBuildBar(); } return true; }
    Build.drag = { start: [tx, ty], tiles: strokeTiles(tool, [tx, ty], [tx, ty]), seen: new Set([tileKey(tx, ty)]) };
    return true;
  }
  if (phase === 'move' && Build.drag) {
    if (T0.kind === 'paint') { const k = tileKey(tx, ty); if (!Build.drag.seen.has(k)) { Build.drag.seen.add(k); Build.drag.tiles.push([tx, ty]); } }
    else Build.drag.tiles = strokeTiles(tool, Build.drag.start, [tx, ty]);
    return true;
  }
  if (phase === 'up' && Build.drag) {
    const tiles = Build.drag.tiles;
    const p = makePlan(tool, tiles);
    Build.drag = null;
    if (!p) toast(`Can't plan that there: ${(tiles.map(([x, y]) => tileWhy(tool, x, y)).find(Boolean) || (BTOOL[tool].kind === 'brush' ? 'the ground can\'t go any ' + (tool === 'raise' ? 'higher' : 'lower') : 'not here')).toLowerCase()}.`, 'info');
    renderBuildBar();
    return true;
  }
  return phase !== 'move';
}
window.addEventListener('DOMContentLoaded', () => {
  const view = $('view');
  const cap = (phase) => (e) => { if (buildPointer(e, phase)) { e.stopImmediatePropagation(); if (phase === 'down') view.setPointerCapture(e.pointerId); } };
  view.addEventListener('pointerdown', cap('down'), { capture: true });
  view.addEventListener('pointermove', cap('move'), { capture: true });
  view.addEventListener('pointerup', cap('up'), { capture: true });
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey) setBuildMode(!Build.on);
    if (Build.on && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undoPlan(); }
    if (Build.on && e.key === 'Escape') setBuildMode(false);
  });
  $('btn-build').addEventListener('click', () => setBuildMode(!Build.on));
  const ro = renderOverlay;
  renderOverlay = function () { ro(); drawBuildOverlay(); };
  const nv = newVillage;
  newVillage = function () { Game.plans = []; Game.planDone = []; Game.terra = []; Game.playerLots = []; Game.lotMoves = {}; Game.planSeq = 0; return nv(); };
  // the terrain you shaped is part of the lie of the land
  const gp = gatherPads;
  gatherPads = function () {
    gp();
    for (const e of Game.terra || []) World.pads.push({ x0: e.x0, y0: e.y0, x1: e.x1, y1: e.y1, h: e.h });
    const near = World.padNear;
    for (const [k, e] of (Game.terra || []).entries()) {
      const id = World.pads.length - (Game.terra.length - k);
      for (let y = Math.max(0, Math.floor(e.y0 - PAD_FADE)); y <= Math.min(MAP_H - 1, Math.ceil(e.y1 + PAD_FADE)); y++)
        for (let x = Math.max(0, Math.floor(e.x0 - PAD_FADE)); x <= Math.min(MAP_W - 1, Math.ceil(e.x1 + PAD_FADE)); x++) (near[y * MAP_W + x] || (near[y * MAP_W + x] = [])).push(id);
    }
  };
});
