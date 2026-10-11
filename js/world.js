'use strict';
// ---------------------------------------------------------------------------
// The village of Thistledown: map layout, seasonal ground painting, places,
// crops and critters, and A* pathfinding.
// ---------------------------------------------------------------------------

const T = { GRASS: 0, PATH: 1, WATER: 2, BRIDGE: 3, SOIL: 4, HILL: 5, LAWN: 6, COBBLE: 7, WEED: 8, FIELD: 9 };
const TILE_COST = [1.5, 1, 0, 1, 3, 0, 1.3, 1, 2.5, 2.2];

// Hobbit-holes. `site` marks a grassy knoll where a new home can be dug.
const HOME_DEFS = [
  { cx: 64, cy: 9, rx: 9, ry: 5.5, grand: true },
  { cx: 46, cy: 16, rx: 5, ry: 3.5 },
  { cx: 33, cy: 21, rx: 4.5, ry: 3 },
  { cx: 20, cy: 25, rx: 4.5, ry: 3 },
  { cx: 80, cy: 18, rx: 5, ry: 3.5 },
  { cx: 50, cy: 40, rx: 4.5, ry: 3 },
  { cx: 33, cy: 36, rx: 4.5, ry: 3 },
  { cx: 92, cy: 32, rx: 4.5, ry: 3 },
  { cx: 46, cy: 66, rx: 4.5, ry: 3 },
  { cx: 82, cy: 66, rx: 4.5, ry: 3 },
  { cx: 36, cy: 47, rx: 4.5, ry: 3, site: true },
  { cx: 98, cy: 44, rx: 4.5, ry: 3, site: true },
  { cx: 36, cy: 62, rx: 4.5, ry: 3, site: true },
  { cx: 12, cy: 62, rx: 4.5, ry: 3, site: true },
  { cx: 72, cy: 80, rx: 4.5, ry: 3, site: true },
  { cx: 88, cy: 86, rx: 4.5, ry: 3, site: true },
];
const HOME_SUFFIX = ['End', 'Burrow', 'Hole', 'Hollow', 'Nook', 'Delving', 'Bank', 'Under-hill', 'Smial', 'Cosy', 'Rise', 'Dell'];

const ROADS = [
  [1.1, [64, 15], [64, 25]],
  [1.1, [64, 31], [64, 46], [64, 58], [64, 72], [64, 92]],
  [1.0, [0, 30], [14, 30], [26, 29], [40, 29], [52, 28.5], [61, 28]],
  [1.0, [67, 27], [80, 26], [91, 22]],
  [0.85, [80, 22], [80, 26]],
  [0.85, [46, 20], [50, 24], [56, 26], [61, 27]],
  [0.85, [33, 25], [36, 29]],
  [0.85, [50, 44], [56, 42], [62, 40]],
  [0.85, [33, 40], [40, 42], [46, 44], [50, 44]],
  [0.85, [92, 36], [86, 39], [82, 42]],
  [0.85, [80, 26], [86, 30], [92, 36], [100, 38], [106, 38]],
  [0.85, [106, 38], [104, 46], [102, 50], [102, 58], [106, 64]],
  [0.8, [98, 48], [102, 50]],
  [0.9, [24, 30], [25, 40], [26, 50], [26, 60], [26, 73]],
  [0.85, [36, 51], [30, 50], [26, 50]],
  [0.85, [14, 30], [14, 20], [17, 13]],
  [0.9, [64, 73], [46, 73], [26, 73], [12, 73]],
  [0.85, [46, 70], [46, 73]],
  [0.85, [36, 66], [36, 73]],
  [0.85, [12, 66], [12, 73]],
  [0.9, [64, 72], [82, 72], [92, 72], [100, 68], [106, 64]],
  [0.85, [82, 70], [82, 72]],
  [0.85, [64, 86], [72, 84]],
  [0.85, [64, 90], [80, 90], [88, 90]],
  [0.8, [64, 43], [68, 43]],
  [0.8, [82, 42], [78, 43]],
  [0.8, [59, 70], [64, 70]],
  [0.85, [86, 8], [87, 15], [89, 20], [91, 22]],
];

const RIVER_Y = (x) => 54 + 2.5 * Math.sin(x * 0.06 + 0.8) + 1.2 * Math.sin(x * 0.17);
const POND = { cx: 100, cy: 78, rx: 6, ry: 4 };
const PARTY = { cx: 100, cy: 16, rx: 11, ry: 7, treeX: 100, treeY: 12, danceX: 100, danceY: 17.4 };
const PLAZA = { cx: 64, cy: 28, r: 4 };
const INN_RECT = { x0: 69, x1: 76, y0: 36, y1: 40 };
const WEED_FIELD = { x0: 6, x1: 18, y0: 33, y1: 41 };
const FIELDS = [{ x0: 14, x1: 30, y0: 75, y1: 86, name: 'the west barley field' }, { x0: 38, x1: 56, y0: 76, y1: 88, name: 'the east barley field' }];
const STORY = { x: 44, y: 32 };
const WEST_EXIT = { x: 0 * 16 + 4, y: 30 * 16 + 12 };

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

// ---------------------------------------------------------------------------
// Statics: anything drawn y-sorted with the villagers. Seasonal statics carry
// a `gen` recipe and are redrawn when the season turns; `snow` ones get a
// dusting in winter; `seasons` limits when a static is shown at all.
// ---------------------------------------------------------------------------
const SEASON_CACHE = new Map();
function seasonalImage(gen, season) {
  const key = gen.type + ':' + gen.seed + ':' + (gen.kind || '') + ':' + season;
  if (!SEASON_CACHE.has(key)) {
    let img;
    if (gen.type === 'tree') img = makeTree(gen.seed, gen.kind, season);
    else if (gen.type === 'bush') img = makeBush(gen.seed, season);
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
function buildWorld(seed) {
  World.seed = seed;
  const rng = mulberry32(seed);
  const tiles = World.tiles;
  tiles.fill(T.GRASS);

  // River and pond
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (Math.abs(y + 0.5 - RIVER_Y(x + 0.5)) < 1.5) tiles[tIdx(x, y)] = T.WATER;
    const px = (x + 0.5 - POND.cx) / POND.rx, py = (y + 0.5 - POND.cy) / POND.ry;
    if (px * px + py * py < 1) tiles[tIdx(x, y)] = T.WATER;
  }
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

  // Roads
  for (const [r, ...pts] of ROADS) {
    for (let s = 0; s < pts.length - 1; s++) {
      const [ax, ay] = pts[s], [bx, by] = pts[s + 1];
      const len = Math.hypot(bx - ax, by - ay);
      for (let t = 0; t <= len; t += 0.2) {
        const px = ax + (bx - ax) * (t / len), py = ay + (by - ay) * (t / len);
        for (let y = Math.floor(py - r - 1); y <= Math.ceil(py + r + 1); y++)
          for (let x = Math.floor(px - r - 1); x <= Math.ceil(px + r + 1); x++) {
            if (!inMap(x, y)) continue;
            if (Math.hypot(x - px, y - py) > r) continue;
            const cur = tiles[tIdx(x, y)];
            if (cur === T.HILL) continue;
            tiles[tIdx(x, y)] = cur === T.WATER || cur === T.BRIDGE ? T.BRIDGE : T.PATH;
          }
      }
    }
  }
  // Plaza
  for (let y = PLAZA.cy - 6; y < PLAZA.cy + 6; y++) for (let x = PLAZA.cx - 7; x < PLAZA.cx + 7; x++) if (Math.hypot(x - PLAZA.cx, (y - PLAZA.cy) * 1.2) < PLAZA.r + 0.7) tiles[tIdx(x, y)] = T.COBBLE;
  // Inn yard
  for (let y = INN_RECT.y1 + 1; y <= INN_RECT.y1 + 6; y++) for (let x = INN_RECT.x0 - 2; x <= INN_RECT.x1 + 2; x++) if (tiles[tIdx(x, y)] !== T.WATER) tiles[tIdx(x, y)] = T.COBBLE;
  // Pipe-weed field, barley fields
  for (let y = WEED_FIELD.y0; y <= WEED_FIELD.y1; y++) for (let x = WEED_FIELD.x0; x <= WEED_FIELD.x1; x++) tiles[tIdx(x, y)] = T.WEED;
  for (const f of FIELDS) for (let y = f.y0; y <= f.y1; y++) for (let x = f.x0; x <= f.x1; x++) if (tiles[tIdx(x, y)] !== T.PATH) tiles[tIdx(x, y)] = T.FIELD;

  World.block.fill(0);
  World.reserved.fill(0);
  World.statics = [];
  World.benches = []; World.fishing = []; World.shade = []; World.mushrooms = []; World.weed = []; World.fields = []; World.herbBeds = [];
  World.wildHerbs = []; World.woodSpots = []; World.orchard = []; World.hives = []; World.hens = []; World.storySeats = [];
  World.partySpots = []; World.partySeats = []; World.lamps = []; World.partyPoles = []; World.flowers = []; World.buildings = {};
  const res = (x, y, r = 0) => { for (let j = y - r; j <= y + r; j++) for (let i = x - r; i <= x + r; i++) if (inMap(i, j)) World.reserved[tIdx(i, j)] = 1; };
  const blk = (x, y) => { if (inMap(x, y)) { World.block[tIdx(x, y)] = 1; World.reserved[tIdx(x, y)] = 1; } };
  const addStatic = (img, x, y, opts = {}) => {
    const s = {
      img, base: img, x: Math.round(x), y: Math.round(y), ox: opts.ox ?? Math.floor(img.width / 2), oy: opts.oy ?? img.height, w: img.width,
      sortY: y + (opts.sortBias || 0), snow: opts.snow !== false, gen: opts.gen, seasons: opts.seasons,
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
    blk(INN_RECT.x1 + 1, INN_RECT.y1 + 1); blk(INN_RECT.x1 + 2, INN_RECT.y1 + 1);
  }
  const cot = (opts) => [makeCottage({ ...opts, lit: false }), makeCottage({ ...opts, lit: true })];
  {
    const [d, n] = cot({ w: 92, wall: '#efe2c0', roof: 'thatch', sign: 'bread', windows: [14, 66], door: 46, chimneys: [64] });
    addBuilding('bakery', { x0: 52, x1: 56, y0: 32, y1: 34, img: d, imgNight: n, doorOff: 46, name: 'The Bakehouse', chimneys: [64] });
  }
  {
    const [d, n] = cot({ w: 84, wall: '#e2d4b0', roof: 'slate', sign: 'mug', windows: [12, 60], door: 42, chimneys: [16], extra: (x, o) => { for (let k = 0; k < 3; k++) { x.fillStyle = '#7a4e2a'; x.fillRect(o.Rr - 14 - k * 9, o.wallBot - 10, 8, 10); x.fillStyle = '#3a3a3a'; x.fillRect(o.Rr - 14 - k * 9, o.wallBot - 8, 8, 1); } } });
    addBuilding('brewhouse', { x0: 80, x1: 84, y0: 37, y1: 39, img: d, imgNight: n, doorOff: 42, name: 'The Brewhouse', chimneys: [16] });
  }
  {
    const [d, n] = cot({ w: 92, wall: '#d8c8a0', roof: 'thatch', sign: 'saw', windows: [12], door: 40, chimneys: [70],
      extra: (x, o) => { x.fillStyle = '#3a2414'; x.fillRect(58, o.wallTop + 12, 26, o.wallBot - o.wallTop - 12); for (let k = 0; k < 4; k++) { disc(x, 64 + (k % 2) * 8, o.wallBot - 4 - Math.floor(k / 2) * 6, 3, '#7a5030'); x.fillStyle = '#d8b07a'; x.fillRect(63 + (k % 2) * 8, o.wallBot - 5 - Math.floor(k / 2) * 6, 2, 2); } } });
    addBuilding('workshop', { x0: 104, x1: 108, y0: 35, y1: 37, img: d, imgNight: n, doorOff: 40, name: 'The Woodwright\'s Workshop', chimneys: [70] });
  }
  {
    const [d, n] = cot({ w: 76, wall: '#e8e0c8', roof: 'thatch', sign: 'herb', windows: [10, 54], door: 38, chimneys: [52], doorCol: '#3a6a4a',
      extra: (x, o) => { for (let k = 0; k < 40; k++) { x.fillStyle = k % 3 ? '#3a7a3a' : '#5aa04a'; x.fillRect(o.L + (k * 7) % (o.Rr - o.L), o.wallTop + ((k * 13) % 30), 2, 2); } } });
    addBuilding('herbalist', { x0: 104, x1: 108, y0: 61, y1: 63, img: d, imgNight: n, doorOff: 38, name: 'The Herbalist\'s Cottage', chimneys: [52] });
  }
  {
    const [d, n] = cot({ w: 84, h: 84, roof: 'barn', sign: 'sack', windows: [], door: 42 });
    addBuilding('store', { x0: 54, x1: 58, y0: 22, y1: 24, img: d, imgNight: n, doorOff: 42, name: 'The Common Store' });
  }
  {
    const [d, n] = cot({ w: 92, h: 84, roof: 'barn', sign: 'grain', windows: [], door: 46 });
    addBuilding('barn', { x0: 57, x1: 62, y0: 66, y1: 68, img: d, imgNight: n, doorOff: 46, name: 'The Granary Barn' });
  }
  // Mill on the north bank, wheel in the river
  {
    const mx = 87;
    let top = 99; for (let y = 30; y < MAP_H; y++) if (tileAt(mx, y) === T.WATER) { top = y; break; }
    const millImg = makeMill();
    const b = addBuilding('mill', { x0: mx - 2, x1: mx + 2, y0: top - 5, y1: top - 2, img: millImg, imgNight: millImg, doorOff: 34, name: 'The Old Mill', rows: 4 });
    World.millWheel = { x: (mx + 3.2) * 16, y: (top - 0.4) * 16, r: 15, a: 0 };
    World.millWheels = [World.millWheel];
    for (let y = top - 3; y <= top - 1; y++) blk(mx + 3, y);
    b.stepX = b.left + 34; b.stepY = b.bottom + 10;
  }
  // a second watermill upstream, on the west reach of the river
  {
    const mx = 44;
    let top = 99; for (let y = 30; y < MAP_H; y++) if (tileAt(mx, y) === T.WATER) { top = y; break; }
    const millImg = makeMill();
    const b = addBuilding('mill2', { x0: mx - 2, x1: mx + 2, y0: top - 5, y1: top - 2, img: millImg, imgNight: millImg, doorOff: 34, name: 'The West Mill', rows: 4 });
    // the river bends here, so the wheel sits at its own water line
    let wtop = top; for (let y = top - 3; y < MAP_H; y++) if (tileAt(mx + 3, y) === T.WATER) { wtop = y; break; }
    const w = { x: (mx + 3.2) * 16, y: (wtop - 0.4) * 16, r: 15, a: 1.3 };
    World.millWheels.push(w);
    for (let y = top - 3; y <= wtop - 1; y++) blk(mx + 3, y);
    b.stepX = b.left + 34; b.stepY = b.bottom + 10;
  }
  // a windmill on the high ground above the village, sails turning in the breeze
  {
    const wx = 86, wy = 6;
    const img = makeWindmill();
    const b = addBuilding('windmill', { x0: wx - 1, x1: wx + 1, y0: wy - 2, y1: wy, img, imgNight: img, doorOff: 28, name: 'The Windmill', rows: 3 });
    World.windmill = { x: b.left + 28, y: b.bottom - 80, a: 0, r: 42, sortY: b.bottom };
    for (let y = wy - 5; y <= wy; y++) for (let x = wx - 3; x <= wx + 3; x++) res(x, y);
  }

  // --- Plaza: well, market, notice board, signpost, benches, lamps ---
  addStatic(makeWell(), 67.5 * 16, 25 * 16 + 2); blk(67, 24);
  World.wellSpot = makeSpot(67.5 * 16, 25 * 16 + 12, 'up', 'stand', 'well');
  World.wells = [World.wellSpot];
  addStatic(makeStall(), 60.5 * 16, 25.4 * 16); blk(59, 24); blk(60, 24); blk(61, 24);
  World.marketSpot = makeSpot(60.5 * 16, 26.3 * 16, 'up', 'stand', 'market');
  addStatic(makeNoticeBoard(), 68.5 * 16, 31.3 * 16); blk(68, 30);
  World.postSpot = makeSpot(68.5 * 16, 32 * 16, 'up', 'stand', 'post');
  addStatic(makeSignpost(), 60 * 16, 31.5 * 16); blk(59, 30);
  const benchImg = makeBench();
  for (const [bx, by] of [[61, 30], [66.5, 30.5], [58, 36], [69, 33], [52, 46], [40, 50], [62, 50], [70, 58], [92, 56], [96, 66], [30, 31], [80, 29], [56, 63]]) {
    const tx = Math.floor(bx), ty = Math.floor(by);
    if (!(tileAt(tx, ty) === T.GRASS || tileAt(tx, ty) === T.PATH || tileAt(tx, ty) === T.COBBLE) || World.block[tIdx(tx, ty)]) continue;
    addStatic(benchImg, bx * 16 + 8, ty * 16 + 12, { sortBias: -1 });
    World.benches.push(makeSpot(bx * 16 + 8, ty * 16 + 12, 'down', 'sit', 'bench')); res(tx, ty);
  }
  const lampImg = makeLampPost();
  for (const [lx, ly] of [[61.5, 25], [66.5, 27.5], [62.4, 33.5], [66.3, 39.5], [66.4, 45.4], [78.6, 45], [64.6, 17.6], [62.6, 51], [65.6, 59.5],
    [62.6, 69.5], [56.5, 29], [80.6, 28.6], [24.5, 31.5], [47, 21], [91, 24.6], [101, 37.6], [27.6, 51.6], [100.5, 59.6], [83.6, 43.5]]) {
    const tx = Math.floor(lx), ty = Math.floor(ly - 0.5);
    if (World.block[tIdx(tx, ty)] || tileAt(tx, ty) === T.WATER || tileAt(tx, ty) === T.HILL) continue;
    addStatic(lampImg, lx * 16, ly * 16, { snow: true }); World.lamps.push({ x: lx * 16, y: ly * 16 - 22 }); blk(tx, ty);
  }

  // --- Story circle beneath an old oak ---
  addStatic(makeTree(5151, 'big'), STORY.x * 16 + 8, (STORY.y + 1) * 16, { gen: { type: 'tree', seed: 5151, kind: 'big' } });
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
  addStatic(makeTree(4242, 'big'), PARTY.treeX * 16 + 8, (PARTY.treeY + 1) * 16, { gen: { type: 'tree', seed: 4242, kind: 'big' } });
  for (let x = PARTY.treeX - 1; x <= PARTY.treeX + 1; x++) blk(x, PARTY.treeY);
  res(PARTY.treeX, PARTY.treeY, 2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    World.partySpots.push(makeSpot((PARTY.danceX + Math.cos(a) * 3) * 16 + 8, (PARTY.danceY + Math.sin(a) * 1.9) * 16, 'down', 'dance', 'party'));
  }
  for (let y = PARTY.danceY - 3; y <= PARTY.danceY + 3; y++) for (let x = PARTY.cx - 4; x <= PARTY.cx + 4; x++) res(Math.floor(x), Math.floor(y));
  const tableImg = makeTable();
  for (const [tx, ty] of [[91, 14], [109, 14], [92, 20], [108, 20], [100, 22]]) {
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
  addStatic(makeMaypole(), 94.5 * 16, 18.6 * 16, { seasons: ['spring'], snow: false }); blk(94, 18);
  World.bonfire = { x: 106 * 16 + 8, y: 18 * 16 + 8 };
  blk(106, 18);
  addStatic(makeHay(), 88 * 16, 10 * 16); blk(87, 9);
  addStatic(makeHay(), 113 * 16, 19 * 16); blk(112, 18);

  // --- Pipe-weed field ---
  const fenceH = makeFence(true);
  for (let x = WEED_FIELD.x0; x <= WEED_FIELD.x1; x++) if (tileAt(x, WEED_FIELD.y0 - 1) === T.GRASS) addStatic(fenceH, x * 16 + 8, WEED_FIELD.y0 * 16 - 4);
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
  addStatic(makeHenhouse(), 53 * 16 + 8, 70 * 16 + 4); blk(52, 69); blk(53, 69); blk(54, 69);
  World.henhouse = { x: 53 * 16 + 8, y: 70 * 16 + 12 };
  for (let i = 0; i < 5; i++) World.hens.push({ x: (50 + i * 1.5) * 16, y: 71.5 * 16, a: rng() * 6, t: 0, hx: 53 * 16, hy: 71.5 * 16 });

  // --- Herb beds by the herbalist ---
  for (let y = 66; y <= 68; y += 2) for (let x = 99; x <= 103; x++) {
    if (tileAt(x, y) !== T.GRASS) continue;
    tiles[tIdx(x, y)] = T.SOIL; res(x, y);
    World.herbBeds.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, stage: 1 + Math.floor(rng() * 4), prog: rng(), claimed: null });
  }

  // --- Orchard with beehives ---
  const appleImgs = [0, 1, 2].map((k) => 900 + k);
  for (let gy = 6; gy <= 14; gy += 4) for (let gx = 6; gx <= 26; gx += 5) {
    const ax = gx + (gy % 8 === 2 ? 2 : 0), ay = gy;
    if (tileAt(ax, ay) !== T.GRASS || World.reserved[tIdx(ax, ay)]) continue;
    const seed = appleImgs[(ax + ay) % 3];
    addStatic(makeTree(seed, 'apple'), ax * 16 + 8, (ay + 1) * 16 - 2, { gen: { type: 'tree', seed, kind: 'apple' } }); blk(ax, ay); res(ax, ay, 1);
    World.orchard.push({ tx: ax, ty: ay, x: ax * 16 + 8, y: (ay + 1) * 16 + 12, apples: 2 + Math.floor(rng() * 3), claimed: null });
    if (walkable(ax, ay + 1) && World.shade.length < 6) World.shade.push(makeSpot(ax * 16 + 8, (ay + 1) * 16 + 10, 'down', 'sit', 'shade'));
  }
  for (const [hx, hy] of [[31, 8], [32, 10.5], [31, 13]]) {
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
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    if (tiles[tIdx(x, y)] !== T.GRASS || World.reserved[tIdx(x, y)]) continue;
    const forest = x >= 112 ? 0.5 : 0;
    const border = y <= 3 || y >= MAP_H - 3 || x <= 1 || x >= MAP_W - 2;
    const n = noise(x * 0.11, y * 0.11);
    let p = border ? (y <= 3 ? 0.6 : 0.42) : forest ? 0.32 + (x - 112) * 0.02 : n > 0.66 ? 0.2 : 0.008;
    if (!border && !forest && nearNonGrass(x, y, 1)) p *= 0.15;
    if (nearRoad(x, y, 1)) p = 0;
    if (treeAt.some(([tx, ty]) => Math.abs(tx - x) < 2 && Math.abs(ty - y) < 2)) p *= 0.12;
    if (rng() < p) {
      let kind;
      const r2 = rng();
      if (y <= 4 || x >= 116 || y >= MAP_H - 4) kind = r2 < 0.45 ? 'pine' : r2 < 0.85 ? 'oak' : 'birch';
      else kind = r2 < 0.62 ? 'oak' : r2 < 0.88 ? 'birch' : 'pine';
      const tseed = (kind === 'oak' ? 100 : kind === 'birch' ? 200 : 400) + Math.floor(rng() * (kind === 'oak' ? 6 : kind === 'birch' ? 3 : 4));
      addStatic(makeTree(tseed, kind), x * 16 + 8 + Math.round((rng() - 0.5) * 4), (y + 1) * 16 - 2, { gen: { type: 'tree', seed: tseed, kind } });
      blk(x, y); treeAt.push([x, y]);
      if (!border && !forest && walkable(x, y + 1) && tiles[tIdx(x, y + 1)] === T.GRASS && World.shade.length < 22 && rng() < 0.6)
        World.shade.push(makeSpot(x * 16 + 8, (y + 1) * 16 + 10, 'down', 'sit', 'shade'));
    } else if (rng() < (border || forest ? 0.05 : 0.016) && !nearNonGrass(x, y, 0)) {
      const bs = 500 + Math.floor(rng() * 6);
      addStatic(makeBush(bs), x * 16 + 8, y * 16 + 14, { gen: { type: 'bush', seed: bs } });
      blk(x, y);
    }
  }

  // --- Woodland spots: mushrooms, wild herbs, timber ---
  const woodsCands = [];
  for (let y = 4; y < MAP_H - 3; y++) for (let x = 3; x < MAP_W - 2; x++) {
    if (tiles[tIdx(x, y)] !== T.GRASS || World.block[tIdx(x, y)] || World.reserved[tIdx(x, y)]) continue;
    let trees = 0;
    for (const [tx, ty] of treeAt) if (Math.abs(tx - x) <= 2 && Math.abs(ty - y) <= 2) trees++;
    if (trees >= 2) woodsCands.push([x, y, trees]);
  }
  woodsCands.sort(() => rng() - 0.5);
  const farFrom = (list, x, y, d) => !list.some((m) => Math.abs(m.tx - x) < d && Math.abs(m.ty - y) < d);
  for (const [x, y] of woodsCands) {
    if (World.mushrooms.length < 22 && farFrom(World.mushrooms, x, y, 6)) {
      World.mushrooms.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, amount: 2 + Math.floor(rng() * 2), regrow: 0, claimed: null, toad: rng() < 0.3 });
      continue;
    }
    if (World.wildHerbs.length < 14 && farFrom(World.wildHerbs, x, y, 7) && farFrom(World.mushrooms, x, y, 2)) {
      World.wildHerbs.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, amount: 2, regrow: 0, claimed: null });
    }
  }
  // timber: spots beside trees on the edge of the eastern woods and the northern woods
  const timberCands = woodsCands.filter(([x, y, n]) => (x >= 108 || y <= 6) && n >= 2);
  for (const [x, y] of timberCands) {
    if (World.woodSpots.length >= 14) break;
    if (!farFrom(World.woodSpots, x, y, 4)) continue;
    const tree = treeAt.find(([tx, ty]) => Math.abs(tx - x) <= 1 && Math.abs(ty - y) <= 1);
    if (!tree) continue;
    World.woodSpots.push({ tx: x, ty: y, x: x * 16 + 8, y: y * 16 + 12, stock: 4, claimed: null, facing: tree[0] < x ? 'left' : tree[0] > x ? 'right' : 'up' });
  }

  // --- Decorative wildflowers ---
  for (let k = 0; k < 300; k++) {
    const x = Math.floor(rng() * MAP_W), y = Math.floor(rng() * MAP_H);
    if (tiles[tIdx(x, y)] !== T.GRASS && tiles[tIdx(x, y)] !== T.LAWN) continue;
    if (World.block[tIdx(x, y)]) continue;
    World.flowers.push({ x: x * 16 + Math.floor(rng() * 8) + 4, y: y * 16 + Math.floor(rng() * 8) + 10, seed: Math.floor(rng() * 9999), ground: true });
  }
  for (const h of World.homes) if (h.built) addHomeFlowers(h);

  // --- Ducks ---
  World.ducks = [0, 1, 2, 3].map((i) => ({ x: (POND.cx + i - 1.5) * 16, y: POND.cy * 16 + (i % 2) * 6, a: rng() * 6, t: 0 }));
  World.waterTiles = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (tiles[tIdx(x, y)] === T.WATER) World.waterTiles.push([x, y]);

  computePixelTypes(seed);
}

// Raises a knoll on the map and makes the home record for it.
function createHome(d, i, surname, name) {
  const tiles = World.tiles;
  let doorTy = 0;
  for (let y = Math.floor(d.cy - d.ry - 1); y <= Math.ceil(d.cy + d.ry + 1); y++) for (let x = Math.floor(d.cx - d.rx - 1); x <= Math.ceil(d.cx + d.rx + 1); x++) {
    if (!inMap(x, y)) continue;
    const nx = (x - d.cx) / d.rx, ny = (y - d.cy) / d.ry;
    if (nx * nx + ny * ny < 1) { tiles[tIdx(x, y)] = T.HILL; if (x === d.cx) doorTy = Math.max(doorTy, y); }
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
  const wo = Math.round(d.rx * 16 * 0.42);
  const sides = V.nwin === 1 ? [vr() < 0.5 ? -1 : 1] : [-1, 1];
  for (const sgn of sides) home.windows.push({ x: doorX + sgn * wo, y: doorY - 13 });
  if (V.nwin >= 3) home.windows.push({ x: doorX + (vr() < 0.5 ? -1 : 1) * wo * 1.75, y: doorY - 18 });
  if (d.grand) home.windows.push({ x: doorX - wo * 1.7, y: doorY - 22 }, { x: doorX + wo * 1.7, y: doorY - 22 });
  if (V.chim2) home.chimney2 = { x: doorX - Math.round(d.rx * 16 * 0.45), y: Math.round((d.cy + 0.5) * 16 - d.ry * 16 * 0.35) };
  if (V.roofWin) home.roofWin = { x: doorX + Math.round(d.rx * 16 * (vr() - 0.5) * 0.5), y: Math.round((d.cy + 0.5) * 16 - d.ry * 16 * 0.45) };
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
  addStatic(makeMailbox(h.doorColor), (sx + 1) * 16 + 4, sy * 16 + 10);
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
const GROUND_PAL = {
  spring: { G1: '#5fa040', G2: '#86c056', L2: '#9ad466', P1: '#b38e58', P2: '#d0ae78', S1: '#6a4630', S2: '#7a5638', W1: '#36719f', W2: '#4382b6', WS: '#5d9fcf', bank: '#8a8250', fleck: 0.012 },
  summer: { G1: '#5c973a', G2: '#7bb04c', L2: '#8cc25a', P1: '#b38e58', P2: '#d0ae78', S1: '#6a4630', S2: '#7a5638', W1: '#36719f', W2: '#4382b6', WS: '#5d9fcf', bank: '#8a8250', fleck: 0.004 },
  autumn: { G1: '#6e8a36', G2: '#94a048', L2: '#a8b058', P1: '#a8845a', P2: '#c8a678', S1: '#64422c', S2: '#744f34', W1: '#30658e', W2: '#3c74a2', WS: '#5690bc', bank: '#8a7848', fleck: 0.02 },
  winter: { G1: '#d6e2ea', G2: '#f4f8fc', L2: '#ffffff', P1: '#a89a86', P2: '#c8bcaa', S1: '#c4ced8', S2: '#dce4ec', W1: '#2b587e', W2: '#36678f', WS: '#8ab4d4', bank: '#b0b8bc', fleck: 0 },
};

function computePixelTypes(seed, rect) {
  const W = MAP_W * TILE, H = MAP_H * TILE;
  const base = (t) => (t === T.HILL ? T.GRASS : t === T.BRIDGE ? T.WATER : t);
  // every half-pixel gets a kind of ground; each world pixel takes its top-left half-pixel's
  const W2 = W * GS;
  const fill = (px0, py0, px1, py1) => {
    const { type, type2, jx, jy, JW } = World.px;
    const JH = (H >> 1) - 1;
    for (let qy = py0 * GS; qy < py1 * GS; qy++) {
      // the wobble is stored every 2 world pixels; blend between them so edges stay smooth
      const gy = qy / 4, iy = Math.min(JH - 1, Math.floor(gy)), wy = gy - iy, fy = qy / GS;
      const r0 = iy * JW, r1 = (iy + 1) * JW;
      for (let qx = px0 * GS; qx < px1 * GS; qx++) {
        const gx = qx / 4, ix = Math.min(JW - 2, Math.floor(gx)), wx = gx - ix;
        const a0 = r0 + ix, a1 = r1 + ix;
        const jxv = (jx[a0] * (1 - wx) + jx[a0 + 1] * wx) * (1 - wy) + (jx[a1] * (1 - wx) + jx[a1 + 1] * wx) * wy;
        const jyv = (jy[a0] * (1 - wx) + jy[a0 + 1] * wx) * (1 - wy) + (jy[a1] * (1 - wx) + jy[a1 + 1] * wx) * wy;
        const tx = Math.floor((qx / GS + jxv) / 16), ty = Math.floor((fy + jyv) / 16);
        const t = base(World.tiles[clamp(ty, 0, MAP_H - 1) * MAP_W + clamp(tx, 0, MAP_W - 1)]);
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
  const n = nh(x * 0.045, y * 0.045) - 0.5, n2 = nh(x * 0.12 + 40, y * 0.12 + 40) - 0.5;
  const valley = clamp((Math.abs(y - ry) - 2) / 9, 0, 1);
  return clamp((base + n * 0.55 + n2 * 0.12) * (0.25 + valley * 0.75), 0, 1);
}
function computeHeights(seed) {
  const { JW } = World.px, JH = (MAP_H * TILE) / 2;
  const nh = makeNoise(seed + 9);
  const height = new Float32Array(JW * JH), level = new Uint8Array(JW * JH);
  for (let y = 0; y < JH; y++) for (let x = 0; x < JW; x++) {
    const h = landHeight(nh, x / 8, y / 8);
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
}

// The ground is painted at GS canvas pixels per world pixel. Colour (hill
// shading, terrace banks, wet edges) is worked out once per world pixel; the
// finer detail (grass blades, pebbles, furrows, cobbles, sparkles) and the
// edges between kinds of ground are done per half-pixel.
function* paintGroundGen(season, target, rect, org = { x: 0, y: 0 }) {
  const { W, H, W2, type, type2, noise, JW, height, level1 } = World.px;
  const JH = H >> 1;
  const bankCol = { spring: [96, 102, 50], summer: [92, 96, 46], autumn: [120, 98, 54], winter: [168, 180, 196] }[season];
  const lipCol = { spring: [170, 214, 110], summer: [160, 204, 100], autumn: [196, 190, 100], winter: [255, 255, 255] }[season];
  const R0 = rect || { x0: 0, y0: 0, x1: W, y1: H };
  const hit = (x0, y0, x1, y1) => x1 >= R0.x0 && x0 <= R0.x1 && y1 >= R0.y0 && y0 <= R0.y1;
  const pal = GROUND_PAL[season];
  const ctx = target.getContext('2d');
  const C = {};
  for (const k in pal) if (typeof pal[k] === 'string') C[k] = hexToRgb(pal[k]);
  const lerpC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const winter = season === 'winter';
  const at = (x, y) => type[clamp(y, 0, H - 1) * W + clamp(x, 0, W - 1)];
  const near = (px, py, t, r) => at(px + r, py) === t || at(px - r, py) === t || at(px, py + r) === t || at(px, py - r) === t;
  const notNear = (px, py, t, r) => at(px + r, py) !== t || at(px - r, py) !== t || at(px, py + r) !== t || at(px, py - r) !== t;

  // the broad colour of one world pixel of a kind of ground
  const colorAt = (t, px, py) => {
    const n = noise[(py >> 1) * JW + (px >> 1)];
    let col;
    if (t === T.GRASS || t === T.LAWN) {
      col = lerpC(C.G1, C.G2, n);
      if (t === T.LAWN && Math.floor((px + py * 0.5) / 10) % 2) col = lerpC(col, C.L2, 0.25);
      if (near(px, py, T.WATER, 2)) return lerpC(col, C.bank, 0.65);
      // relief: soft hill-shading lit from the north-west, then terrace banks
      const cx = px >> 1, cy = py >> 1, j = cy * JW + cx;
      const hx0 = height[cy * JW + Math.max(0, cx - 3)], hx1 = height[cy * JW + Math.min(JW - 1, cx + 3)];
      const hy0 = height[Math.max(0, cy - 3) * JW + cx], hy1 = height[Math.min(JH - 1, cy + 3) * JW + cx];
      const lit = clamp(((hx0 - hx1) * 0.7 + (hy0 - hy1)) * 9, -0.22, 0.22);
      col = lit > 0 ? lerpC(col, [255, 255, 235], lit * 0.6) : lerpC(col, [20, 40, 30], -lit);
      const pj = py * W + px, lv = level1[pj];
      col = lerpC(col, winter ? [255, 255, 255] : [214, 230, 140], (lv - 1) * 0.05);
      const up = (k) => (py - k * 2 >= 0 ? level1[pj - k * 2 * W] : lv);
      const dn1 = py < H - 2 ? level1[pj + 2 * W] : lv;
      let face = 0;
      for (let k = 1; k <= 8; k++) if (up(k) > lv) { face = k; break; }
      if (face && face <= 5) {
        const tt = face / 5;
        col = lerpC(col, bankCol, 0.75 - tt * 0.25);
        if (!winter && hash2(px >> 1, py >> 2) < 0.22) col = lerpC(col, [104, 80, 50], 0.55);
        if (face === 1 && hash2(px >> 1, 9) < 0.6) col = lerpC(col, lipCol, 0.45);
      } else if (face) col = lerpC(col, [20, 40, 24], 0.24 - (face - 6) * 0.08);
      else if (dn1 < lv) col = lerpC(col, lipCol, 0.4);
      col.bank = face && face <= 5;
      return col;
    }
    if (t === T.PATH) {
      col = lerpC(C.P1, C.P2, n);
      if (notNear(px, py, T.PATH, 2)) col = lerpC(col, winter ? [220, 228, 236] : [138, 138, 72], 0.45);
      return col;
    }
    if (t === T.SOIL || t === T.WEED || t === T.FIELD) {
      col = lerpC(C.S1, C.S2, n);
      if (t === T.WEED) col = lerpC(col, [130, 90, 60], winter ? 0.05 : 0.2);
      if (t === T.FIELD && !winter) col = lerpC(col, [150, 120, 70], 0.15);
      return col;
    }
    if (t === T.WATER) {
      col = lerpC(C.W1, C.W2, n);
      if (notNear(px, py, T.WATER, 3)) col = lerpC(col, C.WS, 0.7);
      return col;
    }
    if (t === T.COBBLE) return [149, 143, 132];
    return [255, 0, 255];
  };

  // the fine detail of one half-pixel
  const detail = (t, col, qx, qy) => {
    const h = hash2(qx, qy);
    if (t === T.GRASS || t === T.LAWN) {
      if (col.bank) {
        if (!winter && hash2(qx, qy >> 1) > 0.93) return lerpC(col, [150, 140, 120], 0.6);
        return h < 0.08 ? lerpC(col, [60, 48, 30], 0.25) : col;
      }
      if (winter) {
        if (h < 0.04) return lerpC(col, [170, 190, 210], 0.4);
        if (h > 0.998 && hash2(qx >> 3, qy >> 3) < 0.4) return [120, 150, 110];
        return col;
      }
      // blades: a darker stroke with a lighter tip above it
      if (hash2(qx, qy >> 1) > 0.975) return lerpC(col, [44, 90, 34], (qy & 1) ? 0.42 : 0.22);
      if (h < 0.045) return lerpC(col, [40, 80, 30], 0.35);
      if (h > 0.97) return lerpC(col, [196, 232, 140], 0.38);
      if (((qx * 7 + qy * 3) % 13 === 0) && hash2(qx >> 2, qy >> 2) < 0.4) return lerpC(col, [50, 100, 40], 0.3);
      if (h > 1 - pal.fleck * 0.6) return season === 'autumn' ? (h > 1 - pal.fleck * 0.3 ? [200, 90, 40] : [220, 170, 60]) : (h > 1 - pal.fleck * 0.3 ? [255, 255, 255] : [250, 220, 90]);
      return col;
    }
    if (t === T.PATH) {
      // snow lies in drifts along the paths, soft-edged
      if (winter) { const sn = noise[(qy >> 2) * JW + (qx >> 2)] + hash2(qx >> 1, qy >> 1) * 0.12 - Math.sin(qx * 0.07 + qy * 0.05) * 0.06; if (sn > 0.52) return lerpC(col, [235, 240, 246], sn > 0.56 ? 0.75 : 0.45); }
      if (h < 0.03) return winter ? [150, 140, 125] : [151, 118, 74];
      if (h > 0.985) return winter ? [240, 244, 250] : [232, 210, 160];
      if (h > 0.96 && hash2(qx + 1, qy) > 0.5) return lerpC(col, [120, 96, 64], 0.3);
      return col;
    }
    if (t === T.SOIL || t === T.WEED || t === T.FIELD) {
      if (qy % 10 === 0) return lerpC(col, winter ? [150, 165, 180] : [60, 38, 24], 0.5);
      if (qy % 10 === 1) return lerpC(col, winter ? [235, 240, 246] : [140, 100, 70], 0.2);
      if (h < 0.05) return lerpC(col, winter ? [255, 255, 255] : [150, 110, 80], 0.4);
      return col;
    }
    if (t === T.WATER) {
      if (((qx + qy * 3) % 47 === 0) && h < 0.35) return lerpC(col, [200, 230, 250], 0.45);
      return col;
    }
    if (t === T.COBBLE) {
      const row = Math.floor(qy / 10), off = (row % 2) * 6, u = (qx + off) % 12, v = qy % 10;
      if (v === 0 || u === 0) return winter ? [200, 205, 212] : [106, 101, 91];
      const cxx = Math.floor((qx + off) / 12);
      if (winter && hash2(cxx, row * 3) < 0.3) return v === 1 ? [255, 255, 255] : [236, 240, 246];
      let c = lerpC([149, 143, 132], [180, 174, 159], hash2(cxx, row));
      if (v === 1 || u === 1) c = lerpC(c, [230, 226, 214], 0.25);
      else if (v === 9 || u === 11) c = lerpC(c, [80, 76, 68], 0.22);
      return c;
    }
    return col;
  };

  const SLICE = 32, RW = R0.x1 - R0.x0, QW = RW * GS;
  for (let y0 = R0.y0; y0 < R0.y1; y0 += SLICE) {
    const rows = Math.min(SLICE, R0.y1 - y0);
    const img = ctx.createImageData(QW, rows * GS);
    const d = img.data;
    for (let r = 0; r < rows; r++) {
      const py = y0 + r;
      for (let px = R0.x0; px < R0.x1; px++) {
        const t = type[py * W + px];
        const base = colorAt(t, px, py);
        let altT = -1, altCol = null;
        for (let sy = 0; sy < GS; sy++) for (let sx = 0; sx < GS; sx++) {
          const qx = px * GS + sx, qy = py * GS + sy;
          const t2 = type2[qy * W2 + qx];
          let col = base;
          if (t2 !== t) { if (t2 !== altT) { altT = t2; altCol = colorAt(t2, px, py); } col = altCol; }
          col = detail(t2, col, qx, qy);
          const i = ((r * GS + sy) * QW + (px - R0.x0) * GS + sx) * 4;
          d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
        }
      }
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
      if (!hit(f.x - 10, f.y - 10, f.x + 10, f.y + 10)) continue;
      if (season === 'autumn' && f.ground && (f.seed % 3)) continue;
      const k = f.seed;
      ctx.drawImage(hd(patches[k] || (patches[k] = makeFlowerPatch(k))), (f.x - 9 - org.x) * GS, (f.y - 10 - org.y) * GS);
    }
  }
}

// A quick flat sketch of the ground, tile by tile, shown for the moment it
// takes to paint the real thing in the background (which then fades in).
function quickGround(season) {
  const [c, x] = makeCanvas(MAP_W * TILE * GS, MAP_H * TILE * GS);
  const pal = GROUND_PAL[season], S = TILE * GS;
  const col = { [T.LAWN]: pal.L2, [T.PATH]: pal.P1, [T.WATER]: pal.W1, [T.BRIDGE]: '#8a6440', [T.SOIL]: pal.S1, [T.WEED]: pal.S1, [T.FIELD]: pal.S2, [T.COBBLE]: '#958f84' };
  x.fillStyle = pal.G1; x.fillRect(0, 0, c.width, c.height);
  for (let ty = 0; ty < MAP_H; ty++) for (let tx = 0; tx < MAP_W; tx++) {
    const k = col[World.tiles[tIdx(tx, ty)]];
    if (k) { x.fillStyle = k; x.fillRect(tx * S, ty * S, S, S); }
  }
  World.ground = c; World.groundSeason = season;
}
// Shows the sketch and paints the real ground behind it.
function paintGroundSoon(season) { quickGround(season); startSeasonPaint(season); World.paintJob.urgent = true; }

// Paints the whole ground synchronously.
function paintGround(season) {
  const [c] = makeCanvas(MAP_W * TILE * GS, MAP_H * TILE * GS);
  const g = paintGroundGen(season, c);
  while (!g.next().done) { /* paint every slice */ }
  World.ground = c;
  World.groundSeason = season;
}

// Starts painting a season in the background; the frame loop calls stepPaint().
function startSeasonPaint(season) {
  const urgent = !!(World.paintJob && World.paintJob.urgent);
  const [c] = makeCanvas(MAP_W * TILE * GS, MAP_H * TILE * GS);
  World.paintJob = { season, canvas: c, gen: paintGroundGen(season, c), urgent };
}
function stepPaint(budgetMs = 6) {
  const job = World.paintJob;
  if (!job) return;
  const t0 = performance.now();
  while (performance.now() - t0 < budgetMs) {
    if (job.gen.next().done) {
      World.prevGround = World.ground; World.groundFade = 1; World.groundFadeRate = job.urgent ? 3 : 0.5;
      World.ground = job.canvas; World.groundSeason = job.season; World.paintJob = null;
      return;
    }
  }
}
// Repaints a rectangle of the current ground (after a tile change). The patch
// is painted on a scratch canvas with a margin, so mounds and flowers that
// straddle its edge come out whole, then copied in.
function repaintRect(x, y, w, h) {
  x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y));
  w = Math.min(MAP_W * TILE - x, Math.ceil(w)); h = Math.min(MAP_H * TILE - y, Math.ceil(h));
  const M = 96;
  const rect = { x0: Math.max(0, x - M), y0: Math.max(0, y - M), x1: Math.min(MAP_W * TILE, x + w + M), y1: Math.min(MAP_H * TILE, y + h + M) };
  computePixelTypes(World.seed, rect);
  const [c] = makeCanvas((rect.x1 - rect.x0) * GS, (rect.y1 - rect.y0) * GS);
  const g = paintGroundGen(World.groundSeason || 'summer', c, rect, { x: rect.x0, y: rect.y0 });
  while (!g.next().done) { /* small patch: paint it all at once */ }
  World.ground.getContext('2d').drawImage(c, (x - rect.x0) * GS, (y - rect.y0) * GS, w * GS, h * GS, x * GS, y * GS, w * GS, h * GS);
}

const MOUND_PAL = {
  spring: ['#62a03e', '#2f5a26', '#a4d26c'],
  summer: ['#5f9a3c', '#2f5a26', '#9ccc68'],
  autumn: ['#7f8a3a', '#4a4a1e', '#b8b25a'],
  winter: ['#e2eaf0', '#94a6b8', '#ffffff'],
};
// A hobbit-hole's grassy mound and the stonework round its door, painted
// into the ground at full detail.
function paintMound(ctx, h, season = 'summer', org = { x: 0, y: 0 }) {
  const d = h.def, G = GS;
  const cx = (d.cx + 0.5) * 16, cy = (d.cy + 0.5) * 16;
  const rx = d.rx * 16 - 4, ry = d.ry * 16 - 8;
  const x0 = Math.floor((cx - rx - 4) * G), y0 = Math.floor((cy - ry - 4) * G), w = Math.ceil((rx * 2 + 8) * G), hh = Math.ceil((ry * 2 + 14) * G);
  const ox = org.x * G, oy = org.y * G;
  const img = ctx.getImageData(x0 - ox, y0 - oy, w, hh);
  const p = img.data;
  const [b0, d0, l0] = MOUND_PAL[season];
  const tint = (h.v && h.v.tint) || 0;
  const base = hexToRgb(shade(b0, tint)), dark = hexToRgb(d0), light = hexToRgb(shade(l0, tint * 0.6));
  const roofFlowers = h.v && h.v.flowers && season !== 'winter';
  const petal = [[240, 120, 150], [250, 220, 90], [190, 150, 240], [255, 255, 255]][h.id % 4];
  const winter = season === 'winter';
  const edge = (px) => 1 + (hash2(px >> 1, 77) - 0.5) * 0.05 + Math.sin(px * 0.35) * 0.012;
  for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) {
    const qx = x0 + i, qy = y0 + j, px = qx / G, py = qy / G;
    const nx = (px - cx) / rx, ny = (py - cy) / ry;
    const dd = nx * nx + ny * ny;
    const k = (j * w + i) * 4;
    const lim = edge(Math.floor(px));
    if (dd < lim) {
      let l = -nx * 0.3 - ny * 0.55 + (1 - dd) * 0.35 - 0.05;
      if (ny > 0.35) l -= (ny - 0.35) * 0.6;
      if (dd > lim - 0.05) l += ny < -0.2 ? 0.25 : -0.35;
      const hsh = hash2(qx, qy);
      if (hsh < 0.06) l -= 0.16; else if (hsh > 0.94) l += 0.16;
      // tufts: short darker strokes
      if (!winter && hash2(qx, qy >> 1) > 0.965) l -= 0.14;
      const t = clamp(l, -1, 1);
      const col = t < 0 ? [lerp(base[0], dark[0], -t), lerp(base[1], dark[1], -t), lerp(base[2], dark[2], -t)]
        : [lerp(base[0], light[0], t), lerp(base[1], light[1], t), lerp(base[2], light[2], t)];
      p[k] = col[0]; p[k + 1] = col[1]; p[k + 2] = col[2];
      if (!winter && hsh > 0.997) { p[k] = 240; p[k + 1] = 220; p[k + 2] = 90; }
      if (roofFlowers && ny < 0.1 && dd < 0.8 && hash2(qx >> 4, qy >> 4) > 0.55 && hash2(qx, qy) > 0.982) {
        p[k] = petal[0]; p[k + 1] = petal[1]; p[k + 2] = petal[2];
        if (hash2(qx + 1, qy) > 0.5) { const k2 = k + w * 4; if (k2 < p.length) { p[k2] = 70; p[k2 + 1] = 120; p[k2 + 2] = 50; } }
      }
      if (!winter && hsh > 0.9985) { p[k] = 245; p[k + 1] = 245; p[k + 2] = 245; }
    } else {
      const sy = (py - cy - 7) / ry, sx2 = (px - cx - 3) / rx;
      if (py > cy - ry * 0.3 && sx2 * sx2 + sy * sy < 1) { p[k] *= 0.68; p[k + 1] *= 0.72; p[k + 2] *= 0.74; }
    }
  }
  ctx.putImageData(img, x0 - ox, y0 - oy);
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
  if (winter) for (let a = 0; a < 20; a++) { const ang = Math.PI + (a / 19) * Math.PI; ctx.fillStyle = '#f4f8ff'; ctx.fillRect(Math.round(dx + Math.cos(ang) * (r + 1)) - 2, Math.round(dy + Math.sin(ang) * (r + 1)) - 2, 4, 3); }
  // the doorstep
  const sx0 = (h.doorX - h.doorR - 3) * G, sw = (h.doorR * 2 + 7) * G, sy0 = h.doorY * G;
  ctx.fillStyle = '#a89a80'; ctx.fillRect(sx0, sy0, sw, 5);
  ctx.fillStyle = '#c8bca4'; ctx.fillRect(sx0 + 1, sy0, sw - 2, 1);
  ctx.fillStyle = '#7a6c54'; ctx.fillRect(sx0, sy0 + 5, sw, 1);
  // window surrounds
  for (const wdw of h.windows) {
    const wx = wdw.x * G, wy = wdw.y * G;
    if (h.v && h.v.square) {
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
};
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
  while (heap.length && iter++ < 30000) {
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
      const c = TILE_COST[World.tiles[ni]] * (dx && dy ? 1.414 : 1);
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
    else d.a += Math.PI * 0.7;
  }
  updateRabbits(dtMin, season, hour);
  updateCrows(dtMin, season, hour);
}

// Rabbits slip out of the woods to nibble ripe crops, and bolt from folk.
function updateRabbits(dtMin, season, hour) {
  const day = hour > 6 && hour < 20;
  if (day && season !== 'winter' && World.rabbits.length < 4 && Math.random() < dtMin * 0.004) {
    const fromEast = R.chance(0.6);
    const sx = fromEast ? R.i(110, 120) : R.i(10, 110), sy = fromEast ? R.i(30, 90) : R.i(3, 5);
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
        if (!r.target) { r.exit = r.exit || { x: R.chance(0.5) ? 118 * 16 : R.i(20, 100) * 16, y: R.chance(0.5) ? R.i(30, 90) * 16 : 3 * 16 }; }
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
      else { r.target = null; r.exit = { x: R.i(5, 120) * 16, y: R.chance(0.5) ? 3 * 16 : 92 * 16 }; r.x += R.f(-2, 2); r.y += R.f(-2, 2); }
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
  const top = { x: PARTY.treeX * 16 + 8, y: PARTY.treeY * 16 - 26 };
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
