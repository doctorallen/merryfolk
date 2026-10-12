'use strict';
// ---------------------------------------------------------------------------
// The village of Thistledown: map layout, seasonal ground painting, places,
// crops and critters, and A* pathfinding.
// ---------------------------------------------------------------------------

const T = { GRASS: 0, PATH: 1, WATER: 2, BRIDGE: 3, SOIL: 4, HILL: 5, LAWN: 6, COBBLE: 7, WEED: 8, FIELD: 9 };
// What each kind of ground costs to walk on: folk keep to paths and cobbles,
// cut across grass and lawns when it saves a fair way, and avoid tilled earth.
const TILE_COST = [2.4, 1, 0, 1, 3.5, 0, 1.8, 1, 3, 3];
// Climbing a terrace bank on the grass is hard going (it's worth a long detour
// to find a path); where a road, path or bridge crosses one, it's a gentle ramp.
const BANK_COST = 14, RAMP_COST = 0.4;
const isRoadTile = (t) => t === T.PATH || t === T.COBBLE || t === T.BRIDGE;

// The lie of the village (the knolls, lanes, river, square, fields and the
// rest) comes from the layout in use: see layout.js. These are set by
// applyLayout when the valley is built.
let HOME_DEFS, ROADS, RIVER_Y, POND, PARTY, PLAZA, INN_RECT, WEED_FIELD, FIELDS, STORY, WEST_EXIT;
const HOME_SUFFIX = ['End', 'Burrow', 'Hole', 'Hollow', 'Nook', 'Delving', 'Bank', 'Under-hill', 'Smial', 'Cosy', 'Rise', 'Dell'];

const World = {
  tiles: new Uint8Array(MAP_W * MAP_H),
  block: new Uint8Array(MAP_W * MAP_H),
  reserved: new Uint8Array(MAP_W * MAP_H),
  homes: [], buildings: {}, statics: [], benches: [], fishing: [], shade: [], mushrooms: [], weed: [], fields: [], herbBeds: [],
  wildHerbs: [], woodSpots: [], orchard: [], hives: [], hens: [], eggs: 0, rabbits: [], crows: [],
  partySpots: [], partySeats: [], storySeats: [], lamps: [], partyPoles: [], wellSpot: null, marketSpot: null, postSpot: null,
  items: [], flowers: [], ducks: [], ground: null, millWheel: null, waterTiles: [], season: 'spring',
  paintJob: null,
};

const tIdx = (x, y) => y * MAP_W + x;
const inMap = (x, y) => x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
function tileAt(x, y) { return inMap(x, y) ? World.tiles[tIdx(x, y)] : T.GRASS; }
function walkable(x, y) {
  if (!inMap(x, y)) return false;
  const t = World.tiles[tIdx(x, y)];
  return t !== T.WATER && t !== T.HILL && !World.block[tIdx(x, y)];
}
function makeSpot(x, y, facing, pose, kind) { return { x, y, facing, pose, kind, occ: null }; }
// A seat on the ground at the foot of a tree, back against the trunk (whose
// foot is at x, y), so it's drawn just in front of it.
function treeBackSpot(x, y) { return makeSpot(x, y + 5, 'down', 'sit', 'shade'); }

// ---------------------------------------------------------------------------
// Statics: anything drawn y-sorted with the villagers. Seasonal statics carry
// a `gen` recipe and are redrawn when the season turns; `snow` ones get a
// dusting in winter; `seasons` limits when a static is shown at all.
// ---------------------------------------------------------------------------
const SEASON_CACHE = new Map();
function seasonalImage(gen, season) {
  const key = gen.type + ':' + gen.seed + ':' + (gen.kind || '') + ':' + (gen.len || '') + (gen.dir || '') + ':' + season;
  if (!SEASON_CACHE.has(key)) {
    let img;
    if (gen.type === 'tree') img = makeTree(gen.seed, gen.kind, season);
    else if (gen.type === 'bush') img = makeBush(gen.seed, season);
    else if (gen.type === 'hedge') img = makeHedge(gen.seed, season, gen.len || 1, gen.dir || 'h');
    SEASON_CACHE.set(key, img);
  }
  return SEASON_CACHE.get(key);
}
const SNOW_CACHE = new WeakMap();
function snowy(img) {
  if (!img) return img;
  if (!SNOW_CACHE.has(img)) {
    const [c, x] = makeCanvas(img.width, img.height);
    x.drawImage(img, 0, 0);
    SNOW_CACHE.set(img, addSnow(c, 0, img.height - 3, img.height > 60 ? 8 : 3, img.width * 7 + img.height));
  }
  return SNOW_CACHE.get(img);
}

function applySeasonToStatics(season) {
  World.season = season;
  for (const s of World.statics) {
    if (s.gen) s.img = seasonalImage(s.gen, season);
    else if (s.snow) { s.img = season === 'winter' ? snowy(s.base) : s.base; if (s.baseAlt) s.alt = season === 'winter' ? snowy(s.baseAlt) : s.baseAlt; }
    if (s.seasons) s.hidden = !s.seasons.includes(season);
  }
}

// ---------------------------------------------------------------------------
// How the valley is to be made: chosen on the setup screen when a village is
// started, and saved with it.
const GEN_OPTIONS = {
  hills: { label: 'The land', opts: [['gentle', 'Gentle', 0.6], ['rolling', 'Rolling', 1], ['hilly', 'Hilly', 1.5]] },
  river: { label: 'The river', opts: [['lazy', 'Lazy', 0.45], ['winding', 'Winding', 1], ['meandering', 'Meandering', 1.6]] },
  woods: { label: 'Woodland', opts: [['sparse', 'Sparse', 0.5], ['fair', 'Fair', 1], ['thick', 'Thick', 1.6]] },
  wet: { label: 'Wetness', opts: [['dry', 'Dry', -0.12], ['fair', 'Fair', 0], ['damp', 'Damp', 0.14]] },
  hedges: { label: 'Hedgerows', opts: [['none', 'None', 0], ['some', 'Some', 0.55], ['many', 'Many', 0.95]] },
  flowers: { label: 'Wildflowers', opts: [['few', 'Few', 0.45], ['plenty', 'Plenty', 1], ['riot', 'A riot', 1.9]] },
  rocks: { label: 'Rocks', opts: [['few', 'Few', 0.45], ['some', 'Some', 1], ['many', 'Many', 1.9]] },
  cliffs: { label: 'Cliffs', opts: [['none', 'None', 0], ['some', 'Some', 1], ['many', 'Many', 1.7]] },
  relief: { label: 'Relief', opts: [['smooth', 'Smooth', 0], ['broken', 'Broken', 1], ['rugged', 'Rugged', 1.6]] },
};
function defaultGen(seed = 1337) { return { seed, hills: 'rolling', river: 'winding', woods: 'fair', wet: 'fair', hedges: 'some', flowers: 'plenty', rocks: 'some', cliffs: 'some', relief: 'broken', layout: 'classic' }; }
// The number behind a setting, e.g. gen('woods') → 1.6 for thick woodland.
function gen(key) {
  const g = World.gen || defaultGen(), o = GEN_OPTIONS[key].opts.find((x) => x[0] === g[key]);
  return o ? o[2] : GEN_OPTIONS[key].opts[1][2];
}

function buildWorld(cfg) { for (const _ of buildWorldSteps(cfg)); }
// Builds the valley a stage at a time, yielding a line about each, so the
// setup screen can show it taking shape.
function* buildWorldSteps(cfg) {
  // villages from before there were cliffs keep their valley as it was
  World.gen = typeof cfg === 'object' ? { ...defaultGen(), cliffs: 'none', relief: 'smooth', layout: 'classic', ...cfg } : defaultGen(cfg);
  const seed = World.gen.seed;
  World.seed = seed;
  // A new valley is half as big again each way as the original, and is
  // planned from its seed once, the plan kept with the village. The map is
  // sized to the plan (or to Thistledown's valley) before anything is built.
  const valley = World.gen.layout === 'valley';
  const [mw, mh] = valley ? (World.gen.plan ? [World.gen.plan.w, World.gen.plan.h] : [192, 144]) : [CLASSIC_LAYOUT.w, CLASSIC_LAYOUT.h];
  if (MAP_W !== mw || MAP_H !== mh) setMapSize(mw, mh);
  if (valley && !World.gen.plan) World.gen.plan = planValley(seed, mw, mh);
  applyLayout(valley && World.gen.plan ? World.gen.plan : CLASSIC_LAYOUT);
  World.land = null; World.grass = []; World.statics = []; World.flowers = []; World.pads = null; World.padNear = null; World._nh = null; World.cliffMask = null; World.cliff = null;
  const rng = mulberry32(seed);
  const tiles = World.tiles;
  tiles.fill(T.GRASS);

  // River and pond
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (Math.abs(y + 0.5 - RIVER_Y(x + 0.5)) < 1.5) tiles[tIdx(x, y)] = T.WATER;
    const px = (x + 0.5 - POND.cx) / POND.rx, py = (y + 0.5 - POND.cy) / POND.ry;
    if (px * px + py * py < 1) tiles[tIdx(x, y)] = T.WATER;
  }
  yield 'The river finds its way down the valley';
  // Party lawn
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const px = (x - PARTY.cx) / PARTY.rx, py = (y - PARTY.cy) / PARTY.ry;
    if (px * px + py * py < 1 && tiles[tIdx(x, y)] === T.GRASS) tiles[tIdx(x, y)] = T.LAWN;
  }
  // Hills (homes and sites)
  World.homes = [];
  const surnames = SURNAMES.slice().sort(() => rng() - 0.5);
  HOME_DEFS.forEach((d, i) => {
    const surname = i === 0 ? 'Bag-and-Barrel' : surnames[i % surnames.length];
    const name = i === 0 ? 'Bag-and-Barrel Hall' : surname + ' ' + HOME_SUFFIX[i % HOME_SUFFIX.length];
    World.homes.push(createHome(d, i, surname, name));
  });

  yield 'Knolls rise where the hobbit-holes will be dug';
  // Roads: each stretch between the lanes' waypoints is walked by the easiest
  // way, keeping to the contours and away from wet and steep ground
  routeRoads(seed);
  yield 'Lanes wind along the contours';
  // Plaza
  for (let y = PLAZA.cy - 6; y < PLAZA.cy + 6; y++) for (let x = PLAZA.cx - 7; x < PLAZA.cx + 7; x++) if (Math.hypot(x - PLAZA.cx, (y - PLAZA.cy) * 1.2) < PLAZA.r + 0.7) tiles[tIdx(x, y)] = T.COBBLE;
  // Inn yard
  for (let y = INN_RECT.y1 + 1; y <= INN_RECT.y1 + 6; y++) for (let x = INN_RECT.x0 - 2; x <= INN_RECT.x1 + 2; x++) if (tiles[tIdx(x, y)] !== T.WATER) tiles[tIdx(x, y)] = T.COBBLE;
  // Pipe-weed field, barley fields
  for (let y = WEED_FIELD.y0; y <= WEED_FIELD.y1; y++) for (let x = WEED_FIELD.x0; x <= WEED_FIELD.x1; x++) tiles[tIdx(x, y)] = T.WEED;
  for (const f of FIELDS) for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) if (tiles[tIdx(x, y)] !== T.PATH) tiles[tIdx(x, y)] = T.FIELD;
  yield 'Fields are ploughed and the square is cobbled';
  // the lie of the land: slope, sun, drainage, wetness and soil, for siting what grows where
  computeLand(seed);
  yield 'Rain runs off the hills; soil settles in the hollows';

  World.block.fill(0);
  World.reserved.fill(0);
  World.statics = [];
  World.benches = []; World.fishing = []; World.shade = []; World.mushrooms = []; World.weed = []; World.fields = []; World.herbBeds = [];
  World.wildHerbs = []; World.woodSpots = []; World.orchard = []; World.hives = []; World.hens = []; World.storySeats = [];
  World.partySpots = []; World.partySeats = []; World.lamps = []; World.dug = new Set(); World.partyPoles = []; World.flowers = []; World.buildings = {};
  const res = (x, y, r = 0) => { for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) if (inMap(i, j)) World.reserved[tIdx(i, j)] = 1; };
  const blk = (x, y) => { if (inMap(x, y)) { World.block[tIdx(x, y)] = 1; World.reserved[tIdx(x, y)] = 1; } };
  const addStatic = (img, x, y, opts = {}) => {
    const s = {
      img, base: img, x: Math.round(x), y: Math.round(y), ox: opts.ox ?? Math.floor(img.width / 2), oy: opts.oy ?? img.height, w: img.width,
      sortY: y + (opts.sortBias || 0), snow: opts.snow !== false, gen: opts.gen, seasons: opts.seasons,
      // trees and bushes sway in the wind
      sway: opts.sway ?? (opts.gen ? (opts.gen.type === 'tree' ? (opts.gen.kind === 'great' ? 0.3 : opts.gen.kind === 'big' ? 0.6 : 1) : 0.35) : 0),
    };
    World.statics.push(s); return s;
  };
  World._addStatic = addStatic; World._blk = blk; World._res = res; World._rng = rng;

  // --- Home surroundings (only for built homes; sites get them when dug) ---
  for (const h of World.homes) {
    res(h.stepTile[0], h.stepTile[1], 1);
    if (h.built) furnishHome(h, rng);
    else h.siteStatic = addStatic(makeConstruction(), h.doorX + 2, h.doorY + 10, { snow: true });
    if (h.siteStatic) h.siteStatic.hidden = true;
  }
  // trees and bushes growing on top of the hills
  for (const h of World.homes) {
    const d = h.def;
    if (h.grand) {
      addStatic(makeTree(77, 'oak'), (d.cx + d.rx * 0.55) * 16, (d.cy - d.ry * 0.25) * 16, { gen: { type: 'tree', seed: 77, kind: 'oak' } });
      addStatic(makeTree(78, 'birch'), (d.cx - d.rx * 0.6) * 16, (d.cy - d.ry * 0.35) * 16, { gen: { type: 'tree', seed: 78, kind: 'birch' } });
    } else {
      const bs = 601 + (h.id % 3);
      addStatic(makeBush(bs), (d.cx - d.rx * 0.45 + (h.id % 2)) * 16, (d.cy - d.ry * 0.3) * 16, { gen: { type: 'bush', seed: bs } });
    }
  }

  // --- Buildings ---
  const addBuilding = (key, def) => {
    const { x0, x1, y0, y1, img, imgNight, doorOff, name, chimneys = [], rows = 3 } = def;
    for (let y = y1 - rows + 1; y <= y1; y++) for (let x = x0; x <= x1; x++) blk(x, y);
    const bottom = (y1 + 1) * 16 + 1;
    const left = Math.round((x0 + x1 + 1) * 8 - img.width / 2);
    const st = addStatic(img, left, bottom, { ox: 0, oy: img.height });
    st.baseAlt = imgNight; st.alt = imgNight;
    const b = {
      key, name, kind: 'building', x0, x1, y0, y1, left, bottom, doorX: left + doorOff, doorY: bottom - 1,
      stepX: left + doorOff, stepY: bottom + 10, inside: [], doorAnim: 0, lit: false, static: st,
      chimneys: chimneys.map((cx) => ({ x: left + cx + 3, y: bottom - img.height + 2 })), w: img.width, h: img.height,
    };
    res(Math.floor(b.stepX / 16), y1 + 1, 1);
    // keep the land under the roof clear too
    for (let y = Math.floor((bottom - img.height) / 16); y <= y1; y++) for (let x = x0; x <= x1; x++) res(x, y);
    World.buildings[key] = b;
    return b;
  };
  World._addBuilding = addBuilding;
  // The inn
  {
    const innDay = makeInn(false), innNight = makeInn(true);
    const inn = addBuilding('inn', { x0: INN_RECT.x0, x1: INN_RECT.x1, y0: INN_RECT.y0, y1: INN_RECT.y1, img: innDay, imgNight: innNight, doorOff: 70, name: 'The Tipsy Badger', rows: 5 });
    inn.chimneys = [{ x: inn.left + 34, y: inn.bottom - 113 }, { x: inn.left + 112, y: inn.bottom - 113 }];
    inn.seats = [];
    inn.isInn = true;
    World.inn = inn;
    addStatic(makeInnSign(), (INN_RECT.x0 - 1) * 16 + 10, (INN_RECT.y1 + 2) * 16 + 2);
    blk(INN_RECT.x0 - 1, INN_RECT.y1 + 1);
    const tableImg = makeTable();
    for (const [tx, ty] of [[INN_RECT.x0, INN_RECT.y1 + 3], [INN_RECT.x1, INN_RECT.y1 + 3], [INN_RECT.x0, INN_RECT.y1 + 6], [INN_RECT.x1, INN_RECT.y1 + 6]]) {
      const x = tx * 16 + 8, y = ty * 16 + 10;
      addStatic(tableImg, x, y + 2);
      blk(tx, ty);
      inn.seats.push(makeSpot(x, y - 7, 'down', 'sit', 'inn'), makeSpot(x - 16, y + 1, 'right', 'sit', 'inn'),
        makeSpot(x + 16, y + 1, 'left', 'sit', 'inn'), makeSpot(x, y + 11, 'up', 'sit', 'inn'));
    }
    inn.serveSpots = [[INN_RECT.x0 + 2, INN_RECT.y1 + 4], [INN_RECT.x1 - 2, INN_RECT.y1 + 4], [INN_RECT.x0 + 3, INN_RECT.y1 + 2], [INN_RECT.x1 - 1, INN_RECT.y1 + 5]].map(([tx, ty]) => ({ x: tx * 16 + 8, y: ty * 16 + 12 }));
    const barrel = makeBarrel();
    for (const [bx, by] of [[INN_RECT.x1 + 1.4, INN_RECT.y1 + 1.5], [INN_RECT.x1 + 2.2, INN_RECT.y1 + 1.2], [INN_RECT.x1 + 1.8, INN_RECT.y1 + 2.1]]) addStatic(barrel, bx * 16, by * 16);
    blk(INN_RECT.x1 + 1, INN_RECT.y1 + 1); blk(INN_RECT.x1 + 2, INN_RECT.y1 + 1); blk(INN_RECT.x1 + 1, INN_RECT.y1 + 2);
  }
  const cot = (opts) => [makeCottage({ ...opts, lit: false }), makeCottage({ ...opts, lit: true })];
  {
    const [d, n] = cot({ w: 92, wall: '#efe2c0', roof: 'thatch', sign: 'bread', windows: [14, 66], door: 46, chimneys: [64] });
    addBuilding('bakery', { ...World.L.buildings.bakery, img: d, imgNight: n, doorOff: 46, name: 'The Bakehouse', chimneys: [64] });
  }
  {
    const [d, n] = cot({ w: 84, wall: '#e2d4b0', roof: 'slate', sign: 'mug', windows: [12, 60], door: 42, chimneys: [16], extra: (x, o) => { for (let k = 0; k < 3; k++) { x.fillStyle = '#7a4e2a'; x.fillRect(o.Rr - 14 - k * 9, o.wallBot - 10, 8, 10); x.fillStyle = '#3a3a3a'; x.fillRect(o.Rr - 14 - k * 9, o.wallBot - 8, 8, 1); } } });
    addBuilding('brewhouse', { ...World.L.buildings.brewhouse, img: d, imgNight: n, doorOff: 42, name: 'The Brewhouse', chimneys: [16] });
  }
  {
    const [d, n] = cot({ w: 92, wall: '#d8c8a0', roof: 'thatch', sign: 'saw', windows: [12], door: 40, chimneys: [70],
      extra: (x, o) => { x.fillStyle = '#3a2414'; x.fillRect(58, o.wallTop + 12, 26, o.wallBot - o.wallTop - 12); for (let k = 0; k < 4; k++) { disc(x, 64 + (k % 2) * 8, o.wallBot - 4 - Math.floor(k / 2) * 6, 3, '#7a5030'); x.fillStyle = '#d8b07a'; x.fillRect(63 + (k % 2) * 8, o.wallBot - 5 - Math.floor(k / 2) * 6, 2, 2); } } });
    addBuilding('workshop', { ...World.L.buildings.workshop, img: d, imgNight: n, doorOff: 40, name: 'The Woodwright\'s Workshop', chimneys: [70] });
  }
  {
    const [d, n] = cot({ w: 76, wall: '#e8e0c8', roof: 'thatch', sign: 'herb', windows: [10, 54], door: 38, chimneys: [52], doorCol: '#3a6a4a',
      extra: (x, o) => { for (let k = 0; k < 40; k++) { x.fillStyle = k % 3 ? '#3a7a3a' : '#5aa04a'; x.fillRect(o.L + (k * 7) % (o.Rr - o.L), o.wallTop + ((k * 13) % 30), 2, 2); } } });
    addBuilding('herbalist', { ...World.L.buildings.herbalist, img: d, imgNight: n, doorOff: 38, name: 'The Herbalist\'s Cottage', chimneys: [52] });
  }
  {
    const [d, n] = cot({ w: 84, h: 84, roof: 'barn', sign: 'sack', windows: [], door: 42 });
    addBuilding('store', { ...World.L.buildings.store, img: d, imgNight: n, doorOff: 42, name: 'The Common Store' });
  }
  {
    const [d, n] = cot({ w: 92, h: 84, roof: 'barn', sign: 'grain', windows: [], door: 46 });
    addBuilding('barn', { ...World.L.buildings.barn, img: d, imgNight: n, doorOff: 46, name: 'The Granary Barn' });
  }
  // Mill on the north bank, wheel in the river
  {
    const mx = World.L.mills[0];
    let top = 99; for (let y = World.L.millScanFrom ?? 30; y < MAP_H; y++) if (tileAt(mx, y) === T.WATER) { top = y; break; }
    const millImg = makeMill();
    const b = addBuilding('mill', { x0: mx - 2, x1: mx + 2, y0: top - 5, y1: top - 2, img: millImg, imgNight: millImg, doorOff: 34, name: 'The Old Mill', rows: 4 });
    World.millWheel = { x: (mx + 3.2) * 16, y: (top - 0.4) * 16, r: 15, a: 0, wallX: b.left + millImg.width - 6, wallY: b.bottom - 14 };
    World.millWheels = [World.millWheel];
    for (let y = top - 3; y <= top - 1; y++) blk(mx + 3, y);
    b.stepX = b.left + 34; b.stepY = b.bottom + 10;
  }
  // a second watermill upstream, on the west reach of the river
  if (World.L.mills[1] != null) {
    const mx = World.L.mills[1];
    let top = 99; for (let y = World.L.millScanFrom ?? 30; y < MAP_H; y++) if (tileAt(mx, y) === T.WATER) { top = y; break; }
    const millImg = makeMill();
    const b = addBuilding('mill2', { x0: mx - 2, x1: mx + 2, y0: top - 5, y1: top - 2, img: millImg, imgNight: millImg, doorOff: 34, name: 'The West Mill', rows: 4 });
    // the river bends here, so the wheel sits at its own water line
    let wtop = top; for (let y = top - 3; y < MAP_H; y++) if (tileAt(mx + 3, y) === T.WATER) { wtop = y; break; }
    const w = { x: (mx + 3.2) * 16, y: (wtop - 0.4) * 16, r: 15, a: 1.3, wallX: b.left + millImg.width - 6, wallY: b.bottom - 14 };
    World.millWheels.push(w);
    for (let y = top - 3; y <= wtop - 1; y++) blk(mx + 3, y);
    b.stepX = b.left + 34; b.stepY = b.bottom + 10;
  }
  // a windmill on the high ground above the village, sails turning in the breeze
  {
    const [wx, wy] = World.L.windmill;
    const img = makeWindmill();
    const b = addBuilding('windmill', { x0: wx - 1, x1: wx + 1, y0: wy - 2, y1: wy, img, imgNight: img, doorOff: 28, name: 'The Windmill', rows: 3 });
    World.windmill = { x: b.left + 28, y: b.bottom - 80, a: 0, r: 42, sortY: b.bottom };
    for (let y = wy - 5; y <= wy; y++) for (let x = wx - 3; x <= wx + 3; x++) res(x, y);
  }

  yield 'The mills, the inn and the workshops go up';
  // --- Plaza: well, market, notice board, signpost, benches, lamps ---
  const SQ = World.L.plaza;
  addStatic(makeWell(), SQ.well[0] * 16, SQ.well[1] * 16 + 2); blk(...SQ.wellBlk);
  World.wellSpot = makeSpot(SQ.well[0] * 16, SQ.well[1] * 16 + 12, 'up', 'stand', 'well');
  World.wells = [World.wellSpot];
  addStatic(makeStall(), SQ.stall[0] * 16, SQ.stall[1] * 16); for (const b of SQ.stallBlk) blk(...b);
  World.marketSpot = makeSpot(SQ.market[0] * 16, SQ.market[1] * 16, 'up', 'stand', 'market');
  addStatic(makeNoticeBoard(), SQ.board[0] * 16, SQ.board[1] * 16); blk(...SQ.boardBlk);
  World.postSpot = makeSpot(SQ.post[0] * 16, SQ.post[1] * 16, 'up', 'stand', 'post');
  addStatic(makeSignpost(), SQ.sign[0] * 16, SQ.sign[1] * 16); blk(...SQ.signBlk);
  const benchImg = makeBench();
  for (const [bx, by] of World.L.benches) {
    const tx = Math.floor(bx), ty = Math.floor(by);
    if (!(tileAt(tx, ty) === T.GRASS || tileAt(tx, ty) === T.PATH || tileAt(tx, ty) === T.COBBLE) || World.block[tIdx(tx, ty)]) continue;
    addStatic(benchImg, bx * 16 + 8, ty * 16 + 12, { sortBias: -1 });
    World.benches.push(makeSpot(bx * 16 + 8, ty * 16 + 12, 'down', 'sit', 'bench')); res(tx, ty);
  }
  const lampImg = makeLampPost(false), lampLit = makeLampPost(true);
  for (const [lx, ly] of World.L.lamps) {
    const tx = Math.floor(lx), ty = Math.floor(ly - 0.5);
    if (World.block[tIdx(tx, ty)] || tileAt(tx, ty) === T.WATER || tileAt(tx, ty) === T.HILL) continue;
    const st = addStatic(lampImg, lx * 16, ly * 16, { snow: true });
    st.alt = st.baseAlt = lampLit;
    World.lamps.push({ x: lx * 16, y: ly * 16 - 22, footX: lx * 16 + (walkable(tx + 1, ty) ? 9 : -9), footY: ly * 16 + 2, st, lit: false, litAt: 0 });
    blk(tx, ty);
  }

  // --- Story circle beneath an old oak ---
  addStatic(makeTree(5151, 'great'), STORY.x * 16 + 8, (STORY.y + 1) * 16, { gen: { type: 'tree', seed: 5151, kind: 'great' } });
  for (let x = STORY.x - 1; x <= STORY.x + 1; x++) blk(x, STORY.y);
  res(STORY.x, STORY.y, 2);
  World.storyteller = makeSpot(STORY.x * 16 + 8, (STORY.y + 1) * 16 + 10, 'down', 'sit', 'story');
  const logImg = makeLogSeat();
  for (const [dx, dy, f] of [[-2.2, 2.4, 'right'], [2.2, 2.4, 'left'], [-1, 3.3, 'up'], [1, 3.3, 'up'], [0, 3.6, 'up'], [-2.6, 1.6, 'right'], [2.6, 1.6, 'left']]) {
    const x = (STORY.x + dx) * 16 + 8, y = (STORY.y + dy) * 16 + 8;
    World.storySeats.push(makeSpot(x, y, f, 'sit', 'storyseat'));
  }
  for (const [dx, dy] of [[-2.2, 2.9], [2.2, 2.9]]) addStatic(logImg, (STORY.x + dx) * 16 + 8, (STORY.y + dy) * 16 + 8, { sortBias: -6 });

  // --- Party field ---
  addStatic(makeTree(4242, 'great'), PARTY.treeX * 16 + 8, (PARTY.treeY + 1) * 16, { gen: { type: 'tree', seed: 4242, kind: 'great' } });
  for (let x = PARTY.treeX - 1; x <= PARTY.treeX + 1; x++) blk(x, PARTY.treeY);
  res(PARTY.treeX, PARTY.treeY, 2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    World.partySpots.push(makeSpot((PARTY.danceX + Math.cos(a) * 3) * 16 + 8, (PARTY.danceY + Math.sin(a) * 1.9) * 16, 'down', 'dance', 'party'));
  }
  for (let y = PARTY.danceY - 3; y <= PARTY.danceY + 3; y++) for (let x = PARTY.cx - 4; x <= PARTY.cx + 4; x++) res(Math.floor(x), Math.floor(y));
  const tableImg = makeTable();
  for (const [tx, ty] of PARTY.tables) {
    const x = tx * 16 + 8, y = ty * 16 + 10;
    addStatic(tableImg, x, y + 2); blk(tx, ty); res(tx, ty, 1);
    World.partySeats.push(makeSpot(x, y - 7, 'down', 'sit', 'partyseat'), makeSpot(x - 16, y + 1, 'right', 'sit', 'partyseat'), makeSpot(x + 16, y + 1, 'left', 'sit', 'partyseat'));
  }
  const fenceV = makeFence(false);
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI * 2 + 0.3;
    const px = (PARTY.cx + Math.cos(a) * 7) * 16 + 8, py = (PARTY.cy - 1 + Math.sin(a) * 4.6) * 16 + 8;
    if (!walkable(Math.floor(px / 16), Math.floor((py - 2) / 16))) continue;
    addStatic(fenceV, px, py);
    World.partyPoles.push({ x: px, y: py - 17 });
    blk(Math.floor(px / 16), Math.floor((py - 2) / 16));
  }
  addStatic(makeMaypole(), PARTY.maypole[0] * 16, PARTY.maypole[1] * 16, { seasons: ['spring'], snow: false }); blk(Math.floor(PARTY.maypole[0]), Math.floor(PARTY.maypole[1]));
  World.bonfire = { x: PARTY.bonfire[0] * 16 + 8, y: PARTY.bonfire[1] * 16 + 8 };
  blk(PARTY.bonfire[0], PARTY.bonfire[1]);
  for (const [hx, hy] of PARTY.hay) { addStatic(makeHay(), hx * 16, hy * 16); blk(hx - 1, hy - 1); }

  // --- Pipe-weed field ---
  const fenceH = makeFence(true);
  for (let x = WEED_FIELD.x0; x <= WEED_FIELD.x1; x++) if (tileAt(x, WEED_FIELD.y0 - 1) === T.GRASS) { addStatic(fenceH, x * 16 + 8, WEED_FIELD.y0 * 16 - 4); blk(x, WEED_FIELD.y0 - 1); }
  for (let y = WEED_FIELD.y0; y <= WEED_FIELD.y1; y++) {
    if ((y - WEED_FIELD.y0) % 2 === 1) continue;
    for (let x = WEED_FIELD.x0; x <= WEED_FIELD.x1; x++) World.weed.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, stage: 1 + Math.floor(rng() * 4), prog: rng(), claimed: null });
  }
  for (let y = WEED_FIELD.y0 - 1; y <= WEED_FIELD.y1 + 1; y++) for (let x = WEED_FIELD.x0 - 1; x <= WEED_FIELD.x1 + 1; x++) res(x, y);

  // --- Barley fields ---
  for (const f of FIELDS) {
    const field = { ...f, plots: [] };
    for (let y = f.y0; y <= f.y1; y += 2) for (let x = f.x0; x <= f.x1; x++) {
      if (tileAt(x, y) !== T.FIELD) continue;
      field.plots.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, stage: 1 + Math.floor(rng() * 3), prog: rng(), claimed: null });
    }
    World.fields.push(field);
    for (let y = f.y0 - 1; y <= f.y1 + 1; y++) for (let x = f.x0 - 1; x <= f.x1 + 1; x++) res(x, y);
    const sx = Math.round((f.x0 + f.x1) / 2), sy = Math.round((f.y0 + f.y1) / 2) | 1;
    addStatic(makeScarecrow(), sx * 16 + 8, sy * 16 + 14); blk(sx, sy);
    field.scarecrow = { x: sx * 16 + 8, y: sy * 16 };
  }
  // henhouse beside the barn
  const [hhx, hhy] = World.L.henhouse;
  addStatic(makeHenhouse(), hhx * 16 + 8, hhy * 16 + 4); blk(hhx - 1, hhy - 1); blk(hhx, hhy - 1); blk(hhx + 1, hhy - 1);
  World.henhouse = { x: hhx * 16 + 8, y: hhy * 16 + 12 };
  for (let i = 0; i < 5; i++) World.hens.push({ x: (hhx - 3 + i * 1.5) * 16, y: (hhy + 1.5) * 16, a: rng() * 6, t: 0, hx: hhx * 16, hy: (hhy + 1.5) * 16 });

  // --- Herb beds by the herbalist ---
  const HB = World.L.herbs;
  for (let y = HB.y0; y <= HB.y1; y += 2) for (let x = HB.x0; x <= HB.x1; x++) {
    if (tileAt(x, y) !== T.GRASS) continue;
    tiles[tIdx(x, y)] = T.SOIL; res(x, y);
    World.herbBeds.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, stage: 1 + Math.floor(rng() * 4), prog: rng(), claimed: null });
  }

  // --- Orchard with beehives ---
  const appleImgs = [0, 1, 2].map((k) => 900 + k);
  const OR = World.L.orchard;
  for (let gy = OR.y0; gy <= OR.y1; gy += 4) for (let gx = OR.x0; gx <= OR.x1; gx += 5) {
    const ax = gx + ((gy - OR.y0) % 8 === 4 ? 2 : 0), ay = gy;
    if (tileAt(ax, ay) !== T.GRASS || World.reserved[tIdx(ax, ay)]) continue;
    const seed = appleImgs[(ax + ay) % 3];
    addStatic(makeTree(seed, 'apple'), ax * 16 + 8, (ay + 1) * 16 - 2, { gen: { type: 'tree', seed, kind: 'apple' } }); blk(ax, ay); res(ax, ay, 1);
    World.orchard.push({ tx: ax, ty: ay, x: ax * 16 + 8, y: (ay + 1) * 16 + 12, apples: 2 + Math.floor(rng() * 3), claimed: null });
    if (walkable(ax, ay + 1) && World.shade.length < 6) World.shade.push(treeBackSpot(ax * 16 + 8, (ay + 1) * 16 - 2));
  }
  for (const [hx, hy] of World.L.hives) {
    addStatic(makeBeehive(), hx * 16 + 8, hy * 16 + 12); blk(hx, Math.floor(hy));
    World.hives.push({ x: hx * 16 + 8, y: (Math.floor(hy) + 1) * 16 + 12, honey: 2, claimed: null });
  }

  // --- Fishing spots: grass right above water (river and pond) ---
  const fishCands = [];
  for (let y = 1; y < MAP_H - 2; y++) for (let x = 2; x < MAP_W - 2; x++) {
    const t = tiles[tIdx(x, y)];
    if (t !== T.GRASS || World.reserved[tIdx(x, y)]) continue;
    if (tiles[tIdx(x, y + 1)] === T.WATER && tiles[tIdx(x, y + 2)] === T.WATER) fishCands.push([x, y, 'down']);
  }
  fishCands.sort(() => rng() - 0.5);
  for (const [x, y, f] of fishCands) {
    if (World.fishing.some((s) => Math.abs(s.x / 16 - x) < 6 && Math.abs(s.y / 16 - y) < 5)) continue;
    if (World.fishing.length >= 16) break;
    World.fishing.push(makeSpot(x * 16 + 8, y * 16 + 12, f, 'sit', 'fish')); res(x, y);
  }

  // --- Pens, a second orchard and allotments, then spare land for the village to grow into ---
  planFarmland();
  planLots(seed);
  planMemorialGreen();
  // level the built-on ground, and work the land out again over it
  gatherPads();
  // rocky escarpments out in the wilder land, before anything grows on them
  computeCliffs(seed);
  computeLand(seed);
  yield 'Pens, orchards and allotments are laid out';

  // --- Trees: woods along the borders (thick to the east), copses elsewhere ---
  const noise = makeNoise(seed + 7);
  const nearNonGrass = (x, y, r) => {
    for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) {
      if (!inMap(i, j)) continue;
      const t = tiles[tIdx(i, j)];
      if (t !== T.GRASS || World.reserved[tIdx(i, j)]) return true;
    }
    return false;
  };
  const nearRoad = (x, y, r) => {
    for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) if (inMap(i, j) && (tiles[tIdx(i, j)] === T.PATH || tiles[tIdx(i, j)] === T.BRIDGE)) return true;
    return false;
  };
  const treeAt = [];
  World.treeAt = treeAt;
  plantHedges(rng, { addStatic, blk });
  yield gen('hedges') ? 'Hawthorn hedges grow along the field edges' : 'The fields are left open, with no hedges';
  plantWoods(rng, { addStatic, blk, nearRoad, nearNonGrass, noise, treeAt });
  yield 'Woods grow where nobody has cleared them';

  // --- Weeping willows along the river and round the pond ---
  for (let y = 2; y < MAP_H - 2; y++) for (let x = 2; x < MAP_W - 2; x++) {
    if (tiles[tIdx(x, y)] !== T.GRASS || World.reserved[tIdx(x, y)] || World.block[tIdx(x, y)] || nearRoad(x, y, 1)) continue;
    let wet = false;
    for (let j = y - 1; j <= y + 1; j++) for (let i = x - 1; i <= x + 1; i++) if (tiles[tIdx(i, j)] === T.WATER) wet = true;
    if (!wet || treeAt.some(([tx, ty]) => Math.abs(tx - x) < 4 && Math.abs(ty - y) < 3) || rng() > 0.09 || onBank(x, y)) continue;
    const ws = 600 + Math.floor(rng() * 10);
    addStatic(makeTree(ws, 'willow'), x * 16 + 8, (y + 1) * 16 - 2, { gen: { type: 'tree', seed: ws, kind: 'willow' } });
    blk(x, y); treeAt.push([x, y]);
  }

  yield 'Willows lean over the water';
  // --- Woodland spots: mushrooms, wild herbs, timber ---
  const woodsCands = [];
  for (let y = 4; y < MAP_H - 3; y++) for (let x = 3; x < MAP_W - 2; x++) {
    if (tiles[tIdx(x, y)] !== T.GRASS || World.block[tIdx(x, y)] || World.reserved[tIdx(x, y)]) continue;
    let trees = 0;
    for (const [tx, ty] of treeAt) if (Math.abs(tx - x) <= 2 && Math.abs(ty - y) <= 2) trees++;
    if (trees >= 2) woodsCands.push([x, y, trees]);
  }
  // mushrooms like it damp and shady; herbs like sunny, dry ground at the woods' edge
  const damp = (x, y) => landAt('moist', x, y) * 1.5 + (landAt('soil', x, y) === SOIL.CLAY ? 0.3 : 0) + rng() * 0.4;
  woodsCands.sort((a, b) => damp(b[0], b[1]) - damp(a[0], a[1]));
  const farFrom = (list, x, y, d) => !list.some((m) => Math.abs(m.tx - x) < d && Math.abs(m.ty - y) < d);
  for (const [x, y] of woodsCands) {
    if (World.mushrooms.length < 22 && farFrom(World.mushrooms, x, y, 6)) {
      World.mushrooms.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, amount: 2 + Math.floor(rng() * 2), regrow: 0, claimed: null, toad: rng() < 0.3 });
      continue;
    }
    if (World.wildHerbs.length < 14 && farFrom(World.wildHerbs, x, y, 7) && farFrom(World.mushrooms, x, y, 2) && landAt('sun', x, y) > 0.5 && landAt('moist', x, y) < 0.45) {
      World.wildHerbs.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, amount: 2, regrow: 0, claimed: null });
    }
  }
  // timber: spots beside trees on the edge of the eastern woods and the northern woods
  const timberCands = woodsCands.filter(([x, y, n]) => (forestDepth(x, y) >= -4 || y <= 6) && n >= 2);
  for (const [x, y] of timberCands) {
    if (World.woodSpots.length >= 14) break;
    if (!farFrom(World.woodSpots, x, y, 4)) continue;
    const tree = treeAt.find(([tx, ty]) => Math.abs(tx - x) <= 1 && Math.abs(ty - y) <= 1);
    if (!tree) continue;
    World.woodSpots.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, stock: 4, claimed: null, facing: tree[0] < x ? 'left' : tree[0] > x ? 'right' : 'up' });
  }

  // --- Long grass, reeds and rocks ---
  plantNature(rng, addStatic, blk);
  yield 'Long grass, reeds and stones';

  // --- Decorative wildflowers ---
  plantWildflowers(rng);
  yield 'Wildflowers come up in drifts';
  for (const h of World.homes) if (h.built) addHomeFlowers(h);
  for (const h of World.homes) plantHill(h);

  // --- Ducks ---
  World.ducks = [0, 1, 2, 3].map((i) => ({ x: (POND.cx + i - 1.5) * 16, y: POND.cy * 16 + (i % 2) * 6, a: rng() * 6, t: 0 }));
  World.waterTiles = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (tiles[tIdx(x, y)] === T.WATER) World.waterTiles.push([x, y]);

  keepReachable();
  computePixelTypes(seed);
  yield 'Ready';
}

// The lanes. Each stretch between two of a lane's waypoints follows the
// least-cost way across the land (a cheap A*): steep ground and terrace banks
// cost more, so lanes run along the contours and take banks at an angle; wet
// ground near the river costs more; joining a lane already laid is cheap, so
// lanes merge. Each stretch keeps within a couple of tiles of its straight
// line, so the buildings set along it stay clear. River crossings stay
// straight, as bridges.
function routeRoads(seed) {
  const tiles = World.tiles, W = MAP_W, H = MAP_H;
  const nh = makeNoise(seed + 9);
  const hgt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) hgt[y * W + x] = landHeight(nh, x + 0.5, y + 0.5);
  const lvl = (i) => Math.floor(hgt[i] * TERRACES);
  const carve = (px, py, r) => {
    for (let y = Math.floor(py - r - 1); y <= Math.ceil(py + r + 1); y++)
      for (let x = Math.floor(px - r - 1); x <= Math.ceil(px + r + 1); x++) {
        if (!inMap(x, y) || Math.hypot(x - px, y - py) > r) continue;
        const cur = tiles[tIdx(x, y)];
        if (cur === T.HILL) continue;
        tiles[tIdx(x, y)] = cur === T.WATER || cur === T.BRIDGE ? T.BRIDGE : T.PATH;
      }
  };
  const straight = (ax, ay, bx, by, r) => { const len = Math.hypot(bx - ax, by - ay); for (let t = 0; t <= len; t += 0.2) carve(ax + (bx - ax) * (t / len), ay + (by - ay) * (t / len), r); };
  const crossesWater = (ax, ay, bx, by) => { const len = Math.hypot(bx - ax, by - ay); for (let t = 0; t <= len; t += 0.5) { const x = Math.round(ax + (bx - ax) * (t / len)), y = Math.round(ay + (by - ay) * (t / len)); if (inMap(x, y) && tiles[tIdx(x, y)] === T.WATER) return true; } return false; };
  const g = new Float32Array(W * H), from = new Int32Array(W * H), closed = new Uint8Array(W * H);
  const route = (ax, ay, bx, by) => {
    const sx = Math.round(ax), sy = Math.round(ay), ex = Math.round(bx), ey = Math.round(by);
    const len = Math.hypot(ex - sx, ey - sy) || 1, ux = (ex - sx) / len, uy = (ey - sy) / len;
    const offLine = (x, y) => Math.abs((x - sx) * uy - (y - sy) * ux);
    g.fill(1e9); closed.fill(0); from.fill(-1);
    const open = [[0, sy * W + sx]];
    g[sy * W + sx] = 0;
    while (open.length) {
      let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;
      const [, i] = open.splice(bi, 1)[0];
      if (closed[i]) continue;
      closed[i] = 1;
      const x = i % W, y = (i / W) | 0;
      if (x === ex && y === ey) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (!inMap(nx, ny) || offLine(nx, ny) > 2.2) continue;
        const n = ny * W + nx, t = tiles[n];
        if (t === T.HILL || t === T.WATER) continue;
        let c = (dx && dy ? 1.414 : 1) * (t === T.PATH || t === T.BRIDGE ? 0.45 : 1);
        c += Math.abs(hgt[n] - hgt[i]) * 60;
        if (lvl(n) !== lvl(i)) c += 3.5;
        if (t === T.FIELD || t === T.WEED || t === T.SOIL) c += 4;
        const pn = g[i] + c;
        if (pn < g[n]) { g[n] = pn; from[n] = i; open.push([pn + Math.hypot(ex - nx, ey - ny), n]); }
      }
    }
    const end = ey * W + ex;
    if (from[end] < 0 && end !== sy * W + sx) return null;
    const path = [];
    for (let i = end; i >= 0; i = from[i]) { path.push([i % W, (i / W) | 0]); if (i === sy * W + sx) break; }
    return path.reverse();
  };
  for (const [r, ...pts] of ROADS) {
    for (let s = 0; s < pts.length - 1; s++) {
      const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
      const p = !crossesWater(ax, ay, bx, by) && Math.hypot(bx - ax, by - ay) > 3 ? route(ax, ay, bx, by) : null;
      if (!p) { straight(ax, ay, bx, by, r); continue; }
      // smooth the way so it curves rather than zigzags, then lay it
      const pts2 = [[ax, ay], ...p.slice(1, -1).map(([x, y]) => [x, y]), [bx, by]];
      for (let pass = 0; pass < 3; pass++) for (let k = 1; k < pts2.length - 1; k++) pts2[k] = [(pts2[k - 1][0] + pts2[k][0] * 2 + pts2[k + 1][0]) / 4, (pts2[k - 1][1] + pts2[k][1] * 2 + pts2[k + 1][1]) / 4];
      for (let k = 0; k < pts2.length - 1; k++) straight(pts2[k][0], pts2[k][1], pts2[k + 1][0], pts2[k + 1][1], r);
    }
  }
}

// Raises a knoll on the map and makes the home record for it.
// A hobbit-hole is dug into its own little hillside, not a dome: each one's
// hill is a lopsided, lumpy rise (wider one way than the other, so the door
// sits off-centre) whose south side is cut back into a face of dry-stone wall
// with the door and windows set in it. The same shape gives the hill tiles
// and the painted hill.
function homeShape(d, id, doorTy) {
  if (d._shape && d._shape.id === id) return d._shape;
  const r = mulberry32(id * 4409 + 23);
  const shift = d.grand ? (r() - 0.5) * 1.6 : (r() < 0.5 ? -1 : 1) * (0.7 + r() * 1.1);
  const sh = {
    id, hcx: d.cx + 0.5 + shift, hcy: d.cy + 0.3, hrx: d.rx * (1.1 + r() * 0.28), hry: d.ry * (0.95 + r() * 0.22),
    ph: [r() * 6.3, r() * 6.3, r() * 6.3], amp: [0.06 + r() * 0.05, 0.035 + r() * 0.035, 0.025], pw: 2.1 + r() * 0.7,
  };
  // how far out a point is: under 1 is inside the hill (x, y in tiles)
  sh.u = (x, y) => {
    const nx = (x - sh.hcx) / sh.hrx, ny = (y - sh.hcy) / sh.hry;
    const th = Math.atan2(ny, nx);
    const rad = 1 + sh.amp[0] * Math.sin(2 * th + sh.ph[0]) + sh.amp[1] * Math.sin(3 * th + sh.ph[1]) + sh.amp[2] * Math.sin(5 * th + sh.ph[2]);
    return Math.pow(Math.pow(Math.abs(nx), sh.pw) + Math.pow(Math.abs(ny), sh.pw), 1 / sh.pw) / rad;
  };
  // the foot of the hill's south face in a column (tiles), or null
  sh.bottom = (x) => {
    let y = sh.hcy;
    if (sh.u(x, y) >= 1) return null;
    while (y < sh.hcy + sh.hry * 1.5 && sh.u(x, y + 0.02) < 1) y += 0.02;
    return y;
  };
  // set it down so the face meets the ground exactly where the door is
  if (doorTy != null) { const b = sh.bottom(d.cx + 0.5); if (b != null) sh.hcy += doorTy + 1 - b; }
  d._shape = sh;
  return sh;
}

function createHome(d, i, surname, name) {
  const tiles = World.tiles;
  // the door's row comes from the knoll's footprint (the lanes were laid to it)
  let doorTy = 0;
  for (let y = Math.floor(d.cy - d.ry - 1); y <= Math.ceil(d.cy + d.ry + 1); y++) {
    const ny = (y - d.cy) / d.ry;
    if (ny * ny < 1) doorTy = Math.max(doorTy, y);
  }
  const sh = homeShape(d, i, doorTy);
  for (let y = Math.floor(sh.hcy - sh.hry * 1.3); y <= doorTy; y++) for (let x = Math.floor(sh.hcx - sh.hrx * 1.3); x <= Math.ceil(sh.hcx + sh.hrx * 1.3); x++) {
    if (!inMap(x, y)) continue;
    if (sh.u(x + 0.5, y + 0.5) < 1 || (x === d.cx && y > sh.hcy)) tiles[tIdx(x, y)] = T.HILL;
  }
  const stepTy = doorTy + 1;
  const doorX = d.cx * 16 + 8, doorY = (doorTy + 1) * 16;
  const home = {
    id: i, name, def: d, grand: !!d.grand, built: !d.site, doorColor: i === 0 ? '#2f6b34' : DOOR_COLS[(i * 3 + 1) % DOOR_COLS.length],
    doorX, doorY, doorR: d.grand ? 9 : 7, stepX: doorX, stepY: stepTy * 16 + 12, stepTile: [d.cx, stepTy],
    windows: [], chimney: { x: doorX + Math.round(d.rx * 16 * 0.35), y: Math.round((d.cy + 0.5) * 16 - d.ry * 16 * 0.55) },
    pantry: emptyPantry(), cropType: CROP_TYPES[i % CROP_TYPES.length], plots: [], bench: null, inside: [], doorAnim: 0, lit: false,
    surname, chilly: false, buildProg: 0, kind: 'home',
  };
  if (home.built) { home.pantry.veg = 3; home.pantry.bread = 2; }
  // every hole is a little different
  const vr = mulberry32(i * 7919 + 17);
  const V = home.v = {
    frame: Math.floor(vr() * 3), door: Math.floor(vr() * 3), square: vr() < 0.35, nwin: d.grand ? 4 : 1 + Math.floor(vr() * 3.2),
    porch: vr() < 0.35, lantern: vr() < 0.45, boxes: vr() < 0.55, chim2: vr() < 0.3, roofWin: vr() < 0.3,
    tint: (vr() - 0.5) * 0.14, flowers: vr() < 0.45, frameCol: ['#4a2e1a', '#2f4a3a', '#5a2a2a', '#3a3a5a'][Math.floor(vr() * 4)],
  };
  if (d.grand) Object.assign(V, { frame: 0, door: 0, porch: false, lantern: true, boxes: true });
  // windows are set into the stone face either side of the door, or higher
  // up in the grassy slope, wherever the hill rises behind them
  const foot = (x) => { const b = sh.bottom(x / 16); return b == null ? null : b * 16; };
  const win = (dx, lift) => {
    const x = Math.round(doorX + dx), f = foot(x);
    return f == null ? null : { x, y: Math.round(f - lift) };
  };
  const wo = Math.round(d.rx * 16 * 0.42) + 4;
  const towards = sh.hcx * 16 > doorX ? 1 : -1; // the bigger side of the hill
  const spots = [];
  if (V.nwin === 1) spots.push([towards * wo, 12]);
  else spots.push([-wo, 12], [wo, 12]);
  if (V.nwin >= 3 && !d.grand) spots.push([towards * wo * 1.7, 11]);
  if (d.grand) spots.push([-wo * 1.75, 11], [wo * 1.75, 11]);
  for (const [dx, lift] of spots) { const w = win(dx, lift); if (w) home.windows.push(w); }
  // the chimney rises from the top of the hill
  home.chimney = { x: Math.round(sh.hcx * 16 + (towards > 0 ? 0.25 : -0.25) * sh.hrx * 16), y: Math.round((sh.hcy - sh.hry * 0.55) * 16) };
  if (V.chim2) home.chimney2 = { x: Math.round(sh.hcx * 16 - towards * sh.hrx * 16 * 0.45), y: Math.round((sh.hcy - sh.hry * 0.3) * 16) };
  if (V.roofWin) home.roofWin = { x: Math.round(sh.hcx * 16 + (vr() - 0.5) * sh.hrx * 8), y: Math.round((sh.hcy - sh.hry * 0.4) * 16) };
  return home;
}

function addHomeFlowers(h) {
  for (const off of [-2, 2]) {
    const fx = h.doorX + off * 16 * (h.grand ? 1.6 : 1.2);
    World.flowers.push({ x: Math.round(fx), y: h.doorY + 2, seed: (h.id * 31 + off * 7) & 255, ground: true });
  }
}

// Garden plots, a bench, a mailbox and a woodpile for a lived-in home.
function furnishHome(h, rng = Math.random) {
  const tiles = World.tiles, res = World._res, blk = World._blk, addStatic = World._addStatic;
  const [sx, sy] = h.stepTile;
  res(sx, sy, 1); res(sx, sy + 1, 0);
  const plotXs = h.grand ? [sx - 6, sx - 5, sx - 4, sx - 3] : [sx - 4, sx - 3, sx - 2];
  const plotYs = h.grand ? [sy, sy + 1] : [sy];
  for (const py of plotYs) for (const px of plotXs) {
    if (tileAt(px, py) !== T.GRASS && tileAt(px, py) !== T.LAWN) continue;
    tiles[tIdx(px, py)] = T.SOIL; res(px, py);
    h.plots.push({ tx: px, ty: py, x: px * 16 + 8, y: py * 16 + 12, stage: 1 + Math.floor(rng() * 4), prog: rng() });
  }
  const bx = sx + 2;
  if ([T.GRASS, T.LAWN, T.PATH].includes(tileAt(bx, sy)) && !World.block[tIdx(bx, sy)]) {
    addStatic(makeBench(), bx * 16 + 8, sy * 16 + 12, { sortBias: -1 });
    h.bench = makeSpot(bx * 16 + 8, sy * 16 + 12, 'down', 'sit', 'bench');
    h.bench.home = h;
    World.benches.push(h.bench); res(bx, sy);
  }
  addStatic(makeMailbox(h.doorColor), (sx + 1) * 16 + 4, sy * 16 + 10); blk(sx + 1, sy);
  h.mailbox = { x: (sx + 1) * 16 + 4, y: sy * 16 + 14 };
  if (tileAt(sx + 4, sy) === T.GRASS && !World.block[tIdx(sx + 4, sy)]) { addStatic(makeWoodpile(), (sx + 4) * 16 + 8, sy * 16 + 12); blk(sx + 4, sy); }
  // about half the holes have an apple tree in the garden
  if (!h.grand && hash2(h.id, 41) < 0.55) {
    for (const [ax, ay] of [[sx - 6, sy], [sx + 6, sy], [sx - 6, sy - 1], [sx + 6, sy + 1]]) {
      if (tileAt(ax, ay) !== T.GRASS || World.block[tIdx(ax, ay)] || World.reserved[tIdx(ax, ay)] || !walkable(ax, ay + 1)) continue;
      const seed = 900 + (h.id % 3);
      addStatic(makeTree(seed, 'apple'), ax * 16 + 8, (ay + 1) * 16 - 2, { gen: { type: 'tree', seed, kind: 'apple' } }); blk(ax, ay);
      World.orchard.push({ tx: ax, ty: ay, x: ax * 16 + 8, y: (ay + 1) * 16 + 12, apples: 1, claimed: null, home: h.id });
      break;
    }
  }
}

// A finished new home: furnish it and redraw its door surround on the ground.
function completeHome(h) {
  h.built = true; h.buildProg = 1;
  if (h.siteStatic) h.siteStatic.hidden = true;
  furnishHome(h);
  addHomeFlowers(h);
  applySeasonToStatics(World.season);
  // the tiles under the new garden plots changed, so repaint the patch
  repaintRect((h.def.cx - 8) * 16, (h.def.cy - 5) * 16, 17 * 16, 11 * 16);
  if (World.paintJob) startSeasonPaint(World.paintJob.season);
}

// ---------------------------------------------------------------------------
// Ground painting. The jittered tile type of every pixel is worked out once;
// painting a season is then a quick colour pass, done a slice at a time so a
// season change never stalls the game.
// ---------------------------------------------------------------------------
// Deep, saturated greens; earthy lanes with a dark rim; water that runs from
// near-navy in the middle through to pale foam at the banks.
const GROUND_PAL = {
  spring: { G1: '#3e7a2e', G2: '#78b84a', L2: '#8cc85a', P1: '#9a7246', P2: '#c89e66', PR: '#5e3f25', S1: '#5a3a20', S2: '#7a5430', W1: '#1c4870', W2: '#3a80b4', WS: '#5aa2d0', foam: '#bfe4f4', bank: '#56602c', fleck: 0.005 },
  summer: { G1: '#346e2a', G2: '#68ad45', L2: '#7cbc52', P1: '#9a7246', P2: '#c89e66', PR: '#5e3f25', S1: '#5a3a20', S2: '#7a5430', W1: '#1c4870', W2: '#3a80b4', WS: '#5aa2d0', foam: '#bfe4f4', bank: '#52582a', fleck: 0.002 },
  autumn: { G1: '#5a6a26', G2: '#90a040', L2: '#a2ae4e', P1: '#946e48', P2: '#c09a68', PR: '#5a3c24', S1: '#56381e', S2: '#74502e', W1: '#1e4466', W2: '#386e9c', WS: '#5690bc', foam: '#c4dcea', bank: '#6a5a2c', fleck: 0.008 },
  winter: { G1: '#c8d6e2', G2: '#f0f6fc', L2: '#ffffff', P1: '#a0907c', P2: '#c4b8a6', PR: '#7a6e60', S1: '#bcc8d4', S2: '#dce4ec', W1: '#1e4466', W2: '#2e5e88', WS: '#7aa6c8', foam: '#e8f4fc', bank: '#a8b2ba', fleck: 0 },
};

function computePixelTypes(seed, rect) {
  const W = MAP_W * TILE, H = MAP_H * TILE;
  const base = (t) => (t === T.HILL ? T.GRASS : t === T.BRIDGE ? T.WATER : t);
  // every half-pixel gets a kind of ground; each world pixel takes its top-left half-pixel's
  const W2 = W * GS;
  // Paths, water, grass and lawn are blended across tile edges so that
  // corners round off and stepped diagonals become flowing curves (the tiles
  // folk walk on are unchanged). Fields, soil and cobbles keep their edges.
  const smooth = new Uint8Array(32);
  for (const t of [T.GRASS, T.LAWN, T.PATH, T.WATER]) smooth[t] = 1;
  const SIG = 0.62, gauss = new Float32Array(257);
  for (let i = 0; i <= 256; i++) { const d = i / 64 - 2; gauss[i] = Math.exp(-(d * d) / (2 * SIG * SIG)); }
  // how each tile counts towards its neighbours: bridges carry the path on
  const soft = (tx, ty) => {
    const raw = World.tiles[clamp(ty, 0, MAP_H - 1) * MAP_W + clamp(tx, 0, MAP_W - 1)];
    if (raw === T.BRIDGE) return T.PATH;
    const b = base(raw);
    return smooth[b] ? b : T.GRASS;
  };
  const acc = new Float32Array(32);
  const fill = (px0, py0, px1, py1) => {
    const { type, type2, jx, jy, JW } = World.px;
    const JH = (H >> 1) - 1;
    // each tile's kind for blending, and which tiles' neighbourhoods are all
    // one kind (those need no blending)
    const SW = MAP_W + 2, sg = new Uint8Array(SW * (MAP_H + 2));
    for (let ty = -1; ty <= MAP_H; ty++) for (let tx = -1; tx <= MAP_W; tx++) sg[(ty + 1) * SW + tx + 1] = soft(tx, ty);
    const mixed = new Uint8Array(MAP_W * MAP_H);
    for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
      const c = sg[(ty + 1) * SW + tx + 1];
      for (let j = 0; j <= 2 && !mixed[ty * MAP_W + tx]; j++) for (let i = 0; i <= 2; i++) if (sg[(ty + j) * SW + tx + i] !== c) { mixed[ty * MAP_W + tx] = 1; break; }
    }
    for (let qy = py0 * GS; qy < py1 * GS; qy++) {
      // the wobble is stored every 2 world pixels; blend between them so edges stay smooth
      const gy = qy / 4, iy = Math.min(JH - 1, Math.floor(gy)), wy = gy - iy, fy = qy / GS;
      const r0 = iy * JW, r1 = (iy + 1) * JW;
      for (let qx = px0 * GS; qx < px1 * GS; qx++) {
        const gx = qx / 4, ix = Math.min(JW - 2, Math.floor(gx)), wx = gx - ix;
        const a0 = r0 + ix, a1 = r1 + ix;
        const jxv = (jx[a0] * (1 - wx) + jx[a0 + 1] * wx) * (1 - wy) + (jx[a1] * (1 - wx) + jx[a1 + 1] * wx) * wy;
        const jyv = (jy[a0] * (1 - wx) + jy[a0 + 1] * wx) * (1 - wy) + (jy[a1] * (1 - wx) + jy[a1 + 1] * wx) * wy;
        const wxp = (qx / GS + jxv) / 16, wyp = (fy + jyv) / 16;
        const tx = Math.floor(wxp), ty = Math.floor(wyp);
        const raw = World.tiles[clamp(ty, 0, MAP_H - 1) * MAP_W + clamp(tx, 0, MAP_W - 1)];
        let t = base(raw);
        if (smooth[t] && raw !== T.BRIDGE && tx >= 0 && ty >= 0 && tx < MAP_W && ty < MAP_H && mixed[ty * MAP_W + tx]) {
          acc[0] = acc[1] = acc[2] = acc[6] = 0;
          let best = t, bw = -1;
          const fx = wxp - tx, fyy = wyp - ty;
          const gx0 = gauss[Math.round((fx + 2.5) * 64)], gx1 = gauss[Math.round((fx + 1.5) * 64)], gx2 = gauss[Math.round((fx + 0.5) * 64)];
          for (let j = 0; j <= 2; j++) {
            const gyv = gauss[Math.round((fyy + 2.5 - j) * 64)], row = (ty + j) * SW + tx;
            let u = sg[row], w = (acc[u] += gyv * gx0); if (w > bw) { bw = w; best = u; }
            u = sg[row + 1]; w = (acc[u] += gyv * gx1); if (w > bw) { bw = w; best = u; }
            u = sg[row + 2]; w = (acc[u] += gyv * gx2); if (w > bw) { bw = w; best = u; }
          }
          t = best;
        }
        type2[qy * W2 + qx] = t;
        if (!(qx & 1) && !(qy & 1)) type[(qy >> 1) * W + (qx >> 1)] = t;
      }
    }
  };
  // a changed patch only needs its own pixels worked out again
  if (rect && World.px && World.px.seed === seed) { fill(Math.max(0, rect.x0), Math.max(0, rect.y0), Math.min(W, rect.x1), Math.min(H, rect.y1)); return; }
  const nJ = makeNoise(seed + 1), nJ2 = makeNoise(seed + 2), nC = makeNoise(seed + 3);
  const JW = W / 2, JH = H / 2;
  const jx = new Float32Array(JW * JH), jy = new Float32Array(JW * JH), nz = new Float32Array(JW * JH);
  for (let y = 0; y < JH; y++) for (let x = 0; x < JW; x++) {
    jx[y * JW + x] = (nJ(x * 0.16, y * 0.16) - 0.5) * 9;
    jy[y * JW + x] = (nJ2(x * 0.16, y * 0.16) - 0.5) * 9;
    nz[y * JW + x] = nC(x * 0.05, y * 0.05);
  }
  World.px = { W, H, W2, type: new Uint8Array(W * H), type2: new Uint8Array(W2 * H * GS), noise: nz, JW, jx, jy, seed };
  computeHeights(seed);
  fill(0, 0, W, H);
}

// The lie of the land: the north bank climbs towards the Hill, the south bank
// rises gently, and both fall away to the river. Heights are kept on the same
// 2px grid as the jitter; `level` quantises them into terraces whose edges are
// drawn as grassy banks.
const TERRACES = 4;
function landHeight(nh, x, y) {
  const ry = RIVER_Y(x);
  const north = y < ry;
  const span = north ? ry : MAP_H - ry;
  const away = clamp(Math.abs(y - ry) / span, 0, 1);
  const base = north ? 0.18 + away * 0.62 : 0.12 + away * 0.38;
  let n = nh(x * 0.045, y * 0.045) - 0.5, n2 = nh(x * 0.12 + 40, y * 0.12 + 40) - 0.5;
  const valley = clamp((Math.abs(y - ry) - 2) / 9, 0, 1);
  const k = gen('hills'), rf = gen('relief');
  let h = base;
  if (rf) {
    // broken ground: the big swells are pushed towards their tops and bottoms
    // (flat shelves, steep sides between), ridgelines run where a second
    // noise crosses its middle, and small knolls and hollows are scattered about
    n = Math.sign(n) * Math.pow(Math.abs(n) * 2, 0.72) / 2;
    const ridge = clamp(1 - Math.abs(nh(x * 0.05 + 300, y * 0.05 + 120) - 0.5) * 5, 0, 1);
    const knoll = nh(x * 0.2 + 500, y * 0.2 + 70) - 0.5;
    h += (ridge * ridge * 0.17 + Math.sign(knoll) * Math.pow(Math.abs(knoll) * 2, 1.6) * 0.07) * rf * k;
  }
  return clamp((h + n * 0.55 * k + n2 * 0.12 * k) * (0.25 + valley * 0.75), 0, 1);
}
function computeHeights(seed) {
  const { JW } = World.px, JH = (MAP_H * TILE) / 2;
  const nh = makeNoise(seed + 9);
  const height = new Float32Array(JW * JH), level = new Uint8Array(JW * JH);
  for (let y = 0; y < JH; y++) for (let x = 0; x < JW; x++) {
    const h = groundHeight(nh, x / 8, y / 8);
    height[y * JW + x] = h;
    level[y * JW + x] = Math.floor(h * TERRACES);
  }
  World.px.height = height; World.px.level = level;
  // terrace levels per world pixel, from the heights blended smoothly, so bank edges don't step in blocks
  const W = MAP_W * TILE, Hh = MAP_H * TILE, level1 = new Uint8Array(W * Hh);
  for (let py = 0; py < Hh; py++) {
    const gy = Math.min(JH - 1.001, py / 2), iy = Math.floor(gy), wy = gy - iy;
    for (let px = 0; px < W; px++) {
      const gx = Math.min(JW - 1.001, px / 2), ix = Math.floor(gx), wx = gx - ix;
      const a0 = iy * JW + ix, a1 = a0 + JW;
      const h = (height[a0] * (1 - wx) + height[a0 + 1] * wx) * (1 - wy) + (height[a1] * (1 - wx) + height[a1 + 1] * wx) * wy;
      level1[py * W + px] = Math.floor(h * TERRACES);
    }
  }
  World.px.level1 = level1;
  // each tile's terrace, for the pathfinder: taken just below the tile's middle, where folk stand
  World.tileLevel = new Uint8Array(MAP_W * MAP_H);
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) World.tileLevel[ty * MAP_W + tx] = level1[Math.min(Hh - 1, ty * 16 + 11) * W + tx * 16 + 8];
}

// The ground is painted at GS canvas pixels per world pixel. Colour (hill
// shading, terrace banks, wet edges) is worked out once per world pixel; the
// finer detail (grass blades, pebbles, furrows, cobbles, sparkles) and the
// edges between kinds of ground are done per half-pixel.
function* paintGroundGen(season, target, rect, org = { x: 0, y: 0 }) {
  const { W, H, W2, type, type2, noise, JW, height, level1 } = World.px;
  const JH = H >> 1;
  const lipCol = { spring: [170, 214, 110], summer: [160, 204, 100], autumn: [196, 190, 100], winter: [255, 255, 255] }[season];
  // the earth of a terrace bank: its face, its darker strata, the stones in it and the roots over it
  const EARTH = { spring: [118, 88, 54], summer: [112, 84, 50], autumn: [122, 90, 52], winter: [128, 118, 110] }[season];
  const EARTH_D = { spring: [84, 60, 36], summer: [80, 58, 34], autumn: [88, 62, 36], winter: [92, 86, 84] }[season];
  const FOOT = { spring: [48, 36, 24], summer: [46, 34, 22], autumn: [50, 36, 24], winter: [70, 72, 84] }[season];
  const MOSS = { spring: [96, 140, 60], summer: [90, 132, 54], autumn: [124, 124, 58], winter: [236, 242, 250] }[season];
  const R0 = rect || { x0: 0, y0: 0, x1: W, y1: H };
  const hit = (x0, y0, x1, y1) => x1 >= R0.x0 && x0 <= R0.x1 && y1 >= R0.y0 && y0 <= R0.y1;
  const pal = GROUND_PAL[season];
  const ctx = target.getContext('2d');
  const C = {};
  for (const k in pal) if (typeof pal[k] === 'string') C[k] = hexToRgb(pal[k]);
  const lerpC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const winter = season === 'winter';
  const CLG = { level1, W, H, season, lipCol, road: false }, CLP = { ...CLG, road: true };
  const at = (x, y) => type[clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)];
  const near = (px, py, t, r) => at(px + r, py) === t || at(px - r, py) === t || at(px, py + r) === t || at(px, py - r) === t;
  const notNear = (px, py, t, r) => at(px + r, py) !== t || at(px - r, py) !== t || at(px, py + r) !== t || at(px, py - r) !== t;

  // a middling noise for the speckle of the grass and the lanes
  // (kept between chunks: it costs as much to make as a chunk takes to paint)
  const nM = World._nM && World._nM.seed === World.seed ? World._nM.fn : (World._nM = { seed: World.seed, fn: makeNoise(World.seed * 7 + 3) }).fn;
  // how deep the water is at a pixel: 0 at the bank to 1 well out in the stream
  const DEPTH_R = [2, 4, 7, 11, 16];
  const depthAt = (px, py) => { let k = 0; for (const r of DEPTH_R) { if (notNear(px, py, T.WATER, r)) break; k++; } return k / DEPTH_R.length; };

  // the colour of one world pixel of a kind of ground
  const colorAt = (t, px, py) => {
    const n = noise[(py >> 1) * JW + (px >> 1)];
    const h = hash2(px, py);
    let col;
    if (t === T.GRASS || t === T.LAWN) {
      // broad patches, a middling mottle and a fine speckle, dithered down later
      col = lerpC(C.G1, C.G2, clamp(n * 0.6 + nM(px * 0.14, py * 0.14) * 0.32 + h * 0.2 - 0.12, 0, 1));
      if (t === T.LAWN && Math.floor((px + py * 0.5) / 10) % 2) col = lerpC(col, C.L2, 0.25);
      if (near(px, py, T.WATER, 1)) return lerpC(col, C.bank, 0.85);
      if (near(px, py, T.WATER, 3)) return lerpC(col, C.bank, 0.45);
      // relief: hill-shading lit from the north-west, then terrace banks
      const cx = px >> 1, cy = py >> 1;
      const hx0 = height[cy * JW + Math.max(0, cx - 3)], hx1 = height[cy * JW + Math.min(JW - 1, cx + 3)];
      const hy0 = height[Math.max(0, cy - 3) * JW + cx], hy1 = height[Math.min(JH - 1, cy + 3) * JW + cx];
      const lit = clamp(((hx0 - hx1) * 0.7 + (hy0 - hy1)) * 12, -0.3, 0.3);
      col = lit > 0 ? lerpC(col, [255, 255, 200], lit * 0.5) : lerpC(col, [10, 30, 20], -lit);
      const pj = py * W + px, lv = level1[pj];
      col = lerpC(col, winter ? [255, 255, 255] : [190, 220, 110], (lv - 1) * 0.05);
      if (World.cliffMask) { const cl = cliffPixel(px, py, lv, col, CLG); if (cl) return cl; }
      // A terrace bank is a face of bare earth under a lip of hanging grass,
      // taller for a bigger drop: strata, stones and roots in it, a dark line
      // and a shadow along its foot. Where the edge runs up and down the map
      // the earth shows as a narrow rim down the side.
      let k = 0, drop = 0;
      for (let d = 1; d <= 18 && py - d >= 0; d++) { const l = level1[pj - d * W]; if (l > lv) { k = d; drop = l - lv; break; } }
      const bh = drop ? 6 + drop * 3 + Math.floor(hash2(px >> 2, 31) * 2) : 0;
      if (k && k <= bh + 4) {
        const sx = hash2(px, py), strata = (k + Math.floor(hash2(px >> 3, 7) * 3)) % 4 === 0;
        if (k <= 1 + (hash2(px, 77) < 0.5 ? 1 : 0)) col = lerpC(lipCol, [40, 70, 30], winter ? 0.05 : 0.25);
        else if (k <= bh - 2) {
          col = lerpC(EARTH, EARTH_D, clamp(nM(px * 0.3, py * 0.3) * 0.9 + (k / bh) * 0.5 - 0.2, 0, 1));
          if (strata) col = lerpC(col, EARTH_D, 0.5);
          if (sx < 0.06) col = winter ? [176, 180, 186] : [146, 136, 120];
          else if (sx > 0.985) col = [184, 174, 150];
          if (!winter && k <= 4 && hash2(px, 5) < 0.3 && hash2(px >> 1, py) < 0.7) col = [70, 50, 32];
          if (!winter && k <= 3 && hash2(px >> 2, 13) < 0.3) col = lerpC(col, MOSS, 0.6);
          if (winter && k <= 3) col = lerpC(col, [240, 244, 250], 0.7);
        } else if (k <= bh) col = FOOT;
        else col = lerpC(col, [20, 30, 16], 0.42 * (1 - (k - bh) / 5));
        col.bank = k <= bh;
        return col;
      }
      const dn1 = py < H - 2 ? level1[pj + 2 * W] : lv;
      if (dn1 < lv) col = lerpC(col, lipCol, 0.45);
      else {
        for (let d = 1; d <= 2; d++) {
          const l = (px + d < W ? level1[pj + d] : lv), r = (px - d >= 0 ? level1[pj - d] : lv);
          if (l > lv || r > lv) { col = d === 1 ? lerpC(EARTH_D, FOOT, 0.5) : lerpC(col, FOOT, 0.35); col.bank = true; return col; }
        }
      }
      col.bank = false;
      return col;
    }
    if (t === T.PATH) {
      if (World.cliffMask) { const cl = cliffPixel(px, py, level1[py * W + px], C.P1, CLP); if (cl) return cl; }
      // a dark ragged rim where the lane meets the grass, here and there grown over
      if (notNear(px, py, T.PATH, 1) && !near(px, py, T.BRIDGE, 1)) return h < 0.3 && !winter ? lerpC(C.G1, C.G2, 0.4) : C.PR;
      col = lerpC(C.P1, C.P2, clamp(nM(px * 0.1 + 50, py * 0.1) * 0.65 + h * 0.4 - 0.05, 0, 1));
      if (notNear(px, py, T.PATH, 3)) col = lerpC(col, C.P1, 0.5);
      // where the lane climbs a bank it is cut into the earth: a short ramp of
      // worn steps, darker, with the bank's own earth showing at the top
      const pj = py * W + px, lv = level1[pj];
      for (let d = 1; d <= 12 && py - d >= 0; d++) {
        if (level1[pj - d * W] <= lv) continue;
        const bh = 6 + (level1[pj - d * W] - lv) * 3;
        if (d > bh) break;
        if (d <= 1) return lerpC(col, EARTH_D, 0.6);
        col = lerpC(col, C.PR, 0.25 + (d / bh) * 0.2);
        if ((d + (px >> 3)) % 3 === 0) col = lerpC(col, C.P2, 0.35);
        return col;
      }
      return col;
    }
    if (t === T.SOIL || t === T.WEED || t === T.FIELD) {
      col = lerpC(C.S1, C.S2, n);
      if (t === T.WEED) col = lerpC(col, [110, 80, 50], winter ? 0.05 : 0.25);
      if (t === T.FIELD && !winter) col = lerpC(col, [140, 110, 64], 0.15);
      return col;
    }
    if (t === T.WATER) {
      // a pale line of foam at the bank, then shallows, then the deep middle
      if (notNear(px, py, T.WATER, 1)) return C.foam;
      const dp = depthAt(px, py);
      return lerpC(C.WS, C.W1, clamp(dp * 0.95 + (n - 0.5) * 0.3, 0, 1));
    }
    if (t === T.COBBLE) return [142, 132, 118];
    return [255, 0, 255];
  };

  // the fine detail of one world pixel
  const STONE_TINT = [[1, 1, 1], [1.06, 1.0, 0.92], [0.94, 0.97, 1.02], [1.08, 0.98, 0.9], [0.98, 1.02, 0.96]];
  const detail = (t, col, px, py) => {
    const h = hash2(px * 3 + 1, py * 5 + 2);
    if (t === T.GRASS || t === T.LAWN) {
      if (col.bank) {
        if (!winter && hash2(px, py >> 1) > 0.93) return lerpC(col, [150, 140, 120], 0.6);
        return h < 0.08 ? lerpC(col, [60, 48, 30], 0.3) : col;
      }
      if (winter) {
        if (h < 0.04) return lerpC(col, [170, 190, 210], 0.4);
        if (h > 0.996 && hash2(px >> 3, py >> 3) < 0.4) return [120, 150, 110];
        return col;
      }
      if (h > 1 - pal.fleck * 0.6) return season === 'autumn' ? (h > 1 - pal.fleck * 0.3 ? [200, 90, 40] : [220, 170, 60]) : (h > 1 - pal.fleck * 0.3 ? [255, 255, 255] : [250, 220, 90]);
      return col;
    }
    if (t === T.PATH) {
      // snow lies in drifts along the paths
      if (winter) { const sn = noise[(py >> 1) * JW + (px >> 1)] + hash2(px, py) * 0.12 - Math.sin(px * 0.14 + py * 0.1) * 0.06; if (sn > 0.52) return lerpC(col, [235, 240, 246], sn > 0.56 ? 0.8 : 0.5); }
      if (h < 0.04) return lerpC(col, C.PR, 0.6);
      if (h > 0.985) return winter ? [240, 244, 250] : [222, 196, 146];
      return col;
    }
    if (t === T.SOIL || t === T.WEED || t === T.FIELD) {
      // furrows: a lit ridge, its slope, and the dark trough
      const r = py % 8;
      const k = r < 2 ? 0.28 : r < 5 ? 0.08 : r < 6 ? -0.25 : -0.45;
      let c = k > 0 ? lerpC(col, winter ? [255, 255, 255] : [200, 160, 110], k) : lerpC(col, winter ? [150, 165, 180] : [30, 18, 10], -k);
      if (h < 0.06) c = lerpC(c, [30, 18, 10], 0.3);
      return c;
    }
    if (t === T.WATER) return col;
    if (t === T.COBBLE) {
      // cobbles: rounded stones of all sizes and tints, each the nearest of a
      // jittered scatter of stone centres, lit on the top-left and dark on the
      // bottom-right, with dark mortar and moss in the gaps between them
      if (notNear(px, py, T.COBBLE, 1)) return winter ? [170, 176, 184] : [122, 108, 84];
      const CX = 7, CY = 6, gx = Math.floor(px / CX), gy = Math.floor(py / CY);
      let d1 = 1e9, d2 = 1e9, sid = 0, sx0 = 0, sy0 = 0, srx = 0, sry = 0;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const cx = gx + i, cy = gy + j;
        const ox = hash2(cx * 3 + 1, cy * 5 + 2), oy = hash2(cx * 7 + 3, cy * 11 + 5);
        const qx = cx * CX + 1 + ox * (CX - 2), qy = cy * CY + 1 + oy * (CY - 2);
        const rx = 3 + hash2(cx, cy * 13) * 1.6, ry = 2.4 + hash2(cx * 17, cy) * 1.2;
        const d = Math.hypot((px + 0.5 - qx) / rx, (py + 0.5 - qy) / ry);
        if (d < d1) { d2 = d1; d1 = d; sid = hash2(cx * 31, cy * 37); sx0 = qx; sy0 = qy; srx = rx; sry = ry; } else if (d < d2) d2 = d;
      }
      // the gaps are packed with sandy earth, grass and moss growing in them, so the yard sits quietly in the green
      const gap = d1 > 0.98 || d2 - d1 < 0.1;
      if (gap) { const g = nM(px * 0.09, py * 0.09); return winter ? [196, 202, 210] : g > 0.58 ? lerpC(C.G1, C.G2, hash2(px, py)) : g > 0.46 && hash2(px, py) > 0.5 ? [96, 118, 62] : lerpC([150, 136, 108], [128, 114, 90], hash2(px * 3, py)); }
      if (winter && sid < 0.4) return d1 < 0.6 ? [255, 255, 255] : [232, 236, 244];
      const lx = (px + 0.5 - sx0) / srx, ly = (py + 0.5 - sy0) / sry, lit = -(lx * 0.6 + ly * 0.8);
      let c = lit > 0.35 ? [190, 182, 164] : lit < -0.4 ? [136, 128, 114] : [166, 158, 142];
      if (d1 > 0.8) c = lit > 0 ? [178, 170, 152] : [124, 116, 102];
      const tint = STONE_TINT[Math.floor(sid * 5)], m = 0.92 + hash2(Math.floor(sx0), Math.floor(sy0)) * 0.14;
      c = [c[0] * tint[0] * m, c[1] * tint[1] * m, c[2] * tint[2] * m];
      // a few stones gone green with moss on their shaded side
      if (!winter && sid > 0.82 && lit < 0) c = lerpC(c, [96, 118, 62], 0.5);
      return c;
    }
    return col;
  };

  // every world pixel is one colour, painted as a block of GS × GS
  const SLICE = 32, RW = R0.x1 - R0.x0, QW = RW * GS;
  for (let y0 = R0.y0; y0 < R0.y1; y0 += SLICE) {
    const rows = Math.min(SLICE, R0.y1 - y0);
    const img = ctx.createImageData(QW, rows * GS);
    const d = img.data;
    const put = (px, py, col) => {
      if (px < R0.x0 || px >= R0.x1 || py < y0 || py >= y0 + rows) return;
      for (let sy = 0; sy < GS; sy++) for (let sx = 0; sx < GS; sx++) {
        const i = (((py - y0) * GS + sy) * QW + (px - R0.x0) * GS + sx) * 4;
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      }
    };
    const plain = new Uint8Array(RW * rows); // flat open grass, where tufts can grow
    for (let r = 0; r < rows; r++) {
      const py = y0 + r;
      for (let px = R0.x0; px < R0.x1; px++) {
        const t = type[py * W + px];
        const base = colorAt(t, px, py);
        if ((t === T.GRASS || t === T.LAWN) && !base.bank && !near(px, py, T.WATER, 3)) plain[r * RW + px - R0.x0] = 1;
        put(px, py, detail(t, base, px, py));
      }
    }
    // tufts of grass: a little dark chevron, or a pair of light tips. A tuft
    // rooted just outside this patch (or slice) still gets its pixels inside
    // it, so patches join without a gap in the tufts.
    const inside = (x, y) => x >= R0.x0 && x < R0.x1 && y >= y0 && y < y0 + rows;
    const plainAt = (x, y) => {
      if (inside(x, y)) return plain[(y - y0) * RW + x - R0.x0];
      if (x < 0 || y < 0 || x >= W || y >= H) return 0;
      const t = type[y * W + x];
      return (t === T.GRASS || t === T.LAWN) && !colorAt(t, x, y).bank && !near(x, y, T.WATER, 3) ? 1 : 0;
    };
    if (!winter) for (let cy = Math.floor((y0 - 5) / 5) * 5; cy < y0 + rows + 5; cy += 5) for (let cx = Math.floor((R0.x0 - 5) / 5) * 5; cx < R0.x1 + 5; cx += 5) {
      const hh = hash2(cx * 7 + 11, cy * 13 + 5), x = cx + Math.floor(hash2(cx, cy * 3) * 4), y = cy + 1 + Math.floor(hash2(cx * 5, cy) * 3);
      if (x + 2 < R0.x0 || x >= R0.x1 || y + 1 < y0 || y - 1 >= y0 + rows || !plainAt(x, y)) continue;
      // (the tuft's colour comes from the ground's own, not from a tuft already drawn over it, so every patch agrees)
      const base = detail(type[y * W + x], colorAt(type[y * W + x], x, y), x, y);
      if (hh < 0.26) { const dk = lerpC(base, [16, 40, 14], 0.42); put(x, y + 1, dk); put(x + 1, y, dk); put(x + 2, y + 1, dk); }
      else if (hh < 0.44) { const lt = lerpC(base, season === 'autumn' ? [230, 210, 120] : [200, 240, 140], 0.45); put(x, y, lt); put(x + 1, y - 1, lt); }
    }
    ctx.putImageData(img, (R0.x0 - org.x) * GS, (y0 - org.y) * GS);
    yield;
  }
  // bridges: planks with nail-heads and posts
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (World.tiles[tIdx(x, y)] !== T.BRIDGE || !hit(x * 16 - 4, y * 16 - 4, x * 16 + 20, y * 16 + 20)) continue;
    const bx = (x * 16 - org.x) * GS, by = (y * 16 - org.y) * GS;
    ctx.fillStyle = '#8a6440'; ctx.fillRect(bx, by - 4, 32, 40);
    for (let k = 0; k < 40; k += 5) {
      ctx.fillStyle = '#6a4a2c'; ctx.fillRect(bx, by - 4 + k, 32, 1);
      ctx.fillStyle = winter ? '#e8eef4' : '#a07a50'; ctx.fillRect(bx + (hash2(x, k) * 22 | 0), by - 3 + k, 8, 1);
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(bx + 2, by - 2 + k, 1, 1); ctx.fillRect(bx + 29, by - 2 + k, 1, 1);
    }
    const left = tileAt(x - 1, y) !== T.BRIDGE, right = tileAt(x + 1, y) !== T.BRIDGE;
    for (const [on, rx] of [[left, bx - 2], [right, bx + 28]]) {
      if (!on) continue;
      ctx.fillStyle = '#4a2e1a'; ctx.fillRect(rx, by - 4, 6, 40);
      ctx.fillStyle = '#6a4a2c'; ctx.fillRect(rx + 1, by - 4, 1, 40);
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(rx + (rx < bx ? -4 : 6), by + 4, 4, 6); ctx.fillRect(rx + (rx < bx ? -4 : 6), by + 24, 4, 6);
      if (winter) { ctx.fillStyle = '#f4f8ff'; ctx.fillRect(rx, by - 5, 6, 2); }
    }
  }
  yield;
  for (const h of World.homes) { const d = h.def; if (hit((d.cx - d.rx - 1) * 16, (d.cy - d.ry - 1) * 16, (d.cx + d.rx + 2) * 16, (d.cy + d.ry + 2) * 16)) paintMound(ctx, h, season, org); }
  if (season !== 'winter') {
    const patches = {};
    for (const f of World.flowers) {
      // a patch is 18 wide and up to 16 tall, drawn with its foot a couple of pixels below f.y
      if (!hit(f.x - 10, f.y - 16, f.x + 10, f.y + 3)) continue;
      // wild kinds only show in their season; the old mixed patches thin out in autumn
      if (f.kind && FLOWER_KINDS[f.kind] && !FLOWER_KINDS[f.kind].seasons.includes(season)) continue;
      if (!f.kind && season === 'autumn' && f.ground && (f.seed % 3)) continue;
      const k = (f.kind || '') + f.seed;
      const img = patches[k] || (patches[k] = makeFlowerPatch(f.seed, f.kind));
      ctx.drawImage(hd(img), (f.x - 9 - org.x) * GS, (f.y - img.height + 2 - org.y) * GS);
    }
  }
  yield;
  // Last, the whole patch is made into pixel art: each world pixel becomes
  // one colour (so the hills, bridges and flowers are as chunky as the rest),
  // and smooth blends are dithered down to a few tones with a 4x4 Bayer pattern.
  for (let y0 = R0.y0; y0 < R0.y1; y0 += 64) {
    const rows = Math.min(64, R0.y1 - y0), RW = R0.x1 - R0.x0, QW = RW * GS;
    const img = ctx.getImageData((R0.x0 - org.x) * GS, (y0 - org.y) * GS, QW, rows * GS), d = img.data;
    for (let r = 0; r < rows; r++) for (let c = 0; c < RW; c++) {
      let R = 0, G = 0, B = 0;
      for (let sy = 0; sy < GS; sy++) for (let sx = 0; sx < GS; sx++) { const i = ((r * GS + sy) * QW + c * GS + sx) * 4; R += d[i]; G += d[i + 1]; B += d[i + 2]; }
      const k = GS * GS, b = BAYER4[((y0 + r) & 3) * 4 + ((R0.x0 + c) & 3)];
      R = Math.min(255, Math.floor(R / k / DITHER_STEP + b) * DITHER_STEP); G = Math.min(255, Math.floor(G / k / DITHER_STEP + b) * DITHER_STEP); B = Math.min(255, Math.floor(B / k / DITHER_STEP + b) * DITHER_STEP);
      for (let sy = 0; sy < GS; sy++) for (let sx = 0; sx < GS; sx++) { const i = ((r * GS + sy) * QW + c * GS + sx) * 4; d[i] = R; d[i + 1] = G; d[i + 2] = B; }
    }
    ctx.putImageData(img, (R0.x0 - org.x) * GS, (y0 - org.y) * GS);
    yield;
  }
}
const DITHER_STEP = 14;

// ---------------------------------------------------------------------------
// The ground is kept in chunks of 32×32 tiles, each its own canvas. A chunk
// is made when it first comes into view, showing a flat sketch of its tiles
// until its real painting is done (the nearest to the camera first, a few
// milliseconds a frame), and is let go again when it has been out of sight
// longest, so a big valley never holds more than a score of them. A change
// of season repaints each chunk as it is seen, fading from the old one.
// ---------------------------------------------------------------------------
const CHUNK_T = 16, CHUNK_PX = CHUNK_T * TILE, CHUNK_MAX = 112;
// A flat sketch of the tiles in a rectangle, for the moment before the real painting.
function sketchGround(x, season, r) {
  const pal = GROUND_PAL[season], S = TILE * GS, Q = 4 * GS;
  const col = { [T.LAWN]: [pal.L2, pal.L2], [T.PATH]: [pal.P1, pal.P2], [T.WATER]: [pal.W1, pal.WS], [T.BRIDGE]: ['#8a6440', '#8a6440'], [T.SOIL]: [pal.S1, pal.S2], [T.WEED]: [pal.S1, pal.S1], [T.FIELD]: [pal.S2, pal.S1], [T.COBBLE]: ['#958f84', '#a8a296'] };
  const grass = [pal.G1, mix(pal.G1, pal.G2, 0.4), mix(pal.G1, pal.G2, 0.7)];
  x.fillStyle = pal.G1; x.fillRect(0, 0, (r.x1 - r.x0) * GS, (r.y1 - r.y0) * GS);
  // a mottle of four blocks to the tile, so the sketch reads as ground until the painting lands
  for (let ty = r.y0 >> 4; ty < (r.y1 + 15) >> 4; ty++) for (let tx = r.x0 >> 4; tx < (r.x1 + 15) >> 4; tx++) {
    const k = col[World.tiles[tIdx(tx, ty)]];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const hsh = hash2(tx * 4 + i, ty * 4 + j);
      x.fillStyle = k ? k[hsh < 0.3 ? 1 : 0] : grass[hsh < 0.55 ? 0 : hsh < 0.85 ? 1 : 2];
      x.fillRect(tx * S + i * Q - r.x0 * GS, ty * S + j * Q - r.y0 * GS, Q, Q);
    }
  }
}
const Ground = {
  chunks: new Map(), season: 'spring', stamp: 0, urgent: false,
  cols() { return Math.ceil(MAP_W / CHUNK_T); },
  rows() { return Math.ceil(MAP_H / CHUNK_T); },
  rect(cx, cy) { const x0 = cx * CHUNK_PX, y0 = cy * CHUNK_PX; return { x0, y0, x1: Math.min(MAP_W * TILE, x0 + CHUNK_PX), y1: Math.min(MAP_H * TILE, y0 + CHUNK_PX) }; },
  // starts afresh in a season: every chunk is made again as it is seen
  reset(season) { this.chunks.clear(); this.season = season; this.urgent = true; World.paintJob = { season, urgent: true }; },
  // the chunk at chunk coordinates, sketched if it is new
  get(cx, cy, touch = true) {
    const k = cy * 1024 + cx;
    let ch = this.chunks.get(k);
    if (!ch) {
      const r = this.rect(cx, cy);
      const [c, x] = makeCanvas((r.x1 - r.x0) * GS, (r.y1 - r.y0) * GS, true);
      sketchGround(x, this.season, r);
      ch = { cx, cy, r, c, season: this.season, painted: false, prev: null, fade: 0, fadeRate: 3, gen: null, next: null, used: 0 };
      this.chunks.set(k, ch);
      // a chunk seen for the first time wants painting, so the frame loop is told there's work
      if (!World.paintJob) World.paintJob = { season: this.season, urgent: false };
    }
    if (touch) ch.used = ++this.stamp;
    return ch;
  },
  // the chunks a rectangle of the world (in pixels) touches
  over(x0, y0, x1, y1, touch = true) {
    const out = [];
    const cx0 = Math.max(0, Math.floor(x0 / CHUNK_PX)), cx1 = Math.min(this.cols() - 1, Math.floor((x1 - 1) / CHUNK_PX));
    const cy0 = Math.max(0, Math.floor(y0 / CHUNK_PX)), cy1 = Math.min(this.rows() - 1, Math.floor((y1 - 1) / CHUNK_PX));
    for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) out.push(this.get(cx, cy, touch));
    return out;
  },
  // whether a chunk still wants painting in the current season
  wants(ch) { return !ch.painted || ch.season !== this.season; },
  // runs the painting for a while: the chunks nearest the camera first
  step(budgetMs) {
    const cam = Game.cam, mx = cam.x + cam.w / 2, my = cam.y + cam.h / 2;
    const t0 = performance.now();
    // whatever is on screen, or a chunk's width off it, gets a chunk, so it is painted before it is drawn
    this.over(cam.x - CHUNK_PX * 1.5, cam.y - CHUNK_PX * 1.5, cam.x + cam.w + CHUNK_PX * 1.5, cam.y + cam.h + CHUNK_PX * 1.5, false);
    const todo = [...this.chunks.values()].filter((ch) => this.wants(ch));
    if (!todo.length) { this.urgent = false; World.paintJob = null; return; }
    const d = (ch) => Math.hypot((ch.r.x0 + ch.r.x1) / 2 - mx, (ch.r.y0 + ch.r.y1) / 2 - my);
    todo.sort((a, b) => d(a) - d(b));
    for (const ch of todo) {
      if (!ch.gen) { const [c] = makeCanvas(ch.c.width, ch.c.height); ch.next = c; ch.gen = paintGroundGen(this.season, c, ch.r, { x: ch.r.x0, y: ch.r.y0 }); }
      while (performance.now() - t0 < budgetMs) {
        if (ch.gen.next().done) {
          ch.prev = ch.c; ch.fade = 1; ch.fadeRate = ch.painted ? 0.5 : 3;
          ch.c = gpuCopy(ch.next); ch.next = null; ch.gen = null; ch.season = this.season; ch.painted = true;
          World.paintStamp = (World.paintStamp || 0) + 1;
          break;
        }
      }
      if (performance.now() - t0 >= budgetMs) return;
    }
    // everything in sight is painted: no need to hurry any more
    if (!this.over(cam.x, cam.y, cam.x + cam.w, cam.y + cam.h, false).some((ch) => this.wants(ch))) this.urgent = false;
  },
  // lets go of the chunks seen longest ago once there are too many
  trim() {
    if (this.chunks.size <= CHUNK_MAX) return;
    const all = [...this.chunks.entries()].sort((a, b) => a[1].used - b[1].used);
    for (const [k, ch] of all) { if (this.chunks.size <= CHUNK_MAX) break; if (ch.used === this.stamp) continue; this.chunks.delete(k); }
  },
  // draws a sprite onto the ground (a flower patch someone has sown)
  draw(img, x, y) {
    for (const ch of this.over(x, y, x + img.width / GS, y + img.height / GS, false)) if (ch.painted) ch.c.getContext('2d').drawImage(img, (x - ch.r.x0) * GS, (y - ch.r.y0) * GS);
  },
  // paints every chunk now, in one go
  paintAll(season) {
    this.reset(season);
    for (let cy = 0; cy < this.rows(); cy++) for (let cx = 0; cx < this.cols(); cx++) {
      const ch = this.get(cx, cy, false);
      const [c] = makeCanvas(ch.c.width, ch.c.height);
      const g = paintGroundGen(season, c, ch.r, { x: ch.r.x0, y: ch.r.y0 });
      while (!g.next().done) { /* paint every slice */ }
      ch.c = gpuCopy(c); ch.painted = true; ch.season = season;
    }
    this.urgent = false; World.paintJob = null;
  },
};
World.ground = Ground;
// Shows a sketch of the ground and paints the real thing behind it, nearest first.
function paintGroundSoon(season) { Ground.reset(season); }
// Paints the whole ground synchronously.
function paintGround(season) { Ground.paintAll(season); }
// Starts repainting for a season in the background; the frame loop calls stepPaint().
function startSeasonPaint(season) {
  const urgent = Ground.urgent;
  Ground.season = season;
  for (const ch of Ground.chunks.values()) { ch.gen = null; ch.next = null; }
  World.paintJob = { season, urgent };
}
function stepPaint(budgetMs = 6) {
  if (!World.paintJob || !Game.cam) return;
  Ground.step(budgetMs);
}
// Repaints a rectangle of the current ground (after a tile change). The patch
// is painted on a scratch canvas with a margin, so mounds and flowers that
// straddle its edge come out whole, then copied into the chunks it touches.
function repaintRect(x, y, w, h) {
  x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y));
  w = Math.min(MAP_W * TILE - x, Math.ceil(w)); h = Math.min(MAP_H * TILE - y, Math.ceil(h));
  const M = 96;
  const rect = { x0: Math.max(0, x - M), y0: Math.max(0, y - M), x1: Math.min(MAP_W * TILE, x + w + M), y1: Math.min(MAP_H * TILE, y + h + M) };
  computePixelTypes(World.seed, rect);
  const chunks = Ground.over(x, y, x + w, y + h, false);
  const patches = {};
  for (const ch of chunks) {
    // a chunk still painting for a new season starts again, so it takes in the change
    if (ch.gen) { ch.gen = null; ch.next = null; }
    if (!ch.painted) { sketchGround(ch.c.getContext('2d'), ch.season, ch.r); continue; }
    let patch = patches[ch.season];
    if (!patch) {
      const [c] = makeCanvas((rect.x1 - rect.x0) * GS, (rect.y1 - rect.y0) * GS);
      const g = paintGroundGen(ch.season, c, rect, { x: rect.x0, y: rect.y0 });
      while (!g.next().done) { /* small patch: paint it all at once */ }
      patch = patches[ch.season] = c;
    }
    const sx0 = Math.max(x, ch.r.x0), sy0 = Math.max(y, ch.r.y0), sx1 = Math.min(x + w, ch.r.x1), sy1 = Math.min(y + h, ch.r.y1);
    if (sx1 <= sx0 || sy1 <= sy0) continue;
    ch.c.getContext('2d').drawImage(patch, (sx0 - rect.x0) * GS, (sy0 - rect.y0) * GS, (sx1 - sx0) * GS, (sy1 - sy0) * GS, (sx0 - ch.r.x0) * GS, (sy0 - ch.r.y0) * GS, (sx1 - sx0) * GS, (sy1 - sy0) * GS);
  }
}

const MOUND_PAL = {
  spring: ['#4a8e36', '#1a3e1e', '#9ad464'],
  summer: ['#3f8234', '#183a1c', '#8ccc58'],
  autumn: ['#6e7c2e', '#36361a', '#aeac50'],
  winter: ['#e2eaf0', '#94a6b8', '#ffffff'],
};
// A hobbit-hole's grassy mound and the stonework round its door, painted
// into the ground at full detail.
function paintMound(ctx, h, season = 'summer', org = { x: 0, y: 0 }) {
  const d = h.def, G = GS;
  const sh = homeShape(d, h.id, Math.round(h.doorY / 16) - 1);
  // the box the hill covers, in half-pixels
  const cx = sh.hcx * 16, cy = sh.hcy * 16, rx = sh.hrx * 16, ry = sh.hry * 16;
  const x0 = Math.floor((cx - rx * 1.25) * G), y0 = Math.floor((cy - ry * 1.3) * G);
  const w = Math.ceil(rx * 2.5 * G), hh = Math.ceil((ry * 2.3 + 22) * G);
  const ox = org.x * G, oy = org.y * G;
  // only the part of the hill's box that lies on this canvas is painted
  const i0 = Math.max(0, ox - x0), j0 = Math.max(0, oy - y0), i1 = Math.min(w, ox + ctx.canvas.width - x0), j1 = Math.min(hh, oy + ctx.canvas.height - y0);
  if (i1 <= i0 || j1 <= j0) return;
  const img = ctx.getImageData(x0 - ox + i0, y0 - oy + j0, i1 - i0, j1 - j0);
  const p = img.data, pw = i1 - i0;
  // the hill's shape is worked out once per home and kept: how far out each half-pixel is
  let M = sh._mask;
  if (!M || M.x0 !== x0 || M.y0 !== y0 || M.w !== w || M.hh !== hh) {
    M = sh._mask = { x0, y0, w, hh, u: new Float32Array(w * hh) };
    for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) M.u[j * w + i] = sh.u((x0 + i) / G / 16, (y0 + j) / G / 16);
  }
  const [b0, d0, l0] = MOUND_PAL[season];
  const tint = (h.v && h.v.tint) || 0;
  const base = hexToRgb(shade(b0, tint)), dark = hexToRgb(d0), light = hexToRgb(shade(l0, tint * 0.6));
  const roofFlowers = h.v && h.v.flowers && season !== 'winter';
  const petal = [[240, 120, 150], [250, 220, 90], [190, 150, 240], [255, 255, 255]][h.id % 4];
  const winter = season === 'winter';
  // per half-pixel column: the foot of the south face, and how tall the
  // stone face is there (full height in front, sinking into the slope at the sides)
  const footY = new Float32Array(w), faceH = new Float32Array(w);
  for (let i = 0; i < w; i++) {
    const px = (x0 + i) / G, b = sh.bottom(px / 16);
    footY[i] = b == null ? -1 : b * 16;
    const nxc = (px - cx) / rx;
    // tall enough in front to hold the door and its surround, and the windows beside it
    const front = clamp(1 - Math.abs(nxc) / 0.95, 0, 1);
    faceH[i] = b == null ? 0 : (h.built || h.buildProg > 0.3 ? (h.grand ? 27 : 23) : 0) * Math.pow(front, 0.3) * (1 + Math.sin(px * 0.21 + h.id) * 0.05);
  }
  const stones = winter ? [[176, 180, 186], [196, 198, 204], [150, 154, 162]] : [[132, 124, 110], [154, 146, 130], [112, 106, 96], [140, 128, 104]];
  for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
    const qx = x0 + i, qy = y0 + j, px = qx / G, py = qy / G;
    const k = ((j - j0) * pw + (i - i0)) * 4;
    const u = M.u[j * w + i];
    const fy = footY[i], fh = faceH[i];
    // the stone face: dry-stone courses, mortar dark, a grassy lip over the top
    if (fy > 0 && fh > 0.5 && py <= fy && py > fy - fh) {
      // courses of uneven height, and in each a run of stones of uneven length,
      // the odd one standing taller than its course; the joints dark, the tops lit
      const up = fy - py;
      let row = 0, base = 0, rh = 3 + Math.floor(hash2(0, h.id * 3) * 2.5);
      while (up >= base + rh) { base += rh; row++; rh = 3 + Math.floor(hash2(row, h.id * 3) * 2.5); }
      const len = 5 + Math.floor(hash2(row * 5, h.id) * 4), off = hash2(row, h.id) * len;
      let sx = Math.floor((px + off) / len);
      const jit = Math.floor(hash2(sx, row * 7 + h.id) * 3) - 1;
      const inStone = (px + off) - sx * len - jit;
      if (inStone < 0) sx--;
      const inRow = up - base, tall = hash2(sx * 3, row + h.id) < 0.12;
      let col;
      if ((inRow < 0.8 && !(tall && row % 2)) || inStone < 0.8 || inStone >= len + jit - 0.2) col = winter ? [120, 124, 132] : [70, 62, 54];
      else { col = stones[Math.floor(hash2(sx, row * 7 + h.id) * stones.length)].slice(); if (inRow > rh - 1.4) col = col.map((c) => c * 1.12); if (hash2(qx, qy) < 0.07) col = col.map((c) => c * 0.85); if (hash2(qx * 3, qy) > 0.985) col = col.map((c) => Math.min(255, c * 1.2)); }
      // moss and ivy creeping over the stones
      if (!winter && hash2(sx * 3, row + 11) < 0.12 && hash2(qx >> 1, qy >> 1) < 0.6) col = [74, 112, 52];
      if (up > fh - 1.2) col = winter ? [236, 242, 248] : [52, 92, 40];
      p[k] = col[0]; p[k + 1] = col[1]; p[k + 2] = col[2];
      continue;
    }
    // the shadow the face casts on the ground in front
    if (fy > 0 && fh > 0.5 && py > fy && py < fy + 3) { p[k] *= 0.72; p[k + 1] *= 0.74; p[k + 2] *= 0.78; continue; }
    if (u >= 1.12) continue;
    // the grassy hillside, lit from the north-west; its edges fade into the
    // meadow rather than stopping at a line
    const nx = (px - cx) / rx, ny = (py - cy) / ry;
    if (fy > 0 && fh > 0.5 && py > fy) continue;
    const edgeFade = clamp((1.12 - u) / 0.24, 0, 1);
    if (edgeFade < 1 && hash2(qx, qy) > edgeFade) continue;
    // a rounded slope: brightest up on the north-west shoulder, darker down the
    // south and east sides and towards the foot, with a soft ridge along the top
    let l = -nx * 0.42 - ny * 0.62 + (1 - u * u) * 0.5 - 0.2;
    if (u > 0.78) l -= (u - 0.78) * 0.9;
    const ridge = Math.abs(ny + 0.55 - nx * 0.15);
    if (ridge < 0.12) l += (0.12 - ridge) * 1.6;
    if (fy > 0 && fh > 0.5 && py > fy - fh - 4) l -= 0.15 * (1 - (fy - fh - py) / 4); // overhang shadow
    const hsh = hash2(qx, qy);
    if (hsh < 0.06) l -= 0.16; else if (hsh > 0.94) l += 0.16;
    if (!winter && hash2(qx, qy >> 1) > 0.965) l -= 0.14;
    const t = clamp(l * edgeFade + (1 - edgeFade) * 0, -1, 1);
    const col = t < 0 ? [lerp(base[0], dark[0], -t), lerp(base[1], dark[1], -t), lerp(base[2], dark[2], -t)]
      : [lerp(base[0], light[0], t), lerp(base[1], light[1], t), lerp(base[2], light[2], t)];
    // at the faded edge, blend towards the ground already painted there
    const m = edgeFade;
    p[k] = lerp(p[k], col[0], m); p[k + 1] = lerp(p[k + 1], col[1], m); p[k + 2] = lerp(p[k + 2], col[2], m);
    if (!winter && hsh > 0.997 && u < 0.95) { p[k] = 240; p[k + 1] = 220; p[k + 2] = 90; }
    if (roofFlowers && ny < 0.1 && u < 0.8 && hash2(qx >> 4, qy >> 4) > 0.55 && hash2(qx, qy) > 0.982) {
      p[k] = petal[0]; p[k + 1] = petal[1]; p[k + 2] = petal[2];
      if (hash2(qx + 1, qy) > 0.5) { const k2 = k + pw * 4; if (k2 < p.length) { p[k2] = 70; p[k2 + 1] = 120; p[k2 + 2] = 50; } }
    }
    if (!winter && hsh > 0.9985 && u < 0.95) { p[k] = 245; p[k + 1] = 245; p[k + 2] = 245; }
  }
  // grass hanging down over the top of the face
  if (!winter) for (let i = i0; i < i1; i++) {
    const fy = footY[i], fh = faceH[i];
    if (fy < 0 || fh < 2 || hash2(x0 + i, h.id) > 0.3) continue;
    const top = Math.round((fy - fh) * G) - y0, len = 1 + Math.floor(hash2(i, 5) * 3);
    for (let j = 0; j < len; j++) { const jj = top + j; if (jj < j0 || jj >= j1) continue; const k = ((jj - j0) * pw + (i - i0)) * 4; p[k] = 58; p[k + 1] = 100; p[k + 2] = 42; }
  }
  ctx.putImageData(img, x0 - ox + i0, y0 - oy + j0);
  if (!h.built) return;
  ctx.save(); ctx.translate(-ox, -oy);
  // stone, timber or brick round the door, at full detail
  const frame = h.v ? h.v.frame : 0;
  const FR = [['#6a5a44', '#9a9080', '#b0a690'], ['#4a3020', '#7a5030', '#8a6440'], ['#6a3a2a', '#a0583e', '#b86a4a']][frame];
  const r = (h.doorR + 4) * G, dx = h.doorX * G, dy = (h.doorY - h.doorR - 1) * G;
  disc(ctx, dx, dy, r, FR[0]);
  ctx.fillStyle = FR[0]; ctx.fillRect(dx - r, dy, r * 2 + 1, (h.doorR + 1) * G);
  const n = frame === 1 ? 9 : frame === 2 ? 18 : 15;
  for (let a = 0; a < n; a++) {
    const ang = Math.PI + (a / (n - 1)) * Math.PI;
    const sx = Math.round(dx + Math.cos(ang) * (r - 3.5)), sy = Math.round(dy + Math.sin(ang) * (r - 3.5));
    const sw = frame === 1 ? 7 : frame === 2 ? 5 : 5, sh = frame === 1 ? 4 : frame === 2 ? 3 : 5;
    ctx.fillStyle = a % 2 ? FR[1] : FR[2]; ctx.fillRect(sx - (sw >> 1), sy - (sh >> 1), sw, sh);
    ctx.fillStyle = shade(FR[2], 0.18); ctx.fillRect(sx - (sw >> 1), sy - (sh >> 1), sw - 1, 1);
  }
  for (const side of [-1, 1]) for (let k = 0; k < 3; k++) {
    const sx = dx + side * (r - 4) - 2, sy = dy + 2 + k * 6;
    ctx.fillStyle = k % 2 ? FR[1] : FR[2]; ctx.fillRect(sx, sy, 5, 5); ctx.fillStyle = shade(FR[2], 0.18); ctx.fillRect(sx, sy, 4, 1);
  }
  // the keystone at the top of the arch
  ctx.fillStyle = shade(FR[2], 0.1); ctx.fillRect(dx - 4, dy - r - 2, 9, 7); ctx.fillStyle = shade(FR[2], 0.3); ctx.fillRect(dx - 4, dy - r - 2, 9, 1); ctx.fillStyle = FR[0]; ctx.fillRect(dx - 4, dy - r + 4, 9, 1);
  if (winter) for (let a = 0; a < 20; a++) { const ang = Math.PI + (a / 19) * Math.PI; ctx.fillStyle = '#f4f8ff'; ctx.fillRect(Math.round(dx + Math.cos(ang) * (r + 1)) - 2, Math.round(dy + Math.sin(ang) * (r + 1)) - 2, 4, 3); }
  // a raised flagstone terrace along the foot of the face, and stone steps
  // down from the door to the lane
  const tw = Math.round(sh.hrx * 16 * 0.55), side = sh.hcx * 16 > h.doorX ? 1 : -1;
  const tx0 = (side > 0 ? h.doorX - h.doorR - 4 : h.doorX - tw) * G, tx1 = (side > 0 ? h.doorX + tw : h.doorX + h.doorR + 4) * G;
  const ty = h.doorY * G;
  ctx.fillStyle = winter ? '#d8dce4' : '#a89a80'; ctx.fillRect(tx0, ty, tx1 - tx0, 8);
  for (let x = tx0; x < tx1; x += 9 + ((x >> 3) % 3)) { ctx.fillStyle = winter ? '#b8bcc6' : '#8a7c64'; ctx.fillRect(x, ty, 1, 8); }
  ctx.fillStyle = winter ? '#f4f8ff' : '#c8bca4'; ctx.fillRect(tx0, ty, tx1 - tx0, 1);
  ctx.fillStyle = winter ? '#9aa0aa' : '#6a5e48'; ctx.fillRect(tx0, ty + 8, tx1 - tx0, 3);
  ctx.fillStyle = 'rgba(30,40,20,0.3)'; ctx.fillRect(tx0, ty + 11, tx1 - tx0, 2);
  for (let k = 0; k < 3; k++) {
    const sw = (h.doorR * 2 + 6 + k * 4) * G, sx = Math.round(h.doorX * G - sw / 2), sy = ty + 8 + k * 6;
    ctx.fillStyle = winter ? '#dfe4ea' : '#a89a80'; ctx.fillRect(sx, sy, sw, 6);
    ctx.fillStyle = winter ? '#ffffff' : '#c8bca4'; ctx.fillRect(sx + 1, sy, sw - 2, 1);
    ctx.fillStyle = winter ? '#9aa0aa' : '#6a5e48'; ctx.fillRect(sx, sy + 5, sw, 1);
  }
  // window surrounds
  for (const wdw of h.windows) {
    const wx = wdw.x * G, wy = wdw.y * G;
    const sq = h.v && h.v.square, half = sq ? 13 : 12;
    // a flat lintel stone over the window and a sill under it, set into the face
    ctx.fillStyle = '#8a8070'; ctx.fillRect(wx - half - 2, wy - half - 4, half * 2 + 5, 4); ctx.fillStyle = '#b0a690'; ctx.fillRect(wx - half - 2, wy - half - 4, half * 2 + 5, 1);
    ctx.fillStyle = '#b0a690'; ctx.fillRect(wx - half - 3, wy + half, half * 2 + 7, 4); ctx.fillStyle = '#d0c8b4'; ctx.fillRect(wx - half - 3, wy + half, half * 2 + 7, 1); ctx.fillStyle = '#5a4a34'; ctx.fillRect(wx - half - 3, wy + half + 4, half * 2 + 7, 1);
    if (sq) {
      ctx.fillStyle = '#5a4a34'; ctx.fillRect(wx - 13, wy - 13, 27, 27); ctx.fillStyle = FR[1]; ctx.fillRect(wx - 11, wy - 11, 23, 23);
      ctx.fillStyle = shade(FR[1], 0.15); ctx.fillRect(wx - 11, wy - 11, 23, 1);
    } else {
      disc(ctx, wx, wy, 12, '#5a4a34'); disc(ctx, wx, wy, 11, frame === 2 ? '#a0583e' : '#8a6a42');
      for (let a = 0; a < 10; a++) { const ang = (a / 10) * Math.PI * 2; ctx.fillStyle = a % 2 ? shade(FR[1], 0.1) : FR[2]; ctx.fillRect(Math.round(wx + Math.cos(ang) * 10) - 1, Math.round(wy + Math.sin(ang) * 10) - 1, 3, 3); }
    }
  }
  if (h.roofWin) { disc(ctx, h.roofWin.x * G, h.roofWin.y * G, 10, '#5a4a34'); disc(ctx, h.roofWin.x * G, h.roofWin.y * G, 9, '#8a6a42'); }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Pathfinding (A*, 8 directions, no corner cutting)
// ---------------------------------------------------------------------------
const PF = {
  g: new Float32Array(MAP_W * MAP_H), f: new Float32Array(MAP_W * MAP_H),
  from: new Int32Array(MAP_W * MAP_H), stamp: new Uint32Array(MAP_W * MAP_H), closed: new Uint32Array(MAP_W * MAP_H), gen: 0,
  cap: 30000, // how far one search may spread, scaled with the map
};
// Sets the map's size in tiles, before a world is built on it: every array
// sized from the map is made afresh (and so is cleared).
function setMapSize(w, h) {
  if (w === MAP_W && h === MAP_H && World.tiles.length === w * h) return;
  MAP_W = w; MAP_H = h;
  const n = w * h;
  World.tiles = new Uint8Array(n); World.block = new Uint8Array(n); World.reserved = new Uint8Array(n);
  World.px = null; World.land = null; World.tileLevel = null; Ground.chunks.clear(); World.paintJob = null;
  World.cliffMask = null; World.cliffZone = null; World.cliff = null; World._mini = null;
  PF.g = new Float32Array(n); PF.f = new Float32Array(n); PF.from = new Int32Array(n); PF.stamp = new Uint32Array(n); PF.closed = new Uint32Array(n); PF.gen = 0;
  PF.cap = Math.round((30000 * n) / (128 * 96));
}
function nearestWalkable(tx, ty) {
  if (walkable(tx, ty)) return [tx, ty];
  for (let r = 1; r < 8; r++) for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
    if (walkable(tx + i, ty + j)) return [tx + i, ty + j];
  }
  return null;
}
function findPath(sx, sy, tx, ty) {
  const s = nearestWalkable(sx, sy), t = nearestWalkable(tx, ty);
  if (!s || !t) return null;
  [sx, sy] = s; [tx, ty] = t;
  if (sx === tx && sy === ty) return [[tx, ty]];
  PF.gen++;
  const gen = PF.gen;
  const heap = [];
  const push = (n) => {
    heap.push(n); let i = heap.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (PF.f[heap[p]] <= PF.f[heap[i]]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; }
  };
  const pop = () => {
    const top = heap[0]; const last = heap.pop();
    if (heap.length) {
      heap[0] = last; let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1; let m = i;
        if (l < heap.length && PF.f[heap[l]] < PF.f[heap[m]]) m = l;
        if (r < heap.length && PF.f[heap[r]] < PF.f[heap[m]]) m = r;
        if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m;
      }
    }
    return top;
  };
  const hfn = (x, y) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return (dx + dy + (1.414 - 2) * Math.min(dx, dy)) * 1.0; };
  const si = tIdx(sx, sy), ti = tIdx(tx, ty);
  PF.g[si] = 0; PF.f[si] = hfn(sx, sy); PF.stamp[si] = gen; PF.from[si] = -1;
  push(si);
  let found = false, iter = 0;
  while (heap.length && iter++ < PF.cap) {
    const cur = pop();
    if (PF.closed[cur] === gen) continue;
    PF.closed[cur] = gen;
    if (cur === ti) { found = true; break; }
    const cx = cur % MAP_W, cy = (cur / MAP_W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (!walkable(nx, ny)) continue;
      if (dx && dy && (!walkable(cx + dx, cy) || !walkable(cx, cy + dy))) continue;
      const ni = tIdx(nx, ny);
      if (PF.closed[ni] === gen) continue;
      let c = TILE_COST[World.tiles[ni]];
      const lv = World.tileLevel;
      if (lv && lv[ni] !== lv[cur]) c += isRoadTile(World.tiles[ni]) || isRoadTile(World.tiles[cur]) || cliffTile(nx, ny) === 2 || cliffTile(cx, cy) === 2 ? RAMP_COST : BANK_COST * Math.abs(lv[ni] - lv[cur]);
      c *= dx && dy ? 1.414 : 1;
      const g = PF.g[cur] + c;
      if (PF.stamp[ni] !== gen || g < PF.g[ni]) {
        PF.stamp[ni] = gen; PF.g[ni] = g; PF.f[ni] = g + hfn(nx, ny); PF.from[ni] = cur; push(ni);
      }
    }
  }
  if (!found) return null;
  const out = [];
  for (let n = ti; n !== si && n !== -1; n = PF.from[n]) out.push([n % MAP_W, (n / MAP_W) | 0]);
  out.reverse();
  return out;
}

// ---------------------------------------------------------------------------
// Per-step world simulation: crops, critters, mill wheel
// ---------------------------------------------------------------------------
const SEASON_GROWTH = { spring: 1, summer: 1.25, autumn: 0.7, winter: 0 };

function growPlot(p, dtMin, rate) {
  if (p.stage >= 1 && p.stage < 4) { p.prog += dtMin * rate; if (p.prog >= 1) { p.prog = 0; p.stage++; } }
}

function updateWorld(dtMin, raining, season, hour) {
  const sg = SEASON_GROWTH[season];
  const growth = (raining ? 1 / 160 : 1 / 320) * sg;
  for (const h of World.homes) {
    if (h.built) for (const p of h.plots) growPlot(p, dtMin, growth);
    if (h.doorAnim > 0) h.doorAnim -= dtMin;
  }
  for (const k in World.buildings) { const b = World.buildings[k]; if (b.doorAnim > 0) b.doorAnim -= dtMin; }
  for (const w of World.weed) growPlot(w, dtMin, growth * 0.8);
  for (const f of World.fields) for (const p of f.plots) growPlot(p, dtMin, growth * 0.55);
  for (const p of World.herbBeds) growPlot(p, dtMin, growth * 0.9);
  const mushRate = season === 'autumn' ? 2.2 : season === 'winter' ? 0 : 1;
  for (const m of World.mushrooms) if (m.amount < 3) { m.regrow += dtMin * (raining ? 2 : 1) * mushRate; if (m.regrow > 360) { m.regrow = 0; m.amount++; } }
  for (const m of World.wildHerbs) if (m.amount < 3 && season !== 'winter') { m.regrow += dtMin * (raining ? 1.6 : 1); if (m.regrow > 420) { m.regrow = 0; m.amount++; } }
  for (const s of World.woodSpots) if (s.stock < 4) { s.regrow = (s.regrow || 0) + dtMin; if (s.regrow > 600) { s.regrow = 0; s.stock++; } }
  // apples ripen late summer and autumn; honey flows spring and summer
  const appleRate = season === 'autumn' ? 1 / 200 : season === 'summer' ? 1 / 500 : 0;
  for (const t of World.orchard) if (t.apples < 6 && appleRate) { t.grow = (t.grow || 0) + dtMin * appleRate; if (t.grow >= 1) { t.grow = 0; t.apples++; } }
  const honeyRate = season === 'summer' ? 1 / 300 : season === 'spring' ? 1 / 450 : 0;
  for (const hv of World.hives) if (hv.honey < 4 && honeyRate) { hv.grow = (hv.grow || 0) + dtMin * honeyRate; if (hv.grow >= 1) { hv.grow = 0; hv.honey++; } }
  // hens wander about the yard, and lay by day
  updateAnimals(dtMin);
  for (const hn of World.hens) {
    hn.t -= dtMin;
    if (hn.t <= 0) { hn.a = Math.atan2(hn.hy - hn.y + R.f(-30, 30), hn.hx - hn.x + R.f(-50, 50)); hn.t = R.f(4, 14); hn.peck = R.chance(0.4) ? R.f(2, 5) : 0; }
    if (hn.peck > 0) { hn.peck -= dtMin; continue; }
    const nx = hn.x + Math.cos(hn.a) * dtMin * 4, ny = hn.y + Math.sin(hn.a) * dtMin * 4;
    if (walkable(Math.floor(nx / 16), Math.floor(ny / 16)) && Math.abs(nx - hn.hx) < 90 && Math.abs(ny - hn.hy) < 40) { hn.x = nx; hn.y = ny; }
    else hn.t = 0;
  }
  if (season !== 'winter' && hour > 6 && hour < 18 && World.eggs < 12 && Math.random() < dtMin * 0.004 * World.hens.length) World.eggs++;
  for (const w of World.millWheels) w.a += dtMin * 0.25;
  if (World.windmill) World.windmill.a += dtMin * (Game.weather === 'storm' ? 0.5 : Game.raining ? 0.3 : 0.16);
  for (const d of World.ducks) {
    d.t -= dtMin;
    if (d.t <= 0) { d.a += (Math.random() - 0.5) * 2.5; d.t = 10 + Math.random() * 30; }
    const nx = d.x + Math.cos(d.a) * dtMin * 1.2, ny = d.y + Math.sin(d.a) * dtMin * 0.6;
    const tx = Math.floor(nx / 16), ty = Math.floor((ny + 4) / 16);
    if (tileAt(tx, ty) === T.WATER && tileAt(Math.floor((nx + 6) / 16), ty) === T.WATER && tileAt(Math.floor((nx - 6) / 16), ty) === T.WATER) { d.x = nx; d.y = ny; }
    // bumped the bank: turn back towards the middle of the pond, rather than nosing at it until the next whim
    else { d.a = Math.atan2(POND.cy * 16 - d.y, POND.cx * 16 - d.x) + (Math.random() - 0.5) * 1.2; d.t = 6 + Math.random() * 10; }
  }
  updateRabbits(dtMin, season, hour);
  updateCrows(dtMin, season, hour);
}

// Rabbits slip out of the woods to nibble ripe crops, and bolt from folk.
function updateRabbits(dtMin, season, hour) {
  const day = hour > 6 && hour < 20;
  if (day && season !== 'winter' && World.rabbits.length < 4 && Math.random() < dtMin * 0.004) {
    const fromEast = R.chance(0.6);
    const sx = fromEast ? R.i(MAP_W - 18, MAP_W - 8) : R.i(10, MAP_W - 18), sy = fromEast ? R.i(30, MAP_H - 6) : R.i(3, 5);
    if (walkable(sx, sy)) World.rabbits.push({ x: sx * 16 + 8, y: sy * 16 + 12, target: null, t: 0, flee: 0, life: R.f(240, 480), nibbled: 0, hop: 0, face: 1, id: Math.random() });
  }
  for (const r of World.rabbits) {
    r.life -= dtMin; r.hop += dtMin;
    let sx = 0, sy = 0, speed = 5;
    // the nearest villager (only the first few are checked each step for speed)
    let threat = null, td = 56;
    for (const v of Game.villagers) {
      if (v.inside) continue;
      const d = dist(v.x, v.y, r.x, r.y);
      if (d < td) { td = d; threat = v; }
    }
    if (threat || r.flee > 0) {
      if (threat) { r.flee = 30; r.fx = threat.x; r.fy = threat.y; }
      r.flee -= dtMin;
      const a = Math.atan2(r.y - r.fy, r.x - r.fx);
      sx = Math.cos(a); sy = Math.sin(a); speed = 16; r.target = null;
    } else {
      if (!r.target || r.target.stage < 3) {
        const cands = [];
        for (const h of World.homes) if (h.built) for (const p of h.plots) if (p.stage >= 3) cands.push(p);
        for (const f of World.fields) for (const p of f.plots) if (p.stage >= 3 && Math.random() < 0.05) cands.push(p);
        r.target = cands.length && r.life > 60 ? cands.sort((a, b) => dist(a.x, a.y, r.x, r.y) - dist(b.x, b.y, r.x, r.y))[Math.min(cands.length - 1, R.i(0, 2))] : null;
        if (!r.target) { r.exit = r.exit || { x: R.chance(0.5) ? (MAP_W - 10) * 16 : R.i(20, MAP_W - 28) * 16, y: R.chance(0.5) ? R.i(30, MAP_H - 6) * 16 : 3 * 16 }; }
      }
      const tg = r.target || r.exit;
      const d = dist(tg.x, tg.y, r.x, r.y);
      if (r.target && d < 6) {
        r.t += dtMin;
        if (r.t > 25) { r.t = 0; if (r.target.stage > 1) r.target.stage--; r.nibbled++; if (r.nibbled >= 2) { r.target = null; r.life = Math.min(r.life, 40); } }
      } else if (d > 2) { sx = (tg.x - r.x) / d; sy = (tg.y - r.y) / d; }
      if (!r.target && d < 10) r.life = 0;
    }
    if (sx || sy) {
      // hop in short bursts
      const go = Math.sin(r.hop * 1.6) > -0.2 ? 1 : 0;
      const nx = r.x + sx * dtMin * speed * go, ny = r.y + sy * dtMin * speed * go;
      if (walkable(Math.floor(nx / 16), Math.floor((ny - 2) / 16)) || tileAt(Math.floor(nx / 16), Math.floor((ny - 2) / 16)) === T.SOIL) { r.x = nx; r.y = ny; }
      else { r.target = null; r.exit = { x: R.i(5, MAP_W - 8) * 16, y: R.chance(0.5) ? 3 * 16 : (MAP_H - 4) * 16 }; r.x += R.f(-2, 2); r.y += R.f(-2, 2); }
      r.face = sx < 0 ? -1 : 1;
      r.moving = go;
    } else r.moving = 0;
  }
  World.rabbits = World.rabbits.filter((r) => r.life > 0 && r.x > 0 && r.x < MAP_W * 16 && r.y > 0 && r.y < MAP_H * 16);
}

// Crows flock to the barley as it ripens; a villager or the scarecrow scatters them.
function updateCrows(dtMin, season, hour) {
  const day = hour > 6.5 && hour < 19;
  if (day && (season === 'summer' || season === 'autumn') && World.crows.length < 6 && Math.random() < dtMin * 0.003) {
    const f = R.pick(World.fields);
    const ripe = f.plots.filter((p) => p.stage >= 3);
    if (ripe.length) {
      const p = R.pick(ripe);
      for (let i = 0; i < R.i(2, 4); i++) World.crows.push({ x: R.f(0, MAP_W * 16), y: R.f(-40, 0), tx: p.x + R.f(-30, 30), ty: p.y + R.f(-10, 10), state: 'fly', t: R.f(60, 160), plot: p, flap: R.f(0, 6) });
    }
  }
  for (const c of World.crows) {
    c.flap += dtMin;
    if (c.state === 'fly') {
      const d = dist(c.x, c.y, c.tx, c.ty);
      if (d < 4) { c.state = c.leaving ? 'gone' : 'peck'; continue; }
      c.x += (c.tx - c.x) / d * dtMin * 40; c.y += (c.ty - c.y) / d * dtMin * 40;
    } else if (c.state === 'peck') {
      c.t -= dtMin;
      let scared = c.t <= 0;
      for (const v of Game.villagers) if (!v.inside && dist(v.x, v.y, c.x, c.y) < 70) { scared = true; break; }
      if (Math.random() < dtMin * 0.002 && c.plot.prog > 0.1) c.plot.prog -= 0.1;
      if (scared) { c.state = 'fly'; c.leaving = true; c.tx = c.x + R.f(-400, 400); c.ty = -60; }
    }
  }
  World.crows = World.crows.filter((c) => c.state !== 'gone');
}

// Seasonal turnover of the land.
function seasonTurn(season) {
  if (season === 'winter') {
    for (const h of World.homes) for (const p of h.plots) { p.stage = 0; p.prog = 0; }
    for (const f of World.fields) for (const p of f.plots) { p.stage = 0; p.prog = 0; }
    for (const w of World.weed) { w.stage = 0; w.prog = 0; }
    for (const p of World.herbBeds) { p.stage = 0; p.prog = 0; }
    for (const m of World.mushrooms) m.amount = 0;
    for (const t of World.orchard) t.apples = 0;
    World.rabbits = []; World.crows = [];
  }
  if (season === 'spring') {
    for (const w of World.weed) if (w.stage === 0) w.stage = 1;
    for (const p of World.herbBeds) if (p.stage === 0) p.stage = 1;
  }
}

// ---------------------------------------------------------------------------
// Drawing helpers for the dynamic parts of the world
// ---------------------------------------------------------------------------
const SPR = {};
function buildWorldSprites() {
  SPR.crops = {};
  for (const t of CROP_TYPES.concat(['leaf', 'barley', 'herb'])) SPR.crops[t] = [0, 1, 2, 3, 4].map((s) => makeCrop(t, s));
  SPR.mush = makeMushrooms();
  SPR.herbWild = makeCrop('herb', 4);
  SPR.duck = [makeDuck(0), makeDuck(1)];
  SPR.rabbit = [makeRabbit(0), makeRabbit(1)];
  SPR.crow = [makeCrow(0), makeCrow(1)];
  SPR.hen = [makeHen(0), makeHen(1)];
  SPR.sheep = [0, 1, 2].map((coat) => [makeSheep(0, coat), makeSheep(1, coat)]);
  SPR.cow = [0, 1, 2].map((coat) => [makeCow(0, coat), makeCow(1, coat)]);
  SPR.pig = [0, 1, 2].map(() => [makePig(0), makePig(1)]);
  SPR.items = { cake: makeItem('cake'), ale: makeItem('ale'), leaf: makeItem('leaf'), remedy: makeItem('remedy'), book: makeItem('book') };
}

// The round door, windows, porch, lantern and chimneys of a hobbit-hole,
// drawn every frame (they open, light up and catch the snow) in half-pixels.
function drawDoor(ctx, h) {
  ctx.save(); ctx.scale(1 / RS, 1 / RS);
  const K = RS, V = h.v || {};
  const r = h.doorR * K, x = h.doorX * K, y = (h.doorY - h.doorR - 1) * K;
  const open = h.doorAnim > 0;
  const winter = World.season === 'winter';
  const dc = h.doorColor, dDark = shade(dc, -0.25), dLite = shade(dc, 0.22);
  const R = (x0, y0, w, hh, col) => { ctx.fillStyle = col; ctx.fillRect(x0, y0, w, hh); };
  // the frame
  disc(ctx, x, y, r + 1, '#2a1c12'); R(x - r - 1, y, (r + 1) * 2 + 1, r + 2, '#2a1c12');
  if (open) {
    const glow = h.lit ? '#e8a84a' : '#1a120a';
    disc(ctx, x, y, r - 1, glow); R(x - r + 1, y, r * 2 - 1, r + 1, glow);
    if (h.lit) { disc(ctx, x, y + 4, r - 5, '#f4c070'); R(x - 3, y - 2, 6, r + 2, '#f8d890'); }
    // the door swung open against the frame
    R(x - r + 1, y - r + 4, 5, r * 2 - 3, dc); R(x - r + 1, y - r + 4, 1, r * 2 - 3, dDark);
  } else {
    disc(ctx, x, y, r - 1, dc); R(x - r + 1, y, r * 2 - 1, r + 1, dc);
    // planks
    for (let k = -r + 3; k < r - 1; k += 3) R(x + k, y - r + 3, 1, r * 2 - 2, dDark);
    if (V.door === 1) { R(x - r + 1, y + 1, r * 2 - 1, 2, dDark); R(x - r + 1, y, r * 2 - 1, 1, dLite); }
    // iron hinges, studs on the studded door
    R(x - r + 1, y - 6, 8, 2, '#3a3a40'); R(x - r + 1, y + 8, 8, 2, '#3a3a40'); R(x - r + 7, y - 7, 2, 4, '#3a3a40'); R(x - r + 7, y + 7, 2, 4, '#3a3a40');
    if (V.door === 2) for (const [ax, ay] of [[-5, -6], [5, -6], [-5, 6], [5, 6], [0, -9], [0, 9]]) { R(x + ax, y + ay, 2, 2, '#2a2018'); R(x + ax, y + ay, 1, 1, '#6a6a70'); }
    // a highlight round the top of the door
    for (let a = 0; a < 10; a++) { const ang = Math.PI * 1.15 + (a / 9) * Math.PI * 0.5; R(Math.round(x + Math.cos(ang) * (r - 3)), Math.round(y + Math.sin(ang) * (r - 3)), 2, 1, dLite); }
    // the brass knob, in the middle as it should be
    disc(ctx, x, y + 1, 3, '#b8902a'); disc(ctx, x, y + 1, 2, '#e8c860'); R(x - 1, y, 1, 1, '#fff2a0');
  }
  if (V.porch) {
    // a little timber porch with a shingled roof
    const pw = r * 2 + 18, px0 = x - r - 9, py0 = y - r - 9;
    R(px0, py0, pw, 6, '#5a3a22'); R(px0 + 1, py0 - 1, pw - 2, 2, '#7a5030');
    for (let k = 0; k < pw; k += 4) R(px0 + k, py0 + 2, 3, 1, '#4a2e1a');
    R(px0, py0 + 4, 4, r * 2 + 6, '#5a3a22'); R(px0 + 1, py0 + 4, 1, r * 2 + 6, '#7a5030');
    R(px0 + pw - 4, py0 + 4, 4, r * 2 + 6, '#4a2e1a'); R(px0 + pw - 3, py0 + 4, 1, r * 2 + 6, '#6a4426');
    if (winter) { R(px0 - 1, py0 - 3, pw + 2, 3, '#f4f8ff'); R(px0, py0 - 4, pw, 1, '#ffffff'); }
  }
  for (const w of h.windows) {
    const wx = w.x * K, wy = w.y * K;
    const glass = h.lit ? (h.neon ? '#8af4ff' : '#ffd77a') : (h.neon ? '#2a4a6a' : '#41556a');
    const shine = h.lit ? '#fff0b0' : '#6a84a0', frame = V.frameCol || '#4a2e1a';
    if (V.square) {
      R(wx - 9, wy - 9, 19, 19, frame); R(wx - 8, wy - 8, 17, 17, glass);
      R(wx - 6, wy - 6, 3, 3, shine); R(wx - 7, wy - 7, 1, 1, shine);
      R(wx, wy - 8, 1, 17, frame); R(wx - 8, wy, 17, 1, frame);
      // shutters with planks
      for (const sxo of [-16, 11]) { R(wx + sxo, wy - 9, 6, 19, dc); R(wx + sxo + 2, wy - 9, 1, 19, dDark); R(wx + sxo, wy - 9, 6, 1, dLite); R(wx + sxo + 1, wy - 3, 4, 1, dDark); R(wx + sxo + 1, wy + 3, 4, 1, dDark); }
    } else {
      disc(ctx, wx, wy, 9, frame); disc(ctx, wx, wy, 8, glass);
      R(wx - 5, wy - 5, 3, 2, shine); R(wx - 5, wy - 3, 1, 1, shine);
      R(wx, wy - 8, 1, 17, frame); R(wx - 8, wy, 17, 1, frame);
    }
    if (V.boxes && !winter) {
      R(wx - 13, wy + 12, 27, 5, '#6a4426'); R(wx - 13, wy + 12, 27, 1, '#8a6440'); R(wx - 13, wy + 16, 27, 1, '#4a2e1a');
      R(wx - 12, wy + 10, 25, 2, '#3a7a2a');
      for (let k = 0; k < 9; k++) { R(wx - 12 + k * 3, wy + 8 + (k % 2), 2, 2, ['#e04a5a', '#f2d24a', '#ffffff', '#c070e0', '#f08a4a'][(k + h.id) % 5]); }
    }
  }
  if (h.roofWin) {
    const rx = h.roofWin.x * K, ry = h.roofWin.y * K;
    disc(ctx, rx, ry, 7, '#4a2e1a'); disc(ctx, rx, ry, 6, h.lit ? '#ffd77a' : '#41556a');
    R(rx, ry - 6, 1, 13, '#4a2e1a'); R(rx - 3, ry - 3, 2, 2, h.lit ? '#fff0b0' : '#6a84a0');
  }
  if (V.lantern) {
    const lx = x + r + (V.porch ? 14 : 8), ly = y - 4;
    R(lx - 3, ly - 8, 6, 2, '#2a2018'); R(lx, ly - 8, 1, 3, '#2a2018');
    R(lx - 4, ly - 4, 9, 12, '#2a2018'); R(lx - 3, ly - 3, 7, 10, Game.darkness > 0.1 ? '#ffd77a' : '#c8b890');
    R(lx - 3, ly + 2, 7, 1, '#2a2018'); R(lx, ly - 3, 1, 10, '#2a2018');
    if (Game.darkness > 0.1) R(lx - 2, ly - 2, 2, 3, '#fff4c0');
    R(lx - 5, ly + 8, 11, 2, '#2a2018');
  }
  // chimneys: brick, with a capstone
  for (const c of [h.chimney, h.chimney2]) {
    if (!c) continue;
    const cx = c.x * K, cy = c.y * K;
    R(cx - 6, cy - 16, 14, 18, '#7a5a4a');
    for (let row = 0; row < 6; row++) for (let col = 0; col < 3; col++) R(cx - 6 + col * 5 + (row % 2) * 2, cy - 16 + row * 3, 4, 2, row % 3 === 1 ? '#9a6a54' : '#8a5e4a');
    R(cx - 6, cy - 16, 2, 18, '#6a4a3c');
    R(cx - 8, cy - 20, 18, 5, '#4a3a2a'); R(cx - 8, cy - 20, 18, 1, '#6a5a4a');
    if (winter) { R(cx - 8, cy - 22, 18, 2, '#f4f8ff'); R(cx - 7, cy - 23, 16, 1, '#ffffff'); }
  }
  ctx.restore();
  if (h.neon) drawNeonHome(ctx, h);
}

// A site being dug: stakes, string, and a heap of earth that grows as work goes on.
function drawSite(ctx, h) {
  ctx.save(); ctx.scale(1 / RS, 1 / RS);
  const K = RS, p = h.buildProg || 0;
  const x = h.doorX * K, y = h.doorY * K;
  const rr = Math.round((3 + p * 5) * K);
  disc(ctx, x, y - rr, rr, '#3a2414');
  disc(ctx, x, y - rr, Math.max(1, rr - 3), p > 0.5 ? '#6a4426' : '#4a2e1a');
  for (let k = 0; k < 8; k++) { ctx.fillStyle = '#8a6440'; ctx.fillRect(x - rr + ((k * 7) % (rr * 2)), y - rr - 2 + ((k * 5) % rr), 2, 2); }
  for (const ox of [-28, 28]) {
    ctx.fillStyle = '#c9a46a'; ctx.fillRect(x + ox, y - 20, 3, 24); ctx.fillStyle = '#a07a50'; ctx.fillRect(x + ox + 2, y - 20, 1, 24);
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(x + ox - 1, y - 22, 5, 3);
  }
  ctx.fillStyle = 'rgba(244,239,226,0.8)'; ctx.fillRect(x - 27, y - 18, 56, 1);
  ctx.restore();
}

// The wheel turns at double resolution: spokes, a rim, paddles that drip.
function drawMillWheel(ctx, w = World.millWheel) {
  ctx.save(); ctx.scale(1 / RS, 1 / RS);
  const K = RS, r = w.r * K, cx = Math.round(w.x * K), cy = Math.round(w.y * K);
  const R = (x, y, ww, hh, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, ww, hh); };
  // the wheel is hung from the mill: a stone pier built out from the wall to
  // carry its axle, and a wooden flume that pours water over the top
  if (w.wallX != null) {
    const px0 = Math.round(w.wallX * K), px1 = cx - 6, py0 = Math.round(w.wallY * K), py1 = cy + 10;
    if (px1 > px0) {
      R(px0, py0, px1 - px0, py1 - py0, '#6a6458');
      for (let y = py0; y < py1; y += 6) for (let x = px0 + ((y - py0) / 6 % 2) * 5; x < px1; x += 10) { R(x, y, 9, 5, '#8a8478'); R(x, y, 9, 1, '#a8a294'); }
      R(px0, py0, px1 - px0, 2, '#4a463e'); R(px1 - 2, py0, 2, py1 - py0, '#4a463e');
      R(px0, py1 - 3, px1 - px0, 3, '#3e5a6a');
    }
    // the axle runs from the pier into the hub
    R(px1 - 4, cy - 3, cx - px1 + 4, 6, '#3a2414'); R(px1 - 4, cy - 3, cx - px1 + 4, 1, '#6a4a2a');
    R(px1 - 8, cy - 6, 6, 12, '#4a4a52'); R(px1 - 8, cy - 6, 6, 2, '#6a6a74');
    // the flume, on trestles, with water spilling onto the paddles
    const fx0 = px0 + 4, fx1 = cx + 4, fy = cy - r - 8;
    R(fx0, fy, fx1 - fx0, 5, '#6a4426'); R(fx0, fy, fx1 - fx0, 1, '#8a6440'); R(fx0, fy + 4, fx1 - fx0, 1, '#4a2e1a');
    R(fx0 + 2, fy + 5, 2, py0 - fy - 5 > 0 ? py0 - fy - 5 : 0, '#4a2e1a');
    for (let k = 0; k < 4; k++) R(fx1 - 2 + ((k + Math.floor(tReal * 8)) % 3), fy + 5 + k * 3, 2, 3, k % 2 ? '#a8d8f0' : '#d8f0ff');
  }
  // the rim
  for (let k = 0; k < 64; k++) { const a = w.a + (k / 64) * Math.PI * 2; R(Math.round(cx + Math.cos(a) * (r - 4)) - 1, Math.round(cy + Math.sin(a) * (r - 4)) - 1, 3, 3, '#5a3a22'); }
  for (let k = 0; k < 8; k++) {
    const a = w.a + (k / 8) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    for (let s2 = 0; s2 < r - 4; s2++) R(Math.round(cx + ca * s2) - 1, Math.round(cy + sa * s2) - 1, 3, 3, '#4a2e1a');
    // a paddle, with a wet highlight
    const px = Math.round(cx + ca * r), py = Math.round(cy + sa * r);
    R(px - 4, py - 4, 9, 9, '#7a5030'); R(px - 4, py - 4, 9, 2, '#9a7048');
    if (sa > 0.6) R(px - 1, py + 5, 2, 3, '#a8d8f0');
  }
  disc(ctx, cx, cy, 5, '#2a1c12'); disc(ctx, cx, cy, 2, '#6a6a70');
  ctx.restore();
}

// Four lattice sails on the windmill's cap.
function drawWindmillSails(ctx) {
  const w = World.windmill;
  ctx.save(); ctx.scale(1 / RS, 1 / RS);
  const K = RS;
  for (let k = 0; k < 4; k++) {
    const a = w.a + (k / 4) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    for (let s2 = 6; s2 < w.r * K; s2++) {
      const px = w.x * K + ca * s2, py = w.y * K + sa * s2 * 0.9;
      ctx.fillStyle = '#4a2e1a'; ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
      if (s2 > 14) {
        // the cloth of the sail, laid over a lattice, to one side of the stock
        for (let t = 2; t <= 18; t++) {
          const qx = px - sa * t, qy = py + ca * t * 0.9;
          ctx.fillStyle = (s2 % 8 === 0 || t % 6 === 0) ? '#8a6a4a' : t > 16 ? '#d8cfb8' : '#efe6cf';
          ctx.fillRect(Math.round(qx), Math.round(qy), 1, 1);
        }
      }
    }
  }
  disc(ctx, w.x * K, w.y * K, 6, '#3a2414'); disc(ctx, w.x * K, w.y * K, 2, '#7a5030');
  ctx.restore();
}

function drawPartyLanterns(ctx, time, on) {
  const poles = World.partyPoles;
  // the strings hang from the lower boughs of the great oak
  const top = { x: PARTY.treeX * 16 + 8, y: PARTY.treeY * 16 - 70 };
  const cols = ['#ff6a5a', '#ffd34a', '#6ad0ff', '#9aff7a', '#ff9ae0'];
  for (let i = 0; i < poles.length; i++) {
    const p = poles[i];
    const n = 28;
    const sag = 8 + Math.hypot(p.x - top.x, p.y - top.y) * 0.08;
    ctx.fillStyle = 'rgba(42,28,18,0.75)';
    for (let k = 1; k < n * 3; k++) {
      const t = k / (n * 3);
      ctx.fillRect(Math.round(lerp(top.x, p.x, t) * RS) / RS, Math.round((lerp(top.y, p.y, t) + Math.sin(t * Math.PI) * sag) * RS) / RS, 0.5, 0.5);
    }
    for (let k = 3; k < n - 1; k += 4) {
      const t = k / n;
      const x = Math.round(lerp(top.x, p.x, t)), y = Math.round(lerp(top.y, p.y, t) + Math.sin(t * Math.PI) * sag) + 1;
      const col = cols[(i + k) % cols.length];
      ctx.fillStyle = on ? (Math.sin(time * 3 + i * 2 + k) > -0.85 ? col : shade(col, -0.3)) : shade(col, -0.45);
      ctx.fillRect(x - 1, y + 0.5, 3, 2.5); ctx.fillRect(x - 0.5, y, 2, 3.5);
      ctx.fillStyle = 'rgba(42,28,18,0.8)'; ctx.fillRect(x, y - 0.5, 1, 0.5); ctx.fillRect(x - 0.5, y + 3.5, 2, 0.5);
      if (on) { ctx.fillStyle = 'rgba(255,255,230,0.85)'; ctx.fillRect(x - 0.5, y + 1, 1, 1); }
    }
  }
}

function drawBonfire(ctx, time, lit) {
  const { x, y } = World.bonfire;
  ctx.fillStyle = '#4a2e1a'; ctx.fillRect(x - 7, y - 2, 14, 3); ctx.fillStyle = '#6a4426'; ctx.fillRect(x - 5, y - 4, 10, 2);
  if (!lit) return;
  for (let k = 0; k < 14; k++) {
    const fx = x - 5.5 + k * 0.85, h = 5 + Math.abs(Math.sin(time * 9 + k * 1.3)) * 8 * (1 - Math.abs(k - 6.5) / 9);
    ctx.fillStyle = k % 3 === 0 ? '#e8602a' : k % 2 ? '#ff9a2a' : '#ffd34a';
    ctx.fillRect(Math.round(fx * RS) / RS, Math.round((y - 3 - h) * RS) / RS, 1, Math.round(h * RS) / RS);
  }
  ctx.fillStyle = '#fff2a0'; ctx.fillRect(x - 1, y - 8, 2.5, 4);
  for (let k = 0; k < 4; k++) { const ey = y - 12 - ((time * 12 + k * 5) % 16); ctx.fillStyle = 'rgba(255,200,90,0.8)'; ctx.fillRect(Math.round((x - 3 + k * 2 + Math.sin(time * 4 + k) * 2) * RS) / RS, Math.round(ey * RS) / RS, 0.5, 0.5); }
}
